import {INK,PAPER,glint,oval,path} from './avatar-cel-art.mjs?v=cel1';

const LIGHTS = {
  ember:'#ffaf57', ice:'#8ff7f0', gold:'#ffd278', orchid:'#e7a3ff',
  mint:'#a3e4b3', coral:'#ff9a80'
};
const signatures = [
  [/chicken|duck/, 'shake','Give it a squeeze','It gives a quick, wobbly shake.','gold'],
  [/lantern|lighthouse|headlamp/, 'lamp','Turn on the light','A warm light spills across the artwork.','gold'],
  [/fire|flam|dragon|volcano|campfire/, 'embers','Stoke the glow','Embers rise and a warm glow catches the edges.','ember'],
  [/laser|scanner|robot|cyber|hologram|circuit|clockwork/, 'scan','Run a scan','A bright scan sweeps the item.','ice'],
  [/balloon|jelly|bubbl|undersea|ocean|lagoon|seaweed/, 'bubbles','Release bubbles','Bubbles lift away and pop in the light.','ice'],
  [/snow|frozen|fjord|winter|diamond|glacier/, 'crystal','Catch the light','An icy glint breaks across the edges.','ice'],
  [/star|moon|cosmic|galax|lightning|comet|celestial|aurora|space|orb|rocket|meteor|portal|magic|rune/, 'spark','Power it up','The artwork lights up and throws off pinpricks of light.','orchid'],
  [/rose|flower|petal|moth|garden|sunflower|maple|leaf|forest|orchid/, 'petals','Let the petals fly','Petals drift across the frame.','coral'],
  [/pizza|taco|sandwich|toast|tea|cake|waffle|noodle|popcorn|muffin|cream|honey|candy|cheese|sundae/, 'steam','Give it a shake','A curl of steam or sugar trails the prize.','gold'],
  [/disco|rainbow|prism|opal|racing|checker|race|jigsaw|domino|pinwheel|windshield|billiards/, 'spin','Set it spinning','It rocks into motion with a sweep of color.','coral'],
  [/trophy|gold|royal|shield|crown|viking|monocle|treasure|armor|golden/, 'polish','Catch the shine','A reflected streak glides along the finish.','gold']
];

const bySlot = {
  hat:['shake','Bump the brim','The hat tips and settles.','gold'],
  eyewear:['polish','Tilt the frames','A reflection sweeps both lenses.','ice'],
  hair:['breeze','Catch a breeze','The hair shifts and settles.','gold'],
  eyes:['blink','Try the expression','The face detail pulses into view.','gold'],
  prop:['shake','Give it a shake','The prop tilts and bounces.','gold'],
  background:['breeze','Bring the scene to life','Light and air move across the scene.','mint'],
  effect:['spark','Activate the effect','The scene responds with new movement and light.','orchid']
};
const special = {
  'rubber-chicken':['shake','Squeeze the chicken','The chicken wobbles under the squeeze.','gold'],
  'floating-pizza':['steam','Lift the slice','The slice lifts with a trail of steam.','gold'],
  'flying-toaster':['spin','Launch the toaster','The toaster takes a short flight.','ember'],
  'magic-wand':['spark','Cast a spell','The wand sweeps up a trail of stars.','orchid'],
  'frozen-halo':['crystal','Freeze the air','Ice glints spread out from the halo.','ice'],
  'victory-wings':['breeze','Flare the wings','The wings flare and trail light.','gold'],
  'flying-saucer-hat':['scan','Switch on the tractor beam','A light sweeps below the saucer.','mint'],
  'dragon-crown':['embers','Wake the dragon','A rush of embers escapes the crown.','ember'],
  'aurora-halo':['breeze','Sweep the aurora','Bands of green and violet sweep through the scene.','mint']
};

export function prizeAction(item) {
  if(item.slot==='companion')return {kind:'pet',label:'Meet this pet',description:'Earn it in a game to adopt, play and teach a trick.',accent:LIGHTS.gold};
  const [kind,label,description,light]=special[item.id]
    ||signatures.find(([match])=>match.test(item.id))?.slice(1)||bySlot[item.slot];
  return {kind,label,description,accent:LIGHTS[light]};
}

const petMoves = {
  'mini-dragon':['Nestles against your hand.','Hops and chases a spark.','Puffs a tiny shower of embers.','hop','ember','Ember puff'],
  'floating-crocodile':['Closes its eyes and grins.','Bobs after a bubble.','Blows a trail of turquoise bubbles.','float','ice','Bubble trail'],
  'tin-robot':['Blinks its indicator.','Bounces to a mechanical beat.','Sends out a bright scan.','wobble','ice','Scanner salute'],
  'pirate-parrot':['Nuzzles into your hand.','Hops after a shiny coin.','Loops through a shower of gold.','glide','gold','Gold loop'],
  'tiny-ufo':['Lights up its cabin.','Skims around the runway.','Powers up its tractor beam.','glide','mint','Tractor beam'],
  'ghost-companion':['Drifts in close.','Darts away and floats back.','Leaves a curl of ghost light.','float','orchid','Ghost light'],
  'baby-dinosaur':['Leans in for a scratch.','Stomps in place.','Puffs out a cloud of dust.','hop','gold','Dino stomp'],
  'tiny-viking':['Nods a greeting.','Shuffles into a dance.','Flashes a starry shield salute.','wobble','gold','Shield salute'],
  'storm-dragon':['Curls into your hand.','Rides a little updraft.','Crackles with blue lightning.','glide','ice','Storm call'],
  'cloud-sheep':['Melts into a fluffy lean.','Bobs like a drifting cloud.','Leaves a sparkling cloud trail.','float','orchid','Cloud trail'],
  'marshmallow-fox':['Tips its head for an ear scratch.','Pounces on a leaf.','Twists through spring petals.','hop','coral','Petal pounce'],
  'moon-jelly':['Glows softly.','Drifts in a slow loop.','Releases bubbles of moonlight.','float','ice','Moon bubbles'],
  'pocket-axolotl':['Leans in with a grin.','Wiggles after a bubble.','Swims through a loop of bubbles.','wobble','coral','Bubble swim'],
  'busy-bumblebee':['Bobs in place with a soft glow.','Zips round a flower.','Leaves a golden line of pollen.','glide','gold','Pollen loop'],
  'teacup-mouse':['Peeks over the cup.','Rocks its cup from side to side.','Makes the cup glow and bounce.','wobble','gold','Teacup dance'],
  'coral-octopus':['Sways its arms.','Wiggles in a circle.','Makes a whirlpool of bubbles.','wobble','coral','Bubble whirlpool'],
  'raspberry-snail':['Leans out of its shell.','Scoots in a little circle.','Draws a sparkling trail.','float','orchid','Garden trail'],
  'penguin-postman':['Tilts its head for a scratch.','Waddles out and back.','Slides through a streak of ice.','wobble','ice','Ice slide'],
  'squeaky-otter':['Wiggles with delight.','Bounces in place.','Sends a ring of bubbles into the air.','hop','ice','Bubble splash'],
  'bookish-owl':['Nods under an ear rub.','Flutters off the perch and back.','Lights up a starry page.','glide','orchid','Story light'],
  'firefly-frog':['Gives a soft golden glow.','Makes two little hops.','Summons a cloud of fireflies.','hop','gold','Firefly call'],
  'bunny-baker':['Leans in for a cheek rub.','Does a two-step hop.','Jumps through a puff of sugar.','hop','gold','Sugar hop'],
  'derby-duck':['Bobs its head.','Rocks on its skates.','Crosses the frame in a flash.','wobble','coral','Derby dash'],
  'rocket-cat':['Nuzzles your glove.','Dashes upward and back.','Leaves a comet tail.','glide','ember','Rocket leap'],
  'peekaboo-mimic':['Opens an eye and leans in.','Wobbles its lid.','Pops open under a shower of gold.','wobble','gold','Treasure pop'],
  'alpaca-scarf':['Leans into a neck scratch.','Bounces and sways.','Throws a swirl of petals.','hop','coral','Scarf twirl'],
  'golden-koi':['Flashes a golden scale.','Swims a little loop.','Sends bubbles spiraling upward.','glide','gold','Golden whirl'],
  'trail-husky':['Cocks its head and leans into the scratch.','Bounds up to meet you.','Does a double hop with a trail of stars.','hop','ice','Trail hop'],
  'starling-owl':['Soft mechanical feathers settle.','Takes a scouting flight above your shoulder.','Projects a glowing enemy-wave map.','glide','ice','Wave scanner'],
  'queen-drone':['Purrs through its tiny radio.','Loops through a squadron salute.','Summons a glowing fleet formation.','glide','orchid','Queen fleet'],
  'clue-mouse':['Squeaks as its detective ears perk up.','Sniffs around a trail of footprints.','Reveals a floating clue with a magnifying beam.','hop','gold','Clue reveal'],
  'wisp-pup':['Wags a translucent tail.','Bounces through a tiny haunted hoop.','Leaves a fluttering constellation of ghost paws.','float','ice','Ghost paw parade'],
  'pixel-hamster':['Nibbles a glowing pixel.','Runs through a neon hamster wheel.','Builds a miniature crystalline staircase.','wobble','gold','Pixel builder'],
  'boss-dragonlet':['Rumbles a tiny victory roar.','Flies a loop over your shoulder.','Breathes a prismatic boss-fire vortex.','glide','mint','Boss fire'],
  'midnight-owl':['Its feathers settle as it blinks.','Flutters around the clue board.','Projects a tiny constellation.','glide','orchid','Constellation call'],
  'phantom-puppy':['Wags its ghostly tail.','Dashes through a glowing hoop.','Leaves little spectral pawprints.','hop','ice','Ghost-paw parade'],
  'clockwork-cat':['Purrs with little clicking gears.','Bats a tiny brass pendulum.','Unwinds a shower of clockwork stars.','wobble','gold','Gearstorm'],
  'moon-fox':['Ears perk for a cuddle.','Leaps after moonlit moths.','Whirls up a misty moon halo.','hop','orchid','Moon halo'],
  'cactus-hedgehog':['Shows its softest side.','Rolls around a cactus flower.','Makes a ring of desert blossoms.','wobble','mint','Desert bloom'],
  'bubble-axolotl':['Wiggles its cheek frills.','Swims a sparkling little loop.','Blows a ribbon of luminous bubbles.','float','ice','Bubble ribbon'],
  'detective-ferret':['Sniffs a hidden clue.','Darts around your shoulder.','Points out a mystery with glowing footprints.','hop','gold','Clue finder'],
  'neon-firefly':['Glows warmly in your hand.','Orbits the character twice.','Calls a swirl of golden lights.','glide','gold','Luminous spiral'],
  'satellite-turtle':['Raises its head for a scratch.','Trundles around a tiny moon.','Launches a playful satellite beam.','wobble','ice','Satellite scan'],
  'bonsai-dragon':['Curls around your finger.','Flutters through the branches.','Breathes a tiny emerald ember cloud.','glide','mint','Emerald flame'],
  'carnival-bat':['Folds its velvet wings.','Loops over a carnival light.','Summons a parade of glowing ghost lights.','glide','coral','Carnival glide'],
  'gear-gecko':['Wiggles its toes happily.','Climbs around a brass cog.','Lights up a tiny mechanical maze.','wobble','gold','Gear maze'],
  'lantern-raccoon':['Tilts its head and lifts the lantern.','Waddles over with the light.','Lights the clearing with a lantern salute.','wobble','ember','Lantern salute']
};

export function petBehavior(item, action) {
  const [pet,play,trick,move,light,trickName]=petMoves[item.id]||['Looks up at you.','Bounces happily.','Performs a little trick.','wobble','gold','Little surprise'];
  const cue=action==='trick'
    ? /bubble|whirlpool/.test(trickName.toLowerCase())?'bubbles':item.id==='lantern-raccoon'?'lamp':
      /beam|scanner/.test(trickName.toLowerCase())?'scan':
      /ember|rocket/.test(trickName.toLowerCase())?'embers':
      /petal|scarf/.test(trickName.toLowerCase())?'petals':'spark'
    : action==='pet'?'hearts':'motion';
  return {label:trickName,caption:{pet,play,trick}[action],kind:cue,move,accent:LIGHTS[light]};
}

export const bounds = {
  background:[128,128,126,125],effect:[128,128,123,123],hat:[128,55,89,38],
  eyewear:[128,123,81,22],eyes:[128,130,60,33],hair:[128,90,81,60],
  prop:[44,194,36,35],companion:[209,192,38,38]
};

function arcLine(c,x,y,r,accent) {
  c.beginPath();c.arc(x,y,r,-.8,1.1);
  c.strokeStyle=accent;c.lineWidth=1.75;c.stroke();
}

export function prizeMotion(c,item,spec,progress) {
  const [x,y]=bounds[item.slot];
  const pulse=Math.sin(Math.PI*progress);
  if(item.slot==='companion'){
    const step=Math.sin(progress*Math.PI*2);
    if(spec.move==='hop')c.translate(step*3,-Math.abs(Math.sin(progress*Math.PI*2))*15);
    else if(spec.move==='glide')c.translate(step*10,-pulse*14);
    else if(spec.move==='float')c.translate(step*5,-pulse*9);
    else c.translate(0,-pulse*3);
    c.translate(x,y);c.rotate(step*(spec.move==='wobble'?.20:.10));c.translate(-x,-y);
  }else if(item.slot==='background'){
    c.translate(128,128);c.scale(1+.03*pulse,1+.03*pulse);c.translate(-128,-128);
  }else if(spec.kind==='spin'||spec.kind==='shake'||spec.kind==='breeze'||spec.kind==='steam'){
    c.translate(x,y-(spec.kind==='steam'?8:2)*pulse);
    c.rotate(Math.sin(progress*Math.PI*4)*pulse*(item.slot==='prop'?.22:.075));
    c.translate(-x,-y);
  } else if(spec.kind==='blink'){
    c.translate(x,y);c.scale(1,1-.33*pulse);c.translate(-x,-y);
  }
}

export function paintAura(c,x,y,r,color,alpha=1) {
  const light=c.createRadialGradient(x,y,0,x,y,r);
  light.addColorStop(0,color+'b0');
  light.addColorStop(.38,color+'43');
  light.addColorStop(1,color+'00');
  c.save();
  c.globalAlpha=alpha;
  c.fillStyle=light;c.fillRect(x-r,y-r,2*r,2*r);
  c.restore();
}

export function paintReaction(c,item,spec,p) {
  let [x,y,w,h]=bounds[item.slot];
  if(item.slot==='background') h=101;
  const {kind,accent}=spec;
  const intensity=.5+.5*Math.sin(p*Math.PI);
  c.save();c.globalAlpha=intensity;
  if(kind==='hearts'){
    for(let i=0;i<3;i++){
      const dx=x+(i-1)*18,dy=y-28-i*4-p*16;
      path(c,[dx,dy+9],[[dx-17,dy-2,dx-4,dy-8,dx,dy-2],[dx+5,dy-9,dx+14,dy-1,dx,dy+9]],'#e78985',INK,1.2);
    }
  }else if(kind==='lamp'){
    if(item.id==='lantern-raccoon'){x+=30;y+=18;w=24;}
    const beam=c.createLinearGradient(x,y-4,x,y+54);
    beam.addColorStop(0,accent+'99');beam.addColorStop(1,accent+'00');
    path(c,[x-w*.28,y-4],[[x+w*.28,y-4],[x+w*1.35,y+60],[x-w*1.35,y+60]],beam,null);
    paintAura(c,x,y,Math.min(100,w*1.7),accent);
    glint(c,x+w*.7,y-9,5,accent);
  }else if(kind==='scan'||kind==='polish'||kind==='crystal'){
    const horizontal=kind==='scan';
    const start=horizontal?[x-w,y-h+2*h*p]:[x-w+1.65*w*p,y+h*.84];
    const end=horizontal?[x+w,start[1]]:[Math.min(x+w,start[0]+w*.38),y-h*.82];
    path(c,start,[end],null,accent+'80',8);
    path(c,start,[end],null,PAPER,2.2);
    for(let i=0;i<(kind==='crystal'?5:2);i++)glint(c,x+(i%2?-.6:.64)*w,y+(i-1)*h*.39,4+i*1.1,accent);
  }else if(kind==='bubbles'){
    for(let i=0;i<8;i++){
      const dx=x+Math.sin(i*1.77+p*3)*w*.83,dy=y+h*.5-((i/8+p)%1)*h*1.5,r=2+i%3;
      oval(c,dx,dy,r,r,accent+'40',accent,1.2);
      oval(c,dx-1.2,dy-1.4,.9,.9,PAPER);
    }
  }else if(kind==='breeze'||kind==='steam'||kind==='motion'||kind==='shake'){
    for(let i=0;i<4;i++){
      const q=(p+i/4)%1;
      const dx=x-w*.9+((q*1.8)*w),dy=y-h*.65+(i*8);
      if(kind==='steam') path(c,[x+(i-1.5)*12,y-h*.5-q*22],[[dx,y-h-q*17,x+i*4,y-h*1.15-q*19]],null,accent,1.55);
      else arcLine(c,dx,dy,9+i*3,accent);
    }
  }else{
    const seed=[...item.id].reduce((s,ch)=>(s*31+ch.charCodeAt(0))>>>0,7);
    for(let i=0;i<9;i++){
      const q=(p+i/9)%1, angle=i*2.33+(seed%44)/10;
      const dx=x+Math.cos(angle)*w*(.43+q*.61),dy=y+Math.sin(angle)*h*(.4+q*.6);
      if(kind==='petals')oval(c,dx,dy,4.2,2.15,accent,PAPER,1,angle+p*3);
      else if(kind==='embers'){
        oval(c,dx,dy-q*17,2.2,2.5,accent);
        path(c,[dx,dy-q*17+2],[[dx-4,dy-q*17+9]],null,accent+'94',1.2);
      }else glint(c,dx,dy,2+i%4,accent);
    }
  }
  c.restore();
}
