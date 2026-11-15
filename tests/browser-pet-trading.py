#!/usr/bin/env python3
"""Synthetic-only browser check of family pet offers and explicit acceptance.
No actual family profiles, trades, emails or score records are touched.
"""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright,expect
ROOT=Path(__file__).resolve().parents[1]
URL='http://127.0.0.1:8765/community.html?preview=1&role=member'

async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch()
  try:
   for width in [375,390]:
    page=await browser.new_page(viewport={'width':width,'height':844},has_touch=True)
    await page.goto(URL,wait_until='domcontentloaded')
    await page.evaluate("""async()=>{
      const {createPetTradeUI}=await import('/avatar-pet-trading.mjs?v=toon3');
      const target=document.createElement('section');
      target.id='synthetic-pet-trade';document.body.append(target);
      const model={
        family:[{id:'friend',name:'Ana'}],
        family_pets:[{member_id:'friend',cosmetic_id:'lantern-raccoon',name:'Glow',bond:3}],
        offers:[]
      };
      const calls=[];let updates=0;
      const rpc=async(fn,args)=>{
        calls.push({fn,args});
        if(fn==='community_avatar_pet_trade_state')return JSON.parse(JSON.stringify(model));
        if(fn==='community_avatar_pet_trade_offer'){
          model.offers=[{id:'offer-1',direction:'outgoing',sender:'Cowboy',recipient:'Ana',
            offered_pet:args.p_pet,requested_pet:args.p_request,status:'pending'}];
          return {id:'offer-1',status:'pending'};
        }
        if(fn==='community_avatar_pet_trade_action'){
          const found=model.offers.find(o=>o.id===args.p_trade);
          if(!found)throw Error('Unknown synthetic offer');
          found.status=args.p_action==='accept'?'accepted':'declined';
          return {status:found.status};
        }
        throw Error('Unexpected synthetic RPC '+fn);
      };
      const studio=createPetTradeUI({
        rpc,
        catalog:()=>[{id:'trail-husky',name:'Trail Husky',slot:'companion'},
          {id:'lantern-raccoon',name:'Lantern Raccoon',slot:'companion'}],
        onChanged:()=>{updates++;},
        isOpen:()=>true
      });
      studio.mount(target,new Map([['trail-husky',
        {cosmetic_id:'trail-husky',name:'Scout',revision:8,bond:7}]]),'trail-husky');
      window.__familyTradeFixture={model,calls,studio,get updates(){return updates;}};
    }""")
    root=page.locator('#synthetic-pet-trade')
    await expect(root.get_by_text('Family Pet Trading')).to_be_visible()
    await root.locator('.avatar-pet-trade-field').last.locator('select').select_option('lantern-raccoon')
    await root.get_by_role('button',name='Review offer').click()
    await expect(root.get_by_text('Review your offer')).to_be_visible()
    await expect(root.get_by_text('In return, you are requesting Lantern Raccoon.')).to_be_visible()
    await root.get_by_role('button',name='Send this offer').click()
    await expect(root.get_by_text('Awaiting family decision',exact=False)).to_be_visible()
    offer=await page.evaluate("""()=>window.__familyTradeFixture.calls.find(c=>
       c.fn==='community_avatar_pet_trade_offer')""")
    assert offer['args']=={'p_to':'friend','p_pet':'trail-husky',
       'p_request':'lantern-raccoon','p_revision':8},offer
    await page.evaluate("""async()=>{
       const f=window.__familyTradeFixture;
       f.model.offers=[{id:'offer-2',direction:'incoming',sender:'Ana',recipient:'Cowboy',
         offered_pet:'lantern-raccoon',requested_pet:'trail-husky',status:'pending'}];
       await f.studio.refresh();
    }""")
    await root.get_by_role('button',name='Review trade').click()
    await expect(root.get_by_text('Confirm pet transfer')).to_be_visible()
    await root.get_by_role('button',name='Not now').click()
    await expect(root.get_by_text('Confirm pet transfer')).to_have_count(0)
    await root.get_by_role('button',name='Review trade').click()
    await root.get_by_role('button',name='Accept and transfer').click()
    await expect(root.get_by_text('Trade accepted.',exact=False)).to_be_visible()
    accepted=await page.evaluate("""()=>({
      call:window.__familyTradeFixture.calls.find(c=>c.fn==='community_avatar_pet_trade_action'
        &&c.args.p_action==='accept'),
      updates:window.__familyTradeFixture.updates
    })""")
    assert accepted['call']['args']=={'p_trade':'offer-2','p_action':'accept'},accepted
    assert accepted['updates']==1,accepted
    assert await page.evaluate('document.documentElement.scrollWidth-innerWidth')<=2
    (ROOT/'reports').mkdir(exist_ok=True)
    await page.screenshot(path=str(ROOT/'reports'/f'family-pet-trade-{width}.png'),
       animations='disabled')
    await page.close()
    print(f'Private pet offer, review, accept and accessible controls PASS at {width}px')
  finally:
   await browser.close()

if __name__=='__main__':
 asyncio.run(main())
