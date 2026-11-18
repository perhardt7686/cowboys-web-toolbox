#!/usr/bin/env python3
"""Read-only V8 pilot checks with synthetic local state only."""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright, expect

REPORTS = Path(__file__).resolve().parents[1] / 'reports'
URL = 'http://127.0.0.1:8765/avatar-v8-pilot.html'

async def run():
    REPORTS.mkdir(exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        try:
            for width, height, label in [(390, 844, 'iphone'), (1365, 900, 'desktop')]:
                page = await browser.new_page(
                    viewport={'width': width, 'height': height},
                    is_mobile=width < 700, has_touch=width < 700,
                    reduced_motion='reduce',
                    device_scale_factor=1)
                errors = []
                page.on('pageerror', lambda err: errors.append(str(err)))
                page.on('console', lambda msg: errors.append('console: '+msg.text) if msg.type == 'error' else None)
                await page.goto(URL, wait_until='networkidle', timeout=30000)
                await expect(page.get_by_role('heading', name='Meet your next character.')).to_be_visible()
                await expect(page.locator('.art-stage svg')).to_be_visible()
                assert await page.locator('.art-stage svg').count() == 1
                assert await page.locator('.art-stage svg').get_attribute('role') == 'img'
                assert await page.evaluate('document.documentElement.scrollWidth <= innerWidth + 2'), 'horizontal overflow'
                if label == 'iphone':
                    await page.screenshot(path=str(REPORTS / 'avatar-v8-iphone.png'), full_page=True)
                else:
                    await page.screenshot(path=str(REPORTS / 'avatar-v8-desktop.png'), full_page=True)
                if label == 'iphone':
                    await expect(page.locator('.preview-peek')).to_be_visible()
                else:
                    await expect(page.locator('.preview-peek')).to_be_hidden()
                # Test true interaction, not presence of static markup.
                before = await page.locator('.art-stage svg').inner_html()
                await page.locator('[data-action="expression"][data-value="smile"]').click()
                after = await page.locator('.art-stage svg').inner_html()
                assert before != after, 'expression did not redraw'
                await page.locator('[data-action="undo"]').click()
                assert await page.locator('.art-stage svg').inner_html() == before, 'undo did not restore art'
                await page.locator('[data-action="redo"]').click()
                assert await page.locator('.art-stage svg').inner_html() == after, 'redo did not restore art'
                await page.locator('[data-action="body"][data-value="robot"]').click()
                assert (await page.locator('.art-stage svg').get_attribute('aria-label')).startswith('Original robot')
                await page.locator('[data-action="tab"][data-value="outfits"]').click()
                assert await page.locator('.reward-card').count() == 10
                visor = page.locator('[data-action="preview"][data-value="studio-workshop-visor"]')
                await expect(visor).to_be_enabled()
                await visor.click()
                await page.screenshot(path=str(REPORTS / ('avatar-v8-outfits-'+label+'.png')), full_page=True)
                assert await visor.get_attribute('aria-pressed') == 'true'
                await page.locator('[data-action="tab"][data-value="pets"]').click()
                assert await page.locator('.reward-card').count() == 2
                await page.locator('[data-action="preview"][data-value="studio-tower-gargoyle"]').click()
                assert 'Slatewing Gargoyle' in (await page.locator('.pet-feature').inner_text())
                await page.locator('[data-action="pet-play"]').click()
                assert await page.locator('.pet-play').count() == 1
                await page.screenshot(path=str(REPORTS / ('avatar-v8-pets-'+label+'.png')), full_page=True)
                await page.locator('[data-action="tab"][data-value="rewards"]').click()
                assert await page.locator('.reward-card').count() == 12
                await page.screenshot(path=str(REPORTS / ('avatar-v8-rewards-'+label+'.png')), full_page=True)
                await page.locator('[data-action="filter"][data-value="companion"]').click()
                assert await page.locator('.reward-card').count() == 2
                await page.locator('[data-action="reset"]').click()
                assert (await page.locator('.art-stage svg').get_attribute('aria-label')).startswith('Original human')
                assert not errors, (label, errors)
                print(f'V8 {label}: stage, mobile width, undo/redo, equipment, pets, gallery and reset PASS')
                await page.close()
        finally:
            await browser.close()

if __name__ == '__main__':
    asyncio.run(run())
