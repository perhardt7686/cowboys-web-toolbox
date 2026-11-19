/* Server-synced Mystery Crew portraits shared across the Family Message Board.
 * Original vector art, no image uploads or untrusted SVG injection. */
export const BASIC_MYSTERY_CREW=Object.freeze({
 id:'crew-1',name:'Scout',skin:'#f0b989',hair:'#904b28',shirt:'#ef792f',pants:'#315b93',
 outfit:'detective',hat:'none',gear:'none',pet:'dog',vehicle:'van',scene:'sunlit',expression:'smile'
});
const color=(value,fallback)=>typeof value==='string'&&/^#[0-9a-fA-F]{6}$/.test(value)?value:fallback;
export function mysteryCrewPortraitSVG(input={}){
 const v={...BASIC_MYSTERY_CREW,...(input&&typeof input==='object'?input:{})};
 const skin=color(v.skin,BASIC_MYSTERY_CREW.skin);
 const hair=color(v.hair,BASIC_MYSTERY_CREW.hair);
 const shirt=color(v.shirt,BASIC_MYSTERY_CREW.shirt);
 const dark='#282e3d';
 const hat=v.hat==='none'?'':v.hat==='helmet'
  ?'<path d="M18 44Q18 4 52 7Q90 7 92 45L78 58 29 58Z" fill="#c0b69b" stroke="#35353e" stroke-width="5"/><path d="M29 23L16 5 8 9 24 40M76 24L91 5 96 10 83 40" fill="#f0d6a5" stroke="#35353e" stroke-width="4"/>'
  :'<path d="M17 44Q23 13 53 12Q80 12 89 44Z" fill="#997046" stroke="#342e34" stroke-width="5"/><path d="M13 44Q53 61 96 44" fill="none" stroke="#453536" stroke-width="8"/>';
 const eyes=v.expression==='curious'?'M36 56L43 53 M63 52L70 55':"";
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 104 104" width="96" height="96" aria-hidden="true" focusable="false">'+
 '<rect width="104" height="104" rx="18" fill="#7fc4df"/>'+
 '<path d="M0 93Q52 73 104 93V104H0Z" fill="#e5ce9d"/>'+
 '<path d="M11 105Q15 81 35 77L52 83 72 77Q91 81 94 105Z" fill="'+shirt+'" stroke="'+dark+'" stroke-width="5"/>'+
 '<path d="M27 38Q28 13 54 13Q79 13 80 39L76 65Q55 87 32 65Z" fill="'+skin+'" stroke="'+dark+'" stroke-width="5"/>'+
 '<path d="M24 45Q11 18 36 14Q52 -1 68 12Q87 13 82 46L69 30 55 31Q40 26 29 44Z" fill="'+hair+'" stroke="'+dark+'" stroke-width="5"/>'+
 '<ellipse cx="43" cy="51" rx="7" ry="9" fill="#fff7e3"/><ellipse cx="65" cy="51" rx="7" ry="9" fill="#fff7e3"/>'+
 '<circle cx="45" cy="53" r="3" fill="#315473"/><circle cx="63" cy="53" r="3" fill="#315473"/>'+
 '<path d="M43 68Q55 79 67 66" fill="none" stroke="#774e46" stroke-width="4" stroke-linecap="round"/>'+
 eyes+hat+'</svg>';
}
