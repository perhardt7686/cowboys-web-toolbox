import {THREE} from './avatar-studio-geometry.mjs?v=workshop1';

export const inkColor='#17141d';

export function inkWidth(width,height){
  return Math.max(1,Math.min(4.2,Math.min(width,height)*.0074));
}

export function createInkLayer(){
  const target=new THREE.WebGLRenderTarget(1,1,{depthBuffer:true,stencilBuffer:false,samples:2});
  const scene=new THREE.Scene();
  const camera=new THREE.Camera();
  const material=new THREE.ShaderMaterial({
    uniforms:{
      image:{value:target.texture},
      offset:{value:new THREE.Vector2()},
      ink:{value:new THREE.Color(inkColor)}
    },
    depthTest:false,depthWrite:false,transparent:true,
    vertexShader:`
      varying vec2 pixel;
      void main(){
        pixel=uv;
        gl_Position=vec4(position.xy,0.0,1.0);
      }
    `,
    fragmentShader:`
      uniform sampler2D image;
      uniform vec2 offset;
      uniform vec3 ink;
      varying vec2 pixel;
      void main(){
        vec4 fill=texture2D(image,pixel);
        float edge=0.0;
        for(int i=0;i<8;i++){
          float turn=float(i)*.785398;
          edge=max(edge,texture2D(image,pixel+vec2(cos(turn),sin(turn))*offset).a);
        }
        float line=smoothstep(.55,.96,edge)*(1.0-fill.a);
        float alpha=fill.a+line;
        // The transparent render target contains premultiplied coverage.
        gl_FragColor=vec4((fill.rgb+ink*line)/max(.0001,alpha),alpha);
        #include <colorspace_fragment>
      }
    `
  });
  const screen=new THREE.Mesh(new THREE.PlaneGeometry(2,2),material);
  screen.frustumCulled=false;
  scene.add(screen);
  return {target,scene,camera,material};
}

// Draw the figure once to transparent coverage, so thin details and the edges
// of separate pieces join into a single silhouette during the turntable.
export function drawInkedRoom(renderer,ink,scene,camera,root,base,width,height){
  const background=scene.background;
  const platform=base.visible;
  const radius=inkWidth(width,height);
  ink.target.setSize(width,height);
  ink.material.uniforms.offset.value.set(radius/width,radius/height);
  try{
    scene.background=null;
    base.visible=false;
    renderer.setClearAlpha(0);
    renderer.setRenderTarget(ink.target);
    renderer.render(scene,camera);
    renderer.setRenderTarget(null);
    renderer.setClearAlpha(1);
    scene.background=background;
    base.visible=platform;
    root.visible=false;
    renderer.render(scene,camera);
    renderer.autoClear=false;
    renderer.render(ink.scene,ink.camera);
  }finally{
    renderer.setRenderTarget(null);
    renderer.setClearAlpha(1);
    renderer.autoClear=true;
    root.visible=true;
    scene.background=background;
    base.visible=platform;
  }
}
