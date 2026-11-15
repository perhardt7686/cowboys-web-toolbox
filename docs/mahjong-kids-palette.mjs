/* Mahjong visual palette, independent of server-side game rules. */
export const MAHJONG_VISUALS=Object.freeze([
 Object.freeze({code:"DR",label:"Dragon",face:"#ffe0e4",edge:"#ac2944",ink:"#79213a"}),
 Object.freeze({code:"BB",label:"Blue bloom",face:"#e2d7ff",edge:"#7654c9",ink:"#43277b"}),
 Object.freeze({code:"BA",label:"Bamboo",face:"#c9f4de",edge:"#198662",ink:"#12543b"}),
 Object.freeze({code:"EW",label:"East wind",face:"#cfecff",edge:"#2479bf",ink:"#164a7a"}),
 Object.freeze({code:"FO",label:"Fortune",face:"#e9fbb8",edge:"#7a992c",ink:"#405714"}),
 Object.freeze({code:"RC",label:"Red center",face:"#ffd7bb",edge:"#c16637",ink:"#843b1e"}),
 Object.freeze({code:"GD",label:"Guardian dragon",face:"#ffe5b5",edge:"#be7b27",ink:"#80420c"}),
 Object.freeze({code:"WF",label:"Wildflower",face:"#ffd7ef",edge:"#ca478c",ink:"#822551"}),
 Object.freeze({code:"BW",label:"Blue wave",face:"#b5f3ed",edge:"#128c8d",ink:"#095860"}),
 Object.freeze({code:"SW",label:"South wind",face:"#ebd8ff",edge:"#8650b1",ink:"#602b7b"}),
 Object.freeze({code:"YN",label:"Balance",face:"#cbd7df",edge:"#536f82",ink:"#253a4b"}),
 Object.freeze({code:"CF",label:"Cherry flower",face:"#ffcbd9",edge:"#cc4674",ink:"#8a224a"}),
 Object.freeze({code:"KF",label:"Koi fish",face:"#b6d4ff",edge:"#5476d6",ink:"#1c3d91"}),
 Object.freeze({code:"NW",label:"North wind",face:"#c4f7f0",edge:"#268b7e",ink:"#0c5953"}),
 Object.freeze({code:"FB",label:"Frost bloom",face:"#e8edf6",edge:"#6984a3",ink:"#374c6a"}),
 Object.freeze({code:"WW",label:"West wind",face:"#fff1a8",edge:"#bf9a30",ink:"#725015"}),
 Object.freeze({code:"CL",label:"Clover",face:"#e4f7a6",edge:"#819d36",ink:"#52641a"}),
 Object.freeze({code:"ST",label:"Starlight",face:"#ffdc95",edge:"#b98727",ink:"#825118"}),
]);
export function visualForTile(symbol){
 const id=Number(symbol);
 const type=Number.isFinite(id)&&id>=1?Math.floor(id-1)%MAHJONG_VISUALS.length:0;
 return {...MAHJONG_VISUALS[type],variant:id>18?'sun':'flower',marker:id>18?'☀':'✿'};
}
