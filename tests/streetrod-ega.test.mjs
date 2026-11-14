import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {runInNewContext} from 'node:vm';

const pathFor=path=>new URL('../'+path,import.meta.url);
const [ega,css,html]=await Promise.all([
 readFile(pathFor('docs/commons-streetrod-ega.mjs'),'utf8'),
 readFile(pathFor('docs/commons-streetrod-ega.css'),'utf8'),
 readFile(pathFor('docs/community.html'),'utf8')
]);

test('DOS EGA source parses and stays within its 320 by 200 16-colour contract',()=>{
 assert.doesNotThrow(()=>execFileSync(process.execPath,['--check',fileURLToPath(pathFor('docs/commons-streetrod-ega.mjs'))]));
 assert.match(ega,/const W=320,H=200/);
 const palette=ega.match(/const EGA=\[([^\]]+)\]/)?.[1]?.match(/#[0-9a-fA-F]{6}/g)||[];
 assert.equal(palette.length,16,'an authentic EGA colour palette has exactly 16 entries');
 assert.equal((css.match(/aspect-ratio:8\/5/g)||[]).length,2,'DOS scenes and tracks must have native 320:200 proportions');
 assert.doesNotMatch(css,/aspect-ratio:4\/3/,'4:3 stretches the original 320x200 raster');
});

test('Pixel-car art varies by six original body families and by model key',()=>{
 // The renderer is pure canvas code before the DOM boot/installation layer.
 const segment=ega.slice(0,ega.indexOf('function border('));
 assert.ok(segment.includes('function bodyFor(name)')&&segment.includes('function car(c,key='));
 const {bodyFor,car}=runInNewContext(segment+'\n({bodyFor,car})');
 const families=[
  ['Vintage Comet Hardtop','hardtop'],
  ['Nomad Wagon','wagon'],
  ['Cipher Van X','van'],
  ['Mammoth Pickup Truck','truck'],
  ['Meteor Muscle Fastback','muscle'],
  ['Rattler Coupe','coupe']
 ];
 for(const [name,expected] of families)assert.equal(bodyFor(name),expected);
 const fingerprint=(name,body)=>{
  const points=[];
  const c={
   save(){},restore(){},translate(){},scale(){},
   fillRect(...args){points.push('R'+args.join(','))},
   beginPath(){},moveTo(...args){points.push('M'+args.join(','))},
   lineTo(...args){points.push('L'+args.join(','))},
   closePath(){},fill(){},stroke(){},arc(...args){points.push('A'+args.join(','))}
  };
  car(c,name,body,0,0,240);
  return points.join('|');
 };
 const silhouettes=families.map(([name,body])=>fingerprint(name,body));
 assert.equal(new Set(silhouettes).size,families.length,'body families should not all be painted copies of one car');
 assert.notEqual(fingerprint('Rattler', 'coupe'),fingerprint('Phoenix','coupe'),
  'independent car models should differ in more than a solid body colour');
});

test('Commons links the fresh EGA assets without removing the saved seasonal garage',()=>{
 for(const asset of ['commons-streetrod-ega.css?v=dos5','commons-streetrod-ega.mjs?v=dos7',
  'commons-streetrod-season-bay.mjs','commons-streetrod-summer.mjs',
  'commons-streetrod-multiplayer.mjs','commons-family-calendar.mjs']){
  assert.ok(html.includes(asset),'missing release asset: '+asset);
 }
 assert.match(ega,/function bodyFor\(name\)/);
 assert.match(ega,/\.ss-garage-stage/);
 assert.match(ega,/\.src-garage-stage/);
 assert.match(ega,/bodyFor\(label\)/);
 assert.match(ega,/function bootAndOpen\(target\)/);
 assert.match(ega,/function monitorMode\(enabled\)/);
});
