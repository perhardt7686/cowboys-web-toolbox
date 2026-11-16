import assert from 'node:assert/strict';
import test from 'node:test';
import {EXPRESSION_KEYS,expressionActing} from '../docs/avatar-expression-acting.mjs';
import {AVATAR_OPTIONS,normalizeAvatarRecipe} from '../docs/family-avatar-builder.mjs';
import {cartoonFaceExpression} from '../docs/avatar-studio-faces.mjs';

test('shared acting poses include every saved expression without changing recipe IDs',()=>{
  const options=AVATAR_OPTIONS.expression.map(([id])=>id);
  assert.deepEqual(EXPRESSION_KEYS,options);
  const visualSignatures=new Set();
  for(const expression of options){
    const acting=expressionActing(expression);
    assert.equal(acting.eyes.length,2);
    assert.equal(acting.brows.length,2);
    assert.equal(acting.gaze.length,2);
    assert.equal(acting.browEnd.length,2);
    assert.ok(acting.eyes.every(x=>x>=0&&x<=1.3));
    assert.ok(acting.brows.every(Number.isFinite));
    visualSignatures.add(JSON.stringify(acting));
    const oldRecipe=normalizeAvatarRecipe({expression});
    assert.equal(oldRecipe.expression,expression,'previously saved expressions remain valid');
    assert.equal(cartoonFaceExpression(oldRecipe).mouth==='smile',expression==='wink'||expression==='smile');
  }
  assert.equal(visualSignatures.size,options.length,'every existing expression needs distinct eye and brow acting');
});

test('laugh eyes read as expressive crescents; calm is relaxed; curious and smirk are genuinely asymmetric',()=>{
  assert.ok(expressionActing('laugh').eyes.every(x=>x<=.55));
  assert.ok(expressionActing('calm').eyes.every(x=>x<.80));
  assert.ok(expressionActing('curious').brows[0]<expressionActing('curious').brows[1]-3);
  assert.notEqual(expressionActing('smirk').eyes[0],expressionActing('smirk').eyes[1]);
  assert.equal(expressionActing('wink').eyes[1],0);
  assert.ok(expressionActing('determined').browEnd[0]>0);
  assert.ok(expressionActing('determined').browEnd[1]<0);
});

test('art references are pure and cannot mutate saved poses',()=>{
  const a=expressionActing('smile');a.eyes[0]=42;a.brows[1]=900;
  const b=expressionActing('smile');
  assert.equal(b.eyes[0],1);
  assert.equal(b.brows[1],0);
  assert.deepEqual(expressionActing('not-an-expression'),b);
});
