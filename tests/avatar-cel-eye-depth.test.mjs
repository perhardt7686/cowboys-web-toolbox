import assert from 'node:assert/strict';
import test from 'node:test';
import {THREE,disposeFigure} from '../docs/avatar-studio-geometry.mjs';
import {buildAvatar} from '../docs/avatar-studio-character.mjs';
import {addGlasses} from '../docs/avatar-studio-faces.mjs';
import {normalizeLoadout} from '../docs/avatar-reward-render.mjs';
import {SHOWROOM_LOOKS} from '../docs/avatar-showroom-presets.mjs';

// Geometry guard complements the browser screenshots: eyes must read as painted
// cartoon features from profile, not as detached stacks of spherical marbles.
test('human studio eyes follow the head with thin cel layers across body shapes and expressions',()=>{
  for(const look of ['detective','mechanic','sleuth','specter','marsh']){
    for(const expression of ['smile','laugh','wink','curious']){
      const actor=buildAvatar(normalizeLoadout({...SHOWROOM_LOOKS[look],expression}));
      const eyes=[];
      actor.figure.traverse(node=>{if(node.userData.studioEye)eyes.push(node);});
      assert.equal(eyes.length,2,`${look} / ${expression} should have two fitted eye groups`);
      for(const eye of eyes){
        assert.ok(eye.position.z<=.174,`${look} / ${expression}: eye root must lie near face`);
        const layerBounds=new THREE.Box3();
        let visibleLayers=0;
        for(const child of eye.children){
          if(!child.isMesh)continue;
          child.geometry.computeBoundingBox();
          child.updateMatrix();
          layerBounds.union(child.geometry.boundingBox.clone().applyMatrix4(child.matrix));
          if(child.geometry.type==='SphereGeometry'){
            visibleLayers++;
            assert.ok(child.scale.z<=.0081,
              `${look} / ${expression}: spherical eye layer must be flattened`);
          }
        }
        assert.ok(!layerBounds.isEmpty(),`${look} / ${expression}: eye has ink geometry`);
        assert.ok(layerBounds.max.z<=.037,
          `${look} / ${expression}: eye ink projects ${layerBounds.max.z} from its socket`);
        if(expression!=='wink')assert.ok(visibleLayers>=5);
      }
      disposeFigure(actor.root);
    }
  }
});

test('glasses and monocles mount close to the new fitted eye plane',()=>{
  for(const kind of ['round','square','retro-square','cat-eye','aviator','oval']){
    for(const single of [false,true]){
      const head=new THREE.Group();
      addGlasses(head,kind,'#574e54',single,1);
      const frame=head.children.find(node=>node.userData.studioPart==='gear');
      assert.ok(frame,`${kind}: expected a wearable glasses root`);
      const lenses=frame.children.filter(node=>node.isGroup&&Math.abs(node.position.x)>.05);
      assert.equal(lenses.length,single?1:2);
      for(const lens of lenses){
        assert.ok(lens.position.z>=.205&&lens.position.z<=.212,
          `${kind}: lens needs to sit just ahead of its iris, not float in front of the face`);
      }
      disposeFigure(head);
    }
  }
});
