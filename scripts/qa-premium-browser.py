"""Browser QA for Four Dogs premium motion on local Astro source. No form is submitted."""
import asyncio
import os
import time
import urllib.request
from pathlib import Path
from playwright.async_api import async_playwright

BASE = os.environ.get("FOUR_DOGS_QA_URL", "http://127.0.0.1:4321")
SIZES = [
    ("iphone-se", 320, 740),
    ("iphone-medium", 375, 812),
    ("iphone-regular", 390, 844),
    ("iphone-large", 430, 932),
    ("tablet", 768, 1024),
    ("desktop", 1280, 800),
    ("desktop-wide", 1440, 900),
]


def ready():
    for _ in range(80):
        try:
            with urllib.request.urlopen(BASE, timeout=2) as response:
                if response.status == 200:
                    return
        except Exception:
            time.sleep(0.5)
    raise RuntimeError("Local Astro QA server did not become available")


async def main():
    ready()
    Path("qa-screenshots").mkdir(exist_ok=True)
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        try:
            for name, width, height in SIZES:
                context = await browser.new_context(viewport={"width": width, "height": height})
                page = await context.new_page()
                errors = []
                page.on("pageerror", lambda err: errors.append(str(err)))
                response = await page.goto(BASE + "/", wait_until="domcontentloaded")
                assert response is not None and response.status == 200, (name, "homepage response")
                heading = page.locator(".home-intro-copy h1")
                try:
                    await heading.wait_for(state="attached", timeout=8000)
                except Exception:
                    raise AssertionError((name, "home heading missing", await page.title(),
                                          (await page.locator("body").inner_text())[:1000]))
                assert await heading.count() == 1, (name, "duplicate homepage heading")
                assert await page.locator('.home-intro-copy a[href="/booking/"]').count() == 1
                assert await page.locator('.home-intro-copy a[href="/events/"]').count() == 1
                assert await page.locator('.service-directory > a').count() >= 6
                assert await page.locator('.event-row').count() >= 1
                await page.locator(".home-intro-photo img").wait_for()
                await page.wait_for_timeout(400)
                image_loaded = await page.locator(".home-intro-photo img").evaluate(
                    "(img) => img.complete && img.naturalWidth > 0"
                )
                assert image_loaded, (name, "hero photo failed to load")
                # Animations must never leave skipped, below-fold content invisible.
                if width <= 430:
                    event_opacity = float(await page.locator(".event-row").first.evaluate(
                        "(el) => getComputedStyle(el).opacity"
                    ))
                    assert event_opacity > 0.95, (
                        name, "offscreen event hidden before scrolling", event_opacity
                    )

                overflow = await page.evaluate(
                    "document.documentElement.scrollWidth - document.documentElement.clientWidth"
                )
                assert overflow <= 1, (name, "horizontal overflow", overflow)
                if width <= 800:
                    menu = page.locator("header button.menu")
                    assert await menu.is_visible(), (name, "menu missing")
                    await menu.click()
                    assert await menu.get_attribute("aria-expanded") == "true"
                    assert await page.locator('#navlinks a[href="/events/"]').is_visible()
                    await page.keyboard.press("Escape")
                    assert await menu.get_attribute("aria-expanded") == "false"
                else:
                    assert not await page.locator("header button.menu").is_visible()
                    services = page.locator('header details').first
                    await services.locator("summary").click()
                    assert await services.get_attribute("open") is not None
                    await page.keyboard.press("Escape")
                    assert await services.get_attribute("open") is None
                await page.locator(".home-photo-grid figure").first.scroll_into_view_if_needed()
                await page.wait_for_timeout(850)
                photo_opacity = float(await page.locator(".home-photo-grid figure").first.evaluate(
                    "(el) => getComputedStyle(el).opacity"
                ))
                assert photo_opacity > 0.95, (name, "photo reveal stayed hidden", photo_opacity)
                assert not errors, (name, "uncaught JS errors", errors)
                await page.evaluate("window.scrollTo({ top: 0, behavior: 'instant' })")
                await page.wait_for_timeout(250)
                await page.screenshot(path=f"qa-screenshots/{name}.png", full_page=True)
                print(f"PASS {name}: {width}x{height}, menu, content, image, event, scroll reveal, no overflow")
                # Check the revised public event across the same phone, tablet, and desktop widths.
                event_path = "/events/the-reunion-the-ultimate-reality-tv-trivia-night-charter-803-2026-11-05/"
                event_response = await page.goto(BASE + event_path, wait_until="domcontentloaded")
                assert event_response is not None and event_response.status == 200, (name, "event URL")
                assert (await page.locator(".event-detail-hero h1").inner_text()) == (
                    "SCI-FI LEGENDS: The Ultimate Sci-Fi Trivia Night"
                ), (name, "sci-fi event heading")
                detail = await page.locator(".event-detail-body").inner_text()
                header = await page.locator(".event-detail-hero").inner_text()
                assert "Sir Patrick Stewart" in detail and "Join Joey" in detail, (name, "tribute or host missing")
                assert "Message Charter 803 directly to reserve your table" in detail, (name, "reservation instruction")
                assert "November 5, 2026" in header and "6:30 PM" in header, (name, "event date/time")
                assert "Charter 803 Bar & Grill" in header and "Lexington, SC" in header, (name, "venue")
                assert "THE REUNION" not in (header + detail), (name, "old promo copy remains")
                meta_description = await page.locator('meta[name="description"]').get_attribute("content")
                assert meta_description and "SCI-FI LEGENDS" in meta_description, (name, "SEO description")
                event_overflow = await page.evaluate(
                    "document.documentElement.scrollWidth - document.documentElement.clientWidth"
                )
                assert event_overflow <= 1, (name, "event page horizontal overflow", event_overflow)
                assert await page.locator('a[href="/events/"]').count() >= 1, (name, "events navigation")
                await page.screenshot(path=f"qa-screenshots/{name}-sci-fi-legends.png", full_page=True)
                listing_response = await page.goto(BASE + "/events/", wait_until="domcontentloaded")
                assert listing_response is not None and listing_response.status == 200, (name, "event calendar")
                assert await page.locator(f'a[href="{event_path}"]').count() >= 1, (
                    name, "calendar link to original event URL"
                )
                print(f"PASS {name}: SCI-FI LEGENDS event, SEO, reservation details, layout and calendar link")
                await context.close()

            reduced = await browser.new_context(
                viewport={"width": 390, "height": 844}, reduced_motion="reduce"
            )
            page = await reduced.new_page()
            await page.goto(BASE + "/", wait_until="domcontentloaded")
            await page.locator(".home-photo-grid figure").first.scroll_into_view_if_needed()
            opacity = await page.locator(".home-photo-grid figure").first.evaluate(
                "(el) => getComputedStyle(el).opacity"
            )
            assert float(opacity) == 1.0, ("reduced motion hid content", opacity)
            animation = await page.locator(".home-intro-copy h1").evaluate(
                "(el) => getComputedStyle(el).animationName"
            )
            assert animation == "none", ("reduced motion animation active", animation)
            await reduced.close()
            print("PASS prefers-reduced-motion")

            no_js = await browser.new_context(viewport={"width": 390, "height": 844},
                                              java_script_enabled=False)
            page = await no_js.new_page()
            await page.goto(BASE + "/", wait_until="domcontentloaded")
            assert await page.locator(".event-row").count() >= 1
            await page.locator(".home-photo-grid figure").first.scroll_into_view_if_needed()
            opacity = await page.locator(".home-photo-grid figure").first.evaluate(
                "(el) => getComputedStyle(el).opacity"
            )
            assert float(opacity) == 1.0, ("no-JS content hidden", opacity)
            await page.goto(BASE + "/booking/", wait_until="domcontentloaded")
            assert await page.locator("form").count() >= 1, "booking form missing"
            await no_js.close()
            print("PASS no-JS reveal fallback and booking-form page (submission not attempted)")
        finally:
            await browser.close()


if __name__ == "__main__":
    asyncio.run(main())
