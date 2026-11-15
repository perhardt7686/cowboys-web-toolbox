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
    page.on('pageerror', lambda error: errors.append(str(error)))
    await page.goto(URL, wait_until='domcontentloaded')
    await page.locator('#family-avatar-quick').click()
    form = page.locator('#profile-studio-form')
    edit = form.locator('.family-character-editor')
    turn = edit.locator('[data-avatar-turntable]')
    canvas = turn.locator('canvas')
    await expect(canvas).to_have_attribute('data-angle', '0')
    await expect(turn.get_by_role('button', name='Rotate left')).to_be_visible()
    assert await canvas.evaluate('n => n.height > n.width')
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
    await turn.get_by_role('button', name='Zoom in').click()
    await expect(canvas).to_have_attribute('data-zoom', '1.35')
    assert await fingerprints(canvas) != before_zoom
    await expect(canvas).to_have_attribute('data-angle', '315')
    await turn.get_by_role('button', name='Fit', exact=True).click()
    await expect(canvas).to_have_attribute('data-zoom', '1')
    await expect(canvas).to_have_attribute('data-angle', '315')
    await turn.get_by_role('button', name='Reset view').click()
    await expect(canvas).to_have_attribute('data-angle', '0')
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

    await wardrobe('model', 'automaton').click()
    await expect(wardrobe('model', 'automaton')).to_have_attribute('aria-pressed', 'true')
    robot = await fingerprints(canvas)
    await wardrobe('model', 'specter').click()
    assert await fingerprints(canvas) != robot
    await wardrobe('model', 'mechanic').click()
    await wardrobe('outerwear', 'trench').click()
    await wardrobe('footwear', 'highboots').click()
    face_group = edit.get_by_text('Hair & facial hair', exact=True)
    await face_group.click()
    await edit.locator('[data-avatar-feature=beard][data-avatar-value=beard]').click()
    await edit.get_by_role('button', name='Pets', exact=True).click()
    await edit.get_by_role('combobox', name='Choose a pet').select_option('trail-husky')
    await edit.get_by_role('button', name='Adopt', exact=True).click()
    await edit.get_by_role('button', name='Take along').click()
    await expect(edit.locator('#avatar-equipped').get_by_text('Trail Husky', exact=True)).to_be_visible()
    await edit.get_by_role('textbox', name='Outfit name').fill('Moonlight Patrol')
    await edit.get_by_role('button', name='Save outfit', exact=True).click()
    saved_look = edit.get_by_role('button', name='Moonlight Patrol', exact=True)
    await expect(saved_look).to_be_visible()
    await form.get_by_role('button', name='Save my avatar').click()
    await expect(form.get_by_text('Preview saved locally for this session.')).to_be_visible()
    await page.locator('#content-dialog').evaluate('dialog => dialog.close()')
    await page.locator('#family-avatar-quick').click()
    await wardrobe('model', 'specter').click()
    await saved_look.click()
    await expect(wardrobe('model', 'mechanic')).to_have_attribute('aria-pressed', 'true')
    await expect(wardrobe('outerwear', 'trench')).to_have_attribute('aria-pressed', 'true')
    await expect(wardrobe('footwear', 'highboots')).to_have_attribute('aria-pressed', 'true')

    await edit.get_by_role('button', name='Unlockables', exact=True).click()
    search = edit.get_by_role('searchbox', name='Search rewards')
    await search.fill('Carnival Control Plate')
    incompatible = edit.locator('[data-reward-item=carnival-visor-plate]')
    await expect(incompatible.get_by_role('button', name='Try on Carnival Control Plate')).to_be_disabled()
    await expect(incompatible.get_by_text('Fits robot', exact=False)).to_be_visible()
    await search.fill('Spectral Case Sword')
    prize = edit.locator('[data-reward-item=spectral-case-sword]')
    await prize.get_by_role('button', name='Try on Spectral Case Sword').click()
    await expect(edit.get_by_text('Spectral Case Sword · Preview only')).to_be_visible()
    await prize.get_by_role('button', name='See Spectral Case Sword').click()
    await page.evaluate('''() => {
      const root=document.createElement('section');root.id='dash-forge-root';
      root.innerHTML='<button id="dash-forge-toggle" type="button">Sample Dash Forge</button>';
      document.querySelector('#conversations .community-main').append(root);
    }''')
    await edit.get_by_role('button', name='Play Dash Forge to unlock').click()
    await expect(page.locator('#arcade-game-title-view')).to_contain_text('DASH FORGE')
    await page.get_by_role('button', name='Back to Avatar Studio', exact=True).click()
    await expect(edit.get_by_role('heading', name='Spectral Case Sword')).to_be_visible()
    await edit.get_by_role('button', name='Draw the light').click()
    await edit.get_by_role('button', name='My Avatar', exact=True).click()
    await turn.get_by_role('button', name='Rotate right').click()
    await expect(canvas).to_have_attribute('data-angle', '45')
    await canvas.scroll_into_view_if_needed()
    await expect(canvas).to_be_in_viewport(ratio=.86)
    assert await page.locator('#content-dialog').evaluate('n => n.scrollWidth <= n.clientWidth + 2')
    if phone:
        (ROOT / 'reports').mkdir(exist_ok=True)
        await page.screenshot(path=str(ROOT / 'reports' / 'avatar-turntable-iphone.png'), animations='disabled')
        await page.set_viewport_size({'width': 844, 'height': 390})
        await expect(turn.get_by_role('button', name='Reset view')).to_be_visible()
        assert await page.locator('#content-dialog').evaluate('n => n.scrollWidth <= n.clientWidth + 2')
    await edit.get_by_role('button', name='Pets', exact=True).click()
    await edit.get_by_role('combobox', name='Choose a pet').select_option('fog-hound')
    await edit.get_by_text('Inspect pet', exact=True).click()
    pet_turn = edit.locator('.avatar-pet-inspection')
    pet = pet_turn.locator('canvas')
    old_pet = await fingerprints(pet)
    await pet_turn.get_by_role('button', name='Rotate right').click()
    await expect(pet).to_have_attribute('data-angle', '45')
    assert await fingerprints(pet) != old_pet
    assert not errors, errors
    await page.close()
    print(f'Full-body avatar turntable PASS in {"iPhone-sized WebKit" if phone else "desktop Chromium"}')


async def main():
    async with async_playwright() as playwright:
        chromium = await playwright.chromium.launch()
        await verify(chromium)
        await chromium.close()
        webkit = await playwright.webkit.launch()
        await verify(webkit, phone=True)
        await webkit.close()


if __name__ == '__main__':
    asyncio.run(main())
