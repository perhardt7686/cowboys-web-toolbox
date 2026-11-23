// Side elevations drawn on a 240 × 75 pixel grid. The nose faces right.
// The DOS screens inform the proportions, whitewalls, and palette. These contours are new artwork.
const WIDTH = 240;
const HEIGHT = 76;
const GROUND = 72;
const EMPTY = 255;

const PAINT = {
  1:[0,1,9,7], 2:[0,2,10,15], 3:[1,3,11,15], 4:[0,4,12,7], 5:[1,5,13,15],
  6:[4,6,14,15], 7:[0,8,7,15], 9:[1,9,11,15], 10:[2,10,14,15],
  12:[4,12,14,15], 13:[5,13,15,11], 14:[6,14,15,7], 15:[8,7,15,11]
};
export const vehiclePaint = color => PAINT[color] || PAINT[1];

// Each model has a body contour, window openings, and fittings in its own proportions.
// The waist controls the transition from the top of the body to the darker lower panels.
const PROFILES = {
  ford32:{
    // Upright five-window Deuce cabin, separate hood and tall radiator.
    // The original cartoonish swooping roof is deliberately retired.
    shell:[[12,50],[19,43],[31,39],[55,37],[62,32],[63,17],[69,9],[78,7],[119,7],[126,9],
      [134,13],[138,18],[139,34],[182,34],[198,37],[209,41],[216,48],[216,57],[208,63],[18,63],[12,59]],
    glass:[[[68,19],[73,13],[93,12],[93,32],[65,33]],
      [[100,12],[116,12],[129,17],[134,32],[100,32]]],
    waist:38,wheels:[47,189,14],doors:[[137,33,136,57,114]],lamps:[17,46,214,38,'separate'],
    fenders:'running',trim:'hood',wall:'thin'
  },
  sedan32:{
    // Four-window sedan: long straight turret, upright rear quarter and
    // two distinct door openings; deliberately not a stretched Deuce coupe.
    shell:[[9,45],[15,39],[23,34],[25,17],[32,9],[42,6],[115,6],[126,10],[138,20],[144,33],
      [194,33],[211,37],[218,45],[216,58],[207,63],[13,63],[7,57]],
    glass:[[[31,16],[42,11],[58,11],[59,32],[27,32]],
      [[65,11],[87,11],[88,32],[65,32]],
      [[94,11],[111,12],[123,17],[136,31],[94,32]]],
    waist:37,wheels:[45,192,14],doors:[[63,32,63,55,69],[138,33,136,55,108]],
    lamps:[10,43,215,37,'separate'],fenders:'running',trim:'hood',wall:'thin'
  },
  master38:{
    shell:[[8,51],[15,43],[24,37],[48,29],[63,16],[79,8],[104,7],[124,12],[137,23],[143,33],
      [186,32],[211,34],[225,42],[228,55],[224,63],[19,63],[8,59]],
    glass:[[[63,22],[76,14],[89,13],[88,31],[51,34]],[[94,13],[108,12],[122,17],[136,31],[94,31]]],
    waist:37,wheels:[44,192,15],doors:[[135,34,134,57,100]],lamps:[10,48,222,43,'separate'],
    fenders:'running',trim:'hood',wall:'wide'
  },
  chevy40:{
    // Business coupe: bulbous rear deck, taller turret and separate pontoon
    // front wings, instead of a low, modern-looking hatchback outline.
    shell:[[7,51],[13,49],[23,48],[34,47],[42,44],[49,32],[60,18],[73,11],[95,9],[109,11],
      [119,16],[129,28],[143,35],[176,35],[194,32],[210,34],[225,41],[231,49],[231,59],[224,64],[18,64],[7,58]],
    glass:[[[55,30],[67,20],[80,15],[93,14],[96,33],[54,35]],
      [[101,16],[112,17],[122,23],[136,34],[101,34]]],
    waist:36,wheels:[48,194,15],doors:[[143,34,143,57,105]],lamps:[10,48,226,40,'shell'],
    fenders:'step',trim:'hood',wall:'wide'
  },
  roadster40:{
    shell:[[8,49],[16,41],[36,36],[68,35],[77,38],[119,38],[122,23],[131,22],[145,33],
      [192,32],[218,34],[230,40],[235,49],[234,59],[227,63],[18,63],[8,58]],
    glass:[[[125,25],[131,25],[141,33],[123,34]]],
    waist:37,wheels:[49,196,15],doors:[[145,37,143,57,108]],lamps:[11,47,229,41,'shell'],
    fenders:'step',trim:'hood',wall:'wide',seat:[88,34]
  },
  ford40:{
    shell:[[9,48],[18,41],[37,34],[56,23],[68,13],[83,8],[109,7],[123,10],[136,17],[150,32],
      [184,34],[208,35],[225,41],[232,49],[232,58],[225,63],[20,63],[10,59]],
    glass:[[[56,27],[68,19],[82,14],[94,13],[97,31],[52,34]],[[101,13],[117,14],[129,19],[142,32],[102,31]]],
    waist:38,wheels:[46,193,15],doors:[[149,35,148,56,106]],lamps:[11,46,227,43,'shell'],
    fenders:'step',trim:'fordHood',wall:'thin'
  },
  style49:{
    shell:[[7,47],[13,40],[32,35],[58,33],[72,21],[87,13],[106,10],[125,10],[145,17],[162,32],
      [196,33],[221,36],[232,42],[236,52],[233,61],[225,65],[16,65],[8,59]],
    glass:[[[70,29],[86,18],[100,15],[111,15],[113,32],[64,33]],[[118,15],[132,17],[145,23],[153,32],[118,32]]],
    waist:37,wheels:[48,194,15],doors:[[163,34,161,60,123]],lamps:[10,45,230,42,'round'],
    fenders:'blend',trim:'straight',wall:'wide'
  },
  olds49:{
    shell:[[7,47],[16,40],[38,35],[53,34],[77,19],[95,12],[118,10],[138,14],[151,24],[161,33],
      [209,34],[228,37],[237,45],[237,57],[229,64],[15,64],[7,58]],
    glass:[[[64,30],[83,20],[99,15],[112,15],[114,32],[57,34]],[[119,15],[134,18],[148,26],[153,33],[119,33]]],
    waist:37,wheels:[47,193,15],doors:[[162,36,161,59,117]],lamps:[10,45,232,41,'round'],
    fenders:'blend',trim:'rocket',wall:'wide'
  },
  silver50:{
    shell:[[7,49],[10,41],[49,35],[65,25],[83,15],[110,10],[138,12],[155,22],[167,33],[215,34],
      [229,39],[236,49],[234,59],[227,64],[17,64],[8,59]],
    glass:[[[61,29],[81,19],[99,15],[111,15],[112,33],[54,34]],[[118,15],[134,17],[149,23],[158,33],[118,33]]],
    waist:36,wheels:[49,195,15],doors:[[165,35,164,59,117]],lamps:[11,42,230,42,'round'],
    fenders:'blend',trim:'streak',wall:'wide'
  },
  olds52:{
    // Rocket 88 hardtop: longer, straighter jet-age bonnet than the '49.
    shell:[[6,41],[15,38],[52,36],[67,26],[85,18],[124,16],[146,20],[162,33],[215,34],[230,38],
      [236,45],[236,57],[232,62],[223,65],[12,64],[6,58]],
    glass:[[[60,34],[71,26],[86,20],[107,19],[109,34]],[[113,19],[128,19],[143,24],[153,34],[113,34]]],
    waist:38,wheels:[49,193,15],doors:[[158,35,157,59,112]],lamps:[9,43,231,43,'round'],
    fenders:'blend',trim:'rocket',wall:'wide'
  },
  mercury54:{
    shell:[[5,43],[11,37],[53,34],[66,25],[86,15],[104,13],[137,14],[155,20],[171,34],[215,34],
      [233,38],[237,44],[236,58],[224,63],[14,64],[6,58]],
    glass:[[[63,33],[73,26],[89,19],[106,18],[107,33]],[[113,18],[134,18],[152,25],[162,34],[113,33]]],
    waist:38,wheels:[47,195,14],doors:[[167,35,165,61,113]],lamps:[8,40,232,40,'round'],
    fenders:'flush',trim:'dip',wall:'wide'
  },
  belair55:{
    shell:[[5,35],[16,39],[50,38],[62,31],[79,20],[95,15],[128,15],[140,17],[156,27],[166,36],
      [218,35],[231,37],[236,42],[236,55],[229,62],[12,64],[5,57]],
    glass:[[[68,33],[84,24],[97,20],[107,20],[107,36],[63,37]],[[111,20],[129,20],[141,23],[154,34],[156,36],[111,36]]],
    waist:40,wheels:[46,193,14],doors:[[161,36,160,58,112]],lamps:[7,39,231,40,'brow'],
    fenders:'flush',trim:'belAir',wall:'wide'
  },
  fairlane55:{
    // Victoria's full-length bright roof, sloped wraparound screen and
    // stepped rear wing distinguish it from Chevrolet's Bel Air.
    shell:[[6,35],[15,37],[54,38],[69,33],[81,21],[97,16],[129,16],[146,21],[163,33],[169,38],
      [218,36],[232,38],[238,45],[236,56],[229,63],[12,64],[5,58]],
    glass:[[[68,34],[84,25],[98,21],[110,21],[110,36]],[[115,21],[129,21],[143,26],[160,36],[115,36]]],
    waist:40,wheels:[48,195,14],doors:[[166,37,164,59,117]],lamps:[9,40,234,42,'round'],
    fenders:'flush',trim:'fairlane',wall:'wide'
  },
  lancer55:{
    // Dodge Royal Lancer's more angular rear kick and tall forward-leaning fin.
    shell:[[5,31],[13,35],[22,39],[55,38],[65,34],[80,23],[94,16],[128,16],[144,19],[159,28],[169,37],
      [222,35],[232,37],[237,44],[237,57],[230,63],[10,64],[4,57]],
    glass:[[[66,35],[84,25],[99,21],[110,21],[110,36]],[[115,21],[135,22],[151,28],[160,36],[115,36]]],
    waist:40,wheels:[48,195,14],doors:[[169,37,165,60,118]],lamps:[8,39,232,40,'brow'],
    fenders:'flush',trim:'lancer',wall:'wide'
  },
  vette56:{
    // A 1956 Corvette is a low two-seat roadster with a rear deck hump and
    // long, scalloped nose, not a shortened sedan with a missing roof.
    shell:[[5,50],[9,43],[22,38],[47,34],[67,34],[89,37],[115,38],[119,24],
      [125,22],[141,36],[169,36],[193,33],[214,33],[229,38],[235,45],[235,56],[228,63],[13,63],[4,57]],
    glass:[[[119,26],[126,26],[138,35],[116,37]]],
    waist:39,wheels:[44,190,14],doors:[[139,36,139,59,112]],lamps:[7,46,229,39,'sport'],
    fenders:'sport',trim:'cove',wall:'wide',seat:[96,34]
  },
  mercury56:{
    // Distinct '56 Custom rear-quarter flare and longer flatter bonnet.
    shell:[[5,33],[15,38],[55,39],[70,28],[83,20],[101,15],[136,16],[151,22],[168,36],
      [212,35],[229,36],[238,42],[237,58],[230,64],[11,64],[4,56]],
    glass:[[[65,35],[81,25],[101,20],[113,20],[113,35]],[[118,20],[135,21],[149,26],[159,35],[118,36]]],
    waist:40,wheels:[44,196,14],doors:[[165,37,164,59,118]],lamps:[7,40,233,41,'brow'],
    fenders:'flush',trim:'dip',wall:'wide'
  },
  fairlane57:{
    shell:[[3,30],[14,33],[34,38],[55,38],[78,22],[97,16],[124,16],[143,19],[157,27],[166,36],
      [215,34],[233,36],[239,43],[237,57],[229,62],[12,65],[4,56]],
    glass:[[[64,36],[81,25],[98,20],[110,20],[110,36]],[[114,20],[130,21],[144,25],[159,36],[114,36]]],
    waist:40,wheels:[48,194,14],doors:[[163,37,162,59,116]],lamps:[7,34,234,39,'brow'],
    fenders:'flush',trim:'fairlaneFin',wall:'wide'
  },
  tbird57:{
    shell:[[6,33],[15,35],[40,39],[96,38],[117,37],[120,24],[129,23],[147,36],[198,35],
      [221,33],[234,37],[238,43],[237,58],[222,63],[15,65],[6,57]],
    glass:[[[123,27],[129,27],[141,36],[119,36]]],
    waist:40,wheels:[45,191,14],doors:[[147,37,145,60,118]],lamps:[7,37,233,39,'brow'],
    fenders:'flush',trim:'bird',wall:'wide',seat:[98,34]
  },
  impala58:{
    // Lower 1958 hardtop, uninterrupted long deck and a rising rear shoulder.
    shell:[[4,32],[17,35],[41,40],[60,37],[78,25],[95,18],[133,17],[152,23],[171,36],
      [221,35],[233,36],[239,42],[238,57],[226,64],[12,64],[4,54]],
    glass:[[[67,36],[81,28],[96,23],[111,22],[111,36]],[[116,22],[133,22],[148,27],[162,36],[116,37]]],
    waist:41,wheels:[47,194,14],doors:[[168,37,166,60,122]],lamps:[7,41,233,39,'quad'],
    fenders:'flush',trim:'impala',wall:'wide'
  },
  valiant61:{
    shell:[[7,40],[18,39],[44,40],[58,36],[78,23],[92,17],[119,16],[138,20],[160,36],
      [183,37],[215,34],[228,37],[234,44],[233,58],[224,62],[13,62],[6,55]],
    glass:[[[65,36],[83,25],[96,21],[100,21],[101,36]],[[105,21],[120,21],[133,24],[151,36],[105,36]]],
    waist:41,wheels:[48,187,13],doors:[[103,35,101,59,97],[157,37,152,59,112]],lamps:[9,42,230,38,'round'],
    fenders:'flush',trim:'valiant',wall:'thin'
  },
  vette61:{
    shell:[[4,40],[43,37],[70,36],[98,39],[116,38],[119,24],[126,22],[143,35],
      [167,36],[196,33],[220,34],[230,38],[237,45],[236,55],[227,61],[10,63],[4,56]],
    glass:[[[121,26],[126,26],[138,35],[118,36]]],
    waist:40,wheels:[44,191,14],doors:[[140,36,139,59,112]],lamps:[6,44,232,40,'quad'],
    fenders:'sport',trim:'coveShort',wall:'thin',seat:[98,35]
  },
  polara62:{
    shell:[[5,40],[12,38],[51,39],[67,27],[82,19],[99,15],[125,15],[143,20],[160,34],
      [210,35],[230,37],[237,41],[235,56],[227,62],[12,63],[5,58]],
    glass:[[[62,36],[80,25],[98,20],[105,20],[105,35]],[[110,20],[127,20],[139,24],[151,35],[110,35]]],
    waist:40,wheels:[48,193,14],doors:[[156,36,156,59,112]],lamps:[7,41,231,40,'quad'],
    fenders:'flush',trim:'polara',wall:'thin'
  },
  valiant63:{
    shell:[[8,40],[16,38],[55,38],[65,31],[79,22],[92,17],[120,17],[139,23],[154,36],
      [207,35],[224,37],[231,43],[230,56],[222,62],[16,62],[8,57]],
    glass:[[[62,36],[78,27],[95,22],[104,22],[106,35]],[[110,22],[122,22],[136,27],[148,36],[110,35]]],
    waist:40,wheels:[49,185,13],doors:[[156,36,153,60,112]],lamps:[10,41,227,39,'round'],
    fenders:'flush',trim:'crease',wall:'thin'
  },
  vette63:{
    shell:[[5,42],[11,37],[41,36],[58,29],[76,21],[98,17],[118,17],[133,23],[146,35],
      [169,36],[194,33],[220,34],[231,37],[238,41],[231,55],[220,62],[11,62],[5,56]],
    glass:[[[53,34],[75,26],[94,22],[97,22],[94,35]],[[103,22],[117,22],[128,26],[138,35],[101,35]]],
    waist:40,wheels:[47,191,14],doors:[[142,36,143,58,104]],lamps:[6,43,233,40,'hidden'],
    fenders:'sport',trim:'stingRay',wall:'thin'
  },
  savoy64:{
    shell:[[5,41],[13,37],[55,37],[69,27],[83,21],[97,18],[127,18],[145,22],[166,36],
      [213,34],[230,35],[237,40],[237,55],[228,61],[11,63],[5,56]],
    glass:[[[63,36],[83,26],[98,23],[109,23],[110,36]],[[114,23],[131,23],[147,29],[158,36],[114,36]]],
    waist:40,wheels:[46,195,14],doors:[[164,36,162,59,115]],lamps:[8,41,233,39,'quad'],
    fenders:'flush',trim:'crease',wall:'thin'
  },

  // All added vehicles use the same real-scale side-elevation geometry and
  // EGA rendering pipeline as the original twenty-five. No stretched sprites.
  woodie34:{
    shell:[[8,46],[10,24],[16,13],[29,8],[117,8],[133,12],[144,27],[148,35],[184,35],
      [202,38],[216,43],[224,50],[222,59],[214,64],[13,64],[7,57]],
    glass:[[[23,16],[32,12],[51,12],[51,33],[19,34]],
      [[57,12],[75,12],[75,33],[57,33]],
      [[82,12],[111,12],[124,17],[137,33],[82,33]]],
    waist:38,wheels:[44,190,14],doors:[[81,34,80,59,72],[144,35,142,59,113]],
    lamps:[10,48,218,45,'separate'],fenders:'running',trim:'hood',wall:'thin'
  },
  town48:{
    shell:[[5,47],[13,42],[34,38],[65,36],[105,39],[135,37],[144,24],[149,22],
      [161,36],[192,36],[218,37],[230,43],[237,51],[236,60],[228,64],[13,64],[5,57]],
    glass:[[[143,26],[149,25],[159,35],[142,36]]],
    waist:39,wheels:[47,192,14],doors:[[160,38,158,59,121]],
    lamps:[8,44,233,44,'round'],fenders:'blend',trim:'straight',wall:'wide',seat:[98,35]
  },
  chevy3100:{
    shell:[[6,37],[14,36],[90,36],[97,35],[105,18],[115,12],[148,12],[159,18],[167,35],
      [200,35],[224,40],[234,47],[234,59],[225,63],[14,63],[7,58]],
    glass:[[[111,23],[119,17],[133,17],[133,34],[104,34]],
      [[138,17],[146,17],[153,22],[160,34],[138,34]]],
    waist:40,wheels:[49,194,14],doors:[[165,36,160,59,127]],
    lamps:[8,43,230,42,'round'],fenders:'step',trim:'pickup',wall:'thin'
  },
  nomad55:{
    shell:[[6,42],[15,35],[22,19],[33,14],[131,14],[144,20],[155,36],[202,35],
      [222,38],[236,45],[236,58],[229,63],[12,64],[5,57]],
    glass:[[[26,23],[33,19],[54,19],[54,36],[22,36]],
      [[60,19],[79,19],[79,36],[60,36]],
      [[85,19],[125,19],[137,24],[148,36],[85,36]]],
    waist:40,wheels:[48,193,14],doors:[[80,36,78,59,67],[152,37,150,59,118]],
    lamps:[8,42,233,41,'brow'],fenders:'flush',trim:'wagon',wall:'wide'
  },
  f10057:{
    shell:[[7,35],[15,34],[93,34],[104,33],[107,21],[118,13],[150,13],[165,24],[172,36],
      [207,35],[227,39],[235,46],[233,59],[224,63],[13,63],[7,58]],
    glass:[[[113,23],[120,18],[136,18],[136,34],[110,34]],
      [[141,18],[149,18],[159,25],[165,34],[141,34]]],
    waist:40,wheels:[49,193,14],doors:[[169,36,164,60,132]],
    lamps:[9,44,231,42,'round'],fenders:'step',trim:'pickup',wall:'thin'
  },
  camino59:{
    shell:[[4,36],[14,36],[66,36],[74,31],[87,20],[99,16],[132,16],[147,21],[162,36],
      [214,35],[232,38],[238,45],[237,57],[228,64],[13,64],[4,58]],
    glass:[[[76,33],[89,24],[102,21],[111,21],[111,35],[73,35]],
      [[116,21],[131,21],[145,27],[155,35],[116,35]]],
    waist:40,wheels:[48,196,14],doors:[[158,36,159,59,122]],
    lamps:[7,42,233,42,'quad'],fenders:'flush',trim:'utility',wall:'wide'
  },
  eldorado59:{
    shell:[[3,23],[10,25],[22,34],[51,37],[83,37],[112,38],[125,38],[132,24],
      [142,23],[153,37],[195,35],[225,36],[238,41],[237,57],[229,64],[11,64],[3,56]],
    glass:[[[132,27],[138,26],[150,35],[130,36]]],
    waist:40,wheels:[49,197,14],doors:[[159,37,158,60,120]],
    lamps:[7,37,232,41,'quad'],fenders:'flush',trim:'eldorado',wall:'wide',seat:[99,34]
  },
  squire60:{
    shell:[[5,39],[9,24],[19,17],[32,14],[133,14],[148,20],[161,35],[217,35],
      [233,39],[237,46],[236,58],[229,63],[11,63],[5,57]],
    glass:[[[23,21],[33,18],[57,18],[57,35],[19,35]],
      [[63,18],[88,18],[88,35],[63,35]],
      [[94,18],[130,18],[145,23],[154,35],[94,35]]],
    waist:40,wheels:[47,193,14],doors:[[90,37,88,59,74],[159,36,157,59,123]],
    lamps:[7,42,232,41,'quad'],fenders:'flush',trim:'wagon',wall:'wide'
  },
  econoline61:{
    shell:[[6,16],[12,11],[178,11],[195,14],[213,25],[224,39],[234,47],[234,58],
      [226,64],[11,64],[5,58]],
    glass:[[[176,17],[190,18],[208,29],[218,38],[179,38]]],
    waist:39,wheels:[48,196,13],doors:[[179,39,178,60,180]],
    lamps:[8,43,230,43,'round'],fenders:'flush',trim:'cargo',wall:'thin'
  },
  clubwagon62:{
    shell:[[6,17],[12,12],[176,12],[194,15],[212,26],[223,39],[234,47],[234,58],
      [226,64],[11,64],[5,58]],
    glass:[[[19,19],[51,19],[51,36],[19,36]],
      [[58,19],[87,19],[87,36],[58,36]],
      [[94,19],[124,19],[124,36],[94,36]],
      [[131,19],[168,19],[170,36],[131,36]],
      [[177,18],[190,19],[207,29],[217,38],[179,38]]],
    waist:39,wheels:[49,196,13],doors:[[177,39,175,60,182]],
    lamps:[8,43,229,43,'round'],fenders:'flush',trim:'clubwagon',wall:'thin'
  },
  econoPickup61:{
    shell:[[7,38],[13,35],[148,35],[154,20],[166,13],[195,13],[213,22],[224,39],[235,46],
      [234,57],[226,64],[12,64],[5,58]],
    glass:[[[163,24],[169,18],[190,18],[190,37],[158,37]],
      [[195,18],[206,24],[218,37],[195,37]]],
    waist:40,wheels:[49,195,13],doors:[[225,39,221,60,181]],
    lamps:[7,44,229,43,'round'],fenders:'flush',trim:'pickup',wall:'thin'
  },
  c10stepside63:{
    shell:[[6,35],[14,35],[94,35],[104,34],[112,22],[123,15],[154,15],[165,23],[174,36],
      [205,35],[224,38],[236,44],[235,58],[225,63],[12,63],[6,57]],
    glass:[[[112,26],[124,20],[140,20],[140,34],[108,34]],
      [[145,20],[155,20],[165,27],[168,34],[145,34]]],
    waist:40,wheels:[51,194,14],doors:[[174,37,171,60,136]],
    lamps:[8,43,231,42,'quad'],fenders:'step',trim:'pickup',wall:'thin'
  },
  d10063:{
    shell:[[6,37],[12,35],[94,35],[103,33],[112,20],[124,15],[155,15],[167,22],[175,36],
      [215,34],[230,37],[237,44],[236,58],[226,63],[11,63],[5,58]],
    glass:[[[113,25],[125,20],[141,20],[141,34],[108,34]],
      [[146,20],[155,20],[165,26],[169,34],[146,34]]],
    waist:40,wheels:[49,197,14],doors:[[174,37,170,59,135]],
    lamps:[7,42,232,41,'quad'],fenders:'flush',trim:'pickup',wall:'thin'
  },
  riviera63:{
    shell:[[5,39],[15,37],[56,37],[75,33],[91,22],[108,17],[139,17],[153,21],[164,34],
      [215,33],[233,37],[239,44],[237,57],[228,63],[12,63],[5,56]],
    glass:[[[80,31],[96,23],[107,21],[116,21],[116,34],[77,34]],
      [[122,21],[137,21],[147,24],[158,34],[122,34]]],
    waist:39,wheels:[48,194,14],doors:[[166,36,164,59,129]],
    lamps:[7,43,232,40,'hidden'],fenders:'flush',trim:'riviera',wall:'thin'
  },
  galaxie63:{
    shell:[[4,38],[12,36],[52,36],[74,32],[94,19],[110,15],[128,16],[148,22],[166,35],
      [211,33],[233,37],[238,44],[237,57],[228,63],[11,63],[4,57]],
    glass:[[[79,31],[97,21],[109,19],[117,20],[117,34],[77,34]],
      [[123,20],[133,21],[148,27],[159,34],[123,34]]],
    waist:40,wheels:[48,195,14],doors:[[166,35,163,59,127]],
    lamps:[6,42,233,40,'quad'],fenders:'flush',trim:'galaxie',wall:'thin'
  },
  mystery66:{
    shell:[[6,12],[10,7],[19,5],[166,5],[178,9],[197,18],[214,37],[225,40],[232,46],
      [233,57],[226,64],[11,64],[5,56]],
    glass:[[[171,13],[181,16],[195,24],[207,36],[177,36]],[[142,12],[164,12],[168,33],[142,33]]],
    waist:36,wheels:[46,186,14],doors:[[172,36,169,60,180]],lamps:[7,44,226,45,'round'],
    fenders:'flush',trim:'van',wall:'thin'
  }
};

const along = (points, draw) => {
  for (let i = 1; i < points.length; i++) draw(...points[i-1], ...points[i]);
};

class Sprite {
  constructor() { this.pixels = new Uint8Array(WIDTH * HEIGHT).fill(EMPTY); }

  pixel(x, y, color) {
    if (x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT) this.pixels[y * WIDTH + x] = color;
  }

  box(x, y, w, h, color) {
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) this.pixel(xx, yy, color);
    }
  }

  line(x, y, toX, toY, color) {
    const steps = Math.max(Math.abs(toX - x), Math.abs(toY - y), 1);
    for (let i = 0; i <= steps; i++) {
      this.pixel(Math.round(x + (toX - x) * i / steps), Math.round(y + (toY - y) * i / steps), color);
    }
  }

  trace(points, color) { along(points, (...line) => this.line(...line,color)); }

  polygon(points, color) {
    const first = Math.min(...points.map(([,y]) => y));
    const last = Math.max(...points.map(([,y]) => y));
    for (let y = first; y < last; y++) {
      const cuts = [];
      for (let i = 0; i < points.length; i++) {
        const [xa,ya] = points[i], [xb,yb] = points[(i+1) % points.length];
        const scan = y + 0.5;
        if ((ya <= scan && scan < yb) || (yb <= scan && scan < ya)) cuts.push(xa + (scan-ya)*(xb-xa)/(yb-ya));
      }
      cuts.sort((a,b) => a-b);
      for (let i = 0; i < cuts.length; i += 2) {
        const start = Math.ceil(cuts[i]);
        const end = Math.ceil(cuts[i+1]);
        if (typeof color === 'function') {
          for (let x = start; x < end; x++) this.pixel(x,y,color(x,y));
        } else {
          this.box(start,y,end-start,1,color);
        }
      }
    }
  }

  ellipse(x, y, rx, ry, color) {
    for (let dy = -ry; dy <= ry; dy++) {
      const half = Math.floor(rx * Math.sqrt(Math.max(0,1 - (dy/ry)**2)));
      this.box(x-half,y+dy,half*2+1,1,color);
    }
  }

  blit(screen, x, y, scale) {
    const left = Math.round(x), top = Math.round(y);
    const width = Math.round(WIDTH * scale), height = Math.round(HEIGHT * scale);
    for (let yy = 0; yy < height; yy++) {
      const offset = Math.floor((yy + 0.5) / scale) * WIDTH;
      let start = 0, color = EMPTY;
      for (let xx = 0; xx <= width; xx++) {
        const next = xx === width ? EMPTY : this.pixels[offset + Math.floor((xx + 0.5) / scale)];
        if (next === color) continue;
        if (color !== EMPTY && color !== undefined) screen.box(left+start,top+yy,xx-start,1,color);
        start = xx;
        color = next;
      }
    }
  }
}

function bodyPaint(y, waist, palette) {
  const [dark,middle,light] = palette;
  return (x,row) => {
    const band = row - y - waist;
    const dither = (x + row) & 1;
    if (band <= -17) return band >= -19 && dither ? light : middle;
    if (band <= -5) return middle;
    if (band <= -2) return dither ? light : middle;
    if (band <= 3) return light;
    if (band <= 7) return band <= 5 || dither ? middle : light;
    if (band <= 14) return middle;
    if (band <= 20) return dither ? dark : middle;
    return dark;
  };
}

function drawGlass(sprite, points, index) {
  sprite.polygon(points,(x,y) => {
    const reflection = (x+y*2+13*index)%43;
    if (reflection < 4) return 3;
    if (reflection < 7) return 1;
    return (x+y)%2 && reflection > 36 ? 8 : 0;
  });
  sprite.trace([...points,points[0]],8);
  sprite.trace(points.slice(0,-1),7);
  const [, [x,y]] = points;
  sprite.box(x+2,y+1,4,1,15);
}

function fenderArch(cx, cy, rx, ry) {
  return [[cx-rx,cy+4],[cx-rx,cy-3],[cx-rx+2,cy-9],[cx-rx+6,cy-ry+3],[cx-5,cy-ry],
    [cx+5,cy-ry],[cx+rx-6,cy-ry+3],[cx+rx-2,cy-9],[cx+rx,cy-3],[cx+rx,cy+4]];
}

function drawFender(sprite, x, r, fenders, paint) {
  const [,mid,light,shine] = paint;
  const radius = fenders==='running' ? r+20 : r+16;
  const archX = fenders==='flush' ? r+4 : r+6;
  const height = fenders==='flush' ? r+2 : r+7;
  const center = GROUND-r;
  if (fenders === 'step' || fenders === 'running') {
    const outer = [[x-radius,59],[x-radius+3,51],[x-radius+9,45],[x-13,40],[x-5,39],[x+6,39],
      [x+15,42],[x+24,48],[x+radius-3,54],[x+radius,60],[x+radius-4,64],[x-radius+4,64]];
    sprite.polygon(outer,(xx,y) => {
      if (y <= 42) return (xx+y)%2 ? light : mid;
      if (y <= 51) return y<=48 || (xx+y)%2 ? light : mid;
      return paint[1];
    });
    sprite.trace(outer.slice(0,10),paint[0]);
    sprite.trace([[x-radius+5,54],[x-21,47],[x-12,43],[x-4,42],[x+5,42],[x+14,45],[x+22,50]],light);
    sprite.trace([[x-18,47],[x-14,45],[x-9,44],[x+1,44]],shine);
  }
  if (fenders === 'sport' || fenders === 'blend') {
    sprite.trace([[x-r-9,54],[x-r-5,48],[x-9,43],[x,42],[x+8,43],[x+r+6,48],[x+r+10,54]],light);
  }
  sprite.trace(fenderArch(x,center,archX,height),fenders==='flush'?7:light);
}

const TRIM = {
  straight:{strip:[[10,49],[223,49]]},
  rocket:{strip:[[10,49],[53,48],[166,50],[220,45]],insert:[[16,48],[36,47],[65,47],[153,50],[65,52],[30,53],[16,52]]},
  streak:{strip:[[10,46],[43,46],[162,47],[222,45]]},
  dip:{strip:[[11,46],[60,46],[106,51],[163,51],[216,43],[232,43]]},
  belAir:{strip:[[8,41],[32,43],[87,44],[117,47],[148,48],[230,44]],
    insert:[[10,44],[87,45],[118,49],[137,50],[111,56],[86,54],[19,53],[10,52]]},
  fairlane:{strip:[[9,43],[91,43],[111,47],[128,50],[146,50],[231,42]],
    insert:[[9,45],[93,45],[113,50],[125,53],[107,56],[26,52],[9,54]]},
  lancer:{strip:[[6,41],[67,41],[110,46],[152,46],[181,41],[230,41]],
    insert:[[7,44],[65,44],[107,48],[151,48],[183,43],[229,43],[227,48],[181,48],[153,55],[58,54],[7,56]]},
  fairlaneFin:{strip:[[5,36],[38,43],[97,42],[120,47],[231,41]],
    insert:[[7,38],[38,45],[96,44],[119,49],[105,55],[18,50],[8,51]]},
  bird:{strip:[[8,43],[63,47],[150,48],[225,43]]},
  impala:{strip:[[9,47],[62,47],[96,49],[149,47],[181,43],[230,42]]},
  valiant:{strip:[[10,43],[57,44],[156,49],[226,43]]},
  polara:{strip:[[8,42],[64,45],[116,51],[181,47],[230,44]]},
  crease:{strip:[[9,43],[58,42],[148,44],[214,42],[231,41]]},
  cove:{coveshape:[[102,47],[120,44],[151,43],[174,44],[193,47],[197,50],[192,52],
    [181,53],[167,58],[140,59],[115,57],[103,54],[99,51]]},
  coveShort:{coveshape:[[105,47],[125,45],[156,44],[186,45],[191,49],[179,51],[168,55],
    [146,58],[118,58],[107,54],[103,51]]},
  stingRay:{strip:[[10,44],[48,41],[96,46],[143,46],[179,43],[227,42]]}
};

function drawTrim(sprite, profile, paint) {
  const {trim, waist, wheels:[rear,front]} = profile;
  const [dark,middle,light,shine] = paint;
  if (trim==='hood' || trim==='fordHood') {
    const hoodStart = Math.round(front - 34);
    const hoodEnd = Math.min(WIDTH-20,front+18);
    sprite.trace([[hoodStart-7,waist-3],[hoodStart+6,waist-3],[hoodEnd,waist-2]],light);
    sprite.line(hoodStart,waist+1,hoodEnd,waist+1,7);
    sprite.line(hoodStart,waist+2,hoodEnd,waist+2,dark);
    for (let x=hoodStart+3; x<hoodEnd; x+=4) {
      if (trim==='fordHood') sprite.line(x,waist+4,x,waist+7,dark);
      else sprite.line(x,waist+2,x+1,waist+3,0);
    }
    sprite.box(rear+37,61,front-rear-72,2,0);
    sprite.box(rear+41,61,front-rear-80,1,7);
    return;
  }
  const detail = TRIM[trim];
  if (!detail) return;
  if (detail.insert) {
    sprite.polygon(detail.insert,(x,y) => {
      if ((x + y)%2 && y>=50) return 7;
      return 15;
    });
  }
  if (detail.coveshape) {
    sprite.polygon(detail.coveshape,(x,y) => y < 51 || (x ^ y) & 1 ? 15 : 7);
    sprite.trace([...detail.coveshape,detail.coveshape[0]],7);
    sprite.trace(detail.coveshape.slice(1,6),15);
    sprite.trace(detail.coveshape.slice(6),dark);
    const start = trim==='cove' ? 145 : 154;
    for (let i=0;i<3;i++) sprite.line(start+i*4,47,start-1+i*4,54,i%2?dark:8);
  }
  if (detail.strip) {
    sprite.trace(detail.strip.map(([x,y]) => [x,y+1]),8);
    sprite.trace(detail.strip,trim==='valiant'||trim==='crease'||trim==='stingRay'?light:15);
  }
  if (trim==='impala') {
    for (let i=0;i<3;i++) sprite.line(70+i*3,52,69+i*3,58,15);
    sprite.trace([[31,54],[57,54],[63,52]],7);
  }
  if (trim==='streak') {
    sprite.trace([[162,37],[198,35],[225,38]],7);
    sprite.line(174,41,219,41,shine);
  }
  if (trim==='stingRay') {
    for (let i=0;i<3;i++) sprite.line(157+i*4,46,155+i*4,53,dark);
    sprite.line(94,59,151,59,8);
    sprite.line(104,58,150,58,7);
  }
  if (trim==='bird') {
    sprite.trace([[65,48],[72,50],[78,50],[76,53],[65,54]],15);
    sprite.pixel(70,52,middle);
  }
}

function drawDoors(sprite, profile, paint) {
  const [dark,,light] = paint;
  const [back,front] = profile.wheels;
  for (const [x,y,foot,floor,handle] of profile.doors) {
    sprite.trace([[x,y],[x-1,y+8],[foot,floor-2],[foot-3,floor]],dark);
    if (foot > back+25 && foot < front-25) sprite.line(foot-3,floor,Math.max(back+20,handle-15),floor,dark);
    sprite.line(x+1,y+4,x+1,y+8,light);
    sprite.box(handle,y+5,8,1,0);
    sprite.box(handle+1,y+4,6,1,15);
  }
  if (profile.trim==='van') {
    sprite.box(62,18,55,1,dark);
    sprite.line(61,19,61,34,dark);
    sprite.line(118,19,118,30,dark);
    sprite.line(70,49,70,59,dark);
  }
}

function drawVan(sprite) {
  const side = [[9,36],[37,29],[63,29],[83,38],[109,44],[136,43],[157,34],[169,33],
    [182,41],[209,49],[228,47],[227,55],[209,56],[182,49],[155,46],[135,52],[105,54],
    [80,50],[55,41],[29,40],[9,46]];
  sprite.polygon(side,(x,y) => y<44 || (x+y)%2 ? 10 : 2);
  sprite.trace(side.slice(0,11),11);
  for (const [x,y] of [[35,23],[144,28],[125,48]]) {
    sprite.ellipse(x-4,y,4,2,6);
    sprite.ellipse(x+4,y,4,2,6);
    sprite.ellipse(x,y-3,2,4,6);
    sprite.ellipse(x,y+3,2,4,6);
    sprite.box(x-1,y-1,3,3,14);
    sprite.pixel(x,y,12);
  }
}


// Reconstructed period hardware and surface geometry. These are new pixel
// instructions based on recognizable body architecture, not copied DOS assets.
// Shared base contours stay intact for color, chop and race rendering.
function drawClassicIdentity(sprite, profile, id, paint) {
  const [shade, body, highlight, chrome] = paint;
  const [rear,front] = profile.wheels;
  const hoodY = profile.waist;
  const draw = (points, ink) => sprite.trace(points,ink);

  if(id==='ford32'||id==='sedan32') {
    // A genuine prewar Ford requires a vertical radiator, a narrow separate
    // engine bonnet, a square cowl, running boards and exposed wheel wings.
    const cowl=id==='ford32'?143:143;
    sprite.line(cowl,34,cowl,59,0);
    sprite.line(cowl+2,35,cowl+2,52,chrome);
    sprite.line(cowl+4,36,209,36,highlight);
    sprite.line(cowl+6,38,205,38,chrome);
    sprite.polygon([[210,36],[218,37],[223,41],[223,55],[219,59],[211,57]],8);
    sprite.line(211,38,220,39,chrome);
    sprite.line(211,39,211,55,15);
    sprite.line(220,40,220,55,0);
    for(let y=41;y<=55;y+=3)sprite.line(214,y,218,y, y%2 ? 15 : 7);
    for(let x=157;x<194;x+=5) {
      sprite.line(x,41,x+1,49,shade);
      sprite.pixel(x+2,43,highlight);
    }
    draw([[rear+17,61],[rear+36,62],[front-36,62],[front-16,60]],8);
    sprite.box(rear+34,62,front-rear-69,2,0);
    sprite.line(rear+37,63,front-36,63,chrome);
    draw([[rear-27,51],[rear-19,44],[rear-6,40],[rear+4,40],[rear+19,44]],highlight);
    draw([[front-22,46],[front-12,40],[front+5,40],[front+19,45]],highlight);
    // Side glass receives explicit rear quarter and vertical door-pillar ink.
    sprite.line(98,14,98,34,8);
    sprite.line(99,14,99,32,chrome);
    return;
  }

  if(['master38','chevy40','roadster40','ford40'].includes(id)){
    // 1938-40 coupe's strong independent fenders and narrower hood ridge.
    // These raised shoulders distinguish it from a postwar pontoon body.
    const back=rear, nose=front;
    draw([[back-28,51],[back-23,45],[back-12,41],[back+2,39],[back+17,42],[back+29,49]],shade);
    draw([[back-22,47],[back-10,42],[back+4,42],[back+18,45]],highlight);
    draw([[nose-29,51],[nose-22,44],[nose-8,39],[nose+7,39],[nose+21,46],[nose+29,54]],shade);
    draw([[nose-20,44],[nose-8,41],[nose+5,41],[nose+17,45]],chrome);
    draw([[nose-43,hoodY-1],[nose-4,hoodY-3],[nose+18,hoodY]],highlight);
    sprite.line(nose-35,hoodY+1,nose+18,hoodY+2,8);
    for(let x=nose-43;x<nose-25;x+=5)sprite.line(x,hoodY+3,x,hoodY+8,shade);
    if(id==='chevy40'){
      draw([[39,39],[54,29],[64,18],[79,12],[100,11],[116,14]],chrome);
      // Strong, lower rear wheel-spat edge and separate cabin shut line.
      sprite.line(146,35,146,58,shade);
      sprite.line(148,37,148,55,highlight);
      draw([[32,61],[78,61],[108,62]],0);
    }
    return;
  }

  if(['style49','olds49','silver50','olds52'].includes(id)){
    // Postwar pontoon shape: wider running waist and proper hood ornament.
    draw([[11,42],[51,39],[73,39],[145,41],[224,42]],highlight);
    draw([[front-52,37],[front-34,35],[front-4,35],[front+16,39]],chrome);
    sprite.line(front-21,33,front-16,31,15);
    sprite.line(front-16,31,front-11,33,7);
    for(let x=front+15;x<front+27;x+=3)sprite.line(x,46,x,54,x%2?7:15);
    draw([[rear+19,61],[front-22,61]],shade);
    if(id==='silver50'){
      for(let x=148;x<199;x+=6)sprite.pixel(x,hoodY-1,chrome);
    }
    return;
  }

  if(['belair55','fairlane55','lancer55','mercury54','mercury56','fairlane57','impala58'].includes(id)){
    // Long chrome flank and high beltline on full-size mid-century cars.
    draw([[rear+24,hoodY+4],[117,hoodY+5],[front-28,hoodY+3]],chrome);
    sprite.line(rear+21,59,front-23,59,shade);
    sprite.line(rear+26,60,front-25,60,7);
    sprite.line(110,18,110,36,8);
    sprite.line(112,20,112,35,chrome);
    if(id==='fairlane57'){
      // Angular raised tailfin, chrome crest and jet-age rear quarter.
      sprite.polygon([[4,28],[8,27],[30,39],[37,41],[12,37]],highlight);
      draw([[4,28],[8,27],[27,37],[44,42]],chrome);
      draw([[13,43],[44,46],[87,46],[118,48]],15);
    }else if(id==='belair55'){
      draw([[12,42],[48,43],[85,46],[128,48],[153,46]],15);
    }else if(id==='lancer55'){
      draw([[10,42],[42,43],[82,46],[143,48],[200,43]],15);
    }else if(id==='impala58'){
      sprite.box(9,38,12,2,12);
      draw([[21,40],[48,43],[84,43]],chrome);
    }
    return;
  }

  if(['vette56','vette61','tbird57'].includes(id)){
    // Two-seat sports cars keep long low hood, painted fender shoulders,
    // exposed windshield stanchions and chrome coves, not sedan roof lines.
    draw([[5,49],[23,40],[52,36],[92,37],[115,38]],highlight);
    draw([[144,38],[181,36],[211,34],[230,40]],chrome);
    sprite.line(117,24,117,39,8);
    sprite.line(119,23,119,38,chrome);
    if(id==='vette56'||id==='vette61'){
      // Sculpted bright 1956 Corvette cove running through the door.
      draw([[100,50],[118,46],[147,44],[173,46],[190,49]],15);
      draw([[103,54],[119,57],[149,57],[169,54]],7);
      sprite.line(200,43,216,40,highlight);
    }
    return;
  }

  if(id==='vette63'){
    // Sting Ray fastback roof shoulders and separate side vent blades.
    draw([[51,35],[78,22],[98,18],[119,19],[139,34]],chrome);
    draw([[144,40],[182,37],[218,38],[234,43]],highlight);
    for(let x=151;x<=164;x+=4){
      sprite.line(x,46,x-2,53,shade);
      sprite.pixel(x+1,46,chrome);
    }
    return;
  }

  if(id==='mystery66')return; // Keep Cowboy's family finale identity intact.

  // Square-shouldered early 1960s sedans use clean horizontal accents
  // rather than the postwar car's round swooping trim.
  draw([[9,hoodY+2],[69,hoodY+2],[115,hoodY+3],[170,hoodY+2],[229,hoodY+2]],chrome);
  draw([[rear+20,59],[front-18,59]],shade);
  for(let x=front+17;x<=front+23;x+=3)sprite.line(x,43,x,51,8);
}

// Period-correct visual landmarks distinguish the car families at the 320x200
// scale. These are independently drawn details, not extracted game sprites.
function drawPeriodBodywork(sprite, profile, id, paint) {
  const [dark,body,light,chrome] = paint;
  const [rear,front] = profile.wheels;
  // Rocker panel and lower door seam: stop at the wheel openings so every
  // model retains its own wheelbase and outline.
  if (front-rear>66) {
    sprite.line(rear+19,60,front-19,60,dark);
    sprite.line(rear+22,61,front-23,61,chrome);
  }
  // Separate chrome windscreen frames and roof gutters on sedans/hardtops.
  if(profile.glass.length>1 && profile.trim!=='van'){
    const windshield=profile.glass.at(-1);
    const top=windshield[1]||windshield[0];
    const foot=windshield.at(-1);
    sprite.line(top[0]+1,top[1],foot[0]-1,foot[1]-1,chrome);
    const roof=profile.shell.filter(([,y])=>y<24);
    if(roof.length>2){
      const start=roof[0],finish=roof.at(-1);
      sprite.line(start[0]+4,start[1]+2,finish[0]-4,finish[1]+2,light);
    }
  }
  // Prewar exposed hood sides, including individual cooling louvers.
  if(['ford32','sedan32','master38','chevy40','roadster40','ford40'].includes(id)){
    for(let x=front-41;x<=front-24;x+=5){
      sprite.line(x,profile.waist+3,x+1,profile.waist+8,dark);
      sprite.pixel(x+2,profile.waist+4,chrome);
    }
    sprite.line(front-45,profile.waist+1,front+11,profile.waist+1,light);
  }
  // Distinctive rear-quarter fin / chrome spear treatments of the 1950s.
  if(['fairlane57','lancer55','fairlane55','belair55','impala58'].includes(id)){
    sprite.trace([[6,profile.waist-4],[18,profile.waist+1],[40,profile.waist+3],[66,profile.waist+4]],chrome);
    sprite.trace([[9,profile.waist-2],[19,profile.waist+3],[36,profile.waist+5]],dark);
    sprite.box(8,profile.waist+5,4,2,12);
  }
  if(id==='fairlane57'){
    // The 1957 Ford has high-pointed rear fins and a sweeping flank spear.
    sprite.polygon([[4,31],[8,30],[16,35],[27,40],[14,40]],(x,y)=>x<13?light:body);
    sprite.trace([[4,31],[8,30],[16,35],[27,40]],chrome);
    sprite.trace([[29,44],[56,44],[87,43],[116,47]],light);
  }
  if(id==='vette56'||id==='vette61'){
    // Side coves and scalloped chrome lips identify the two-seat Corvettes.
    sprite.trace([[99,48],[111,46],[132,44],[167,44],[185,47]],chrome);
    sprite.trace([[103,54],[116,57],[145,58],[168,54]],dark);
    sprite.line(119,41,143,41,light);
  }
  if(id==='vette63'){
    // Sting Ray's short front-fender vent cluster and long sculpted shoulder.
    sprite.trace([[10,43],[58,39],[94,43],[138,44],[170,42],[228,41]],chrome);
    for(const x of [151,155,159]) {
      sprite.line(x,46,x-2,54,dark);
      sprite.pixel(x+1,47,chrome);
    }
  }
  if(id==='tbird57'||id==='roadster40'){
    // Raised soft-top windscreen rail and low door cap of open cars.
    sprite.trace([[121,23],[128,22],[144,35]],chrome);
    sprite.line(72,39,115,39,light);
  }
  if(id==='mystery66'){
    // The optional family finale retains its own color blocks and flower art.
    sprite.line(13,12,163,12,chrome);
    sprite.line(138,16,138,34,dark);
  }
}

// Car-by-car factory signatures: unique quarter-panel decorations, brightwork,
// roof architecture and tail/headlight cues at a legible 240x76 sprite scale.
// Every model stays an original hand-drawn EGA approximation, not a copied asset.
// Never alter a car's ID, mechanical stats, available parts or saved appearance.
function drawFactorySignature(sprite, profile, id, paint, car) {
  const [shade,body,light,chrome] = paint;
  const bright = 15, steel = 7, ink = 0;
  const draw = (points,color=chrome) => sprite.trace(points,color);
  const band = (x,y,w,color=chrome) => sprite.box(x,y,w,1,color);
  const pip = (x,y,color=bright) => sprite.pixel(x,y,color);
  const fin = (pts) => {sprite.polygon(pts,light);sprite.trace(pts.slice(0,3),chrome);};

  switch(id) {
    case 'ford32': {
      // Five-window hot rod, narrow rear quarter port and exposed louvers.
      sprite.polygon([[62,21],[68,16],[73,16],[73,29],[62,29]],ink);
      draw([[61,29],[61,18],[68,14],[74,14]],chrome);
      draw([[142,44],[155,44],[162,45]],bright);
      band(151,55,23,shade);
      break;
    }
    case 'sedan32': {
      // Upright multi-window four-door with a three-pillar greenhouse.
      for(const x of [61,91]){sprite.line(x,12,x,34,ink);sprite.line(x+1,12,x+1,32,chrome);}
      band(30,35,110,steel);
      draw([[13,45],[20,37],[28,35]],bright);
      break;
    }
    case 'master38': {
      // Chevrolet Master Deluxe: stepped hood, under-door running board.
      draw([[139,36],[169,35],[192,38]],light);
      draw([[145,44],[200,44]],steel);
      for(let x=163;x<=183;x+=4) sprite.line(x,43,x+1,49,shade);
      sprite.box(81,60,54,2,ink);
      break;
    }
    case 'chevy40': {
      // Business coupe's beaked nose and stout rear fender.
      draw([[14,47],[31,46],[41,42],[53,39]],bright);
      draw([[181,34],[212,35],[226,40]],chrome);
      for(let x=162;x<=183;x+=6) pip(x,43,steel);
      break;
    }
    case 'roadster40': {
      // Low open car: windshield frame, cowl and padded cockpit lip.
      draw([[117,37],[120,22],[127,20],[145,35]],bright);
      band(83,38,33,ink);band(87,39,25,steel);
      draw([[42,44],[64,42],[90,42]],light);
      break;
    }
    case 'ford40': {
      // Ford Deluxe rounded beak, horizontal hood ribs, rolled belt.
      draw([[155,36],[193,35],[221,40]],bright);
      for(let x=159;x<=177;x+=4) sprite.line(x,41,x+1,47,shade);
      draw([[13,53],[26,50],[37,47]],chrome);
      break;
    }
    case 'style49': {
      // Chevrolet's smooth postwar pontoon: two long bright side spears.
      draw([[21,46],[64,46],[108,48],[168,47],[225,44]],bright);
      draw([[23,48],[68,48],[111,50],[166,49],[223,46]],steel);
      pip(177,38,bright);band(207,36,10,light);
      break;
    }
    case 'olds49': {
      // Rocket 88 rocket flashes and three-piece rear flank ornament.
      draw([[26,47],[56,45],[82,46],[126,49],[186,46],[226,41]],bright);
      draw([[15,54],[30,54],[42,52]],steel);
      sprite.polygon([[149,49],[161,47],[170,48],[162,51]],bright);
      for(const x of [185,191,197])pip(x,38,bright);
      break;
    }
    case 'silver50': {
      // Pontiac "Silver Streak" hood strips and arrowhead wing emblem.
      for(const dy of [-2,0,2]) draw([[160,37+dy],[184,35+dy],[216,38+dy]],dy===0?bright:steel);
      sprite.polygon([[99,49],[107,45],[115,49],[107,52]],bright);
      band(14,52,18,steel);break;
    }
    case 'olds52': {
      // '52 Rocket 88 longer chrome rocket and crisp B pillar.
      draw([[17,47],[51,46],[88,47],[126,49],[183,47],[230,43]],bright);
      draw([[27,51],[60,51],[100,52]],steel);
      sprite.line(110,19,110,34,ink);sprite.line(111,20,111,32,bright);
      pip(171,37,bright);break;
    }
    case 'mercury54': {
      // Monterey's subtle "dip" side sweep and turbine-style rear badge.
      draw([[9,44],[60,45],[96,50],[150,50],[198,44],[232,42]],bright);
      draw([[14,47],[60,48],[96,53],[146,53],[196,47]],steel);
      for(const y of [46,49,52])pip(24,y,bright);
      break;
    }
    case 'belair55': {
      // Chevy two-tone hockey-stick spear, chrome across the rear flank.
      sprite.polygon([[15,44],[64,45],[93,47],[111,49],[130,52],[95,55],[50,53],[16,50]],bright);
      draw([[17,44],[62,45],[94,47],[111,49],[130,52]],steel);
      draw([[135,49],[174,46],[224,42]],bright);
      break;
    }
    case 'fairlane55': {
      // Victoria roof belt and distinctive rising Ford side insert.
      draw([[71,22],[95,17],[130,17],[146,22]],bright);
      sprite.polygon([[14,45],[43,46],[82,46],[115,49],[132,54],[91,54],[48,51]],steel);
      draw([[14,45],[49,45],[83,46],[114,49],[132,54]],bright);
      break;
    }
    case 'lancer55': {
      // Dodge spear, pronounced forward-leaning fin and rear chrome slash.
      fin([[5,31],[12,31],[24,39],[10,37]]);
      sprite.polygon([[11,44],[62,44],[116,47],[151,48],[180,44],[221,42],[204,48],[158,54],[115,52],[63,50]],bright);
      draw([[12,44],[61,44],[116,47],[151,48],[183,44],[221,42]],steel);
      break;
    }
    case 'vette56': {
      // '56 roadster with massive white coves and short door shut line.
      draw([[99,45],[118,42],[147,42],[172,44],[195,48]],bright);
      draw([[100,53],[115,57],[142,58],[169,54]],steel);
      draw([[120,23],[124,22],[135,32]],bright);
      for(const x of [205,209,213]) pip(x,44,bright);
      break;
    }
    case 'mercury56': {
      // '56 Mercury high side sweep, rear fender hump, broad chrome mouth.
      fin([[5,33],[10,33],[24,39],[11,39]]);
      draw([[13,44],[61,46],[99,50],[157,50],[214,43],[234,42]],bright);
      draw([[17,47],[61,49],[101,53],[157,53],[208,47]],steel);
      break;
    }
    case 'fairlane57': {
      // 1957 Ford, tall squared fin with wide chrome bi-tone insert.
      fin([[3,29],[10,29],[33,40],[14,38]]);
      sprite.polygon([[10,43],[36,46],[83,46],[119,49],[146,49],[123,54],[79,53],[35,51]],bright);
      draw([[10,43],[36,46],[83,46],[119,49],[146,49]],steel);
      break;
    }
    case 'tbird57': {
      // Low two-seat Thunderbird with removable-top cues, wing badge.
      draw([[118,24],[126,22],[142,35]],bright);
      sprite.polygon([[70,46],[78,46],[82,50],[77,53],[70,51]],bright);
      draw([[16,47],[51,45],[102,45]],steel);
      for(const x of [200,206,212])pip(x,43,bright);
      break;
    }
    case 'impala58': {
      // 1958 Impala broad fin, longer descending quarter and dual chrome strips.
      fin([[4,32],[12,32],[32,41],[15,39]]);
      draw([[14,45],[61,46],[101,47],[161,44],[224,41]],bright);
      draw([[17,48],[61,49],[102,50],[160,47],[224,44]],steel);
      for(const x of [71,76,81])sprite.line(x,53,x-1,57,bright);
      break;
    }
    case 'valiant61': {
      // Early Valiant: quirky pointed rear eyebrow, slim side crease.
      fin([[7,40],[11,34],[17,35],[25,41]]);
      draw([[11,44],[53,43],[94,45],[151,48],[202,43]],bright);
      sprite.line(101,22,101,36,ink);
      break;
    }
    case 'vette61': {
      // Quad-headlamp later Corvette with a shorter, higher rising cove.
      draw([[106,46],[126,45],[155,43],[186,46]],bright);
      draw([[110,54],[125,57],[154,57],[180,52]],steel);
      for(const x of [203,208,213,218])pip(x,43,bright);
      break;
    }
    case 'polara62': {
      // Dodge Polara long squared bonnet with horizontal bright rocket trim.
      draw([[9,42],[63,42],[99,45],[153,44],[208,40],[234,41]],bright);
      draw([[10,45],[65,45],[99,48],[151,47],[210,43]],steel);
      for(const x of [192,198,204])pip(x,38,bright);
      break;
    }
    case 'valiant63': {
      // Compact Valiant, short nose and understated slanted rear quarter.
      draw([[12,45],[44,43],[101,44],[153,46],[208,43]],bright);
      draw([[13,47],[44,46],[99,47],[153,49]],steel);
      sprite.line(106,23,107,36,ink);
      break;
    }
    case 'vette63': {
      // Split-window Sting Ray fastback: roof taper, rear spine and three vents.
      draw([[53,34],[76,23],[95,18],[119,19],[139,34]],bright);
      sprite.line(99,23,101,36,ink);
      sprite.line(100,24,102,33,bright);
      for(const x of [151,156,161])sprite.line(x,47,x-2,54,steel);
      draw([[171,38],[198,36],[230,40]],bright);
      break;
    }
    case 'savoy64': {
      // Plymouth Savoy straight-box two-door roof and conservative body spear.
      draw([[12,43],[55,42],[106,43],[164,44],[216,41]],bright);
      draw([[13,45],[55,44],[106,46],[164,47]],steel);
      sprite.line(111,23,111,36,ink);
      for(const x of [220,225,230])pip(x,44,bright);
      break;
    }
    case 'woodie34':{
      // True wagon profile with timber frames, separate radiator and rear door.
      sprite.polygon([[16,40],[36,38],[73,40],[110,40],[138,38],[141,57],[16,57]],6);
      for(const [x1,x2] of [[18,51],[55,79],[82,111],[115,138]]){
        draw([[x1,40],[x1,56],[x2,56],[x2,41]],14);
      }
      draw([[17,49],[140,49]],14);
      draw([[18,40],[19,20],[28,11],[120,11],[135,19]],steel);
      break;
    }
    case 'town48':{
      // Genuine wood-panel convertible with fine-grained cabin-side framing.
      sprite.polygon([[18,41],[75,39],[114,43],[151,42],[151,57],[18,57]],6);
      draw([[20,43],[49,42],[82,43],[112,46],[150,45]],14);
      draw([[20,54],[50,55],[83,55],[116,54],[151,55]],14);
      for(const x of [32,66,97,129])sprite.line(x,44,x,54,14);
      draw([[139,26],[145,23],[159,37]],bright);
      break;
    }
    case 'chevy3100':{
      // 1950s stepside cargo bed, exposed rear wheel arch and square truck cab.
      sprite.line(13,35,94,35,ink);
      sprite.line(12,57,29,57,steel);
      sprite.line(84,39,84,58,ink);
      draw([[97,36],[110,18],[122,13],[149,14]],bright);
      draw([[174,38],[207,36],[230,42]],steel);
      for(const x of [181,186,191])sprite.line(x,46,x,52,steel);
      break;
    }
    case 'nomad55':{
      // Nomad roof stainless, distinctive seven rear bright ribs and low estate.
      draw([[25,17],[129,17],[146,29]],bright);
      for(let x=28;x<=52;x+=4)sprite.line(x,46,x+1,56,steel);
      draw([[8,44],[42,43],[85,44],[126,47],[221,42]],bright);
      break;
    }
    case 'f10057':{
      // Flareside bed and contrasting cab pillars, separated truck nose.
      draw([[12,36],[91,36],[93,59]],bright);
      sprite.line(97,35,97,60,ink);
      draw([[107,31],[119,15],[153,16],[170,36]],bright);
      draw([[178,42],[214,40],[234,46]],bright);
      for(const x of [181,186,191])sprite.line(x,47,x,53,steel);
      break;
    }
    case 'camino59':{
      // El Camino rear load deck and dramatic 1959 Chevrolet fin.
      fin([[4,36],[7,28],[14,30],[28,38]]);
      draw([[15,37],[70,37]],steel);
      draw([[9,43],[48,44],[102,45],[145,47],[211,42]],bright);
      draw([[9,47],[48,48],[102,49]],steel);
      break;
    }
    case 'eldorado59':{
      // Cadillac's enormous towering rocket fins and double deck trim.
      fin([[3,23],[6,17],[14,19],[29,35]]);
      draw([[8,40],[55,42],[107,44],[157,44],[220,40]],bright);
      draw([[10,44],[55,46],[107,48],[158,48],[219,44]],steel);
      for(const x of [67,74,81,88])sprite.line(x,52,x-1,57,bright);
      break;
    }
    case 'squire60':{
      // Country Squire wood appliqué, crossbars and three-window roof.
      sprite.polygon([[12,43],[54,43],[89,44],[144,44],[153,52],[112,57],[27,57],[10,54]],6);
      draw([[14,43],[58,43],[92,44],[145,44],[153,52]],14);
      draw([[14,54],[39,56],[111,56],[153,52]],14);
      for(const x of [36,67,99,127])sprite.line(x,45,x,54,14);
      draw([[24,17],[131,17],[149,25]],bright);
      break;
    }
    case 'econoline61':{
      // Cargo van: solid delivery sides, small driver window, flat roof.
      draw([[14,13],[175,13],[192,17],[216,37]],bright);
      sprite.line(166,16,166,59,ink);
      draw([[12,43],[166,43],[226,43]],steel);
      for(const x of [47,93,129])sprite.line(x,44,x,58,shade);
      sprite.box(154,44,7,2,steel);
      break;
    }
    case 'clubwagon62':{
      // Passenger van: five separate window bays, slim door seams.
      draw([[12,14],[176,14],[192,18],[216,37]],bright);
      for(const x of [55,90,128,173])sprite.line(x,18,x,37,ink);
      draw([[12,42],[228,43]],steel);
      draw([[12,56],[226,56]],bright);
      break;
    }
    case 'econoPickup61':{
      // Forward-control Econoline: box bed, cab perched over front wheel.
      draw([[13,36],[145,36],[150,37]],bright);
      sprite.line(145,36,145,60,ink);
      sprite.line(16,36,16,57,ink);
      draw([[160,16],[193,15],[216,34]],bright);
      draw([[150,44],[231,44]],steel);
      break;
    }
    case 'c10stepside63':{
      // Separate bed and stepside rear fender, front angular Chevrolet hood.
      sprite.line(13,35,94,35,ink);
      sprite.line(92,36,92,59,steel);
      draw([[105,33],[122,17],[153,17],[174,37]],bright);
      draw([[176,41],[215,38],[231,43]],steel);
      for(const x of [206,211,216,221])pip(x,44,bright);
      break;
    }
    case 'd10063':{
      // Full-width Sweptline load bed and compact short-cab shoulder line.
      draw([[10,36],[103,36],[175,37],[226,36]],bright);
      draw([[13,44],[57,44],[101,44],[165,46],[224,43]],steel);
      draw([[109,21],[123,16],[156,16],[169,27]],bright);
      sprite.line(101,36,101,60,ink);
      break;
    }
    case 'riviera63':{
      // Buick Riviera clean coke-bottle shoulder, small formal roof, no fins.
      draw([[8,42],[58,42],[94,44],[150,44],[212,39],[236,43]],bright);
      draw([[12,45],[57,45],[95,47],[148,47],[213,42]],steel);
      for(const x of [173,177,181])sprite.line(x,44,x-1,51,ink);
      draw([[86,25],[107,18],[138,18],[156,28]],bright);
      break;
    }
    case 'galaxie63':{
      // Formal Galaxie fastback, full-length bright body spear.
      draw([[83,27],[101,17],[128,18],[162,34]],bright);
      draw([[10,44],[62,44],[100,47],[166,47],[231,42]],bright);
      draw([[13,46],[64,46],[101,49],[168,49]],steel);
      for(const x of [204,208,212])pip(x,42,bright);
      break;
    }
    case 'mystery66':
      // The family finale stays exactly as it is.
      return;
  }
  // Single bright door lock and rocker notches preserve the scale of EGA-era
  // details while adding period character at 320x200 display resolution.
  if(profile.doors.length && !car?.roof) {
    const handle = profile.doors.at(-1)[4];
    if(handle>22&&handle<226) pip(handle-2,profile.waist+13,chrome);
  }
}

function drawWheel(sprite, x, r, part, whitewall, fitted, wireSpokes=false) {
  const y = GROUND - r;
  const slick = part === 'tire-slick';
  const sporty = slick || part === 'tire-road';
  sprite.ellipse(x,y,r+2,r+2,EMPTY);
  sprite.ellipse(x,y-1,r+1,r,0);
  if (!fitted) {
    sprite.ellipse(x,y-1,r-6,r-6,8);
    sprite.ellipse(x,y-1,r-8,r-8,7);
    sprite.box(x-2,y-3,5,5,8);
    return;
  }
  sprite.ellipse(x,y,r,r,0);
  sprite.ellipse(x-1,y-1,r-1,r-1,8);
  sprite.ellipse(x,y+1,r-1,r-1,0);
  const lip = sporty ? r-5 : r-4;
  const hub = wireSpokes && !sporty ? lip-5 : whitewall==='wide' && !sporty ? lip-4 : lip-2;
  sprite.ellipse(x,y,lip+1,lip+1,8);
  sprite.ellipse(x,y,lip,lip,slick?7:15);
  sprite.ellipse(x,y+1,lip-1,lip-1,slick?8:7);
  sprite.trace([[x-lip+2,y-4],[x-4,y-lip+2],[x,y-lip+1],[x+5,y-lip+3]],15);
  sprite.ellipse(x,y,hub+1,hub+1,0);
  sprite.ellipse(x,y,hub,hub,8);
  if (sporty) {
    for (const [dx,dy] of [[-hub+1,0],[hub-1,0],[0,-hub+1],[0,hub-1],[-4,-4],[4,-4],[-4,4],[4,4]]) {
      sprite.line(x,y,x+dx,y+dy,7);
    }
  } else if (wireSpokes) {
    // Early Ford wire wheels: bright narrow spokes rather than modern discs.
    sprite.ellipse(x,y,hub+1,hub+1,7);
    sprite.ellipse(x,y,hub,hub,8);
    for(const [dx,dy] of [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]]){
      sprite.line(x,y,x+dx*(lip-2),y+dy*(lip-2),7);
    }
    sprite.ellipse(x,y,hub,hub,8);
    for(const [dx,dy] of [[-hub,0],[hub,0],[0,-hub],[0,hub],[-hub+1,-hub+1],[hub-1,-hub+1],[-hub+1,hub-1],[hub-1,hub-1]]){
      sprite.line(x,y,x+dx,y+dy,15);
    }
  } else {
    sprite.ellipse(x-1,y-1,hub-1,hub-1,7);
    sprite.trace([[x-hub+2,y-2],[x-2,y-hub+2],[x+2,y-hub+2]],15);
    for (const [dx,dy] of [[4,0],[-4,0],[0,4],[0,-4]]) sprite.pixel(x+dx,y+dy,0);
  }
  sprite.ellipse(x,y,2,2,7);
  sprite.pixel(x-1,y-1,15);
  sprite.pixel(x+1,y+1,8);
}

function drawBumper(sprite, x, y, width) {
  sprite.trace([[x+3,y-1],[x+width-3,y-1],[x+width,y+1],[x+width-2,y+3],[x+2,y+3],[x,y+1],[x+3,y-1]],0);
  sprite.box(x+1,y,width-1,1,7);
  sprite.box(x,y+1,width+1,1,15);
  sprite.box(x+1,y+2,width-1,1,8);
}

function drawEnds(sprite, profile, car) {
  const [rx,ry,fx,fy,style] = profile.lamps;
  const early = style==='shell' || style==='separate';
  sprite.box(rx,ry,style==='sport'?4:3,5,4);
  sprite.box(rx,ry,2,3,12);
  if (style==='separate' || style==='shell') {
    const x = style==='separate' ? fx-6 : fx;
    sprite.ellipse(x,fy,4,3,0);
    sprite.ellipse(x,fy,3,2,7);
    sprite.box(x+1,fy-1,2,3,15);
  } else if (style!=='hidden') {
    const width = style==='quad' ? 7 : 5;
    sprite.box(fx-width,fy,width+3,7,8);
    sprite.box(fx-width+1,fy+1,width+1,3,7);
    sprite.box(fx-width+2,fy+1,style==='quad'?2:4,3,15);
    if (style==='quad') sprite.box(fx-1,fy+1,2,3,15);
    if (style==='brow') sprite.line(fx-width-1,fy,fx+1,fy,15);
  }
  const grilleX = early ? fx+1 : fx-3;
  for (let i=0;i<(early?6:3);i++) sprite.line(grilleX,fy+8+i*2,fx+4,fy+8+i*2,i%2?8:7);
  if (car?.rear!==false) drawBumper(sprite,Math.max(0,rx-6),58,early?13:15);
  if (car?.front!==false) drawBumper(sprite,Math.min(WIDTH-16,fx-6),58,early?13:15);
}

function drawDecal(sprite, decal, profile) {
  const x = profile.doors.at(-1)[3]-6;
  const y = profile.trim === 'cove' || profile.trim === 'coveShort' ? 48 : 49;
  if (decal === 1) {
    const flame = [[x-14,y+8],[x-9,y+5],[x-5,y+6],[x,y],[x-1,y+4],[x+4,y+2],
      [x+3,y+5],[x+12,y+2],[x+9,y+7],[x+14,y+8],[x+6,y+10],[x-9,y+10]];
    sprite.polygon(flame,12);
    sprite.trace([[x-13,y+8],[x-7,y+7],[x-1,y+5],[x+5,y+6],[x+11,y+4]],14);
  } else if (decal === 2) {
    sprite.ellipse(x,y+6,9,6,15);
    sprite.ellipse(x,y+6,7,4,0);
    sprite.box(x-2,y+3,4,6,15);
    sprite.box(x-4,y+5,8,2,15);
  } else if (decal === 3) {
    sprite.polygon([[x-13,y+8],[x-1,y+1],[x+10,y+2],[x+3,y+6],[x+14,y+7],[x-3,y+11],[x,y+7]],11);
    sprite.line(x-8,y+7,x+4,y+3,15);
  }
}

function vehicleSprite(profile, modelId, car, paint, frontWheel, rearWheel) {
  const sprite = new Sprite();
  const roof = points => car?.roof
    ? points.map(([x,y]) => [x,y < profile.waist-2 ? Math.round(y+(profile.waist-2-y)*0.28) : y])
    : points;
  const shell = roof(profile.shell);
  const [dark,,light] = paint;
  const [rear,front,designRadius] = profile.wheels;
  // In an elevation, tire diameter must be small relative to wheelbase and
  // height. Earlier oversized circles made realistic cars look toy-like.
  const r = Math.max(10,Math.round(designRadius*0.79));
  const visibleJack = car?.jack?.endsWith('-left') ? car.jack : '';
  const jackX = visibleJack.startsWith('rear') ? rear : front;
  sprite.polygon([[7,69],[41,67],[194,67],[232,70],[220,74],[44,74],[13,72]],8);
  sprite.polygon([[16,70],[209,70],[224,72],[209,73],[31,73]],0);
  sprite.polygon(shell,bodyPaint(0,profile.waist,paint));
  sprite.trace([...shell,shell[0]],0);
  sprite.trace(shell.slice(2,-4).map(([x,y]) => [x,y+1]),light);
  if (profile.seat) {
    const [x,y] = profile.seat;
    sprite.trace([[x-12,y+3],[x-6,y+3],[x-5,y-3],[x+1,y-4],[x+7,y+3],[x+12,y+3]],0);
    sprite.line(x-3,y-3,x+1,y-3,8);
    sprite.line(x+2,y-2,x+5,y+3,dark);
  }
  profile.glass.forEach((points,i) => drawGlass(sprite,roof(points),i));
  if (profile.trim === 'van') drawVan(sprite);
  for (const x of [rear,front]) drawFender(sprite,x,r,profile.fenders,paint);
  drawTrim(sprite,profile,paint);
  drawDoors(sprite,profile,paint);
  drawPeriodBodywork(sprite,profile,modelId,paint);
  // Unified factory-fidelity renderer: one silhouette, restrained bodywork,
  // and one signature accent pass for original and expansion vehicles.
  drawFactorySignature(sprite,profile,modelId,paint,car);
  if (car?.decal && profile.trim !== 'van') drawDecal(sprite,car.decal,profile);
  for (const [x, wheel] of [[rear,rearWheel],[front,frontWheel]]) {
    drawWheel(sprite,x,r,wheel,profile.wall,Boolean(wheel),modelId==='ford32'||modelId==='sedan32');
  }
  drawEnds(sprite,profile,car);
  if (!visibleJack) return sprite;

  const lifted = new Sprite();
  for (let x = 0; x < WIDTH; x++) {
    const raise = Math.max(0,Math.round(3*(1-Math.abs(x-jackX)/205)));
    for (let y = 0; y < 67; y++) {
      const color = sprite.pixels[y*WIDTH+x];
      if (color !== EMPTY) lifted.pixel(x,y-raise,color);
    }
    for (let y = 67; y < HEIGHT; y++) lifted.pixel(x,y,sprite.pixels[y*WIDTH+x]);
  }
  lifted.box(jackX+17,70,18,2,0);
  lifted.box(jackX+19,67,15,3,8);
  lifted.trace([[jackX+19,68],[jackX+25,61],[jackX+31,68]],14);
  lifted.line(jackX+25,61,jackX+35,59,7);
  return lifted;
}

const spriteCache = new Map();

// Racing uses the same model profiles and paint as inspection, with a proper
// rear/front elevation rather than one generic sedan for every opponent.
const raceSpriteCache=new Map();
function raceVehicleSprite(model,car,frontView){
  const p=PROFILES[model.id],s=new Sprite();
  const paint=vehiclePaint(car?.color??model.color),[dark,body,light,chrome]=paint;
  const van=model.body==='van',pickup=model.body==='pickup'||model.body==='utility';
  const wagon=model.body==='wagon';
  const early=['ford32','sedan32','master38','chevy40','roadster40','ford40'].includes(model.id);
  const open=Boolean(p.seat)||['vette56','vette61','tbird57','roadster40'].includes(model.id);
  const fin=['fairlane57','fairlane55','lancer55','impala58'].includes(model.id);
  const half=Math.round((van?48:pickup?49:early?39:51)+(p.wheels[1]-p.wheels[0]-145)*0.06);
  const top=Math.round((van?9:pickup?18:open?35:early?15:23)+(car?.roof?7:0));
  const cx=120,left=cx-half,right=cx+half,waist=van?42:pickup?44:46;
  const cabinHalf=Math.round(half*(van?0.88:pickup?0.67:early?0.65:0.72));
  const roofCrown=early?6:van?3:5;
  s.ellipse(cx,72,half+5,3,0);
  s.box(left+3,57,10,15,0);s.box(right-13,57,10,15,0);
  s.box(left+5,59,2,9,8);s.box(right-7,59,2,9,8);
  const shell=[[left,66],[left+1,waist+5],[left+5,waist-5],[cx-cabinHalf,top+roofCrown],
    [cx-cabinHalf+roofCrown,top],[cx+cabinHalf-roofCrown,top],[cx+cabinHalf,top+roofCrown],
    [right-5,waist-5],[right-1,waist+5],[right,66]];
  s.polygon(shell,bodyPaint(0,waist-7,paint));s.trace([...shell,shell[0]],0);
  s.trace(shell.slice(2,8).map(([x,y])=>[x,y+1]),light);
  if(!open){
    const glassTop=top+5,glassBottom=pickup?34:van?35:waist-7;
    const glassHalf=cabinHalf-5;
    const glass=[[cx-glassHalf,glassTop+2],[cx-glassHalf+4,glassTop],
      [cx+glassHalf-4,glassTop],[cx+glassHalf,glassTop+2],
      [cx+glassHalf+3,glassBottom],[cx-glassHalf-3,glassBottom]];
    s.polygon(glass,0);s.trace([...glass,glass[0]],chrome);
    s.line(cx-glassHalf+5,glassTop+3,cx-5,glassTop+3,9);
    s.line(cx+4,glassTop+3,cx+glassHalf-4,glassTop+3,8);
    if(model.id==='vette63'||van)s.line(cx,glassTop,cx,glassBottom,body);
    if(van&&!frontView){
      s.line(cx,glassBottom,cx,64,dark);
      s.box(cx-5,45,3,2,chrome);s.box(cx+3,45,3,2,chrome);
    }
  }else{
    s.line(cx-cabinHalf,top,cx+cabinHalf,top,chrome);
    for(const seat of [cx-14,cx+14]){
      s.polygon([[seat-9,43],[seat-7,34],[seat+6,34],[seat+9,43]],0);
      s.line(seat-5,35,seat+4,35,8);
    }
  }
  if(pickup&&!frontView){
    s.polygon([[left+6,40],[right-6,40],[right-4,51],[left+4,51]],dark);
    s.line(left+6,40,right-6,40,chrome);
    s.box(left+8,51,half*2-16,12,body);s.box(left+9,53,half*2-18,1,light);
    s.box(cx-9,56,18,1,chrome);
  }else{
    s.line(left+5,waist,right-5,waist,light);
    s.line(left+8,waist+2,right-8,waist+2,dark);
  }
  if(wagon&&!frontView){
    s.box(left+8,48,half*2-16,9,6);s.box(left+10,50,half*2-20,1,14);
    s.line(cx,47,cx,60,dark);
  }
  if(fin){
    for(const sign of [-1,1]){
      const x=cx+sign*(half-3);
      s.polygon([[x,57],[x-sign*7,waist+4],[x,waist-9],[x+sign*3,56]],light);
      s.line(x,waist-9,x+sign*3,56,chrome);
    }
  }
  if(early&&!frontView){
    s.polygon([[cx-17,45],[cx-14,top+20],[cx+14,top+20],[cx+17,58]],body);
    s.trace([[cx-17,45],[cx-14,top+20],[cx+14,top+20],[cx+17,58]],dark);
    s.box(cx-4,49,8,2,chrome);
    if(model.id==='ford32'||model.id==='sedan32'){
      s.ellipse(cx,54,12,12,0);s.ellipse(cx,54,8,8,15);s.ellipse(cx,54,5,5,8);
    }
  }
  const round=['vette56','vette61','vette63','tbird57','fairlane57','impala58','galaxie63'].includes(model.id);
  const lampY=van?57:early?58:55;
  for(const sign of [-1,1]){
    const x=cx+sign*(half-11);
    if(round){
      const count=frontView?1:model.id==='impala58'?3:model.id==='vette63'||model.id==='vette61'?2:1;
      for(let i=0;i<count;i++){
        const xx=x-sign*i*7;
        s.ellipse(xx,lampY,4,4,chrome);s.ellipse(xx,lampY,3,3,frontView?15:4);
        s.pixel(xx-1,lampY-1,frontView?14:12);
      }
    }else{
      const vertical=van||fin;
      s.box(x-4,lampY-3,vertical?5:10,vertical?9:5,chrome);
      s.box(x-3,lampY-2,vertical?3:8,vertical?6:3,frontView?15:12);
    }
  }
  if(frontView){
    s.box(cx-19,55,38,6,0);
    for(let x=cx-17;x<cx+18;x+=3)s.line(x,56,x,59,7);
  }else{
    // Distinct deck and lamp treatments survive the small racing view.
    switch(model.id){
      case 'style49':
        s.trace([[left+12,54],[cx-16,48],[cx,47],[cx+16,48],[right-12,54]],chrome);
        s.box(cx-12,51,24,2,7);break;
      case 'valiant61':
        s.ellipse(cx,51,13,8,dark);s.ellipse(cx,50,11,6,light);s.ellipse(cx,50,8,4,body);
        for(const sign of [-1,1])s.trace([[cx+sign*(half-18),51],[cx+sign*(half-5),47],[cx+sign*(half-10),57]],chrome);
        break;
      case 'polara62':
        for(const sign of [-1,1])for(const dx of [0,8]){
          const x=cx+sign*(half-11-dx);s.ellipse(x,55,3,3,7);s.ellipse(x,55,2,2,12);
        }
        s.trace([[left+9,49],[cx-12,51],[cx,48],[cx+12,51],[right-9,49]],chrome);break;
      case 'olds49':
        s.ellipse(cx,52,3,3,7);s.line(cx-11,52,cx+11,52,chrome);
        s.trace([[left+13,47],[left+11,55],[left+15,60]],light);break;
      case 'belair55':
        s.trace([[left+13,48],[cx,56],[right-13,48]],chrome);
        for(const x of [left+7,right-12]){s.box(x,49,6,12,chrome);s.box(x+1,51,4,7,12);}
        break;
      case 'savoy64':
        s.box(left+5,52,half*2-10,8,dark);
        for(const x of [left+8,right-23]){s.box(x,53,16,5,7);s.box(x+1,54,14,3,12);}
        s.line(left+9,50,right-9,50,chrome);break;
      case 'olds52':
        s.line(left+11,50,right-11,50,chrome);s.ellipse(cx,50,3,3,15);
        s.line(cx-8,54,cx+8,54,7);break;
      case 'riviera63':
        s.box(left+5,50,half*2-10,10,dark);
        for(const x of [left+9,right-26]){s.box(x,53,18,3,chrome);s.box(x+2,53,14,2,12);}
        s.line(cx,49,cx,60,light);break;
    }
  }
  if((frontView?car?.front:car?.rear)!==false){
    s.box(left-1,65,half*2+2,4,8);s.box(left,65,half*2,1,chrome);s.box(left+2,67,half*2-4,1,7);
  }
  s.box(cx-7,60,14,6,0);s.box(cx-5,61,10,4,15);
  if(car?.decal)s.box(cx+11,waist+4,3+(car.decal%3)*2,2,14);
  if(model.id==='mystery66'&&!frontView){
    s.polygon([[left+5,39],[cx-7,43],[cx+10,38],[right-4,33],[right-4,43],[cx+9,47],[cx-8,48],[left+5,44]],10);
    for(const [x,y] of [[cx-20,49],[cx+23,44]]){s.box(x-5,y,11,3,12);s.box(x-1,y-4,3,11,12);s.box(x-1,y,3,3,14);}
  }
  return s;
}

export function paintRaceVehicle(screen,model,car,x,y,size,frontView=false){
  if(!model||!PROFILES[model.id])return;
  const key=[model.id,car?.color??model.color,car?.roof===true,car?.front!==false,car?.rear!==false,car?.decal||0,frontView].join('/');
  if(!raceSpriteCache.has(key)){
    if(raceSpriteCache.size>=100)raceSpriteCache.delete(raceSpriteCache.keys().next().value);
    raceSpriteCache.set(key,raceVehicleSprite(model,car,frontView));
  }
  const scale=Math.max(0.09,size*0.60);
  raceSpriteCache.get(key).blit(screen,x-120*scale,y-72*scale,scale);
}

export function paintVehicle(screen, model, car, x, y, scale) {
  if (!model) return;
  const profile = PROFILES[model.id];
  if (!profile) return;
  const color = car?.color ?? model.color;
  const wheelPart = slot => car?.installed ? (car.installed[slot]?.id ?? '') : 'tire-bias';
  const front = wheelPart('front-left'), rear = wheelPart('rear-left');
  const key = [model.id,color,car?.roof===true,car?.front!==false,car?.rear!==false,car?.decal||0,
    car?.jack||'',front,rear].join('/');
  if (!spriteCache.has(key)) {
    if (spriteCache.size >= 80) spriteCache.delete(spriteCache.keys().next().value);
    spriteCache.set(key,vehicleSprite(profile,model.id,car,vehiclePaint(color),front,rear));
  }
  spriteCache.get(key).blit(screen,x,y,scale);
}
