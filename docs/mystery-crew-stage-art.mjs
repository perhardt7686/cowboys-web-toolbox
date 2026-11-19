/* Original, live SVG art painted against Cowboy's approved 1672x941 reference.
 * The reference screenshot itself is PRIVATE and not published as a site asset.
 * The stage remains live and interactive; no static screenshot is substituted. */
const svg=parts=>parts.join('');
export function enhanceMysteryScene(){
 const scene=document.getElementById('mc-scene');
 const barn=document.getElementById('mc-barn');
 const vehicle=document.getElementById('mc-vehicle');
 if(!scene||!barn||!vehicle)return false;
 scene.querySelector('defs')?.insertAdjacentHTML('beforeend',svg([
  '<linearGradient id="mc-barnwood" x2=".8" y2=".1"><stop stop-color="#8d3327"/><stop offset=".4" stop-color="#c9633f"/><stop offset="1" stop-color="#843a2d"/></linearGradient>',
  '<linearGradient id="mc-workshopdoor" x2="0" y2="1"><stop stop-color="#4a2a24"/><stop offset=".7" stop-color="#8c552f"/><stop offset="1" stop-color="#322622"/></linearGradient>',
  '<linearGradient id="mc-vanblue" x2="0" y2="1"><stop stop-color="#479bbb"/><stop offset=".6" stop-color="#267ca7"/><stop offset="1" stop-color="#155476"/></linearGradient>',
  '<linearGradient id="mc-vanwindow" x2="1" y2="1"><stop stop-color="#def7eb"/><stop offset=".55" stop-color="#9fcada"/><stop offset="1" stop-color="#639eb9"/></linearGradient>',
  '<radialGradient id="mc-shopglow"><stop stop-color="#ffcf6e" stop-opacity=".9"/><stop offset="1" stop-color="#e79739" stop-opacity="0"/></radialGradient>',
  '<linearGradient id="mc-jacketshine" x2=".9" y2="1"><stop stop-color="#ffe3a0" stop-opacity=".36"/><stop offset="1" stop-color="#a3512c" stop-opacity=".3"/></linearGradient>'
 ]));
 barn.insertAdjacentHTML('beforebegin',svg([
  '<g id="mc-woods-detail" aria-hidden="true">',
  '<path d="M0 344Q49 296 93 342Q160 252 216 333Q278 252 345 328Q423 252 494 326Q561 283 636 345V424H0Z" fill="#38775d" opacity=".75"/>',
  '<g fill="#336e56" stroke="#285e4a" stroke-width="3"><path d="M98 363L116 260 133 363Z"/><path d="M104 300L117 227 129 300Z"/><path d="M255 363L278 240 301 363Z"/><path d="M266 294L279 210 291 294Z"/><path d="M413 361L437 232 461 361Z"/><path d="M424 294L437 209 449 294Z"/></g>',
  '<g fill="#4f975e"><ellipse cx="79" cy="38" rx="133" ry="67"/><ellipse cx="179" cy="28" rx="127" ry="60"/><ellipse cx="918" cy="45" rx="117" ry="67"/><ellipse cx="805" cy="22" rx="78" ry="53"/></g>',
  '<g fill="#3b7d4d"><ellipse cx="11" cy="97" rx="88" ry="42"/><ellipse cx="133" cy="75" rx="130" ry="47"/><ellipse cx="221" cy="54" rx="76" ry="34"/><ellipse cx="911" cy="104" rx="102" ry="43"/></g>',
  '<g fill="none" stroke="#236044" stroke-width="4" opacity=".7"><path d="M-10 63Q86 11 187 62M33 102Q116 58 209 88M793 53Q888 17 976 68"/></g>',
  '<g fill="#c1d58d" opacity=".53"><ellipse cx="104" cy="20" rx="24" ry="10"/><ellipse cx="195" cy="57" rx="20" ry="9"/><ellipse cx="891" cy="29" rx="19" ry="9"/></g>',
  '<path d="M321 79Q393 54 454 74Q404 84 321 79Z" fill="#fff8dc" opacity=".56"/>',
  '</g>'
 ]));
 barn.innerHTML=svg([
  '<path d="M665 188L801 95 956 190V459H665Z" fill="url(#mc-barnwood)" stroke="#4d3a37" stroke-width="11"/>',
  '<path d="M681 218V457M706 198V459M742 174V458M775 153V458M812 132V458M847 154V458M879 177V458M912 198V458M941 218V458" fill="none" stroke="#813d30" stroke-width="5" opacity=".6"/>',
  '<path d="M667 241H956M668 323H958M671 398H955" stroke="#d88b5b" stroke-width="3" opacity=".7"/>',
  '<path d="M647 205L802 89 969 199" fill="none" stroke="#503b35" stroke-width="37" stroke-linejoin="round"/>',
  '<path d="M648 201L801 94 967 198" fill="none" stroke="#e0c7ad" stroke-width="24" stroke-linejoin="round"/>',
  '<path d="M707 231H929V462H707Z" fill="#5b3728" stroke="#e3c4a6" stroke-width="15"/>',
  '<path d="M725 250H910V447H725Z" fill="url(#mc-workshopdoor)"/>',
  '<ellipse cx="808" cy="301" rx="114" ry="105" fill="url(#mc-shopglow)" opacity=".72"/>',
  '<path d="M735 391H904M739 308H897" stroke="#6a4932" stroke-width="14"/>',
  '<path d="M751 333V388M780 329V391M863 315V392" stroke="#48352b" stroke-width="7"/>',
  '<path d="M762 330H795V374H762Z" fill="#aa9367" stroke="#5c4737" stroke-width="4"/>',
  '<path d="M817 321H851V371H817Z" fill="#7e9268" stroke="#5d4834" stroke-width="4"/>',
  '<path d="M872 330H898V381H872Z" fill="#b77748" stroke="#5e4032" stroke-width="4"/>',
  '<path d="M749 264L850 251 860 337 758 344Z" fill="#d1b68b" stroke="#765842" stroke-width="6"/>',
  '<path d="M764 281L842 272M766 298L841 291M770 319L831 310" stroke="#927452" stroke-width="3"/>',
  '<g fill="none" stroke="#bd7643" stroke-width="4"><path d="M774 283L818 300 795 322"/></g>',
  '<path d="M802 204V249" stroke="#3b302e" stroke-width="7"/>',
  '<path d="M764 248H840L830 269H774Z" fill="#e7a045" stroke="#554034" stroke-width="7"/>',
  '<path d="M779 257H822" stroke="#fff0bb" stroke-width="10" stroke-linecap="round"/>',
  '<ellipse cx="801" cy="285" rx="81" ry="34" fill="url(#mc-shopglow)" opacity=".6"/>',
  '<path d="M703 231V460M932 231V460M704 453H930" fill="none" stroke="#f0d3b4" stroke-width="9"/>'
 ]);
 vehicle.innerHTML=svg([
  '<ellipse cx="303" cy="444" rx="209" ry="23" fill="#61442e" opacity=".25"/>',
  '<path d="M112 321Q119 272 174 257Q188 250 222 248H438Q473 251 488 287L510 340 502 411Q497 444 467 445H141Q108 442 110 414Z" fill="url(#mc-vanblue)" stroke="#314351" stroke-width="9"/>',
  '<path d="M114 320L163 267Q184 240 220 240L443 241Q475 247 489 285L501 326 488 345H116Z" fill="#ede3c7" stroke="#344450" stroke-width="8"/>',
  '<path d="M134 288L166 265 229 260 235 337 123 338Z" fill="url(#mc-vanwindow)" stroke="#354c59" stroke-width="8"/>',
  '<path d="M251 261H432Q470 270 475 331L251 333Z" fill="url(#mc-vanwindow)" stroke="#344753" stroke-width="8"/>',
  '<path d="M152 303L188 273M278 328L309 270M318 327L353 270" stroke="#f2fff3" stroke-width="6" opacity=".5"/>',
  '<path d="M116 348H500" stroke="#ee8b43" stroke-width="23"/>',
  '<path d="M118 378H500" stroke="#f6bf80" stroke-width="8"/>',
  '<path d="M249 262V428M435 265V429" stroke="#3d6072" stroke-width="5"/>',
  '<path d="M268 349H301M445 350H473" stroke="#e9d9b6" stroke-width="7" stroke-linecap="round"/>',
  '<path d="M158 243L448 241" stroke="#34434e" stroke-width="10"/>',
  '<path d="M175 242V217H432V242M202 216V201M405 216V201" fill="none" stroke="#3a4149" stroke-width="8"/>',
  '<path d="M191 211H421" stroke="#74818a" stroke-width="4"/>',
  '<g stroke="#52606a" stroke-width="6" fill="#fbe9bd"><circle cx="212" cy="198" r="18"/><circle cx="276" cy="198" r="18"/><circle cx="342" cy="198" r="18"/><circle cx="406" cy="200" r="17"/></g>',
  '<g fill="#fff8dc"><circle cx="206" cy="192" r="6"/><circle cx="272" cy="191" r="6"/><circle cx="336" cy="190" r="6"/><circle cx="402" cy="192" r="6"/></g>',
  '<g fill="#25313c" stroke="#dfd5bf" stroke-width="10"><circle cx="207" cy="429" r="34"/><circle cx="426" cy="429" r="34"/></g>',
  '<g fill="#8996a0" stroke="#435362" stroke-width="5"><circle cx="207" cy="429" r="15"/><circle cx="426" cy="429" r="15"/></g>',
  '<g fill="#f6eeda" stroke="#967657" stroke-width="6"><circle cx="128" cy="381" r="18"/><circle cx="488" cy="381" r="18"/></g>',
  '<path d="M109 409H171M447 409H510" stroke="#dcd2b8" stroke-width="12" stroke-linecap="round"/>',
  '<g transform="translate(354 358) rotate(-12)"><circle r="37" fill="#f1d9b0" stroke="#b37742" stroke-width="8"/><circle r="26" fill="#eebc7e" stroke="#ce8f57" stroke-width="5"/><circle cx="-5" cy="-5" r="13" fill="#83b6c6" stroke="#9f6740" stroke-width="5"/><path d="M14 16L43 44" stroke="#dd7d42" stroke-width="11" stroke-linecap="round"/></g>',
  '<path d="M134 312Q176 273 220 272" fill="none" stroke="#fff" stroke-width="5" opacity=".36"/>'
 ]);
 vehicle.insertAdjacentHTML('beforebegin',svg([
  '<g id="mc-ground-fidelity" aria-hidden="true">',
  '<path d="M0 439Q156 421 293 439Q458 408 625 437Q796 415 960 440V620H0Z" fill="#cfa773" opacity=".75"/>',
  '<path d="M-15 472Q100 446 204 474Q352 450 463 475Q624 454 769 477Q869 454 980 475" fill="none" stroke="#e2c18a" stroke-width="17" opacity=".7"/>',
  '<path d="M-25 543Q151 493 331 541Q544 582 768 527Q866 504 985 543" fill="none" stroke="#9b7854" stroke-width="10" opacity=".2"/>',
  '<g fill="#937650" opacity=".31"><ellipse cx="52" cy="486" rx="22" ry="5"/><ellipse cx="236" cy="523" rx="28" ry="6"/><ellipse cx="744" cy="555" rx="23" ry="6"/><ellipse cx="864" cy="477" rx="28" ry="4"/></g>',
  '<g stroke="#4f8055" stroke-width="4" fill="none" stroke-linecap="round"><path d="M28 461L21 446M28 460L37 446M180 461L174 449M180 461L190 447M690 465L682 450M690 464L700 451M912 461L906 445M912 461L924 450"/></g>',
  '<g fill="#ba8b5f" opacity=".67"><path d="M88 479L110 471 97 485Z"/><path d="M583 550L605 543 610 553Z"/><path d="M851 516L875 513 861 525Z"/></g>',
  '</g>'
 ]));
 const legs=document.getElementById('mc-legs');
 legs?.insertAdjacentHTML('beforeend',svg([
  '<path d="M40 327L34 396Q47 415 60 405M117 325L136 404" fill="none" stroke="#779fc4" stroke-width="6" opacity=".65"/>',
  '<path d="M27 357L73 359L69 399H28Z" fill="#315b93" stroke="#263849" stroke-width="5"/>',
  '<path d="M34 370H66M49 366V393" stroke="#7897bd" stroke-width="4"/>',
  '<path d="M119 353L149 352L147 394L124 397Z" fill="#38618f" stroke="#293744" stroke-width="4"/>',
  '<path d="M125 364H146M134 362V386" stroke="#80a4c8" stroke-width="3"/>',
  '<path d="M40 460H70M116 458H149" stroke="#283642" stroke-width="6"/>',
  '<path d="M43 464L61 478M60 465L43 479M130 466L146 478M146 466L131 479" stroke="#b1c4ce" stroke-width="3"/>'
 ]));
 document.getElementById('mc-arm-left')?.insertAdjacentHTML('beforebegin',svg([
  '<path d="M137 183Q164 169 175 199L171 299 146 316 133 272Z" fill="#344d5e" stroke="#283744" stroke-width="8"/>',
  '<path d="M144 196Q159 193 161 231L157 277" fill="none" stroke="#738d95" stroke-width="6"/>'
 ]));
 document.getElementById('mc-outfit-details')?.insertAdjacentHTML('beforebegin',svg([
  '<path d="M47 188Q91 167 139 188L149 230 133 306Q87 328 29 310L30 241Z" fill="url(#mc-jacketshine)" opacity=".37" pointer-events="none"/>',
  '<path d="M57 193Q63 236 55 310M114 191Q124 250 121 314" fill="none" stroke="#f8cb83" stroke-width="4" opacity=".6"/>',
  '<path d="M47 249H66L63 276H42Z M116 248H139L144 273 120 277Z" fill="none" stroke="#ae603c" stroke-width="5"/>',
  '<path d="M83 217V305" stroke="#f7ce7c" stroke-width="3" stroke-dasharray="3 10"/>',
  '<g fill="#ffe2ae"><circle cx="83" cy="241" r="3"/><circle cx="84" cy="273" r="3"/><circle cx="85" cy="300" r="3"/></g>'
 ]));
 return true;
}
