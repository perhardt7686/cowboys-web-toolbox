import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {CAR_LIST,CARS} from '../docs/hot-rod-catalog.mjs';
import {paintVehicle} from '../docs/hot-rod-vehicle-art.mjs';

// Synthetic 240x76 EGA display used by the game's native 320x200 scene.
// Test real rendering, not a mock profile name or drawing count.
const WIDTH=240, HEIGHT=76;
function raster(id, appearance={}) {
  const model=CARS[id];assert.ok(model,'Unknown car '+id);
  const pixels=new Uint8Array(WIDTH*HEIGHT).fill(255);
  const screen={box(left,top,width,height,color) {
    assert.ok(Number.isInteger(color)&&color>=0&&color<=15,'EGA palette only');
    for(let y=Math.max(0,Math.round(top));y<Math.min(HEIGHT,Math.round(top+height));y++){
      for(let x=Math.max(0,Math.round(left));x<Math.min(WIDTH,Math.round(left+width));x++){
        pixels[y*WIDTH+x]=color;
      }
    }
  }};
  paintVehicle(screen,model,{color:model.color,...appearance},0,0,1);
  return pixels;
}
const hash=pixels=>createHash('sha256').update(pixels).digest('hex');

test('all 25 preserved Street Rod-era cars render complete, distinct 16-color pixel elevations',()=>{
  assert.equal(CAR_LIST.length,25,'Keep original compatible roster, do not disrupt saved car IDs');
  assert.equal(new Set(CAR_LIST.map(m=>m.id)).size,25);
  const outputs=CAR_LIST.map(model=>({model,bitmap:raster(model.id)}));
  assert.equal(new Set(outputs.map(x=>hash(x.bitmap))).size,25,'Each car needs its own recognisable art');
  for(const {model,bitmap} of outputs){
    const active=bitmap.filter(ink=>ink!==255);
    assert.ok(active.length>1200,model.name+' silhouette appears incomplete');
    assert.ok(new Set(active).size>=5,model.name+' must retain 16-color EGA surface detail');
    assert.ok(!active.some(ink=>ink<0||ink>15),model.name+' is not EGA palette safe');
  }
});

test('critical period classes cannot silently collapse to one generic sedan sprite',()=>{
  for(const [oldCar,newCar] of [
    ['ford32','sedan32'],['master38','chevy40'],
    ['olds49','olds52'],['silver50','olds52'],
    ['belair55','fairlane55'],['lancer55','mercury56'],
    ['fairlane57','impala58'],['vette56','vette61'],
    ['valiant61','valiant63'],['polara62','savoy64'],
    ['tbird57','vette63']
  ]) {
    assert.notEqual(hash(raster(oldCar)),hash(raster(newCar)),oldCar+' and '+newCar+' must look different');
  }
  // A four-window sedan must have a longer upright turret than the five-window coupe.
  assert.notEqual(raster('sedan32')[11*WIDTH+90],raster('ford32')[11*WIDTH+90]);
});

test('restyling leaves all player cosmetic and workshop states visible, including finale van',()=>{
  const base=raster('fairlane57');
  assert.notEqual(hash(base),hash(raster('fairlane57',{color:12})), 'user paint should show');
  assert.notEqual(hash(base),hash(raster('fairlane57',{roof:true})), 'roof chop should show');
  assert.notEqual(hash(base),hash(raster('fairlane57',{decal:1})), 'flames should show');
  assert.notEqual(hash(base),hash(raster('fairlane57',{front:false})), 'removed front bumper should show');
  assert.notEqual(hash(base),hash(raster('fairlane57',{jack:'rear-left'})), 'jack should lift car');
  assert.notEqual(hash(base),hash(raster('fairlane57',{installed:{
    'front-left':{id:'tire-slick'},'rear-left':{id:'tire-road'}
  }})), 'performance tire appearances should show');
  assert.ok(raster('mystery66').filter(ink=>ink!==255).length>1000,'family finale remains visible');
});
