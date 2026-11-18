/* V8 Arcade Treasury: 21 original hand-inked prize illustrations for existing
   Star Squadron, Mystery Maze and Dash Forge achievement IDs. Rendering only:
   never grants, changes or invents any family reward ownership. */
export const V8_ARCADE_ART_IDS=Object.freeze([
  'starling-owl','nebula-visor','meteor-jetpack','comet-signal',
  'squadron-meteor-rain','starfield-cockpit','queen-drone',
  'clue-mouse','wall-vision-glasses','spectral-keyring','spectral-lantern',
  'ghost-echo','ancient-keyway','wisp-pup',
  'pixel-hamster','neon-runner-shades','geometry-helmet','prism-trail',
  'boss-baton','crystal-portal','boss-dragonlet'
]);
const CATALOG=new Set(V8_ARCADE_ART_IDS),INK='#2f2a43';
function shape(ctx,d,color,stroke=INK,w=4){
  const path=new Path2D(d);
  if(color){ctx.fillStyle=color;ctx.fill(path);}
  if(stroke){ctx.lineWidth=w;ctx.strokeStyle=stroke;ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke(path);}
}
function oval(c,x,y,rx,ry,color,outline=INK,w=3){
  c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);
  if(color){c.fillStyle=color;c.fill();}
  if(outline){c.strokeStyle=outline;c.lineWidth=w;c.stroke();}
}
function beam(c,x,y,color){
  shape(c,'M'+(x-9)+' '+(y+18)+' L'+x+' '+(y-17)+' L'+(x+9)+' '+(y+18)+' L'+x+' '+(y+10)+' Z',color,null);
}
export function paintV8ArcadePrizeIcon(canvas,item){
  if(!canvas?.getContext||!CATALOG.has(item?.id))return false;
  const c=canvas.getContext('2d');if(!c)return false;
  const id=item.id,index=V8_ARCADE_ART_IDS.indexOf(id),family=index<7?'squadron':index<14?'maze':'dash';
  c.save();c.setTransform(canvas.width/200,0,0,canvas.height/160,0,0);
  const bg=c.createLinearGradient(0,0,0,160);
  bg.addColorStop(0,family==='squadron'?'#6b7e9e':family==='maze'?'#789c8e':'#ae93a6');
  bg.addColorStop(1,family==='squadron'?'#2d4269':family==='maze'?'#365b5c':'#5d5687');
  c.fillStyle=bg;c.fillRect(0,0,200,160);
  oval(c,100,80,75,63,family==='squadron'?'#e7d8b799':family==='maze'?'#d8e8c499':'#f4d6e099',null);
  shape(c,'M12 138 Q98 130 190 138',null,'#e6d1ad',3);
  switch(id){
    case 'starling-owl':
      shape(c,'M51 110 Q34 57 75 43 L101 56 127 39 Q167 57 150 107 L132 132 68 132 Z','#8a837d');
      shape(c,'M67 59 L63 27 90 48 M116 49 L144 26 137 60',null,'#d3b99a',7);
      oval(c,78,84,17,19,'#e6d5b6');oval(c,121,84,17,19,'#e6d5b6');
      oval(c,78,87,7,10,'#354960');oval(c,121,87,7,10,'#354960');
      shape(c,'M93 107 L105 107 99 118 Z','#dca465');break;
    case 'nebula-visor':
      shape(c,'M22 63 Q104 27 180 67 L169 113 Q93 139 30 110 Z','#b5a8c2');
      shape(c,'M38 71 Q107 53 164 74 L154 102 Q99 119 46 98 Z','#75c8d4');
      shape(c,'M48 82 L145 82',null,'#d8f1e1',4);
      shape(c,'M29 110 Q108 137 175 109',null,'#7b6d9b',5);break;
    case 'meteor-jetpack':
      shape(c,'M51 50 L77 38 89 113 58 129 Z','#789e9e');
      shape(c,'M111 113 L122 39 151 54 146 128 Z','#9aa6a7');
      shape(c,'M85 51 L114 51 114 106 87 106 Z','#efcb9d');
      shape(c,'M58 116 L72 150 83 114 M116 114 L131 151 146 116',null,'#f4b96f',7);
      oval(c,102,78,11,13,'#4d6e80');break;
    case 'comet-signal':
      shape(c,'M66 129 L88 54 112 49 133 130 Z','#9c7e73');
      oval(c,99,58,33,25,'#ecd9a8');
      shape(c,'M99 58 L136 29 M99 58 L164 56 M99 58 L154 91',null,'#e4ba75',7);
      oval(c,96,59,10,10,'#ee996f');break;
    case 'squadron-meteor-rain':
      for(const [x,y] of [[54,38],[125,50],[92,100],[159,97],[45,119]]){
        shape(c,'M'+(x-26)+' '+(y-21)+' L'+x+' '+y,null,'#eece96',6);
        oval(c,x,y,7,8,'#eca681',null);
      }
      oval(c,117,80,22,19,'#c5a2a3');
      shape(c,'M106 76 L121 67 132 85 115 96 Z','#edcd91');break;
    case 'starfield-cockpit':
      shape(c,'M24 36 L176 36 185 125 16 125 Z','#344e68');
      oval(c,103,70,20,19,'#edcb9a',null);
      shape(c,'M23 118 L181 118 185 149 16 149 Z','#6e5e78');
      for(const x of [43,72,103,137,165])oval(c,x,132,7,5,'#78bfc0',null);
      shape(c,'M100 36 L100 120',null,'#a2bcc5',4);break;
    case 'queen-drone':
      shape(c,'M61 58 L87 40 115 41 145 58 150 110 113 135 82 131 49 106 Z','#849e9a');
      shape(c,'M76 45 L67 24 94 39 M121 41 L139 21 132 52',null,'#e7c78d',8);
      oval(c,81,85,13,15,'#efddbb');oval(c,120,85,13,15,'#efddbb');
      oval(c,85,86,5,8,'#375a6a');oval(c,120,86,5,8,'#375a6a');
      oval(c,100,115,13,6,'#c7927d');break;
    case 'clue-mouse':
      oval(c,100,104,53,35,'#b8aa96');
      oval(c,67,55,23,24,'#b8aa96');oval(c,133,55,23,24,'#b8aa96');
      oval(c,67,55,12,13,'#d39d91',null);oval(c,133,55,12,13,'#d39d91',null);
      oval(c,84,98,7,10,'#3a424a');oval(c,117,98,7,10,'#3a424a');
      oval(c,100,116,9,7,'#d78d7f');
      shape(c,'M63 117 L31 108 M62 126 L29 130 M138 117 L169 108 M138 125 L167 130',null,'#544c4e',2);break;
    case 'wall-vision-glasses':
      shape(c,'M24 75 Q60 45 91 70 L87 105 Q56 122 30 102 Z','#a8c1a6');
      shape(c,'M111 71 Q144 45 175 75 L170 103 Q140 120 111 104 Z','#a8c1a6');
      shape(c,'M88 82 Q99 71 113 82 M24 83 L12 77 M174 83 L188 77',null,'#456065',6);
      shape(c,'M51 87 L68 76 M132 87 L147 76',null,'#eff4ca',4);break;
    case 'spectral-keyring':
      oval(c,88,66,33,31,'#d7c196',INK,6);oval(c,88,66,17,16,'#a2b7ae',null);
      shape(c,'M111 85 L159 128 144 143 134 133 122 143 107 124 119 110 107 99 Z','#dbbb8a');
      oval(c,145,127,5,5,'#a1c9b5',null);break;
    case 'spectral-lantern':
      shape(c,'M64 45 L136 45 143 124 57 124 Z','#98ac91');
      shape(c,'M78 55 L123 55 130 111 71 111 Z','#e9e4b5');
      shape(c,'M100 111 Q78 86 100 66 Q125 86 106 111 Z','#8fc8b9',null);
      shape(c,'M76 44 Q76 17 100 19 Q127 17 128 44',null,'#556b67',6);break;
    case 'ghost-echo':
      oval(c,101,81,32,33,'#e1e8d7',null);
      for(const size of [48,63,73])oval(c,101,81,size,size*.77,null,'#bad6d1',3);
      oval(c,89,82,7,10,'#4a6670');oval(c,112,82,7,10,'#4a6670');
      shape(c,'M89 104 Q102 116 116 103',null,'#506f68',4);break;
    case 'ancient-keyway':
      shape(c,'M40 144 L40 43 159 43 159 144 Z','#9db0a8');
      shape(c,'M69 146 L69 93 Q101 48 132 93 L132 146 Z','#596579');
      oval(c,100,99,19,20,'#d3b47f');
      oval(c,100,97,8,9,'#57617a');
      shape(c,'M95 112 L105 112 109 132 90 132 Z','#d3b47f');
      for(const x of [52,147])for(const y of [61,88,119])oval(c,x,y,3,4,'#e2d6b3',null);break;
    case 'wisp-pup':
      shape(c,'M49 108 Q50 54 94 61 Q131 47 151 82 L154 132 46 134 Z','#b1d1c8');
      shape(c,'M78 67 L60 24 39 57 55 88 M124 66 L147 24 159 57 145 91',null,'#84b1a7',9);
      oval(c,88,89,8,11,'#314e60');oval(c,123,88,8,11,'#314e60');
      oval(c,104,110,10,7,'#547a87');
      shape(c,'M91 124 Q103 134 118 122',null,'#5e8086',3);break;
    case 'pixel-hamster':
      shape(c,'M43 69 L58 45 81 51 112 49 146 66 158 119 140 136 62 135 43 119 Z','#e6c8a1');
      shape(c,'M52 62 L72 45 85 59 M123 56 L147 41 153 65',null,'#c28c82',8);
      oval(c,84,93,7,8,'#3b445e');oval(c,124,92,7,8,'#3b445e');
      oval(c,104,110,10,8,'#db9586');
      for(const x of [57,72,135,150])oval(c,x,118,3,3,'#ab8078',null);break;
    case 'neon-runner-shades':
      shape(c,'M21 70 L92 58 84 106 33 106 Z','#7a93b9');
      shape(c,'M108 59 L178 70 166 106 113 105 Z','#9b7fb4');
      shape(c,'M86 77 Q102 68 112 77 M20 72 L10 65 M180 73 L191 64',null,'#4d4978',7);
      shape(c,'M41 75 L70 70 M132 74 L161 80',null,'#e5c4e6',4);break;
    case 'geometry-helmet':
      shape(c,'M45 104 L58 50 94 25 137 44 160 101 145 122 55 121 Z','#6aa5bb');
      shape(c,'M66 80 L92 50 119 80 100 113 Z','#f5ce89');
      shape(c,'M54 105 L152 105',null,'#c0b7c7',7);
      shape(c,'M91 32 L100 15 111 34',null,'#e7bd85',7);break;
    case 'prism-trail':
      for(const [x,y] of [[35,113],[72,90],[106,105],[142,69],[168,37]]){
        shape(c,'M'+(x-12)+' '+(y+9)+' L'+x+' '+(y-18)+' L'+(x+14)+' '+(y+10)+' Z',x%2?'#8cc6c6':'#d8a4bc');
        shape(c,'M'+(x-8)+' '+(y+9)+' L'+x+' '+(y-10),null,'#f5e9ce',2);
      }break;
    case 'boss-baton':
      shape(c,'M54 118 L128 41 141 51 67 132 Z','#e5c092');
      shape(c,'M127 42 L154 22 178 47 144 72 Z','#7b7eae');
      shape(c,'M61 119 L74 127',null,'#6a4f80',6);
      for(const [x,y] of [[165,21],[174,78],[36,91]])oval(c,x,y,5,5,'#eac2a1',null);break;
    case 'crystal-portal':
      for(const [rx,ry,color] of [[69,57,'#ecb9ce'],[53,46,'#a9c5d7'],[38,32,'#e6dda5']])
        oval(c,102,81,rx,ry,null,color,7);
      shape(c,'M75 105 L101 28 127 105 103 127 Z','#a3abc9');
      shape(c,'M88 91 L102 50 116 92 Z','#f8d7a5');
      oval(c,102,78,8,11,'#fff8d5',null);break;
    case 'boss-dragonlet':
      shape(c,'M44 102 Q40 56 82 58 L96 40 116 58 Q146 61 153 101 L142 138 56 138 Z','#a6a2ba');
      shape(c,'M49 91 L30 39 79 66 M135 68 L172 40 156 102',null,'#e6bd94',10);
      shape(c,'M78 60 L69 30 99 54 112 29 129 64 Z','#b9ab85');
      oval(c,85,95,8,10,'#f2ddae');oval(c,121,95,8,10,'#f2ddae');
      oval(c,86,96,3,5,'#5c5369');oval(c,123,96,3,5,'#5c5369');
      shape(c,'M86 121 Q104 139 122 119',null,'#635367',4);break;
  }
  c.restore();
  canvas.dataset.artPack='v8-arcade';
  return true;
}
