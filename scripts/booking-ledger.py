"""Merge an owner-only Netlify booking export into an editable lead ledger."""
import argparse
import csv
import os
import tempfile
from pathlib import Path

FIELDS = ['Lead key', 'Date', 'Service', 'Channel', 'Landing page', 'Stage', 'Booked revenue']
STAGES = {'Inquiry', 'Qualified', 'Booked', 'Lost', 'Excluded'}

def normalized(row):
    return {k.strip().lower().replace('_', '-').replace(' ', '-'): (v or '').strip()
            for k, v in row.items() if k}

def update(source, target):
    if source.resolve() == target.resolve():
        raise ValueError('Choose a separate ledger file.')
    leads = {}
    if target.exists():
        with target.open(encoding='utf-8-sig', newline='') as f:
            reader = csv.DictReader(f)
            if reader.fieldnames != FIELDS:
                raise ValueError('Destination is not a booking ledger.')
            for item in reader:
                if item['Stage'] not in STAGES or item['Lead key'] in leads:
                    raise ValueError('Check duplicate keys and stages in the existing ledger.')
                leads[item['Lead key']] = item
    with source.open(encoding='utf-8-sig', newline='') as f:
        for line, raw in enumerate(csv.DictReader(f), 2):
            row = normalized(raw)
            if row.get('test-inquiry', '').lower() in {'yes', 'true', '1'}:
                continue
            key = row.get('inquiry-id') or next(('netlify-' + row[k] for k in
                ('id','submission-id','number','submission-number') if row.get(k)), None)
            if not key:
                raise ValueError(f'Row {line} has no inquiry ID or provider ID/number. Export with a stable ID.')
            if key in leads:
                continue
            vals = [key, row.get('created-at') or row.get('created') or row.get('date',''),
                    row.get('service',''), row.get('entry-channel') or 'unknown',
                    row.get('entry-page',''), 'Inquiry', '']
            # Keep imported strings literal when opening the CSV in a spreadsheet.
            leads[key] = dict(zip(FIELDS, ["'" + v if v.startswith(('=', '+', '-', '@')) else v for v in vals]))
    tmp = None
    try:
        with tempfile.NamedTemporaryFile(mode='w', dir=target.parent, encoding='utf-8',
                                         newline='', delete=False) as out:
            tmp = out.name
            writer = csv.DictWriter(out, fieldnames=FIELDS)
            writer.writeheader()
            writer.writerows(leads.values())
        os.replace(tmp, target)
    finally:
        if tmp and os.path.exists(tmp):
            os.unlink(tmp)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('export', type=Path)
    parser.add_argument('ledger', type=Path)
    args = parser.parse_args()
    update(args.export, args.ledger)
