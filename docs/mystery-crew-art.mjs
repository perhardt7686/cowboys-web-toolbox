/* Mystery Crew Creator: original reference-locked vector faces.
 * Visual anchors come from the approved 1672x941 illustrated workshop image.
 * All values are allowlisted; no user-supplied SVG, CSS or image URL is injected.
 * The same head geometry powers the stage, selection cards and family portraits. */
export const CREW_OPTIONS=Object.freeze({
 faceShape:['oval','round','heart','square','narrow','broad'],
 hairStyle:['tousled','bob','side-sweep','curls','crop','long'],
 eyeShape:['bright','almond','soft','keen'],
 expression:['smile','curious','grin','determined','surprised'],
 detail:['none','glasses','headband','freckles']
});
export const CREW_ANCHORS=Object.freeze([
 {faceShape:'oval',hairStyle:'tousled',eyeShape:'bright',expression:'smile',detail:'none'},
 {faceShape:'heart',hairStyle:'bob',eyeShape:'soft',expression:'smile',detail:'headband'},
 {faceShape:'round',hairStyle:'side-sweep',eyeShape:'bright',expression:'grin',detail:'none'},
 {faceShape:'narrow',hairStyle:'long',eyeShape:'almond',expression:'curious',detail:'glasses'},
 {faceShape:'broad',hairStyle:'crop',eyeShape:'keen',expression:'smile',detail:'none'},
 {faceShape:'square',hairStyle:'curls',eyeShape:'soft',expression:'determined',detail:'freckles'}
]);
const valid=(value,options,fallback)=>options.includes(value)?value:fallback;
const hex=(value,fallback)=>typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value)?value:fallback;
export function normalizeCrewArt(raw={}){
 const v=raw&&typeof raw==='object'?raw:{};
 return {
  faceShape:valid(v.faceShape,CREW_OPTIONS.faceShape,'oval'),
  hairStyle:valid(v.hairStyle,CREW_OPTIONS.hairStyle,'tousled'),
  eyeShape:valid(v.eyeShape,CREW_OPTIONS.eyeShape,'bright'),
  expression:valid(v.expression,CREW_OPTIONS.expression,'smile'),
  detail:valid(v.detail,CREW_OPTIONS.detail,'none'),
  skin:hex(v.skin,'#f0b989'),hair:hex(v.hair,'#904b28')
 };
}
const facePaths={
 oval:'M43 52Q38 14 93 9Q151 7 151 52L146 111Q136 154 96 163Q52 153 43 111Z',
 round:'M34 63Q31 16 91 12Q154 11 158 63L151 119Q139 159 94 165Q51 161 38 119Z',
 heart:'M39 55Q38 16 92 12Q151 10 155 57Q159 117 124 148L94 167Q63 148 44 116Z',
 square:'M41 48Q39 10 93 11Q152 9 153 50L153 127Q136 158 96 160Q54 157 41 127Z',
 narrow:'M50 50Q47 12 96 11Q145 13 145 51L138 125Q119 160 96 171Q67 160 55 123Z',
 broad:'M31 52Q30 16 91 13Q154 12 161 52L156 124Q149 150 120 158L62 158Q39 146 35 124Z'
};
function hairMarkup(style,hair){
 const stroke='#2e2934',fill=`fill="${hair}" stroke="${stroke}" stroke-width="7" stroke-linejoin="round"`;
 const art={
 tousled:`<path d="M36 78Q13 55 27 30L17 17 43 24Q44 6 65 14Q80 -8 112 5Q145 -3 152 25L167 18 160 51 154 77Q141 50 128 46Q113 29 95 42Q75 28 55 57Z" ${fill}/><path d="M51 28L65 12M92 23L112 6M134 36L152 23" fill="none" stroke="#d4a06b" stroke-width="5" opacity=".72"/> `,
 bob:`<path d="M34 90Q21 20 65 12Q111 -7 151 24Q164 59 158 120L145 130 140 91Q143 62 121 46Q96 53 77 39Q61 62 52 71L52 125 34 122Z" ${fill}/><path d="M53 41Q94 8 132 44" fill="none" stroke="#dba17a" stroke-width="5" opacity=".6"/> `,
 'side-sweep':`<path d="M37 79Q16 32 51 17Q79 -10 108 9Q150 -4 161 41Q157 64 150 76Q137 51 126 44Q80 64 45 54Z" ${fill}/><path d="M42 52Q104 46 144 19" fill="none" stroke="#e8b56c" stroke-width="7" opacity=".7"/> `,
 curls:`<path d="M35 83Q20 75 23 52Q14 30 37 20Q37 5 62 10Q77 -5 96 7Q122 -4 137 15Q164 15 160 38Q174 54 154 82L141 56Q116 45 102 52Q77 40 57 60Z" ${fill}/><g fill="${hair}" stroke="${stroke}" stroke-width="5"><circle cx="41" cy="24" r="17"/><circle cx="70" cy="17" r="21"/><circle cx="107" cy="17" r="20"/><circle cx="137" cy="29" r="19"/></g>`,
 crop:`<path d="M39 66Q32 12 93 12Q155 10 154 66L144 58Q130 43 108 47Q85 39 64 54L43 72Z" ${fill}/><path d="M57 27Q92 13 129 27" fill="none" stroke="#bb8056" stroke-width="6" opacity=".7"/> `,
 long:`<path d="M34 65Q28 4 91 8Q158 5 159 64L171 152 145 144 142 75Q136 49 116 36Q91 58 66 45Q53 62 50 81L46 147 23 149Z" ${fill}/><path d="M46 73Q54 105 35 139M150 76Q143 110 157 140" fill="none" stroke="#be855b" stroke-width="5" opacity=".66"/> `
 };
 return art[style]||art.tousled;
}
function mouthMarkup(expression){
 const paths={
 smile:'<path d="M73 132Q96 157 121 131" fill="none" stroke="#7c4641" stroke-width="6" stroke-linecap="round"/>',
 curious:'<path d="M80 137Q97 144 115 133" fill="none" stroke="#74433e" stroke-width="5" stroke-linecap="round"/>',
 grin:'<path d="M68 128Q96 173 126 128Q99 149 68 128Z" fill="#fff7e8" stroke="#743e3e" stroke-width="5" stroke-linejoin="round"/>',
 determined:'<path d="M76 141Q96 138 116 141" fill="none" stroke="#754942" stroke-width="5" stroke-linecap="round"/>',
 surprised:'<ellipse cx="97" cy="139" rx="9" ry="13" fill="#783e42" stroke="#854e4c" stroke-width="3"/>'
 };
 return paths[expression]||paths.smile;
}
function eyeMarkup(shape){
 const pairs={
 bright:[11,16],almond:[12,11],soft:[11,14],keen:[12,10]
 };
 const [rx,ry]=pairs[shape]||pairs.bright;
 const brow=shape==='keen'?'M55 70L86 65 M106 65L135 70':shape==='soft'?'M56 69Q71 61 87 67 M104 67Q121 61 134 69':'M55 64Q73 56 85 64 M104 64Q122 55 135 64';
 return `<g stroke="#3c3036" stroke-width="2.8"><ellipse cx="72" cy="92" rx="${rx}" ry="${ry}" fill="#fffaf3"/><ellipse cx="118" cy="91" rx="${rx}" ry="${ry}" fill="#fffaf3"/></g><circle cx="77" cy="94" r="5.6" fill="#3d708c"/><circle cx="114" cy="93" r="5.6" fill="#3d708c"/><circle cx="80" cy="91" r="2.4" fill="#fff"/><circle cx="117" cy="90" r="2.4" fill="#fff"/><path d="${brow}" fill="none" stroke="#5d3f38" stroke-width="5.5" stroke-linecap="round"/>`;
}
function detailMarkup(v){
 return {
 none:'',
 glasses:'<g fill="none" stroke="#322e38" stroke-width="5"><circle cx="73" cy="94" r="24"/><circle cx="118" cy="93" r="24"/><path d="M97 86Q96 82 94 87M47 91L38 84M144 91L153 84"/></g>',
 headband:'<path d="M41 49Q64 10 96 12Q131 10 152 48" fill="none" stroke="#ed7048" stroke-width="10" stroke-linecap="round"/><path d="M49 41Q94 17 145 40" fill="none" stroke="#ffc887" stroke-width="3"/>',
 freckles:'<g fill="#ab6650" opacity=".8"><circle cx="57" cy="115" r="3"/><circle cx="66" cy="119" r="2.6"/><circle cx="75" cy="116" r="2.5"/><circle cx="120" cy="116" r="3"/><circle cx="129" cy="119" r="2.4"/></g>'
 }[v.detail]||'';
}
export function crewHeadMarkup(raw={}){
 const v=normalizeCrewArt(raw);
 return '<path d="'+facePaths[v.faceShape]+'" fill="'+v.skin+'" stroke="#332d39" stroke-width="8" stroke-linejoin="round"/>'+
 '<ellipse cx="40" cy="96" rx="13" ry="18" fill="'+v.skin+'" stroke="#392f3b" stroke-width="5"/>'+
 '<ellipse cx="151" cy="96" rx="13" ry="18" fill="'+v.skin+'" stroke="#392f3b" stroke-width="5"/>'+
 '<path d="M49 101Q54 130 82 147Q94 151 108 146Q132 133 145 104Q141 147 100 160Q64 157 49 122Z" fill="#713c30" opacity=".12"/>'+
 '<path d="M52 72Q66 56 85 66M106 63Q129 55 141 73" fill="none" stroke="#fff1cb" stroke-width="5" opacity=".32"/>'+
 '<path d="M49 116Q61 134 78 137 M110 137Q129 133 143 116" fill="none" stroke="#d38568" stroke-width="4" opacity=".42"/>'+
 '<path d="M54 119Q68 124 77 119 M115 118Q129 125 140 117" fill="none" stroke="#d97d66" stroke-width="3" opacity=".4"/>'+
 eyeMarkup(v.eyeShape)+
 '<path d="M96 99L88 116Q98 123 107 117" fill="none" stroke="#bd7957" stroke-width="4.5"/>'+
 '<path d="M95 111Q100 113 104 110" fill="none" stroke="#ffe1b4" stroke-width="3" opacity=".7"/>'+
 mouthMarkup(v.expression)+hairMarkup(v.hairStyle,v.hair)+detailMarkup(v);
}
export function crewHeadPreviewSVG(raw={},size=128){
 const v=normalizeCrewArt(raw);
 const width=Math.min(160,Math.max(80,Number(size)||128));
 return '<svg viewBox="0 0 192 190" width="'+width+'" height="'+width+'" aria-hidden="true" focusable="false"><rect width="192" height="190" rx="20" fill="#8ac7dd"/><g transform="translate(0 4)">'+crewHeadMarkup(v)+'</g></svg>';
}
