import assert from 'node:assert/strict';
import test from 'node:test';
import {PET_ART} from '../docs/avatar-pet-art.mjs';

function recordedCel(draw,time){
  const commands=[];
  let stack=0;
  const ctx={};
  for(const name of ['beginPath','closePath','moveTo','lineTo','quadraticCurveTo',
    'bezierCurveTo','ellipse','fill','stroke','translate','rotate']){
    ctx[name]=(...args)=>commands.push([name,...args]);
  }
  ctx.save=()=>{++stack;commands.push(['save']);};
  ctx.restore=()=>{--stack;assert.ok(stack>=0);commands.push(['restore']);};
  draw(ctx,time);
  assert.equal(stack,0,'canvas state must be balanced');
  return commands;
}

test('original Trail Husky and Lantern Raccoon keep stable reward identities',()=>{
  assert.deepEqual(PET_ART.map(([id,name,,animated])=>[id,name,animated]),[
    ['trail-husky','Trail Husky',true],
    ['lantern-raccoon','Lantern Raccoon',true]
  ]);
  assert.ok(PET_ART.every(row=>typeof row[2]==='function'));
});

test('each pet has its own small original cel motion without modifying game state',()=>{
  for(const [id,,draw] of PET_ART){
    const resting=recordedCel(draw,0);
    const active=recordedCel(draw,1.12);
    assert.notDeepEqual(resting,active,id+' must change visibly between animation frames');
    assert.ok(resting.some(op=>op[0]==='rotate'),id+' uses anchored acting');
    assert.ok(resting.filter(op=>op[0]==='fill').length>=15,
      id+' must retain painted body, eyes and original details');
  }
});
