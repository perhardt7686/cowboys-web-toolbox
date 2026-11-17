#!/usr/bin/env python3
"""Walk the shipped turntable with sample approved users in Chromium and WebKit."""
import asyncio
from pathlib import Path

from playwright.async_api import async_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
URL = 'http://127.0.0.1:8765/community.html?preview=1&role=member'


async def fingerprints(canvas):
    return await canvas.evaluate('n => n.toDataURL()')


async def verify(browser, phone=False):
    page = await browser.new_page(
        viewport={'width': 390, 'height': 844} if phone else {'width': 1280, 'height': 900},
        is_mobile=phone, has_touch=phone, reduced_motion='reduce' if phone else 'no-preference',
    )
    errors = []
    page.on('pageerror', lambda error: errors.append(error.stack or str(error)))
    await page.goto(URL, wait_until='domcontentloaded')
    await page.locator('#family-avatar-quick').click()
    form = page.locator('#profile-studio-form')
    edit = form.locator('.family-character-editor')
    turn = edit.locator('.studio-stage [data-avatar-turntable]')
    canvas = turn.locator('canvas')
    await expect(canvas).to_have_attribute('data-angle', '0')
    await expect(turn.get_by_role('button', name='Rotate left')).to_be_visible()
    assert await canvas.evaluate('n => n.height >= 220 && n.width >= 230')
    await expect(canvas).to_have_attribute('data-renderer', '3d', timeout=15000)
    backend = await canvas.get_attribute('data-backend')
    signatures = set()
    for angle in range(0, 360, 45):
        await expect(canvas).to_have_attribute('data-angle', str(angle))
        signatures.add(await fingerprints(canvas))
        await turn.get_by_role('button', name='Rotate right').click()
    await expect(canvas).to_have_attribute('data-angle', '0')
    assert len(signatures) == 8
    await canvas.press('ArrowLeft')
    await expect(canvas).to_have_attribute('data-angle', '315')
    before_zoom = await fingerprints(canvas)
    camera_menu = turn.locator('.studio-camera-menu summary')
    await camera_menu.click()
    await turn.get_by_role('button', name='Zoom in').click()
    await expect(canvas).to_have_attribute('data-zoom', '1.35')
    assert await fingerprints(canvas) != before_zoom
    # Same person, camera angle and zoom, different original render pipelines.
    # The setting is preview-only and never mutates the saved avatar recipe.
    cel = turn.get_by_role('button', name='Layered 2D')
    before_compare = await fingerprints(canvas)
    await expect(cel).to_have_attribute('aria-pressed', 'false')
    await cel.click()
    await expect(cel).to_have_attribute('aria-pressed', 'true')
    await expect(canvas).to_have_attribute('data-renderer', '2d')
    await expect(canvas).to_have_attribute('data-preview-style', 'cel')
    await expect(canvas).to_have_attribute('data-angle', '315')
    await expect(canvas).to_have_attribute('data-zoom', '1.35')
    layered = await fingerprints(canvas)
    assert layered != before_compare
    (ROOT / 'reports').mkdir(exist_ok=True)
    await canvas.screenshot(path=str(ROOT / 'reports' / ('avatar-workshop-cel-iphone.png' if phone else 'avatar-workshop-cel-desktop.png')))
    await cel.click()
    await expect(cel).to_have_attribute('aria-pressed', 'false')
    await expect(canvas).to_have_attribute('data-renderer', '3d')
    await expect(canvas).to_have_attribute('data-preview-style', '3d')
    await expect(canvas).to_have_attribute('data-angle', '315')
    assert await fingerprints(canvas) != layered, 'Returning to 3D restores the original rendering path'
    await expect(canvas).to_have_attribute('data-angle', '315')
    await turn.get_by_role('button', name='Fit', exact=True).click()
    await expect(canvas).to_have_attribute('data-zoom', '1')
    await expect(canvas).to_have_attribute('data-angle', '315')
    await turn.get_by_role('button', name='Reset view').click()
    await expect(canvas).to_have_attribute('data-angle', '0')
    await turn.locator('[data-turn="face"]').click()
    await expect(canvas).to_have_attribute('data-zoom', '2.45')
    await turn.get_by_role('button', name='Reset view').click()
    spin = turn.locator('[data-turn=spin]')
    if phone:
        await expect(spin).to_be_disabled()
    else:
        await spin.click()
        await expect(spin).to_have_text('Pause')
        await expect(canvas).not_to_have_attribute('data-angle', '0')
        await spin.click()
        frozen = await canvas.get_attribute('data-angle')
        await expect(spin).to_have_text('Spin')
        await expect(canvas).to_have_attribute('data-angle', frozen)
        await turn.get_by_role('button', name='Reset view').click()
    await canvas.scroll_into_view_if_needed()
    box = await canvas.bounding_box()
    assert box and box['width'] >= 195
    y = box['y'] + box['height'] * .43
    await page.mouse.move(box['x'] + 50, y)
    await page.mouse.down()
    await page.mouse.move(box['x'] + 120, y, steps=6)
    await page.mouse.up()
    await expect(canvas).not_to_have_attribute('data-angle', '0')
    await turn.get_by_role('button', name='Reset view').click()

    def wardrobe(slot, value):
        return edit.locator(f'[data-avatar-body={slot}][data-avatar-value={value}]')

    await page.keyboard.press('Escape')
    await expect(camera_menu).to_be_focused()
    async def body(model, family):
        await edit.get_by_role('button',name='Create',exact=True).click()
        await edit.locator('[data-studio-part="looks"]').click()
        await edit.locator(f'[data-studio-family={family}]').click()
        await wardrobe('model', model).click()
    await body('automaton', 'robot')
    await expect(wardrobe('model', 'automaton')).to_have_attribute('aria-pressed', 'true')
    robot = await fingerprints(canvas)
    await body('specter', 'monster')
    assert await fingerprints(canvas) != robot
    await body('mechanic', 'human')
    await edit.get_by_role('button',name='Wardrobe',exact=True).click()
    await edit.locator('[data-studio-part="clothes"]').click()
    await wardrobe('outerwear', 'trench').click()
    await edit.get_by_text('Bottoms & shoes', exact=True).click()
    await wardrobe('footwear', 'highboots').click()
    await edit.get_by_role('button',name='Create',exact=True).click()
    await edit.locator('[data-studio-part="hair"]').click()
    await edit.locator('[data-avatar-feature=beard][data-avatar-value=beard]').click()
    await edit.locator('[data-studio-part="looks"]').click()
    await edit.locator('[data-studio-panel=looks] summary').filter(has_text='Fine tune').click()
    height = edit.locator('[data-studio-sculpt="height"]')
    await height.press('ArrowRight')
    await expect(height).to_have_value('1')
    await edit.get_by_role('button', name='Companions', exact=True).click()
    await edit.get_by_role('combobox', name='Choose a pet').select_option('studio-attic-ghost')
    await edit.get_by_role('button', name='Adopt', exact=True).click()
    await edit.get_by_role('button', name='Take along').click()
    await expect(edit.locator('#avatar-equipped').get_by_text('Wick the Attic Ghost', exact=True)).to_be_visible()
    await edit.get_by_role('button',name='Wardrobe',exact=True).click()
    await edit.get_by_role('textbox', name='Outfit name').fill('Moonlight Patrol')
    await edit.get_by_role('button', name='Save outfit', exact=True).click()
    saved_look = edit.get_by_role('button', name='Moonlight Patrol', exact=True)
    await expect(saved_look).to_be_visible()
    await form.get_by_role('button', name='Save look').click()
    await expect(form.locator('#profile-save-status')).to_have_text('Preview saved locally for this session.', timeout=15000)
    await page.locator('#content-dialog').evaluate('dialog => dialog.close()')
    await page.locator('#family-avatar-quick').click()
    await body('specter', 'monster')
    await edit.get_by_role('button',name='Wardrobe',exact=True).click()
    await saved_look.click()
    await edit.get_by_role('button',name='Create',exact=True).click()
    await edit.locator('[data-studio-family=human]').click()
    await expect(wardrobe('model', 'mechanic')).to_have_attribute('aria-pressed', 'true')
    await expect(height).to_have_value('1')
    await edit.get_by_role('button',name='Wardrobe',exact=True).click()
    await edit.locator('[data-studio-part="clothes"]').click()
    await expect(wardrobe('outerwear', 'trench')).to_have_attribute('aria-pressed', 'true')
    await edit.get_by_text('Bottoms & shoes', exact=True).click()
    await expect(wardrobe('footwear', 'highboots')).to_have_attribute('aria-pressed', 'true')

    await edit.get_by_role('button', name='Rewards', exact=True).click()
    search = edit.get_by_role('searchbox', name='Search rewards')
    await search.fill('Carnival Scanner Plate')
    incompatible = edit.locator('[data-reward-item=studio-workshop-visor]')
    await expect(incompatible.get_by_role('button', name='Try on Carnival Scanner Plate')).to_be_disabled()
    await expect(incompatible.get_by_text('Fits robot', exact=False)).to_be_visible()
    await search.fill('Brass Field Telescope')
    prize = edit.locator('[data-reward-item=studio-observatory-telescope]')
    await prize.get_by_role('button', name='Try on Brass Field Telescope').click()
    await expect(edit.locator('#avatar-preview-status')).to_contain_text('Earn it to save it')
    await prize.get_by_role('button', name='See Brass Field Telescope').click()
    # The old Star Squadron challenge is archived. Preserve its existing
    # ownership and tell members clearly that new progress is unavailable.
    await expect(edit.get_by_text('Legacy Star Squadron challenge archived.',exact=False)).to_be_visible()
    assert await edit.get_by_role('button',name='Play Star Squadron to unlock').count()==0
    await expect(edit.get_by_role('heading', name='Brass Field Telescope')).to_be_visible()
    await edit.get_by_role('button', name='Extend the telescope').click()
    await edit.get_by_role('button', name='Create', exact=True).click()
    await edit.locator('[data-studio-part="looks"]').click()
    await turn.get_by_role('button', name='Rotate right').click()
    await expect(canvas).to_have_attribute('data-angle', '45')
    await canvas.scroll_into_view_if_needed()
    await expect(canvas).to_be_in_viewport(ratio=.86)
    assert await page.locator('#content-dialog').evaluate('n => n.scrollWidth <= n.clientWidth + 2')
    assert await edit.locator('[data-avatar-body=model]').first.evaluate('e => e.clientWidth >= 81')
    await page.locator('#content-dialog').evaluate('n => n.scrollTop = 0')
    (ROOT / 'reports').mkdir(exist_ok=True)
    if phone:
        await page.screenshot(path=str(ROOT / 'reports' / 'avatar-turntable-iphone.png'), animations='disabled')
        await page.set_viewport_size({'width': 844, 'height': 390})
        await expect(camera_menu).to_be_visible()
        assert await page.locator('#content-dialog').evaluate('n => n.scrollWidth <= n.clientWidth + 2')
    else:
        await page.screenshot(path=str(ROOT / 'reports' / 'avatar-studio-desktop.png'), animations='disabled')
    await edit.get_by_role('button', name='Companions', exact=True).click()
    await edit.get_by_role('combobox', name='Choose a pet').select_option('studio-rain-hound')
    await edit.get_by_text('Inspect pet', exact=True).click()
    pet_turn = edit.locator('.avatar-pet-inspection')
    pet = pet_turn.locator('canvas')
    old_pet = await fingerprints(pet)
    await pet_turn.get_by_role('button', name='Rotate right').click()
    await expect(pet).to_have_attribute('data-angle', '45')
    assert await fingerprints(pet) != old_pet
    assert not errors, errors
    await page.close()
    print(f'Full-body avatar turntable PASS in {"iPhone-sized WebKit" if phone else "desktop Chromium"} ({backend})')


async def main():
    async with async_playwright() as playwright:
        chromium = await playwright.chromium.launch(args=['--enable-unsafe-swiftshader', '--use-angle=swiftshader'])
        await verify(chromium)
        await chromium.close()
        webkit = await playwright.webkit.launch()
        await verify(webkit, phone=True)
        await webkit.close()


if __name__ == '__main__':
    asyncio.run(main())
