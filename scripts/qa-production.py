"""Read-only HTTP release audit. No forms are submitted and no accounts are used.

Run: python scripts/qa-production.py https://4dogsentertainment.com artifacts/production-qa.json
Preview URLs are supported; canonical URLs must still point to production.
"""
import concurrent.futures
import datetime as dt
import html.parser
import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
import urllib.robotparser
import xml.etree.ElementTree as ET
from zoneinfo import ZoneInfo

ORIGIN = "https://4dogsentertainment.com"
base = sys.argv[1].rstrip("/") if len(sys.argv) > 1 else ORIGIN
output = sys.argv[2] if len(sys.argv) > 2 else "artifacts/production-qa.json"
now = dt.datetime.now(dt.timezone.utc)
ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
checks, pages, maps = [], [], []


def check(name, passed):
    checks.append({"check": name, "passed": bool(passed)})


def get(path, agent="FourDogsReleaseQA/1.0"):
    req = urllib.request.Request(base + path, headers={"User-Agent": agent})
    try:
        with urllib.request.urlopen(req, timeout=35) as r:
            return r.status, dict(r.headers), r.read().decode(), r.url
    except urllib.error.HTTPError as e:
        return e.code, dict(e.headers), e.read().decode(), e.url


class Page(html.parser.HTMLParser):
    def __init__(self, body):
        super().__init__(convert_charrefs=True)
        self.canonical, self.robots, self.description = "", "", ""
        self.links, self.schemas, self.h1s, self.event_ids = [], [], 0, []
        self.heading, self.in_h1 = "", False
        self.schema_text = None
        self.feed(body)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get("data-event-id"):
            self.event_ids.append(a["data-event-id"])
        if tag == "link" and a.get("rel") == "canonical":
            self.canonical = a.get("href", "")
        if tag == "meta":
            if a.get("name") == "robots":
                self.robots = a.get("content", "")
            if a.get("name") == "description":
                self.description = a.get("content", "")
        if tag == "h1":
            self.h1s += 1
            self.in_h1 = True
        if tag == "a":
            self.links.append(a.get("href", ""))
        if tag == "script" and a.get("type") == "application/ld+json":
            self.schema_text = ""

    def handle_data(self, text):
        if self.in_h1:
            self.heading += text
        if self.schema_text is not None:
            self.schema_text += text

    def handle_endtag(self, tag):
        if tag == "h1":
            self.in_h1 = False
        if tag == "script" and self.schema_text is not None:
            self.schemas.append(json.loads(self.schema_text))
            self.schema_text = None


status, headers, body, url = get("/sitemap-index.xml")
check("sitemap index HTTP 200", status == 200)
index = ET.fromstring(body)
check("sitemap index namespace", index.tag == "{" + ns["s"] + "}sitemapindex")
entries = []
for loc in index.findall("s:sitemap/s:loc", ns):
    check("production sitemap origin " + loc.text, loc.text.startswith(ORIGIN + "/"))
    path = urllib.parse.urlsplit(loc.text).path
    s, h, b, u = get(path)
    check(path + " HTTP 200", s == 200)
    root = ET.fromstring(b)
    check(path + " valid urlset", root.tag == "{" + ns["s"] + "}urlset")
    rows = root.findall("s:url", ns)
    maps.append({"path": path, "urls": len(rows)})
    for row in rows:
        target = row.findtext("s:loc", namespaces=ns)
        modified = row.findtext("s:lastmod", namespaces=ns)
        check("sitemap public canonical origin " + target, target.startswith(ORIGIN + "/"))
        check("sitemap excludes admin/confirmation " + target, "/admin/" not in target and "/thank-you/" not in target)
        if modified:
            parsed = dt.datetime.fromisoformat(modified.replace("Z", "+00:00"))
            check("lastmod not in future " + target, parsed.astimezone(dt.timezone.utc) <= now)
        entries.append(target)
check("no duplicate sitemap URLs", len(entries) == len(set(entries)))


def inspect(target):
    path = urllib.parse.urlsplit(target).path
    s, h, b, u = get(path)
    page = Page(b)
    return target, s, h, b, u, page


with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    results = list(pool.map(inspect, entries))
event_count = 0
for target, status, headers, body, final_url, page in results:
    check(target + " HTTP 200", status == 200)
    check(target + " canonical", page.canonical == target)
    # Netlify can add a platform noindex header to previews. Production must be indexable.
    directives = page.robots + (headers.get("X-Robots-Tag", "") if base == ORIGIN else "")
    check(target + " indexable page directives", "noindex" not in directives.lower())
    check(target + " description", bool(page.description))
    check(target + " one H1", page.h1s == 1)
    for schema in page.schemas:
        if schema.get("@type") != "Event":
            continue
        event_count += 1
        required = ["name", "description", "startDate", "eventStatus", "location", "organizer", "image", "url"]
        check(target + " Event properties", all(schema.get(k) for k in required))
        check(target + " Event URL", schema.get("url") == target)
        check(target + " Event timezone", bool(re.search(r"T\d\d:\d\d:\d\d-0[45]:00$", schema.get("startDate", ""))))
        address = schema.get("location", {}).get("address", {})
        check(target + " Event address", all(address.get(k) for k in ["streetAddress", "addressLocality", "addressRegion", "postalCode", "addressCountry"]))
        check(target + " Event visible name", schema["name"] == page.heading.strip())
    pages.append({"url": target, "status": status, "canonical": page.canonical, "robots": page.robots})

_, _, robot_body, _ = get("/robots.txt")
robots = urllib.robotparser.RobotFileParser()
robots.parse(robot_body.splitlines())
for agent in ["Googlebot", "OAI-SearchBot"]:
    for path in ["/", "/events/", urllib.parse.urlsplit(entries[-1]).path]:
        check(agent + " permitted " + path, robots.can_fetch(agent, ORIGIN + path))
    s, _, b, _ = get("/events/", agent)
    check(agent + " receives crawlable calendar", s == 200 and "data-event-id=" in b)

s, _, feed_body, _ = get("/events/feed.json")
feed = json.loads(feed_body)
check("public feed timezone", feed.get("timeZone") == "America/New_York")
check("public feed excludes staffing", all("assignedHost" not in e for e in feed["events"]))
check("all upcoming feed pages in sitemap", all(e["url"] in entries for e in feed["events"]))
check("upcoming feed is chronological", [e["start"] for e in feed["events"]] == sorted(e["start"] for e in feed["events"]))
for e in feed["events"]:
    check("upcoming status " + e["eventId"], e["displayStatus"] in ["Upcoming", "In progress"])
today = now.astimezone(ZoneInfo("America/New_York")).date()
through = today + dt.timedelta(days=30)
window = [e for e in feed["events"] if today.isoformat() <= e["date"] <= through.isoformat()]
for query, expected in [
    ("", [e["eventId"] for e in window]),
    ("city=Cayce", [e["eventId"] for e in window if e["venue"] == "WesCo Brew & Bowl"]),
    ("category=Music%20Bingo", [e["eventId"] for e in window if e["category"] == "Music Bingo"]),
    ("price=paid", [e["eventId"] for e in window if e["category"] == "Murder Mystery"]),
]:
    path = "/events/" + ("?" + query if query else "")
    status, _, content, _ = get(path)
    check("calendar filter " + (query or "next 30 days"), status == 200 and Page(content).event_ids == expected)
_, _, empty, _ = get("/events/?city=Irmo")
check("empty filter offers recovery", "No matching events" in empty and "See the next 30 days" in empty)
_, _, inverted, _ = get("/events/?from=2026-12-01&to=2026-10-01")
check("invalid date range has accessible error", 'role="alert"' in inverted)
_, _, confirmation, _ = get("/thank-you/")
check("confirmation noindex", "noindex" in Page(confirmation).robots)
_, admin_headers, _, _ = get("/admin/")
check("editor noindex", "noindex" in admin_headers.get("X-Robots-Tag", ""))
check("unknown event returns 404", get("/events/not-a-real-event/")[0] == 404)

report = {"base": base, "testedAt": now.isoformat(), "sitemaps": maps,
          "sitemapUrls": len(entries), "eventSchemas": event_count,
          "upcomingFeedEvents": len(feed["events"]), "checks": checks, "pages": pages,
          "passed": sum(c["passed"] for c in checks), "failed": [c for c in checks if not c["passed"]]}
from pathlib import Path
Path(output).parent.mkdir(parents=True, exist_ok=True)
Path(output).write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps({k: v for k, v in report.items() if k not in ["checks", "pages"]}, indent=2))
sys.exit(1 if report["failed"] else 0)
