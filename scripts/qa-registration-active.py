"""Run against an enabled loopback test site backed by a disposable database."""
import csv
import io
import os
import subprocess
from datetime import datetime
from zoneinfo import ZoneInfo
from urllib.parse import urlencode, urlparse
from uuid import uuid4
from playwright.sync_api import sync_playwright

base = os.environ["FDE_LOCAL_QA_URL"].rstrip("/")
if urlparse(base).hostname not in {"127.0.0.1", "::1", "localhost"}:
    raise SystemExit("Active registration tests require an isolated loopback site.")
password = os.environ["FDE_LOCAL_QA_OWNER_PASSWORD"]
guest = "=QA-" + uuid4().hex[:12]
with sync_playwright() as playwright:
    browser = playwright.chromium.launch()
    context = browser.new_context(viewport={"width": 390, "height": 844}, ignore_https_errors=True)
    page = context.new_page()
    page.goto(base + "/register/")
    event = page.locator("#reg-event option").first.get_attribute("value")
    page.fill("#reg-name", guest)
    page.fill("#reg-size", "6")
    page.click("#reg-submit")
    page.get_by_text("6 expected attendees", exact=False).wait_for()
    page.goto(base + "/register/?" + urlencode({"event": event}))
    page.get_by_role("link", name="Open your private registration").click()
    page.fill("#size", "3")
    page.click("#resize")
    page.get_by_text("3 expected attendees", exact=False).wait_for()

    def staff_get(**params):
        return context.request.get(base + "/api/staff/?" + urlencode(params))

    assert staff_get(mode="csv", eventId=event).status == 401
    login = context.request.post(base + "/api/staff/", headers={"Origin": base}, data={
        "action": "login", "username": "owner", "password": password
    })
    assert login.ok
    events = staff_get(mode="events").json()["events"]
    selected = next(row for row in events if row["id"] == event)
    for filters in [
        {"eventId": event},
        {"venueId": selected["venueId"], "from": selected["date"], "to": selected["date"]},
        {"from": selected["date"], "to": selected["date"]},
    ]:
        response = staff_get(mode="csv", **filters)
        assert response.ok
        rows = list(csv.DictReader(io.StringIO(response.body().decode("utf-8-sig"))))
        assert any(r["Group leader"] == "'" + guest and r["Expected group size"] == "3" for r in rows)
        active = [r for r in rows if r["Event ID"] == event and r["Registration status"] == "Active"]
        assert len(active) == selected["registeredGroups"]
        assert sum(int(r["Expected group size"]) for r in active) == selected["expectedPeople"]
    page.once("dialog", lambda dialog: dialog.accept())
    page.click("#cancel")
    page.get_by_role("heading", name="Registration canceled").wait_for()
    updated = next(r for r in staff_get(mode="events").json()["events"] if r["id"] == event)
    assert updated["registeredGroups"] == selected["registeredGroups"] - 1
    assert updated["expectedPeople"] == selected["expectedPeople"] - 3
    page.goto(base + "/staff/owner/")
    page.wait_for_selector("#compare a")
    page.goto(base + "/staff/check-in/")
    page.get_by_text("Allow camera access", exact=False).wait_for()
    # Supply a generated QR image as video frames. This exercises the real decoder
    # and network request without camera hardware or a redeemable voucher.
    qr_image = subprocess.check_output([
        "node", "--input-type=module", "-e",
        "import QR from 'qrcode';console.log(await QR.toDataURL('synthetic-invalid-qr',{width:320}))"
    ], text=True).strip()
    page.add_init_script("""async function syntheticCamera() {
      const image = new Image();
      image.src = """ + repr(qr_image) + """;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 320;
      const ctx = canvas.getContext('2d');
      setInterval(() => ctx.drawImage(image, 0, 0), 100);
      return canvas.captureStream(10);
    }
    navigator.mediaDevices.getUserMedia = syntheticCamera;""")
    page.reload()
    page.get_by_text("INVALID VOUCHER.", exact=True).wait_for()
    # Exercise the live Charter page when the test calendar contains a future Wednesday.
    today = datetime.now(ZoneInfo("America/New_York")).date().isoformat()
    eligible = next((e for e in events if e["venueId"] == "charter-803"
                     and e["date"] > today and e["date"] >= "2026-12-02"
                     and datetime.fromisoformat(e["date"]).weekday() == 2
                     and e["eventType"] in {"Trivia", "Music Bingo"}
                     and e["status"] in {"scheduled", "rescheduled"}), None)
    if eligible:
        policy = context.request.post(base + "/api/staff/", headers={"Origin": base}, data={
            "action": "policy", "eventId": eligible["id"], "enabled": True,
            "rewardEnabled": True, "rewardKind": "appetizer",
            "redemptionDeadline": eligible["date"] + "T21:15"
        })
        assert policy.ok
        visitor = browser.new_context(ignore_https_errors=True) if not os.getenv("FDE_SINGLE_PROCESS_QA") else context
        voucher = visitor.new_page()
        voucher.goto(base + "/register/?" + urlencode({"event": eligible["id"]}))
        voucher.fill("#reg-name", "Voucher QA " + uuid4().hex[:8])
        voucher.click("#reg-submit")
        voucher.get_by_text("SCREENSHOTS ARE NOT ACCEPTED.", exact=True).wait_for()
        voucher.wait_for_function("document.querySelector('#manual')?.value.length > 0")
        first = voucher.locator("#manual").input_value()
        voucher.wait_for_function("first => document.querySelector('#manual')?.value !== first", arg=first)
        assert voucher.locator("#qr").evaluate("canvas => canvas.width") > 0
        print("Charter confirmation, configured deadline and live QR rotation passed.")
    browser.close()
print("Mobile registration, private-link recovery, estimates, all three CSV scopes, camera fallback and synthetic optical QR scanning passed.")
