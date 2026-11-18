/* First original V8 unlockable asset pack. Each ID is an individually drawn cel,
   not a generic rotated primitive with a palette swap. Unhandled items continue
   through the established item-accurate renderer until their art is complete. */
export const V8_ART_IDS=Object.freeze([
 'viking-battle-helmet','studio-observatory-coat','studio-observatory-telescope',
 'studio-rain-cape','studio-rain-boots','studio-workshop-visor',
 'studio-workshop-gloves','studio-tower-cape','studio-backlot-glasses',
 'studio-backlot-flashlight','studio-rain-hound','studio-tower-gargoyle',
 // Every remaining reward in the five established studio collections, plus the starter pet.
 'studio-observatory-pack','studio-observatory-moth','studio-observatory-scene',
 'studio-rain-lantern','studio-rain-scene',
 'studio-workshop-belt','studio-workshop-gremlin','studio-workshop-scene',
 'studio-tower-lantern','studio-tower-gloves','studio-tower-scene',
 'studio-backlot-compass','studio-backlot-jacket','studio-backlot-scene',
 'studio-attic-ghost'
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

    // Collection 2: custom inkwork for every previously uncovered prize.
    case 'studio-observatory-pack':
      p(c,'M55 63 Q67 40 88 42 L136 51 Q149 58 149 83 L146 123 Q98 140 53 121 Z','#956e58');
      p(c,'M67 69 Q109 80 140 69 L141 107 Q106 126 60 108 Z','#bc916d');
      p(c,'M59 68 Q63 34 100 25 Q127 27 143 55',null,'#634f50',9);
      p(c,'M71 88 L126 88 L114 101 81 100 Z','#ead2a5');
      ellipse(c,99,99,5,5,'#d4b47e');break;
    case 'studio-observatory-moth':
      p(c,'M97 71 Q49 24 31 71 Q35 97 89 99 Z','#e9ba7b');
      p(c,'M103 70 Q150 22 177 70 Q168 103 109 98 Z','#e8bc7c');
      p(c,'M92 99 Q45 100 55 132 Q76 145 95 115 Z','#bb927c');
      p(c,'M106 100 Q153 96 150 128 Q129 151 106 114 Z','#b89079');
      ellipse(c,100,93,12,33,'#7d686b');
      ellipse(c,64,77,14,12,'#7a8495');ellipse(c,140,76,14,12,'#798997');
      p(c,'M95 67 Q85 41 74 42 M105 66 Q115 40 127 43',null,'#66515b',3);break;
    case 'studio-observatory-scene':
      p(c,'M25 136 L25 96 46 96 46 132 M169 136 L169 96 183 96 183 133',null,'#536879',7);
      p(c,'M41 97 L160 97',null,'#c7af91',5);
      p(c,'M65 133 L87 81 120 81 142 133 Z','#475f80');
      p(c,'M83 81 L90 50 113 50 120 81 Z','#e0c5a3');
      ellipse(c,103,48,32,17,'#a1b6bd');
      ellipse(c,103,48,20,9,'#e6d2b5');
      for(const [x,y] of [[39,29],[162,31],[59,54],[137,45]])ellipse(c,x,y,2.5,2.5,'#fff0bd',null);
      p(c,'M20 140 L181 140',null,'#5b6882',8);break;
    case 'studio-rain-lantern':
      p(c,'M76 41 L126 41 138 111 63 111 Z','#b48b5a');
      p(c,'M83 49 L121 49 125 100 74 100 Z','#f3d39b');
      p(c,'M101 87 Q81 66 100 53 Q113 68 109 83 Z','#f4a154',null);
      p(c,'M90 40 L90 28 Q101 16 113 28 L113 40',null,'#61545b',6);
      p(c,'M56 112 L145 112 145 126 56 126 Z','#6f6470');
      p(c,'M74 60 L119 60 M73 84 L124 84',null,'#99744f',2);break;
    case 'studio-rain-scene':
      p(c,'M20 38 L181 38 181 129 20 129 Z','#577d87');
      p(c,'M18 73 L70 31 120 73 184 32',null,'#304e60',10);
      p(c,'M41 133 L42 73 72 71 72 133 M119 133 L119 64 164 65 163 133',null,'#d4b48d',8);
      p(c,'M25 146 Q106 125 183 146',null,'#88b6b1',9);
      for(const x of [52,79,103,131,156])p(c,'M'+x+' 20 L'+(x-13)+' 51',null,'#b9d7d5',3);
      ellipse(c,143,104,11,23,'#f0ca85',null);break;
    case 'studio-workshop-belt':
      p(c,'M20 77 Q98 50 181 81 L177 105 Q99 83 23 109 Z','#71525c');
      p(c,'M80 68 L122 68 125 112 77 110 Z','#b89064');
      p(c,'M90 77 L111 78 114 100 88 101 Z','#f2ddab');
      ellipse(c,100,89,5,5,'#99714c');
      for(const x of [38,55,148,167])ellipse(c,x,90,6,6,'#d2a86c');
      p(c,'M35 96 L53 94 M146 94 L166 97',null,'#efd2a2',3);break;
    case 'studio-workshop-gremlin':
      p(c,'M42 76 L64 44 85 61 115 61 140 43 158 74 147 118 53 120 Z','#8aad8c');
      p(c,'M64 47 L46 19 87 43 M136 43 L169 17 155 65 Z','#779c82');
      ellipse(c,81,85,14,16,'#e8dfbe');ellipse(c,121,85,14,16,'#e8dfbe');
      ellipse(c,83,87,5,8,'#314959',null);ellipse(c,120,87,5,8,'#314959',null);
      p(c,'M86 106 Q99 117 116 105',null,'#503d48',4);
      p(c,'M75 122 L58 141 83 135 M127 122 L143 141 118 135',null,'#60786d',5);
      ellipse(c,102,53,12,11,'#d3a96b');break;
    case 'studio-workshop-scene':
      p(c,'M22 43 L177 43 182 134 21 134 Z','#ab7468');
      p(c,'M36 61 L163 61',null,'#e2ba8c',7);
      p(c,'M34 67 L34 130 M165 67 L165 130',null,'#694c55',6);
      p(c,'M58 85 L92 85 92 120 58 120 Z','#dcc5a3');
      p(c,'M114 90 L144 90 141 119 116 121 Z','#d2b48b');
      ellipse(c,103,27,15,16,'#edd0a0');
      p(c,'M103 43 L103 66',null,'#58545e',3);
      for(const x of [65,88,124,151])ellipse(c,x,70,3,3,'#f1cf93',null);break;
    case 'studio-tower-lantern':
      p(c,'M65 48 L137 48 144 115 56 115 Z','#81728c');
      p(c,'M81 56 L119 56 126 106 75 105 Z','#f0cda4');
      p(c,'M90 105 Q80 74 101 60 Q120 76 110 104 Z','#e8a766',null);
      p(c,'M73 46 Q74 21 100 21 Q128 19 129 47',null,'#6b5a72',6);
      p(c,'M52 118 L147 118 142 128 58 128 Z','#665c78');
      ellipse(c,100,39,5,5,'#edd9ad');break;
    case 'studio-tower-gloves':
      p(c,'M41 118 L41 61 Q39 37 49 40 L58 68 62 28 Q75 18 77 41 L78 70 85 40 Q98 32 99 54 L91 111 80 135 50 134 Z','#716479');
      p(c,'M116 117 L121 56 Q124 37 133 45 L137 68 148 28 Q160 23 159 50 L165 88 162 126 147 135 120 130 Z','#826b8e');
      p(c,'M49 110 L91 111 M122 114 L160 113',null,'#dcc09b',5);
      for(const x of [61,72,141,154])ellipse(c,x,85,3,3,'#d2b690',null);break;
    case 'studio-tower-scene':
      p(c,'M28 129 L28 77 62 77 62 41 141 41 141 73 174 73 174 131 Z','#7c7993');
      p(c,'M70 131 L70 70 127 70 127 131 Z','#bbc0b9');
      p(c,'M84 131 L84 98 Q101 82 114 99 L114 131 Z','#4c586e');
      p(c,'M31 72 L52 40 65 72 M141 73 L159 40 175 72',null,'#576579',7);
      p(c,'M89 41 L89 22 112 22 112 41 Z','#d4b68f');
      ellipse(c,102,27,8,7,'#f1d8a9');break;
    case 'studio-backlot-compass':
      ellipse(c,101,83,47,49,'#bc9460');
      ellipse(c,101,83,36,37,'#ead6b2');
      p(c,'M101 39 L112 80 101 128 91 80 Z','#555b72');
      p(c,'M101 51 L110 82 101 80 Z','#d46d65',null);
      p(c,'M66 84 L137 84 M101 48 L101 120',null,'#a38e79',2);
      ellipse(c,101,83,7,7,'#675a69');
      for(const [x,y] of [[101,30],[101,136],[48,83],[154,83]])ellipse(c,x,y,3.2,3.2,'#f5e8d1',null);break;
    case 'studio-backlot-jacket':
      p(c,'M69 40 L84 32 101 41 120 32 138 44 167 110 140 125 125 91 124 137 78 137 77 90 62 125 36 111 Z','#b55f5d');
      p(c,'M83 42 L101 67 118 42 L107 137 96 137 Z','#f5e5ce');
      p(c,'M54 72 L69 77 M133 77 L151 71',null,'#e2b394',4);
      p(c,'M104 68 L104 128',null,'#6a4f59',3);
      ellipse(c,110,96,3,3,'#ebc48d');ellipse(c,110,111,3,3,'#ebc48d');break;
    case 'studio-backlot-scene':
      p(c,'M22 48 L179 48 178 128 22 128 Z','#c78c77');
      p(c,'M45 128 L45 83 75 83 75 128 M119 128 L119 68 161 68 161 128',null,'#e8bf98',9);
      p(c,'M31 76 L89 40 180 73',null,'#66536c',10);
      p(c,'M65 133 L65 95 105 95 105 134 Z','#597b80');
      p(c,'M114 38 L143 19 170 39',null,'#d9b18a',5);
      ellipse(c,147,33,9,9,'#fff0be',null);break;
    case 'studio-attic-ghost':
      p(c,'M57 116 Q42 52 95 37 Q150 36 145 111 L156 137 134 126 112 139 93 127 73 140 Z','#d7e4d9');
      ellipse(c,82,91,10,14,'#3e5666');ellipse(c,121,91,10,14,'#3e5666');
      ellipse(c,102,115,7,9,'#819b9e');
      p(c,'M62 74 Q86 53 102 63 M109 62 Q128 52 144 73',null,'#f6f3db',4);
      for(const [x,y] of [[51,40],[165,64],[35,116]])ellipse(c,x,y,4,4,'#e6e6c2',null);break;
  }
  c.restore();
  canvas.dataset.artPack='v8-ink';
  return true;
}
