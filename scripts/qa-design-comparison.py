"""Capture production-before and local-after pages, plus focused interaction checks.

The production site is read-only. No booking form is submitted.
"""
import asyncio
import json
import os
from pathlib import Path
from playwright.async_api import async_playwright

BEFORE = "https://4dogsentertainment.com"
AFTER = os.environ.get("FOUR_DOGS_DESIGN_AFTER_URL", "http://127.0.0.1:4321")
PAGES = {
    "home": "/",
    "services": "/services/",
    "weddings": "/weddings/",
    "venues": "/for-venues/",
    "about": "/about/",
    "gallery": "/gallery/",
    "brides": "/for-the-brides/",
    "local-wedding": "/wedding-dj-lexington-sc/",
    "photo-booth": "/services/photo-booth/",
    "retired-aura": "/venues/aura-kitchen-bar-music-bingo-columbia-sc/",
}
SIZES = {
    "iphone": (390, 844),
    "desktop": (1440, 900),
}
OUT = Path("qa-design")
IMAGES = Path("qa-screenshots")


async def capture(browser, origin, kind, name, route, device, width, height):
    context = await browser.new_context(
        viewport={"width": width, "height": height},
        reduced_motion="reduce",
        device_scale_factor=1,
        ignore_https_errors=True,
    )
    page = await context.new_page()
    result = {"origin": kind, "route": route, "device": device, "width": width}
    try:
        response = await page.goto(origin + route, wait_until="domcontentloaded", timeout=45000)
        result["status"] = response.status if response else None
        await page.locator("main h1").first.wait_for(timeout=12000)
        await page.wait_for_timeout(350)
        result["h1"] = await page.locator("main h1").first.inner_text()
        result["overflow_px"] = await page.evaluate(
            "document.documentElement.scrollWidth - document.documentElement.clientWidth"
        )
        result["canonical"] = await page.locator('link[rel="canonical"]').get_attribute("href")
        result["main_images"] = await page.locator("main img").count()
        result["main_video"] = await page.locator("main video").count()
        result["navigation_ms"] = await page.evaluate("""() => {
          const navigation = performance.getEntriesByType('navigation')[0];
          return navigation ? Math.round(navigation.domContentLoadedEventEnd) : null;
        }""")
        # Scroll to request lazy images before the full-page screenshot.
        await page.evaluate("""async () => {
          const max = document.documentElement.scrollHeight;
          for (let y = 0; y < max; y += Math.max(550, innerHeight)) {
            scrollTo(0, y);
            await new Promise(resolve => setTimeout(resolve, 45));
          }
          scrollTo(0, 0);
        }""")
        # Ensure screenshots show actual image content rather than lazy-load placeholders.
        await page.evaluate("""async () => {
          const images = [...document.querySelectorAll('main img')];
          await Promise.all(images.map(async (img) => {
            img.loading = 'eager';
            await Promise.race([
              img.decode().catch(() => {}),
              new Promise(resolve => setTimeout(resolve, 15000))
            ]);
          }));
        }""")
        await page.wait_for_timeout(200)
        result["broken_images"] = await page.locator("main img").evaluate_all(
            "(images) => images.filter(i => i.complete && i.naturalWidth === 0).map(i => i.getAttribute('src'))"
        )
        result["incomplete_images"] = await page.locator("main img").evaluate_all(
            "(images) => images.filter(i => !i.complete).map(i => i.getAttribute('src'))"
        )
        path = IMAGES / f"design-{kind}-{name}-{device}.png"
        await page.screenshot(path=str(path), full_page=True, animations="disabled", timeout=30000)
        result["screenshot"] = str(path)
        if kind == "after":
            assert result["status"] == 200, (name, "unexpected response", result["status"])
            assert result["overflow_px"] <= 1, (name, "horizontal overflow", result["overflow_px"])
            assert result["canonical"], (name, "canonical missing")
            assert not result["broken_images"], (name, "broken images", result["broken_images"])
            assert not result["incomplete_images"], (name, "incomplete images", result["incomplete_images"])
            if name == "weddings":
                assert await page.locator('video source[src^="/videos/weddings/"]').count() == 10, "wedding videos missing"
            if name == "photo-booth":
                assert await page.locator('main img[src*="wedding-floor"]').count() == 0, "unrelated wedding photo on photo booth"
            if name == "brides":
                await page.locator("#brides-first").fill("Taylor")
                await page.locator("#brides-second").fill("Jordan")
                await page.locator('#brides-form button[type="submit"]').click()
                assert await page.locator("#brides-results").is_visible(), "hashtag results missing"
                assert await page.locator("#brides-results-grid").locator("button, article, div").count() > 0, "hashtag generator empty"
            if name == "retired-aura":
                text = await page.locator("main").inner_text()
                assert "The Music Bingo trial has ended." in text
                assert "not currently hosting events at this location" in text
                assert "Coming up here" not in text
                assert await page.locator('a[href="/events/?view=archive&venue=aura"]').count() == 1
            if name == "gallery":
                await page.locator('[data-gallery-filter="Weddings"]').click()
                assert await page.locator('[data-gallery-item]:not([hidden])').count() == 3, "wedding gallery filter"
                await page.locator('[data-gallery-filter="All"]').click()
                assert await page.locator('[data-gallery-item]:not([hidden])').count() == 52, "gallery items changed beyond the single Aura removal"
        result["ok"] = True
    except Exception as exc:
        result["ok"] = False
        result["error"] = repr(exc)
    finally:
        await context.close()
    return result


async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    IMAGES.mkdir(parents=True, exist_ok=True)
    results = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        try:
            for name, route in PAGES.items():
                for device, (width, height) in SIZES.items():
                    for origin, kind in ((BEFORE, "before"), (AFTER, "after")):
                        result = await capture(browser, origin, kind, name, route, device, width, height)
                        results.append(result)
                        print(f"{'PASS' if result['ok'] else 'FAIL'} {kind} {name} {device}: {result.get('error', 'captured')}", flush=True)
        finally:
            await browser.close()
    (OUT / "design-comparison.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
    local_failures = [r for r in results if r["origin"] == "after" and not r["ok"]]
    before_failures = [r for r in results if r["origin"] == "before" and not r["ok"]]
    print(f"Comparison results: {len(results)} attempts; {len(local_failures)} local failures; {len(before_failures)} production-baseline capture failures")
    if local_failures:
        raise SystemExit(1)


if __name__ == "__main__":
    asyncio.run(main())
