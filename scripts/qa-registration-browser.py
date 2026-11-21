"""Non-destructive browser smoke tests for registration features before provider activation.

Tests that the preview fails closed, exposes no live registration and remains readable
on mobile and desktop. Never writes customer data or requests a real confirmation.
"""
import asyncio
import os
from playwright.async_api import async_playwright

BASE = os.environ.get("FOUR_DOGS_QA_URL", "http://127.0.0.1:4321").rstrip("/")

async def inspect(browser, width):
    ctx = await browser.new_context(viewport={"width":width,"height":860},
                                    reduced_motion="reduce", java_script_enabled=True)
    page = await ctx.new_page()
    for route,heading in [
        ("/register/","Register your group. Come have fun."),
        ("/staff/","Event check-in"),
        ("/staff/check-in/","Host check-in"),
        ("/staff/owner/","Registrations & rewards")]:
        response=await page.goto(BASE+route,wait_until="domcontentloaded",timeout=45000)
        assert response and response.status==200,(route,response.status if response else None)
        assert heading in await page.locator("h1").inner_text(),route
        overflow=await page.evaluate("document.documentElement.scrollWidth-document.documentElement.clientWidth")
        assert overflow<=1,(route,"horizontal overflow",width,overflow)
    response=await page.goto(BASE+"/register/",wait_until="domcontentloaded")
    assert response is not None
    assert await page.get_by_text("Online registration is not available yet.").count()==1, "registration must fail closed without an approved database and mail provider"
    assert await page.locator("form#free-registration").count()==0,"must not collect personal data without infrastructure"
    assert await page.locator('meta[name="robots"][content*="noindex"]').count()==1,"inactive registration must not be indexed"
    response=await page.goto(BASE+"/events/",wait_until="domcontentloaded")
    assert response is not None
    assert await page.get_by_role("link",name="Register Free").count()==0,"no registration CTA before verified activation"
    # A paid event continues to use its existing ticket flow; no free button is injected.
    result=await page.request.get(BASE+"/api/staff/?mode=events")
    assert result.status==503,"staff API must not expose private records when unconfigured"
    result=await page.request.get(BASE+"/api/registration/")
    assert result.status==405,"registration must not be allowed via GET"
    await ctx.close()

async def main():
    async with async_playwright() as p:
        browser=await p.chromium.launch()
        for width in [375,430,1280]:
            await inspect(browser,width)
        await browser.close()
    print("Registration safety and responsive smoke checks passed for disabled preview.")

if __name__=="__main__":
    asyncio.run(main())
