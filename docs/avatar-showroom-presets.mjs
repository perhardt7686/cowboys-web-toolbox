export const SHOWROOM_LOOKS={
  detective:{shirt:'burntorange',style:'shag',skin:'sand',eyes:'hazel',face:'long',nose:'pointed',expression:'curious',pose:'tilt',glasses:'round',background:'night',
    full_body:{model:'detective',outerwear:'none',neckwear:'ascot',bottoms:'flares',footwear:'loafers',back:'satchel'}},
  mechanic:{shirt:'forest',style:'part',skin:'tan',eyes:'brown',face:'square',expression:'smirk',beard:'beard',hat:'western',background:'ocean',
    full_body:{model:'mechanic',outerwear:'trench',bottoms:'slacks',footwear:'highboots',waist:'utility'}},
  sleuth:{shirt:'gold',style:'afro',hair:'black',skin:'deep',eyes:'green',cheeks:'freckles',pose:'wave',background:'sunset',
    full_body:{model:'sleuth',outerwear:'denim',neckwear:'scarf',bottoms:'pleats',footwear:'maryjanes'}},
  specter:{shirt:'plum',style:'long',hair:'silver',skin:'bisque',eyes:'amber',pose:'tilt',background:'moss',
    full_body:{model:'specter',outerwear:'raincoat',neckwear:'pendant',bottoms:'slacks',footwear:'boots'}},
  armor:{shirt:'navy',eyes:'amber',background:'ochre',full_body:{model:'armor',outerwear:'cape',bottoms:'slacks',footwear:'boots',hands:'gauntlets'}},
  automaton:{shirt:'turquoise',eyes:'aqua',background:'lavender',full_body:{model:'automaton',bottoms:'slacks',footwear:'boots',waist:'utility'}},
  scout:{shirt:'rust',eyes:'green',background:'heather',full_body:{model:'scout',bottoms:'cuffs',footwear:'sneakers',back:'pack'}}
};

export const STUDIO_COLLECTIONS=[
  {id:'lantern-detective',label:'Lantern Detective',look:'detective',
    pieces:['museum-lantern','fog-hound'],action:'museum-lantern'},
  {id:'bell-tower',label:'Bell Tower',look:'armor',
    pieces:['phantom-cloak','bell-tower-gargoyle'],action:'phantom-cloak'},
  {id:'workshop',label:'Workshop',look:'automaton',
    pieces:['carnival-visor-plate','wind-up-gremlin'],action:'carnival-visor-plate'}
];
