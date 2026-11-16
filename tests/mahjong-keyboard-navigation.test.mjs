import assert from 'node:assert/strict';
import test from 'node:test';
import {adjacentMahjongTile,isTileFree,countLegalPairs} from '../docs/mahjong-moves.mjs';

const puzzle=()=>[
  {id:1,x:0,y:0,z:0,s:1,gone:false},
  {id:2,x:1,y:0,z:0,s:1,gone:false},
  {id:3,x:2,y:0,z:0,s:2,gone:false},
  {id:4,x:0,y:2,z:0,s:3,gone:false},
  {id:5,x:2,y:2,z:0,s:3,gone:false},
  {id:6,x:1,y:2,z:1,s:4,gone:false}
];

test('Mahjong arrow keys land on nearest free tile and skip blocked ones',()=>{
  const tiles=puzzle(),original=structuredClone(tiles);
  assert.equal(isTileFree(tiles,tiles[1]),false,'center tile should be blocked');
  assert.equal(adjacentMahjongTile(tiles,1,'ArrowRight')?.id,3);
  assert.equal(adjacentMahjongTile(tiles,1,'ArrowDown')?.id,4);
  assert.equal(adjacentMahjongTile(tiles,3,'ArrowLeft')?.id,1);
  assert.equal(adjacentMahjongTile(tiles,1,'ArrowLeft'),null);
  assert.equal(adjacentMahjongTile(tiles,1,'ArrowUp'),null);
  assert.equal(adjacentMahjongTile(tiles,1,'Enter'),null);
  assert.deepEqual(tiles,original,'navigation must not change stored tile state');
});

test('finished or layered-over tiles are excluded without changing match rules',()=>{
  const tiles=puzzle();
  tiles[2].gone=true;
  // A removed neighbor can free a tile, so navigate to that tile first.
  assert.equal(isTileFree(tiles,tiles[1]),true);
  assert.equal(adjacentMahjongTile(tiles,1,'ArrowRight')?.id,2);
  tiles[1].gone=true;
  assert.equal(adjacentMahjongTile(tiles,1,'ArrowRight')?.id,6);
  const over={id:7,x:0,y:0,z:1,s:4,gone:false};
  tiles.push(over);
  assert.equal(isTileFree(tiles,tiles[0]),false);
  assert.equal(adjacentMahjongTile(tiles,7,'ArrowDown')?.id,4);
  assert.equal(adjacentMahjongTile(tiles,99,'ArrowRight'),null);
  assert.ok(Number.isInteger(countLegalPairs(tiles)));
});
