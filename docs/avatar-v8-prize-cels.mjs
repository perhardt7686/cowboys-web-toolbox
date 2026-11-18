/* First original V8 unlockable asset pack. Each ID is an individually drawn cel,
   not a generic rotated primitive with a palette swap. Unhandled items continue
   through the established item-accurate renderer until their art is complete. */
export const V8_ART_IDS=Object.freeze([
 'viking-battle-helmet','studio-observatory-coat','studio-observatory-telescope',
 'studio-rain-cape','studio-rain-boots','studio-workshop-visor',
 'studio-workshop-gloves','studio-tower-cape','studio-backlot-glasses',
 'studio-backlot-flashlight','studio-rain-hound','studio-tower-gargoyle'
]);
const IDS=new Set(V8_ART_IDS),INK='#302b3b';
function p(c,path,fill,stroke=INK,w=4){
  const q=new Path2D(path);
  if(fill){c.fillStyle=fill;c.fill(q);}
  if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.lineJoin='round';c.lineCap='round';c.stroke(q);}
}
function ellipse(c,x,y,rx,ry,fill,stroke=INK,w=4){
  c.beginPath();c.ellipse(x,y,rx,ry,0,0,2*Math.PI);
  if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}
}
export function paintV8RewardIcon(canvas,item){
  if(!canvas?.getContext||!IDS.has(item?.id))return false;
  const c=canvas.getContext('2d');if(!c)return false;
  const w=canvas.width,h=canvas.height;
  c.save();c.setTransform(w/200,0,0,h/160,0,0);
  const wash=c.createRadialGradient(101,64,7,100,81,160);
  wash.addColorStop(0,'#f3e2c4');wash.addColorStop(1,'#b4c7c1');
  c.fillStyle=wash;c.fillRect(0,0,200,160);
  ellipse(c,101,83,68,61,'#eadac2',null);
  p(c,'M15 132 Q101 120 185 132',null,'#9c917f',3);
  switch(item.id){
    case 'viking-battle-helmet':
      p(c,'M51 102 L55 57 Q97 32 146 57 L151 100 Q96 127 51 102 Z','#687d8b');
      p(c,'M59 74 Q35 47 47 21 Q54 51 73 63 Z','#f0c68c');
      p(c,'M128 64 Q149 43 154 17 Q165 45 142 80 Z','#f0c68c');
      p(c,'M55 94 Q101 110 150 94 L148 108 Q95 127 52 107 Z','#a5adb4');
      ellipse(c,100,85,12,13,'#cda76c');p(c,'M89 86 L111 86',null,'#675e6a',2.5);break;
    case 'studio-observatory-coat':
      p(c,'M65 38 L86 28 108 36 129 29 149 60 167 122 130 129 115 91 121 137 78 137 85 92 69 125 34 121 52 58 Z','#435d78');
      p(c,'M87 40 L102 63 115 39 L110 123 90 123 Z','#f0d9ad');
      p(c,'M78 70 L93 73 87 88 70 84 Z','#324d6a');
      p(c,'M111 79 L128 73 134 85 113 90 Z','#324d6a');
      ellipse(c,107,84,4,4,'#d7bc86');ellipse(c,107,102,4,4,'#d7bc86');break;
    case 'studio-observatory-telescope':
      p(c,'M43 109 L131 39 146 61 58 129 Z','#a17c59');
      p(c,'M56 111 L134 51',null,'#f2d6ac',5);
      p(c,'M128 37 L152 22 174 50 149 70 Z','#c9a875');
      p(c,'M43 103 L31 114 45 132 59 121 Z','#5d6470');
      p(c,'M84 99 L83 133 105 133 99 87 Z','#625d68');break;
    case 'studio-rain-cape':
      p(c,'M83 28 Q102 37 122 28 Q138 47 151 66 L180 134 Q95 158 22 134 L51 66 Z','#587f83');
      p(c,'M86 32 Q104 56 118 34 L101 57 Z','#e9c599');
      p(c,'M57 69 Q72 87 65 125',null,'#a7c5bb',4);
      p(c,'M143 71 Q130 100 143 125',null,'#b9d4ca',4);break;
    case 'studio-rain-boots':
      p(c,'M50 28 L88 28 84 107 105 121 98 137 32 137 37 109 46 91 Z','#846649');
      p(c,'M110 27 L147 29 149 102 170 122 162 137 101 138 101 117 112 102 Z','#97724e');
      p(c,'M49 61 L87 61',null,'#d4a575',4);p(c,'M109 61 L149 61',null,'#d4a575',4);
      p(c,'M34 126 L97 125 M104 125 L163 125',null,'#4e4c50',5);break;
    case 'studio-workshop-visor':
      p(c,'M28 64 Q100 31 176 63 L168 110 Q91 139 34 106 Z','#bd986f');
      p(c,'M38 71 Q103 52 164 74 L157 99 Q100 119 45 97 Z','#92cbc4');
      p(c,'M51 78 L85 74',null,'#f9e6bd',4);
      p(c,'M34 109 Q100 139 166 111',null,'#5b6d72',4);break;
    case 'studio-workshop-gloves':
      p(c,'M26 95 L33 39 Q42 23 50 44 L57 63 66 19 Q78 12 82 38 L84 68 101 33 Q118 27 115 54 L102 108 84 140 48 135 Z','#b99162');
      p(c,'M111 95 L119 32 Q129 22 137 43 L146 66 156 40 Q169 38 167 61 L176 114 159 138 128 135 Z','#c7a074');
      p(c,'M58 104 L96 108 M131 110 L167 112',null,'#76596a',5);break;
    case 'studio-tower-cape':
      p(c,'M75 32 L124 31 158 86 183 131 Q107 160 20 133 L42 86 Z','#7e709c');
      p(c,'M78 34 L101 65 123 34 L103 78 Z','#d7be93');
      p(c,'M42 121 Q104 143 157 122',null,'#c0b0d1',3);break;
    case 'studio-backlot-glasses':
      p(c,'M24 69 Q58 46 89 65 L86 98 Q58 120 32 95 Z','#dcbfaf');
      p(c,'M111 67 Q146 48 177 68 L169 99 Q138 115 112 96 Z','#dcbfaf');
      p(c,'M87 74 Q102 66 112 74 M24 76 L10 73 M175 75 L190 71',null,'#464552',5);
      ellipse(c,61,84,9,9,'#9d837a22',null);ellipse(c,143,85,9,9,'#9d837a22',null);break;
    case 'studio-backlot-flashlight':
      p(c,'M53 111 L119 46 139 67 74 131 Z','#b6925c');
      p(c,'M119 44 L151 27 173 53 140 72 Z','#e4c587');
      p(c,'M148 28 L171 10 189 35 172 53 Z','#f7df9e');
      p(c,'M65 116 L77 126',null,'#756372',4);break;
    case 'studio-rain-hound':
      p(c,'M49 99 Q54 50 94 57 Q124 49 150 82 L149 128 58 131 Z','#788e89');
      p(c,'M77 61 L73 26 Q95 28 109 55 L130 28 Q150 24 147 68 Z','#576b76');
      p(c,'M83 82 Q112 70 144 82 L138 116 Q112 131 87 111 Z','#ece0c8');
      ellipse(c,103,94,5,7,'#262c36');ellipse(c,133,94,5,7,'#262c36');
      ellipse(c,119,110,10,7,'#393640');p(c,'M107 122 Q118 135 135 119',null,'#392f3b',3);
      p(c,'M59 132 Q45 149 30 120',null,'#597e74',5);break;
    case 'studio-tower-gargoyle':
      p(c,'M73 87 Q39 61 28 22 Q63 31 90 62 L122 62 Q159 31 175 23 Q172 74 137 91 Z','#6b7f91');
      p(c,'M62 77 L67 37 86 55 121 55 141 37 146 77 141 121 69 121 Z','#99a7ac');
      p(c,'M84 89 L98 92 94 102 Z','#e5c486');
      p(c,'M115 90 L130 88 123 102 Z','#e5c486');
      p(c,'M92 113 Q106 124 120 112',null,'#37475a',3);
      p(c,'M71 117 L55 140 78 138 M133 117 L152 140 129 139',null,'#4d6578',5);break;
  }
  c.restore();
  canvas.dataset.artPack='v8-ink';
  return true;
}
