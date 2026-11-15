#!/usr/bin/env python3
"""Verify stage interactions through the private board's approved-member preview."""
import asyncio
from pathlib import Path

from playwright.async_api import async_playwright, expect

REPORTS = Path(__file__).resolve().parents[1] / 'reports'
URL = 'http://127.0.0.1:8765/community.html?preview=1&role=member'


async def studio(page):
    await page.goto(URL, wait_until='domcontentloaded')
    await page.locator('#family-avatar-quick').click()
    form = page.locator('#profile-studio-form')
    award = form.get_by_role('button', name='Back to Studio', exact=True)
    if await award.is_visible():
        await award.click()
    canvas = form.locator('#family-avatar-canvas')
    await expect(canvas).to_have_attribute('data-renderer', '3d', timeout=20000)
    await form.get_by_role('button', name='Unlockables', exact=True).click()
    await form.get_by_role('heading', name='Matching looks').wait_for()
    return form, canvas


async def pixels(canvas):
    return await canvas.evaluate('canvas => canvas.toDataURL()')


async def reduce_motion_walk(browser):
    page = await browser.new_page(
        viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True,
        reduced_motion='reduce',
    )
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    form, canvas = await studio(page)
    stage = form.locator('.studio-stage')
    note = stage.locator('.avatar-stage-preview-note')
    for look, action, reward, reaction in [
        ('Lantern Detective', 'Light the lantern', 'museum-lantern', 'sniff'),
        ('Bell Tower', 'Unfurl cloak', 'phantom-cloak', ''),
        ('Workshop', 'Sweep the visor', 'carnival-visor-plate', 'scan'),
    ]:
        await form.get_by_role('button', name='Preview '+look+' look').click()
        await expect(note).to_contain_text(look+' preview')
        resting = await pixels(canvas)
        await note.get_by_role('button', name=action).click()
        await expect(canvas).to_have_attribute('data-studio-action', reward)
        await expect(canvas).to_have_attribute('data-studio-reaction', reaction)
        assert resting != await pixels(canvas)
        if look == 'Lantern Detective':
            await stage.evaluate("element => element.scrollIntoView({block:'start'})")
            await expect(canvas).to_be_in_viewport(ratio=.96)
            await expect(note.get_by_role('button', name=action)).to_be_in_viewport()
            await page.screenshot(path=str(REPORTS/'avatar-cartoon-iphone.png'), animations='disabled')
        await note.get_by_role('button', name='My character', exact=True).click()
        await expect(canvas).to_have_attribute('data-studio-action', '')
        await expect(note).to_be_hidden()
    await expect(form.locator('#avatar-equipped').get_by_text('Museum Lantern')).to_have_count(0)

    await form.get_by_role('searchbox', name='Search rewards').fill('Spectral Case Sword')
    await form.get_by_role('button', name='See Spectral Case Sword').click()
    preview = form.locator('.avatar-prize-art')
    await expect(form.get_by_role('heading', name='Spectral Case Sword')).to_be_visible()
    before = await pixels(preview)
    await form.get_by_role('button', name='Draw the light', exact=True).click()
    await expect(preview).to_have_attribute('data-studio-action', 'spectral-case-sword')
    assert before != await pixels(preview)
    await expect(form.get_by_role('button', name='Play Dash Forge to unlock')).to_be_visible()
    await form.get_by_role('button', name='Try it on', exact=True).click()
    await form.get_by_role('button', name='Save my avatar').click()
    await expect(form.get_by_text('Remove the preview-only items before saving your avatar.')).to_be_visible()
    await page.set_viewport_size({'width': 844, 'height': 390})
    assert await page.locator('#content-dialog').evaluate('n => n.scrollWidth <= n.clientWidth + 2')
    assert not errors, errors
    print('iPhone-sized WebKit cartoon interactions PASS, including locked action and reduced motion')
    await page.close()


async def record_interaction(browser):
    context = await browser.new_context(viewport={'width': 864, 'height': 810},
        record_video_dir=REPORTS/'cartoon-recordings', record_video_size={'width': 864, 'height': 810})
    page = await context.new_page()
    video = page.video
    form, canvas = await studio(page)
    note = form.locator('.avatar-stage-preview-note')
    await form.get_by_role('button', name='Preview Lantern Detective look').click()
    await form.locator('.studio-stage').evaluate("element => element.scrollIntoView({block:'start'})")
    await expect(canvas).to_be_in_viewport(ratio=.96)
    await expect(canvas).to_have_attribute('data-backend', 'webgl')
    await form.get_by_role('button', name='Rotate right', exact=True).click()
    await expect(canvas).to_have_attribute('data-angle', '45')
    paused = await pixels(canvas)
    await note.get_by_role('button', name='Light the lantern', exact=True).click()
    await expect(canvas).to_have_attribute('data-studio-reaction', 'sniff')
    assert paused != await pixels(canvas)
    await expect(canvas).to_have_attribute('data-studio-action', '', timeout=6000)
    await note.get_by_role('button', name='Light the lantern', exact=True).click()
    await expect(canvas).to_have_attribute('data-studio-action', '', timeout=6000)
    await context.close()
    await video.save_as(REPORTS/'avatar-cartoon-interaction.webm')
    print('Desktop Chromium animated lantern and Fog Hound PASS')


async def software_preview(chromium):
    browser = await chromium.launch(args=['--disable-webgl', '--disable-webgl2'])
    page = await browser.new_page(viewport={'width': 390, 'height': 844}, reduced_motion='reduce')
    form, canvas = await studio(page)
    await expect(canvas).to_have_attribute('data-backend', 'canvas')
    await form.get_by_role('button', name='Preview Workshop look').click()
    before = await pixels(canvas)
    await form.locator('.avatar-stage-preview-note').get_by_role('button', name='Sweep the visor').click()
    await expect(canvas).to_have_attribute('data-studio-reaction', 'scan')
    assert before != await pixels(canvas)
    await browser.close()
    print('Canvas fallback preserves the visual interaction PASS')


async def main():
    REPORTS.mkdir(exist_ok=True)
    async with async_playwright() as playwright:
        webkit = await playwright.webkit.launch()
        await reduce_motion_walk(webkit)
        await webkit.close()
        chromium = await playwright.chromium.launch(args=['--enable-unsafe-swiftshader', '--use-angle=swiftshader'])
        await record_interaction(chromium)
        await chromium.close()
        await software_preview(playwright.chromium)


if __name__ == '__main__':
    asyncio.run(main())
