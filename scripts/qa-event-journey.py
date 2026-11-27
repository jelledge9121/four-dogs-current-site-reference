"""Regression checks against a local build. Every POST and external request is intercepted."""
import asyncio
import os
from urllib.parse import parse_qs, urlsplit

from playwright.async_api import async_playwright

BASE = os.environ.get("FOUR_DOGS_QA_URL", "http://127.0.0.1:4321").rstrip("/")


async def main():
    if urlsplit(BASE).hostname not in {"127.0.0.1", "localhost", "::1"}:
        raise ValueError("Run these simulated booking checks against a local build.")

    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(executable_path=os.environ.get("CHROMIUM_PATH"))
        context = await browser.new_context(viewport={"width": 390, "height": 844})
        submissions = []

        async def intercept(route):
            request = route.request
            if urlsplit(request.url).netloc != urlsplit(BASE).netloc:
                return await route.abort()
            if request.method == "POST" and urlsplit(request.url).path == "/thank-you/":
                submissions.append(parse_qs(request.post_data or ""))
                return await route.fulfill(status=503 if len(submissions) == 1 else 200, body="")
            if request.method != "GET":
                return await route.abort()
            await route.continue_()

        await context.route("**/*", intercept)
        page = await context.new_page()
        try:
            for width in [320, 390]:
                await page.set_viewport_size({"width": width, "height": 844})
                for path in ["/", "/events/", "/booking/", "/weddings/", "/for-venues/"]:
                    await page.goto(BASE + path)
                    await page.add_style_tag(content="html{font-size:200% !important}")
                    assert await page.evaluate("document.documentElement.scrollWidth <= innerWidth"), (width, path)

            await page.goto(BASE + "/events/")
            first = page.locator(".event-row").first
            if await first.count():
                for selector in ["h3", ".event-place", ".event-time", ".event-meta span"]:
                    box = await first.locator(selector).first.bounding_box()
                    assert box and box["y"] + box["height"] <= 844, selector

            await page.goto(BASE + "/events/?venue=wesco")
            await page.get_by_role("button", name="Today", exact=True).click()
            query = parse_qs(urlsplit(page.url).query)
            assert query["from"] == query["to"] and query["venue"] == ["wesco"]
            assert await page.get_by_role("button", name="Today", exact=True).get_attribute("aria-current")
            assert await page.locator("#event-results").is_visible()

            await page.goto(BASE + "/")
            await page.set_viewport_size({"width": 320, "height": 680})
            await page.add_style_tag(content="html{font-size:200% !important}")
            opener = page.locator("footer [data-pack-open]")
            await opener.click()
            dialog = page.get_by_role("dialog")
            assert await dialog.is_visible()
            assert await dialog.evaluate("e => e.scrollWidth <= e.clientWidth")
            assert (await dialog.locator("[data-pack-sms]").first.get_attribute("href")).startswith("sms:")
            await page.keyboard.press("Shift+Tab")
            assert await dialog.locator("button").last.evaluate("b => b === document.activeElement")
            await page.keyboard.press("Escape")
            assert not await dialog.is_visible() and await opener.evaluate("b => b === document.activeElement")

            await page.goto(BASE + "/booking/?service=Venue%20Entertainment")
            form = page.locator('form[name="booking"]')
            submit = form.get_by_role("button", name="Send booking request")
            email = form.locator('[name="email"]')
            optional = form.locator(".booking-optional")
            assert await optional.get_attribute("open") is None
            assert await submit.is_visible()
            await optional.locator("summary").click()
            assert await form.locator("[data-venue-partnership]").is_visible()
            name = form.locator('[name="name"]')
            await email.evaluate("e => e.setAttribute('aria-describedby', 'booking-progress-note')")
            await submit.click()
            jump = form.get_by_role("button", name="Go to the first field to fix")
            await jump.focus()
            await page.keyboard.press("Enter")
            assert await name.evaluate("e => e === document.activeElement")
            await email.fill("incomplete")
            assert await email.get_attribute("aria-invalid") == "true"
            error_id = await email.get_attribute("aria-describedby")
            assert error_id.split() == ["booking-progress-note", "booking-error-email"]
            assert await page.locator("#booking-error-email").is_visible()
            await email.fill("qa@example.invalid")
            assert await email.get_attribute("aria-invalid") is None
            assert await email.get_attribute("aria-describedby") == "booking-progress-note"
            await name.fill("Local QA")
            assert not await jump.is_visible()
            await form.locator('[name="preferred-weeknight"]').select_option("Thursday")
            await form.locator('[name="service"]').select_option("Corporate Event")
            assert not await form.locator("[data-venue-partnership]").is_visible()
            count = form.locator('[name="guest-count"]')
            await count.fill("0")
            await optional.locator("summary").click()
            await submit.click()
            assert await count.is_visible() and await count.get_attribute("aria-invalid") == "true"
            await count.fill("15")
            await optional.locator("summary").click()
            await form.locator('[name="contact-method"]').select_option("Text message")
            await submit.click()
            assert await form.locator('[name="phone"]').get_attribute("aria-invalid") == "true"
            assert not submissions
            await form.locator('[name="contact-method"]').select_option("Email")
            assert await form.locator('[name="phone"]').get_attribute("aria-invalid") is None

            await submit.click()
            await form.get_by_text("We couldn’t confirm receipt.", exact=False).wait_for()
            submit = form.get_by_role("button", name="Try sending again")
            assert await email.input_value() == "qa@example.invalid" and await submit.is_enabled()
            await submit.click()
            await page.wait_for_url(BASE + "/thank-you/")
            assert len(submissions) == 2 and submissions[0] == submissions[1]
            assert submissions[1]["form-name"] == ["booking"]
            assert submissions[1]["service"] == ["Corporate Event"]
            assert "preferred-weeknight" not in submissions[1]
            print("Passed enlarged text, calendar filtering, SMS focus and mocked booking failure/retry/success.")
        finally:
            await browser.close()


if __name__ == "__main__":
    asyncio.run(main())
