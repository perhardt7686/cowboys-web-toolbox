begin;

-- Reward state belongs to the signed-in account. Display recipes are returned
-- through a projection that checks approval and profile visibility explicitly.
create table community_private.avatar_reward_metric (
  id text primary key,
  game text not null check (game in ('mahjong','wordle','wordquest','plates','hotrod')),
  label text not null
);
create table community_private.avatar_reward_achievement (
  id text primary key,
  name text not null,
  tier text not null check (tier in ('starter','bronze','silver','gold','legendary','family')),
  group_id text not null check (group_id in ('mahjong','wordle','wordquest','plates','hotrod','cross','family')),
  match_type text not null default 'all' check (match_type in ('all','any')),
  position bigint generated always as identity unique
);
create table community_private.avatar_reward_requirement (
  achievement_id text not null references community_private.avatar_reward_achievement(id),
  metric_id text not null references community_private.avatar_reward_metric(id),
  target integer not null check (target>0),
  position bigint generated always as identity unique,
  primary key (achievement_id,metric_id)
);
create table community_private.avatar_reward_cosmetic (
  id text primary key check (id ~ '^[a-z][a-z0-9-]{0,63}$'),
  slot text not null check (slot in ('hat','eyewear','hair','eyes','prop','companion','background','effect')),
  achievement_id text not null references community_private.avatar_reward_achievement(id),
  name text not null check (char_length(name) between 1 and 72),
  tags text[] not null default '{}',
  position bigint generated always as identity unique
);
create index avatar_reward_cosmetics_by_achievement on community_private.avatar_reward_cosmetic(achievement_id);
create table community_private.avatar_reward_earned (
  member_id uuid not null references public.community_members(user_id) on delete cascade,
  achievement_id text not null references community_private.avatar_reward_achievement(id),
  awarded_at timestamptz not null default now(),
  seen_at timestamptz,
  primary key (member_id,achievement_id)
);
create table community_private.avatar_reward_current (
  member_id uuid primary key references public.community_members(user_id) on delete cascade,
  recipe jsonb not null check (jsonb_typeof(recipe)='object' and octet_length(recipe::text)<=3072),
  active boolean not null default false,
  revision bigint not null default 1 check (revision>0)
);
create table community_private.avatar_reward_outfit (
  member_id uuid not null references public.community_members(user_id) on delete cascade,
  slot integer not null check (slot between 1 and 6),
  name text not null check (char_length(name) between 1 and 32),
  recipe jsonb not null check (jsonb_typeof(recipe)='object' and octet_length(recipe::text)<=3072),
  updated_at timestamptz not null default now(),
  primary key (member_id,slot)
);
alter table community_private.avatar_reward_metric enable row level security;
alter table community_private.avatar_reward_achievement enable row level security;
alter table community_private.avatar_reward_requirement enable row level security;
alter table community_private.avatar_reward_cosmetic enable row level security;
alter table community_private.avatar_reward_earned enable row level security;
alter table community_private.avatar_reward_current enable row level security;
alter table community_private.avatar_reward_outfit enable row level security;
revoke all on community_private.avatar_reward_metric, community_private.avatar_reward_achievement,
  community_private.avatar_reward_requirement, community_private.avatar_reward_cosmetic,
  community_private.avatar_reward_earned, community_private.avatar_reward_current, community_private.avatar_reward_outfit
  from public, anon, authenticated;

insert into community_private.avatar_reward_metric(id,game,label) values
  ('mahj-wins','mahjong','Clear a Mahjong board'),
  ('mahj-levels','mahjong','Clear qualified Mahjong levels'),
  ('mahj-best','mahjong','Personal best Mahjong score'),
  ('wordle-clue-days','wordle','Days you revealed a matching letter'),
  ('wordle-points','wordle','Points earned from useful w0rdle guesses'),
  ('wordle-solves','wordle','w0rdle puzzles you solved'),
  ('wordle-team','wordle','Solved w0rdle days you helped'),
  ('wordle-streak','wordle','Longest streak of solved w0rdle days you helped'),
  ('wordle-coop','wordle','Solved w0rdle days you and a teammate both helped'),
  ('quest-clue-days','wordquest','Word Quest days you revealed a matching letter'),
  ('quest-xp','wordquest','Verified Word Quest XP'),
  ('quest-solves','wordquest','Word Quest puzzles you solved'),
  ('quest-team','wordquest','Solved Word Quest days you helped'),
  ('quest-coop','wordquest','Solved Word Quest days you and a teammate both helped'),
  ('plates-approved','plates','License Plate guesses approved by the other player'),
  ('rod-runs','hotrod','Recorded timed Hot Rod races'),
  ('rod-drags','hotrod','Drag races won'),
  ('rod-roads','hotrod','Road races won'),
  ('rod-wins','hotrod','Classic races won'),
  ('rod-points','hotrod','Verified Hot Rod career points'),
  ('rod-crowns','hotrod','The King defeated'),
  ('rod-mystery','hotrod','The Mystery Machine defeated'),
  ('rod-duels','hotrod','Family challenges where both drivers finished');

insert into community_private.avatar_reward_achievement(id,name,tier,group_id,match_type) values
  ('mahjong-first-board','First Clear','starter','mahjong','all'),
  ('mahjong-level-three','Three Paths','starter','mahjong','all'),
  ('mahjong-five-wins','Stack of Victories','bronze','mahjong','all'),
  ('mahjong-tilesmith','Tilesmith','bronze','mahjong','all'),
  ('mahjong-five-stages','Carved in Stone','silver','mahjong','all'),
  ('mahjong-ten-stages','Temple Explorer','gold','mahjong','all'),
  ('mahjong-stargazer','Nine Thousand Stars','legendary','mahjong','all'),

  ('wordle-first-clue','First Green Spark','starter','wordle','all'),
  ('wordle-score-25','Word Scout','starter','wordle','all'),
  ('wordle-first-solve','Word Detective','bronze','wordle','all'),
  ('wordle-three-days','Three-Day Sleuth','bronze','wordle','all'),
  ('wordle-score-75','Letter Lantern','silver','wordle','all'),
  ('wordle-team-three','Word Circle','gold','wordle','all'),
  ('wordle-streak-four','Four-Day Word Streak','legendary','wordle','all'),

  ('quest-first-clue','First Clue Found','starter','wordquest','all'),
  ('quest-xp-50','Trail Learner','starter','wordquest','all'),
  ('quest-first-solve','Quest Solver','bronze','wordquest','all'),
  ('quest-three-team-days','Quest Regular','bronze','wordquest','all'),
  ('quest-xp-200','Quest Adventurer','silver','wordquest','all'),
  ('quest-xp-400','Quest Pathfinder','gold','wordquest','all'),
  ('quest-master','Master of Quests','legendary','wordquest','all'),

  ('plates-first-approval','First Plate Ribbon','starter','plates','any'),
  ('plates-two-approvals','Double Spotter','starter','plates','any'),
  ('plates-three-approvals','Plate Pathfinder','bronze','plates','any'),
  ('plates-four-approvals','Four in the Album','bronze','plates','any'),
  ('plates-five-approvals','Highway Hall','silver','plates','any'),
  ('plates-seven-approvals','Road Atlas','gold','plates','any'),
  ('plates-ten-approvals','Grand Plate Tour','legendary','plates','any'),

  ('hotrod-first-run','First Time Slip','starter','hotrod','all'),
  ('hotrod-first-drag','Strip Starter','starter','hotrod','all'),
  ('hotrod-first-road','Road Rook','bronze','hotrod','all'),
  ('hotrod-points-25','Quick Shift','bronze','hotrod','all'),
  ('hotrod-five-wins','Five Finish Lines','silver','hotrod','all'),
  ('hotrod-classic-crown','King of the Road','gold','hotrod','all'),
  ('hotrod-mystery-trophy','Mystery Trophy','legendary','hotrod','all'),

  ('cross-double-play','Double Play','starter','cross','all'),
  ('cross-shop-class','Shop Class','starter','cross','all'),
  ('cross-letter-circuit','Letter Circuit','bronze','cross','all'),
  ('cross-three-games','Three-Game Tour','bronze','cross','all'),
  ('cross-track-and-tiles','Track and Tiles','silver','cross','all'),
  ('cross-game-room','Game Room Regular','gold','cross','all'),
  ('cross-arcade-legend','Arcade Legend','legendary','cross','all'),

  ('family-first-word','A Clue Together','family','family','all'),
  ('family-quest-crew','Quest Crew','family','family','all'),
  ('family-friendly-run','Family Race Day','family','family','all'),
  ('family-two-word-games','Two Word Teams','family','family','all'),
  ('family-puzzle-party','Puzzle Party','family','family','all'),
  ('family-garage-rivals','Garage Rivals','family','family','all'),
  ('family-all-star-crew','All-Star Family Crew','family','family','all');

insert into community_private.avatar_reward_requirement(achievement_id,metric_id,target) values
  ('mahjong-first-board','mahj-wins',1),
  ('mahjong-level-three','mahj-levels',3),
  ('mahjong-five-wins','mahj-wins',5),
  ('mahjong-tilesmith','mahj-best',4500),
  ('mahjong-five-stages','mahj-levels',5),
  ('mahjong-ten-stages','mahj-levels',10),
  ('mahjong-stargazer','mahj-best',9000),

  ('wordle-first-clue','wordle-clue-days',1),
  ('wordle-score-25','wordle-points',25),
  ('wordle-first-solve','wordle-solves',1),
  ('wordle-three-days','wordle-clue-days',3),
  ('wordle-score-75','wordle-points',75),
  ('wordle-team-three','wordle-team',3),
  ('wordle-streak-four','wordle-streak',4),

  ('quest-first-clue','quest-clue-days',1),
  ('quest-xp-50','quest-xp',50),
  ('quest-first-solve','quest-solves',1),
  ('quest-three-team-days','quest-team',3),
  ('quest-xp-200','quest-xp',200),
  ('quest-xp-400','quest-xp',400),
  ('quest-master','quest-solves',4),('quest-master','quest-team',5),

  -- The match remains limited to its existing participants. Every board
  -- member has a second, similarly paced path through an unrestricted game.
  ('plates-first-approval','plates-approved',1),('plates-first-approval','wordle-clue-days',1),
  ('plates-two-approvals','plates-approved',2),('plates-two-approvals','quest-xp',50),
  ('plates-three-approvals','plates-approved',3),('plates-three-approvals','mahj-levels',3),
  ('plates-four-approvals','plates-approved',4),('plates-four-approvals','wordle-clue-days',3),
  ('plates-five-approvals','plates-approved',5),('plates-five-approvals','quest-xp',200),
  ('plates-seven-approvals','plates-approved',7),('plates-seven-approvals','mahj-levels',10),
  ('plates-ten-approvals','plates-approved',10),('plates-ten-approvals','mahj-best',9000),

  ('hotrod-first-run','rod-runs',1),
  ('hotrod-first-drag','rod-drags',1),
  ('hotrod-first-road','rod-roads',1),
  ('hotrod-points-25','rod-points',25),
  ('hotrod-five-wins','rod-wins',5),
  ('hotrod-classic-crown','rod-crowns',1),
  ('hotrod-mystery-trophy','rod-mystery',1),

  ('cross-double-play','mahj-wins',1),('cross-double-play','wordle-clue-days',1),
  ('cross-shop-class','rod-runs',1),('cross-shop-class','quest-clue-days',1),
  ('cross-letter-circuit','wordle-clue-days',3),('cross-letter-circuit','quest-xp',50),
  ('cross-three-games','mahj-levels',2),('cross-three-games','wordle-points',25),('cross-three-games','quest-xp',50),
  ('cross-track-and-tiles','rod-drags',1),('cross-track-and-tiles','mahj-best',5500),
  ('cross-game-room','mahj-levels',5),('cross-game-room','wordle-points',75),('cross-game-room','quest-xp',200),('cross-game-room','rod-wins',2),
  ('cross-arcade-legend','mahj-best',8000),('cross-arcade-legend','wordle-solves',1),('cross-arcade-legend','quest-xp',400),('cross-arcade-legend','rod-wins',5),

  ('family-first-word','wordle-coop',1),
  ('family-quest-crew','quest-coop',1),
  ('family-friendly-run','rod-duels',1),
  ('family-two-word-games','wordle-coop',1),('family-two-word-games','quest-coop',1),
  ('family-puzzle-party','wordle-coop',3),('family-puzzle-party','quest-coop',2),
  ('family-garage-rivals','rod-duels',2),
  ('family-all-star-crew','wordle-coop',2),('family-all-star-crew','quest-coop',2),('family-all-star-crew','rod-duels',1);

-- COSMETIC CATALOG START --
insert into community_private.avatar_reward_cosmetic(id,slot,achievement_id,name,tags) values
  ('dragon-crown','hat','mahjong-ten-stages','Dragon Crown',array['dragon','royal']::text[]),
  ('giant-taco-hat','hat','mahjong-first-board','Giant Taco Hat',array['food','funny']::text[]),
  ('rubber-chicken-helmet','hat','quest-first-clue','Rubber Chicken Helmet',array['animal','funny']::text[]),
  ('viking-battle-helmet','hat','hotrod-first-drag','Viking Battle Helmet',array['history','norse']::text[]),
  ('golden-crocodile-crown','hat','family-all-star-crew','Golden Crocodile Crown',array['animal','royal']::text[]),
  ('alien-antenna-helmet','hat','cross-shop-class','Alien Antenna Helmet',array['space','funny']::text[]),
  ('flaming-cowboy-hat','hat','family-puzzle-party','Flaming Cowboy Hat',array['western','fire']::text[]),
  ('disco-ball-helmet','hat','mahjong-level-three','Disco Ball Helmet',array['party','shiny']::text[]),
  ('pizza-crown','hat','wordle-score-75','Pizza Crown',array['food','royal']::text[]),
  ('mushroom-wizard-hat','hat','quest-first-clue','Mushroom Wizard Hat',array['magic','garden']::text[]),
  ('space-captain-helmet','hat','plates-four-approvals','Space Captain Helmet',array['space','helmet']::text[]),
  ('birthday-cake-hat','hat','hotrod-mystery-trophy','Birthday Cake Hat',array['party','food']::text[]),
  ('cheese-wedge-hat','hat','cross-letter-circuit','Cheese Wedge Hat',array['food','funny']::text[]),
  ('pirate-captain-hat','hat','family-garage-rivals','Pirate Captain Hat',array['pirate','history']::text[]),
  ('dragon-skull-helmet','hat','mahjong-five-wins','Dragon Skull Helmet',array['dragon','mask']::text[]),
  ('flying-saucer-hat','hat','wordle-team-three','Flying Saucer Hat',array['space','ufo']::text[]),
  ('retro-tv-helmet','hat','quest-xp-50','Retro TV Helmet',array['retro','technology']::text[]),
  ('royal-chicken-crown','hat','plates-five-approvals','Royal Chicken Crown',array['animal','royal']::text[]),
  ('galactic-warrior-helmet','hat','hotrod-first-run','Galactic Warrior Helmet',array['space','helmet']::text[]),
  ('aurora-crown','hat','cross-arcade-legend','Aurora Crown',array['magic','legendary']::text[]),
  ('mythical-storm-helmet','hat','family-all-star-crew','Mythical Storm Helmet',array['weather','legendary']::text[]),
  ('frog-bucket-hat','hat','mahjong-tilesmith','Frog Bucket Hat',array['animal','garden']::text[]),
  ('octopus-beret','hat','wordle-streak-four','Octopus Beret',array['ocean','animal']::text[]),
  ('teapot-topper','hat','quest-first-solve','Teapot Topper',array['kitchen','funny']::text[]),
  ('pie-stack-hat','hat','plates-seven-approvals','Pie Stack Hat',array['food','funny']::text[]),
  ('jellyfish-beanie','hat','hotrod-first-drag','Jellyfish Beanie',array['ocean','animal']::text[]),
  ('toast-helmet','hat','cross-track-and-tiles','Toast Helmet',array['food','funny']::text[]),
  ('race-striped-helmet','hat','family-first-word','Race Stripe Helmet',array['race','helmet']::text[]),
  ('domino-top-hat','hat','mahjong-five-stages','Domino Top Hat',array['tabletop','formal']::text[]),
  ('traffic-cone-hat','hat','wordle-first-clue','Traffic Cone Hat',array['funny','garage']::text[]),
  ('fox-ears-hood','hat','quest-three-team-days','Fox Ears Hood',array['animal','hood']::text[]),
  ('pinwheel-hat','hat','plates-ten-approvals','Pinwheel Hat',array['party','toy']::text[]),
  ('boomerang-cowboy-hat','hat','hotrod-first-road','Boomerang Cowboy Hat',array['western','funny']::text[]),
  ('paper-boat-captain','hat','cross-game-room','Paper Boat Captain',array['ocean','craft']::text[]),
  ('rubber-duck-rain-hat','hat','family-quest-crew','Rubber Duck Rain Hat',array['animal','weather']::text[]),
  ('ice-cream-sundae-hat','hat','mahjong-ten-stages','Ice Cream Sundae Hat',array['food','party']::text[]),
  ('tangled-noodle-bowl','hat','wordle-score-25','Tangled Noodle Bowl',array['food','funny']::text[]),
  ('goodnight-moon-cap','hat','quest-xp-200','Goodnight Moon Cap',array['sleep','space']::text[]),
  ('blueberry-muffin-hat','hat','plates-first-approval','Blueberry Muffin Hat',array['food','funny']::text[]),
  ('bat-pilot-helmet','hat','hotrod-points-25','Bat Pilot Helmet',array['animal','helmet']::text[]),
  ('garden-gnome-hat','hat','cross-arcade-legend','Garden Gnome Hat',array['garden','story']::text[]),
  ('cloud-float-hat','hat','family-friendly-run','Cloud Float Hat',array['weather','magic']::text[]),
  ('snow-globe-hat','hat','mahjong-stargazer','Snow Globe Hat',array['winter','magic']::text[]),
  ('treasure-chest-helmet','hat','wordle-first-solve','Treasure Chest Helmet',array['pirate','rare']::text[]),
  ('billiards-rack-hat','hat','quest-xp-400','Billiards Rack Hat',array['tabletop','funny']::text[]),
  ('crab-captain-hat','hat','plates-two-approvals','Crab Captain Hat',array['ocean','animal']::text[]),
  ('popcorn-bucket-hat','hat','hotrod-five-wins','Popcorn Bucket Hat',array['food','cinema']::text[]),
  ('hedgehog-cap','hat','cross-double-play','Hedgehog Cap',array['animal','garden']::text[]),
  ('bubble-tea-hat','hat','family-two-word-games','Bubble Tea Hat',array['food','funny']::text[]),
  ('lighthouse-hat','hat','mahjong-first-board','Lighthouse Hat',array['ocean','tower']::text[]),
  ('googly-glasses','eyewear','quest-xp-50','Googly Glasses',array['funny','animated']::text[]),
  ('hypnotic-spiral-glasses','eyewear','plates-five-approvals','Hypnotic Spiral Glasses',array['magic','retro']::text[]),
  ('heart-sunglasses','eyewear','hotrod-first-run','Heart-Shaped Sunglasses',array['party','hearts']::text[]),
  ('laser-goggles','eyewear','cross-three-games','Laser Goggles',array['sci-fi','neon']::text[]),
  ('pirate-eyepatch','eyewear','family-all-star-crew','Pirate Eyepatch',array['pirate','patch']::text[]),
  ('rainbow-visor','eyewear','mahjong-five-wins','Rainbow Visor',array['neon','retro']::text[]),
  ('golden-monocle','eyewear','wordle-team-three','Golden Monocle',array['formal','retro']::text[]),
  ('mad-scientist-goggles','eyewear','quest-first-solve','Mad Scientist Goggles',array['science','retro']::text[]),
  ('pixel-sunglasses','eyewear','plates-seven-approvals','Pixel Sunglasses',array['pixel','retro']::text[]),
  ('cyberpunk-visor','eyewear','hotrod-first-drag','Cyberpunk Visor',array['sci-fi','neon']::text[]),
  ('dragon-eye-glasses','eyewear','cross-track-and-tiles','Dragon-Eye Glasses',array['dragon','animal']::text[]),
  ('giant-comedy-spectacles','eyewear','family-first-word','Giant Comedy Spectacles',array['funny','retro']::text[]),
  ('butterfly-mask','eyewear','mahjong-tilesmith','Butterfly Mask',array['garden','mask']::text[]),
  ('luna-moth-mask','eyewear','wordle-streak-four','Luna Moth Mask',array['night','animal']::text[]),
  ('northern-ski-goggles','eyewear','quest-three-team-days','Northern Ski Goggles',array['winter','sports']::text[]),
  ('clockwork-double-monocle','eyewear','plates-ten-approvals','Clockwork Double Monocle',array['clockwork','formal']::text[]),
  ('banana-split-shades','eyewear','hotrod-first-road','Banana Split Shades',array['food','funny']::text[]),
  ('comet-trail-specs','eyewear','cross-game-room','Comet-Trail Specs',array['space','magic']::text[]),
  ('flower-power-shades','eyewear','family-quest-crew','Flower Power Shades',array['garden','retro']::text[]),
  ('checkerboard-racing-shades','eyewear','mahjong-five-stages','Checkerboard Racing Shades',array['race','pattern']::text[]),
  ('crescent-moon-frames','eyewear','wordle-first-clue','Crescent Moon Frames',array['space','moon']::text[]),
  ('chalkboard-glasses','eyewear','quest-xp-200','Chalkboard Glasses',array['school','funny']::text[]),
  ('teardrop-safety-goggles','eyewear','plates-first-approval','Teardrop Safety Goggles',array['science','ocean']::text[]),
  ('bubble-wand-glasses','eyewear','hotrod-points-25','Bubble Wand Glasses',array['party','bubbles']::text[]),
  ('hologram-hex-specs','eyewear','cross-arcade-legend','Hologram Hex Specs',array['science','animated']::text[]),
  ('windshield-wiper-glasses','eyewear','family-friendly-run','Windshield Wiper Glasses',array['weather','animated']::text[]),
  ('cat-eye-glasses','eyewear','mahjong-ten-stages','Cat-Eye Glasses',array['retro','formal']::text[]),
  ('cinema-double-feature','eyewear','wordle-score-25','Cinema Double Feature',array['cinema','retro']::text[]),
  ('candy-cane-spectacles','eyewear','quest-xp-400','Candy Cane Spectacles',array['food','winter']::text[]),
  ('magic-keyhole-mask','eyewear','plates-two-approvals','Magic Keyhole Mask',array['magic','mask']::text[]),
  ('robot-scanner','eyewear','hotrod-five-wins','Robot Scanner',array['robot','animated']::text[]),
  ('starburst-gala-glasses','eyewear','cross-double-play','Starburst Gala Glasses',array['party','space']::text[]),
  ('masquerade-feather-mask','eyewear','family-two-word-games','Masquerade Feather Mask',array['formal','mask']::text[]),
  ('welder-flip-goggles','eyewear','mahjong-stargazer','Welder Flip Goggles',array['garage','science']::text[]),
  ('bird-beak-mask','eyewear','wordle-first-solve','Bird Beak Mask',array['animal','mask']::text[]),
  ('rainbow-lightning-hair','hair','wordle-first-clue','Rainbow Lightning Hair',array['neon','animated']::text[]),
  ('flaming-hair','hair','cross-game-room','Flaming Hair',array['fire','animated']::text[]),
  ('lightning-bolt-hair','hair','family-quest-crew','Lightning Bolt Hair',array['weather','neon']::text[]),
  ('cosmic-purple-hair','hair','mahjong-five-stages','Cosmic Purple Hair',array['space','rare']::text[]),
  ('neon-green-curls','hair','wordle-first-clue','Neon Green Curls',array['neon','garden']::text[]),
  ('electric-blue-spikes','hair','quest-three-team-days','Electric Blue Spikes',array['neon','science']::text[]),
  ('viking-battle-braids','hair','plates-ten-approvals','Viking Battle Braids',array['history','norse']::text[]),
  ('galaxy-hair','hair','hotrod-points-25','Galaxy Hair',array['space','legendary']::text[]),
  ('golden-glowing-hair','hair','cross-arcade-legend','Golden Glowing Hair',array['shiny','animated']::text[]),
  ('jelly-braids','hair','family-friendly-run','Jelly Braids',array['funny','neon']::text[]),
  ('space-bun-satellites','hair','mahjong-ten-stages','Space Bun Satellites',array['space','toy']::text[]),
  ('waterfall-hair','hair','wordle-score-25','Waterfall Hair',array['water','nature']::text[]),
  ('whipped-cream-quiff','hair','quest-xp-200','Whipped Cream Quiff',array['food','funny']::text[]),
  ('orchid-braid-bob','hair','plates-first-approval','Orchid Braid Bob',array['garden','formal']::text[]),
  ('checkered-flag-fringe','hair','hotrod-five-wins','Checkered Flag Fringe',array['race','pattern']::text[]),
  ('cotton-candy-puffs','hair','cross-double-play','Cotton Candy Puffs',array['food','party']::text[]),
  ('tornado-swirl-cut','hair','family-two-word-games','Tornado Swirl Cut',array['weather','magic']::text[]),
  ('volcano-mohawk','hair','mahjong-stargazer','Volcano Mohawk',array['fire','rare']::text[]),
  ('moonlit-pigtail-curls','hair','wordle-first-solve','Moonlit Pigtail Curls',array['space','sleep']::text[]),
  ('lemon-sherbet-waves','hair','quest-xp-400','Lemon Sherbet Waves',array['food','sunshine']::text[]),
  ('storm-cloud-afro','hair','plates-two-approvals','Storm Cloud Afro',array['weather','magic']::text[]),
  ('autumn-leaf-locks','hair','hotrod-classic-crown','Autumn Leaf Locks',array['nature','autumn']::text[]),
  ('bubblegum-layered-hair','hair','cross-shop-class','Bubblegum Layered Hair',array['food','funny']::text[]),
  ('opal-ribbon-cut','hair','family-puzzle-party','Opal Ribbon Cut',array['opulent','magic']::text[]),
  ('circuit-board-bob','hair','mahjong-first-board','Circuit Board Bob',array['technology','neon']::text[]),
  ('glass-comb-cut','hair','wordle-three-days','Glass Comb Cut',array['ice','rare']::text[]),
  ('bee-hive-bouffant','hair','quest-master','Bee Hive Bouffant',array['animal','garden']::text[]),
  ('snowflake-fade','hair','plates-three-approvals','Snowflake Fade',array['winter','ice']::text[]),
  ('dragon-scale-crest','hair','hotrod-mystery-trophy','Dragon Scale Crest',array['dragon','magic']::text[]),
  ('maple-bun-with-chopsticks','hair','cross-letter-circuit','Maple Bun with Chopsticks',array['formal','rare']::text[]),
  ('dandelion-fluff-hair','hair','family-garage-rivals','Dandelion Fluff Hair',array['garden','nature']::text[]),
  ('campfire-curls','hair','mahjong-level-three','Campfire Curls',array['fire','nature']::text[]),
  ('kite-string-ponytail','hair','wordle-score-75','Kite String Ponytail',array['toy','wind']::text[]),
  ('seashell-sculpted-bob','hair','quest-first-clue','Seashell Sculpted Bob',array['ocean','formal']::text[]),
  ('slinky-spring-hair','hair','plates-four-approvals','Slinky Spring Hair',array['toy','funny']::text[]),
  ('mosaic-petal-cut','hair','hotrod-first-run','Mosaic Petal Cut',array['garden','pattern']::text[]),
  ('puff-of-stars','hair','cross-three-games','Puff of Stars',array['space','party']::text[]),
  ('jigsaw-jazz-hair','hair','family-all-star-crew','Jigsaw Jazz Hair',array['tabletop','pattern']::text[]),
  ('seaweed-pigtail-bows','hair','mahjong-five-wins','Seaweed Pigtail Bows',array['ocean','nature']::text[]),
  ('comet-shard-quiff','hair','wordle-team-three','Comet Shard Quiff',array['space','rare']::text[]),
  ('rose-vine-twist','hair','quest-xp-50','Rose Vine Twist',array['garden','formal']::text[]),
  ('galaxy-eyes','eyes','wordle-score-75','Galaxy Eyes',array['space','galaxy']::text[]),
  ('cat-eyes','eyes','mahjong-stargazer','Cat Eyes',array['animal']::text[]),
  ('clockwork-eyes','eyes','wordle-first-solve','Clockwork Eyes',array['mechanical']::text[]),
  ('spiral-eyes','eyes','quest-xp-400','Spiral Eyes',array['goofy']::text[]),
  ('hologram-eyes','eyes','plates-two-approvals','Hologram Eyes',array['space','tech']::text[]),
  ('moon-phase-eyes','eyes','hotrod-five-wins','Moon Phase Eyes',array['space','moon']::text[]),
  ('diamond-iris','eyes','cross-double-play','Diamond Iris',array['gem']::text[]),
  ('candy-swirl-eyes','eyes','family-puzzle-party','Candy Swirl Eyes',array['food']::text[]),
  ('checker-eyes','eyes','mahjong-first-board','Checker Eyes',array['racing']::text[]),
  ('flower-iris','eyes','wordle-three-days','Daisy Iris',array['garden']::text[]),
  ('rocket-face-paint','eyes','quest-master','Rocket Face Paint',array['space','rocket']::text[]),
  ('cat-whiskers','eyes','plates-three-approvals','Cat Whiskers',array['animal']::text[]),
  ('rainbow-cheeks','eyes','hotrod-classic-crown','Rainbow Cheeks',array['rainbow']::text[]),
  ('tire-mark-warpaint','eyes','cross-shop-class','Tire Mark Warpaint',array['racing']::text[]),
  ('viking-warpaint','eyes','family-garage-rivals','Viking Warpaint',array['warrior']::text[]),
  ('freckle-constellation','eyes','mahjong-level-three','Freckle Constellation',array['space','stars']::text[]),
  ('leaf-face-paint','eyes','wordle-score-75','Forest Leaves',array['garden']::text[]),
  ('honeybee-cheeks','eyes','quest-first-clue','Honeybee Cheeks',array['garden','animal']::text[]),
  ('dragon-scales-face','eyes','plates-four-approvals','Dragon Scales',array['dragon','fantasy']::text[]),
  ('lightning-face-paint','eyes','hotrod-mystery-trophy','Lightning Cheeks',array['storm']::text[]),
  ('pirate-scar','eyes','cross-letter-circuit','Pirate Scar',array['pirate']::text[]),
  ('stage-stars','eyes','family-all-star-crew','Stage Stars',array['music','stars']::text[]),
  ('crescent-cheek','eyes','mahjong-five-wins','Moon and Comet',array['moon','space']::text[]),
  ('brick-brows','eyes','wordle-team-three','Brick Brows',array['goofy','building']::text[]),
  ('avian-brows','eyes','quest-xp-50','Feather Brows',array['bird']::text[]),
  ('crown-brows','eyes','plates-five-approvals','Royal Brows',array['royal']::text[]),
  ('cloud-brows','eyes','hotrod-first-run','Cloud Brows',array['weather']::text[]),
  ('chipmunk-grin','eyes','cross-three-games','Chipmunk Grin',array['animal','expression']::text[]),
  ('robot-mouth','eyes','family-first-word','Robot Speaker',array['tech','goofy']::text[]),
  ('fangy-grin','eyes','mahjong-tilesmith','Tiny Vampire Fangs',array['fantasy','expression']::text[]),
  ('rubber-chicken','prop','wordle-score-75','Rubber Chicken',array[]::text[]),
  ('viking-shield','prop','quest-first-clue','Runic Viking Shield',array[]::text[]),
  ('magic-wand','prop','plates-four-approvals','Star-Tipped Magic Wand',array[]::text[]),
  ('floating-pizza','prop','hotrod-mystery-trophy','Floating Pizza',array[]::text[]),
  ('giant-sandwich','prop','cross-letter-circuit','Stacked Deli Sandwich',array[]::text[]),
  ('flying-toaster','prop','family-garage-rivals','Flying Toaster',array[]::text[]),
  ('golden-trophy','prop','mahjong-level-three','Golden Trophy',array[]::text[]),
  ('lightning-staff','prop','wordle-team-three','Lightning Staff',array[]::text[]),
  ('waffle-shield','prop','quest-xp-50','Waffle Shield',array[]::text[]),
  ('floating-spellbook','prop','plates-five-approvals','Floating Spellbook',array[]::text[]),
  ('foam-finger','prop','hotrod-first-run','Giant Foam Finger',array[]::text[]),
  ('pocket-arcade','prop','cross-three-games','Pocket Arcade',array[]::text[]),
  ('moon-balloon','prop','family-all-star-crew','Moon Balloon',array[]::text[]),
  ('bubble-tea','prop','mahjong-five-wins','Bubble Tea Buddy',array[]::text[]),
  ('cassette-tape','prop','wordle-streak-four','Mixtape Cassette',array[]::text[]),
  ('pencil-rocket','prop','quest-first-solve','Pencil Rocket',array[]::text[]),
  ('ice-cream-tower','prop','plates-seven-approvals','Triple Scoop Tower',array[]::text[]),
  ('compass-rose','prop','hotrod-first-drag','Compass Rose',array[]::text[]),
  ('camping-lantern','prop','cross-track-and-tiles','Firelight Lantern',array[]::text[]),
  ('telescope','prop','family-first-word','Stargazer Telescope',array[]::text[]),
  ('cactus-pot','prop','mahjong-tilesmith','Flowerpot Cactus',array[]::text[]),
  ('tabletop-globe','prop','wordle-first-clue','Family Adventure Globe',array[]::text[]),
  ('enchanted-umbrella','prop','quest-three-team-days','Enchanted Umbrella',array[]::text[]),
  ('disco-microphone','prop','plates-ten-approvals','Disco Microphone',array[]::text[]),
  ('checkerboard','prop','hotrod-first-road','Travel Checkerboard',array[]::text[]),
  ('tiny-sailboat','prop','cross-game-room','Bottle-Cap Sailboat',array[]::text[]),
  ('magic-polaroid','prop','family-quest-crew','Instant Camera',array[]::text[]),
  ('honey-jar','prop','mahjong-five-stages','Bumblebee Honey Jar',array[]::text[]),
  ('mini-dragon','companion','quest-xp-50','Mini Dragon',array[]::text[]),
  ('floating-crocodile','companion','family-first-word','Floating Crocodile',array[]::text[]),
  ('tin-robot','companion','cross-track-and-tiles','Tin Robot Companion',array[]::text[]),
  ('pirate-parrot','companion','family-first-word','Pirate Parrot',array[]::text[]),
  ('tiny-ufo','companion','mahjong-tilesmith','Tiny UFO',array[]::text[]),
  ('ghost-companion','companion','wordle-streak-four','Peekaboo Ghost',array[]::text[]),
  ('baby-dinosaur','companion','quest-first-solve','Baby Stegosaur',array[]::text[]),
  ('tiny-viking','companion','plates-ten-approvals','Pocket Viking',array[]::text[]),
  ('storm-dragon','companion','hotrod-first-road','Storm Dragon',array[]::text[]),
  ('cloud-sheep','companion','cross-game-room','Cloud Sheep',array[]::text[]),
  ('marshmallow-fox','companion','family-quest-crew','Marshmallow Fox',array[]::text[]),
  ('moon-jelly','companion','mahjong-five-stages','Moon Jellyfish',array[]::text[]),
  ('pocket-axolotl','companion','wordle-first-clue','Pocket Axolotl',array[]::text[]),
  ('busy-bumblebee','companion','quest-three-team-days','Busy Bumblebee',array[]::text[]),
  ('teacup-mouse','companion','plates-first-approval','Teacup Mouse',array[]::text[]),
  ('coral-octopus','companion','hotrod-points-25','Coral Octopus',array[]::text[]),
  ('raspberry-snail','companion','cross-arcade-legend','Raspberry Snail',array[]::text[]),
  ('penguin-postman','companion','family-friendly-run','Penguin Postman',array[]::text[]),
  ('squeaky-otter','companion','mahjong-ten-stages','River Otter',array[]::text[]),
  ('bookish-owl','companion','wordle-score-25','Bookish Owl',array[]::text[]),
  ('firefly-frog','companion','quest-xp-200','Firefly Frog',array[]::text[]),
  ('bunny-baker','companion','plates-two-approvals','Bunny Baker',array[]::text[]),
  ('derby-duck','companion','hotrod-five-wins','Roller Derby Duck',array[]::text[]),
  ('rocket-cat','companion','cross-double-play','Rocket Cat',array[]::text[]),
  ('peekaboo-mimic','companion','family-two-word-games','Peekaboo Treasure Chest',array[]::text[]),
  ('alpaca-scarf','companion','mahjong-stargazer','Scarf Alpaca',array[]::text[]),
  ('golden-koi','companion','wordle-first-solve','Golden Sky Koi',array[]::text[]),
  ('galaxy-portal','background','cross-track-and-tiles','Galaxy Portal',array[]::text[]),
  ('sunflower-field','background','family-friendly-run','Sunflower Field',array[]::text[]),
  ('northern-fjord','background','mahjong-ten-stages','Northern Fjord',array[]::text[]),
  ('mushroom-cove','background','wordle-score-25','Mushroom Cove',array[]::text[]),
  ('undersea-castle','background','quest-xp-200','Undersea Castle',array[]::text[]),
  ('paint-splash','background','plates-first-approval','Paint Splash Wall',array[]::text[]),
  ('retro-arcade','background','hotrod-points-25','Retro Arcade Grid',array[]::text[]),
  ('meteor-shower','background','cross-double-play','Meteor Shower',array[]::text[]),
  ('geode-cave','background','family-two-word-games','Rainbow Geode Cave',array[]::text[]),
  ('violet-library','background','mahjong-stargazer','Violet Library',array[]::text[]),
  ('sweetshop','background','wordle-first-solve','Cloud Candy Shop',array[]::text[]),
  ('winter-cabin','background','quest-xp-400','Winter Cabin',array[]::text[]),
  ('midnight-city','background','plates-two-approvals','Midnight City',array[]::text[]),
  ('skate-park','background','hotrod-five-wins','Sunset Skate Park',array[]::text[]),
  ('coral-lagoon','background','cross-shop-class','Coral Lagoon',array[]::text[]),
  ('comet-meadow','background','family-puzzle-party','Comet Meadow',array[]::text[]),
  ('ink-waves','background','mahjong-first-board','Woodcut Waves',array[]::text[]),
  ('storybook-forest','background','wordle-three-days','Storybook Forest',array[]::text[]),
  ('tangerine-desert','background','quest-master','Tangerine Desert',array[]::text[]),
  ('night-market','background','plates-three-approvals','Night Market Lanterns',array[]::text[]),
  ('bottle-ocean','background','hotrod-classic-crown','Storm in a Bottle',array[]::text[]),
  ('paper-optics','background','cross-letter-circuit','Kaleidoscope Paper',array[]::text[]),
  ('daybreak-mountains','background','family-garage-rivals','Daybreak Mountains',array[]::text[]),
  ('pixel-picnic','background','mahjong-level-three','Pixel Picnic',array[]::text[]),
  ('starlit-train','background','wordle-score-75','Starlit Night Train',array[]::text[]),
  ('aurora-halo','effect','mahjong-first-board','Aurora Halo',array[]::text[]),
  ('lightning-aura','effect','wordle-three-days','Lightning Aura',array[]::text[]),
  ('rainbow-flames','effect','plates-three-approvals','Rainbow Flames',array[]::text[]),
  ('victory-wings','effect','hotrod-classic-crown','Golden Victory Wings',array[]::text[]),
  ('floating-runes','effect','hotrod-classic-crown','Floating Runes',array[]::text[]),
  ('celestial-armor','effect','hotrod-mystery-trophy','Celestial Armor',array[]::text[]),
  ('comet-trail','effect','family-puzzle-party','Comet Trail',array[]::text[]),
  ('rose-petals','effect','mahjong-level-three','Rose Petal Drift',array[]::text[]),
  ('rainbow-prism','effect','wordle-score-75','Rainbow Prism',array[]::text[]),
  ('falling-starlight','effect','quest-first-clue','Falling Starlight',array[]::text[]),
  ('firefly-orbit','effect','plates-four-approvals','Firefly Orbit',array[]::text[]),
  ('enchanted-confetti','effect','hotrod-mystery-trophy','Enchanted Confetti',array[]::text[]),
  ('frozen-halo','effect','cross-letter-circuit','Frozen Halo',array[]::text[]),
  ('orbiting-hearts','effect','family-garage-rivals','Orbiting Hearts',array[]::text[]),
  ('ribbon-dance','effect','mahjong-five-wins','Ribbon Dance',array[]::text[]);
-- COSMETIC CATALOG END --

create index avatar_reward_wordle_clues on public.community_wordle_guesses(user_id,game_date)
  where points>0 and feedback && array['correct','present'];
create index avatar_reward_quest_clues on public.community_word_guesses(user_id,game_date)
  where feedback && array['correct','present'];
create index avatar_reward_approved_plates on public.community_plate_entries(author_id)
  where status='approved' and approved_at is not null;

create function community_private.avatar_reward_viewer()
returns uuid language plpgsql stable security invoker set search_path=''
as $$
declare
  viewer uuid := auth.uid();
begin
  if viewer is null or not exists(
    select 1 from public.community_members where user_id=viewer and status='approved'
  ) then
    raise exception 'Approved family membership required' using errcode='42501';
  end if;
  return viewer;
end;
$$;

create function community_private.avatar_reward_metrics(p_member uuid)
returns jsonb language sql stable security invoker set search_path=''
as $$
  with wordle_days as (
    select g.game_date, sum(g.points)::bigint as points, d.solved_at is not null as solved,
      coalesce(d.solved_by=p_member,false) as solver,
      d.solved_at is not null and exists (
        select 1 from public.community_wordle_guesses other
        join public.community_members member on member.user_id=other.user_id and member.status='approved'
        where other.game_date=g.game_date and other.user_id<>p_member and other.points>0
          and other.feedback && array['correct','present']
      ) as together
    from public.community_wordle_guesses g
    join public.community_wordle_days d on d.game_date=g.game_date
    where g.user_id=p_member and g.points>0 and g.feedback && array['correct','present']
    group by g.game_date,d.solved_at,d.solved_by
  ), wordle_streak as (
    select game_date - (row_number() over(order by game_date))::integer as starts
    from wordle_days where solved
  ), wordle_best as (
    select coalesce(max(n),0) as consecutive from (select count(*) as n from wordle_streak group by starts) runs
  ), quest_archived as (
    select a.game_date, a.solved_at, a.solved_by,
      count(*) filter(where g.pick->>'user_id'=p_member::text) as same_member,
      sum((g.pick->>'points')::integer) filter(where g.pick->>'user_id'=p_member::text) as points,
      count(*) filter(where helper.user_id is not null and helper.user_id<>p_member) as others
    from public.community_word_archived_rounds a
    cross join lateral jsonb_array_elements(case when jsonb_typeof(a.guesses)='array' then a.guesses else '[]'::jsonb end) g(pick)
    left join public.community_members helper on helper.user_id::text=g.pick->>'user_id' and helper.status='approved'
    where a.guesses @> jsonb_build_array(jsonb_build_object('user_id',p_member::text))
      and jsonb_typeof(g.pick->'points')='number'
      and (g.pick->>'points') ~ '^[0-9]{1,7}$'
      and (g.pick->'feedback') ?| array['correct','present']
    group by a.id,a.game_date,a.solved_at,a.solved_by
  ), quest_rounds as (
    select g.game_date, sum(g.points)::bigint as points, d.solved_at is not null as solved,
      coalesce(d.solved_by=p_member,false) as solver,
      d.solved_at is not null and exists (
        select 1 from public.community_word_guesses other
        join public.community_members member on member.user_id=other.user_id and member.status='approved'
        where other.game_date=g.game_date and other.user_id<>p_member
          and other.feedback && array['correct','present']
      ) as together
    from public.community_word_guesses g join public.community_word_days d on d.game_date=g.game_date
    where g.user_id=p_member and g.feedback && array['correct','present']
    group by g.game_date,d.solved_at,d.solved_by
    union all
    select game_date,points,solved_at is not null,coalesce(solved_by=p_member,false),
      solved_at is not null and others>0 from quest_archived where same_member>0
  ), plate_total as (
    select count(*) as eligible
    from public.community_plate_entries entry
    where entry.author_id=p_member and entry.status='approved' and entry.approved_at is not null
      and entry.approved_by<>entry.author_id and exists (
        select 1 from public.community_plate_votes vote
        join public.community_members member on member.user_id=vote.voter_id and member.status='approved'
        where vote.entry_id=entry.id and vote.voter_id=entry.approved_by and vote.approved
      )
  ), classic as (
    select count(*) filter(where rival<>'mystery' and
      (won or (kind='drag' and elapsed_ms>=15000) or (kind='road' and elapsed_ms>=55000))) as runs,
      count(*) filter(where kind='drag' and won and rival<>'mystery') as drags,
      count(*) filter(where kind='road' and won and rival<>'mystery') as roads,
      count(*) filter(where rival<>'mystery' and won) as wins,
      count(*) filter(where champion and won) as crowns,
      count(*) filter(where rival='mystery' and won) as mysteries,
      coalesce(sum(points),0)::bigint as points
    from community_private.hot_rod_result where user_id=p_member
  ), duels as (
    select count(*) filter(where mine.result->>'outcome'='finish' and other.result->>'outcome'='finish') as together,
      count(*) filter(where duel.winner=p_member and mine.result->>'outcome'='finish') as wins
    from community_private.hot_rod_duel duel
    join community_private.hot_rod_duel_run mine on mine.duel=duel.id and mine.user_id=p_member
    join community_private.hot_rod_duel_run other on other.duel=duel.id and other.user_id<>p_member
    join public.community_members member on member.user_id=other.user_id and member.status='approved'
    where duel.status='completed' and p_member in (duel.challenger,duel.challenged)
  )
  select jsonb_build_object(
    'mahj-wins',coalesce((select wins from public.community_mahjong_stats where user_id=p_member),0),
    'mahj-levels',coalesce((select levels_cleared from public.community_mahjong_campaign where user_id=p_member),0),
    'mahj-best',coalesce((select best_score from public.community_mahjong_stats where user_id=p_member),0),
    'wordle-clue-days',(select count(*) from wordle_days),
    'wordle-points',(select coalesce(sum(points),0) from wordle_days),
    'wordle-solves',(select count(*) from wordle_days where solved and solver),
    'wordle-team',(select count(*) from wordle_days where solved),
    'wordle-streak',(select consecutive from wordle_best),
    'wordle-coop',(select count(*) from wordle_days where together),
    'quest-clue-days',(select count(distinct game_date) from quest_rounds),
    'quest-xp',(select coalesce(sum(points),0)+25*count(distinct game_date) filter(where solved) from quest_rounds),
    'quest-solves',(select count(distinct game_date) from quest_rounds where solved and solver),
    'quest-team',(select count(distinct game_date) from quest_rounds where solved),
    'quest-coop',(select count(distinct game_date) from quest_rounds where together),
    'plates-approved',plate_total.eligible,
    'rod-runs',classic.runs,'rod-drags',classic.drags,'rod-roads',classic.roads,'rod-wins',classic.wins,
    'rod-crowns',classic.crowns,'rod-mystery',classic.mysteries,
    'rod-points',classic.points+20*duels.wins,'rod-duels',duels.together
  )
  from plate_total,classic,duels;
$$;

create function community_private.avatar_reward_award(p_member uuid,p_metrics jsonb)
returns void language sql security invoker set search_path=''
as $$
  insert into community_private.avatar_reward_earned(member_id,achievement_id)
  select p_member,a.id from community_private.avatar_reward_achievement a
  join community_private.avatar_reward_requirement r on r.achievement_id=a.id
  group by a.id,a.match_type
  having case when a.match_type='any'
    then bool_or(coalesce((p_metrics->>r.metric_id)::bigint,0)>=r.target)
    else bool_and(coalesce((p_metrics->>r.metric_id)::bigint,0)>=r.target)
  end
  on conflict (member_id,achievement_id) do nothing;
$$;

create function community_private.avatar_reward_recipe(p_member uuid,p_recipe jsonb,p_legacy boolean default false)
returns jsonb language plpgsql stable security invoker set search_path=''
as $$
declare
  choices constant jsonb := '{
    "skin":["porcelain","sand","amber","copper","deep","espresso","tan","bisque"],
    "hair":["brown","black","blonde","auburn","silver","purple","chestnut","red","grey","pale"],
    "style":["short","wavy","curly","long","spiky","bald","braids","bun","locs","bob","part","crop","shaved","coils","ponytail"],
    "eyes":["brown","blue","green","hazel","grey","amber","black"],
    "shirt":["violet","teal","rose","gold","navy","forest","cream","rust","sky","plum","olive","black"],
    "background":["lavender","sunset","ocean","mint","night","cloud","sand","rose","heather","sky","peach"],
    "accessory":["none","glasses","freckles","headphones","crown","earrings","scarf","bowtie","badge"],
    "brows":["soft","straight","bold","arching"],
    "beard":["none","stubble","beard","moustache","goatee"],
    "expression":["smile","grin","calm","wink","curious"],
    "pose":["center","tilt","wave"],
    "hat":["none","cap","beanie","western","beret"],
    "glasses":["none","round","square","oval"]
  }';
  legacy_defaults constant jsonb := '{"brows":"soft","beard":"none","expression":"smile","pose":"center","hat":"none","glasses":"none","cosmetics":{}}';
  checked jsonb := p_recipe;
begin
  if p_recipe is null or jsonb_typeof(p_recipe)<>'object' or octet_length(p_recipe::text)>3072 then
    raise exception 'Choose a valid family character design' using errcode='22023';
  end if;
  if p_legacy then checked := legacy_defaults||p_recipe; end if;
  if exists (
    select 1 from jsonb_object_keys(checked) field(key) where field.key<>'cosmetics' and not (choices ? field.key)
  ) or exists (
    select 1 from jsonb_each(choices) choice
    where (jsonb_typeof(checked->choice.key)='string' and choice.value ? (checked->>choice.key)) is not true
  ) or jsonb_typeof(checked->'cosmetics') is distinct from 'object' then
    raise exception 'Choose a valid family character design' using errcode='22023';
  end if;
  if p_legacy and checked->'cosmetics'<>'{}'::jsonb then
    raise exception 'The older character can only use starter options' using errcode='22023';
  end if;
  if exists (
    select 1 from jsonb_each(checked->'cosmetics') part
    where jsonb_typeof(part.value)<>'string' or not exists (
      select 1 from community_private.avatar_reward_cosmetic cosmetic
      join community_private.avatar_reward_earned unlocked on unlocked.achievement_id=cosmetic.achievement_id
      where cosmetic.slot=part.key and cosmetic.id=(checked->'cosmetics'->>part.key) and unlocked.member_id=p_member
    )
  ) then
    raise exception 'Earn each cosmetic before saving it in an outfit' using errcode='42501';
  end if;
  return checked;
end;
$$;

create function public.community_avatar_projections(p_members uuid[])
returns table (user_id uuid, avatar_display jsonb)
language plpgsql stable security definer set search_path=''
as $$
declare
  viewer uuid := community_private.avatar_reward_viewer();
begin
  if coalesce(cardinality(p_members),0)>100 then
    raise exception 'Request at most 100 family avatars' using errcode='22023';
  end if;
  return query select a.member_id,a.recipe
    from community_private.avatar_reward_current a
    join public.community_profiles p on p.user_id=a.member_id
    join public.community_members m on m.user_id=a.member_id
    where a.member_id=any(p_members) and a.active and p.account_active
      and m.status='approved' and (a.member_id=viewer or p.published);
end;
$$;

create function community_private.avatar_reward_outfits(p_member uuid)
returns jsonb language sql stable security invoker set search_path=''
as $$
  select coalesce(jsonb_agg(jsonb_build_object('slot',slot,'name',name,'recipe',recipe) order by slot),'[]'::jsonb)
  from community_private.avatar_reward_outfit where member_id=p_member;
$$;

create function public.community_avatar_reward_state()
returns jsonb language plpgsql security definer set search_path=''
as $$
declare
  viewer uuid := community_private.avatar_reward_viewer();
  metrics jsonb := community_private.avatar_reward_metrics(viewer);
  saved community_private.avatar_reward_current%rowtype;
  legacy jsonb;
begin
  perform community_private.avatar_reward_award(viewer,metrics);
  select * into saved from community_private.avatar_reward_current where member_id=viewer;
  if saved.recipe is null then
    select details->'avatar_recipe' into legacy from public.community_profile_preferences where user_id=viewer;
  end if;
  return jsonb_build_object(
    'loadout',coalesce(saved.recipe,legacy),'active',coalesce(saved.active,false),'revision',coalesce(saved.revision,0),
    'plate_access',exists(select 1 from public.community_plate_players where user_id=viewer),
    'outfits',community_private.avatar_reward_outfits(viewer),
    'catalog',(select coalesce(jsonb_agg(jsonb_build_object(
      'id',c.id,'slot',c.slot,'name',c.name,'achievement_id',c.achievement_id,'tags',c.tags
    ) order by c.position),'[]'::jsonb) from community_private.avatar_reward_cosmetic c),
    'earned',(select coalesce(jsonb_agg(jsonb_build_object(
      'id',c.id,'awarded_at',e.awarded_at,'seen',e.seen_at is not null
    ) order by e.awarded_at desc,c.position),'[]'::jsonb)
      from community_private.avatar_reward_earned e join community_private.avatar_reward_cosmetic c on c.achievement_id=e.achievement_id
      where e.member_id=viewer),
    'achievements',(select coalesce(jsonb_agg(jsonb_build_object(
      'id',a.id,'name',a.name,'tier',a.tier,'group',a.group_id,'match',a.match_type,'earned_at',e.awarded_at,
      'requirements',(select jsonb_agg(jsonb_build_object(
        'game',m.game,'label',m.label,'target',r.target,'current',coalesce((metrics->>m.id)::bigint,0)
      ) order by r.position) from community_private.avatar_reward_requirement r
        join community_private.avatar_reward_metric m on m.id=r.metric_id where r.achievement_id=a.id)
    ) order by a.position),'[]'::jsonb)
      from community_private.avatar_reward_achievement a
      left join community_private.avatar_reward_earned e on e.achievement_id=a.id and e.member_id=viewer)
  );
end;
$$;

create function public.community_avatar_reward_seen(p_ids text[])
returns jsonb language plpgsql security definer set search_path=''
as $$
declare
  viewer uuid := community_private.avatar_reward_viewer();
  updated integer;
begin
  if coalesce(cardinality(p_ids),0)>250 then
    raise exception 'Choose up to 250 rewards' using errcode='22023';
  end if;
  update community_private.avatar_reward_earned e set seen_at=now()
  where e.member_id=viewer and e.seen_at is null and exists(
    select 1 from community_private.avatar_reward_cosmetic c
    where c.achievement_id=e.achievement_id and c.id=any(p_ids)
  );
  get diagnostics updated = row_count;
  return jsonb_build_object('marked',updated);
end;
$$;

create function public.community_avatar_save_outfit(p_slot integer,p_name text,p_recipe jsonb)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare
  viewer uuid := community_private.avatar_reward_viewer();
  label text := btrim(coalesce(p_name,''));
  checked jsonb;
begin
  if p_slot is null or p_slot not between 1 and 6 then
    raise exception 'Choose an outfit slot from 1 to 6' using errcode='22023';
  end if;
  if p_recipe is null then
    delete from community_private.avatar_reward_outfit where member_id=viewer and slot=p_slot;
  else
    if char_length(label) not between 1 and 32 or label ~ '[[:cntrl:]]' then
      raise exception 'Name your outfit with 1 to 32 characters' using errcode='22023';
    end if;
    perform community_private.avatar_reward_award(viewer,community_private.avatar_reward_metrics(viewer));
    checked := community_private.avatar_reward_recipe(viewer,p_recipe);
    insert into community_private.avatar_reward_outfit as outfit(member_id,slot,name,recipe) values(viewer,p_slot,label,checked)
    on conflict (member_id,slot) do update set name=excluded.name,recipe=excluded.recipe,updated_at=now()
      where (outfit.name,outfit.recipe) is distinct from (excluded.name,excluded.recipe);
  end if;
  return community_private.avatar_reward_outfits(viewer);
end;
$$;

create function public.community_avatar_equip(
  p_recipe jsonb,p_publish boolean default null,p_expected bigint default null,p_fallback jsonb default null
)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare
  viewer uuid := community_private.avatar_reward_viewer();
  saved community_private.avatar_reward_current%rowtype;
  own_profile public.community_profiles%rowtype;
  checked jsonb;
  v_active boolean := p_recipe is not null;
begin
  perform pg_advisory_xact_lock(hashtextextended('family-avatar:'||viewer::text,0));
  select * into saved from community_private.avatar_reward_current where member_id=viewer;
  select * into own_profile from public.community_profiles where user_id=viewer for update;
  if not found or own_profile.account_active is not true then
    raise exception 'Your family profile is unavailable' using errcode='42501';
  end if;
  -- Sharing uses existing profile moderation. An optional flag can assert its
  -- last known state, but this RPC never changes that state.
  if p_publish is not null and p_publish<>own_profile.published then
    raise exception 'Profile visibility changed. Reload before saving.' using errcode='40001';
  end if;
  if v_active then
    perform community_private.avatar_reward_award(viewer,community_private.avatar_reward_metrics(viewer));
    checked := community_private.avatar_reward_recipe(viewer,p_recipe);
  else
    checked := saved.recipe;
    if checked is null and p_fallback is not null then
      checked := community_private.avatar_reward_recipe(viewer,p_fallback,true);
    end if;
  end if;
  if (checked,v_active) is distinct from (saved.recipe,coalesce(saved.active,false)) then
    if p_expected is not null and p_expected<>coalesce(saved.revision,0) then
      raise exception 'Your avatar changed in another session. Reload before saving.' using errcode='40001';
    end if;
    insert into community_private.avatar_reward_current as avatar(member_id,recipe,active)
      values(viewer,checked,v_active)
      on conflict (member_id) do update set recipe=excluded.recipe,active=excluded.active,revision=avatar.revision+1
      returning * into saved;
    if own_profile.published then
      update public.community_family_revisions set revision=revision+1,changed_at=clock_timestamp() where topic='scores';
    end if;
  end if;
  return jsonb_build_object(
    'loadout',saved.recipe,'active',coalesce(saved.active,false),'revision',coalesce(saved.revision,0),
    'profile',jsonb_build_object('avatar_display',case when saved.active then saved.recipe end,'published',own_profile.published,
      'avatar_mode',own_profile.avatar_mode,'avatar_path',own_profile.avatar_path)
  );
end;
$$;

revoke all on function community_private.avatar_reward_viewer(),
  community_private.avatar_reward_metrics(uuid), community_private.avatar_reward_award(uuid,jsonb),
  community_private.avatar_reward_recipe(uuid,jsonb,boolean),
  community_private.avatar_reward_outfits(uuid) from public,anon,authenticated;
revoke all on function public.community_avatar_projections(uuid[]), public.community_avatar_reward_state(), public.community_avatar_reward_seen(text[]),
  public.community_avatar_save_outfit(integer,text,jsonb), public.community_avatar_equip(jsonb,boolean,bigint,jsonb)
  from public,anon,authenticated;
grant execute on function public.community_avatar_projections(uuid[]), public.community_avatar_reward_state(), public.community_avatar_reward_seen(text[]),
  public.community_avatar_save_outfit(integer,text,jsonb), public.community_avatar_equip(jsonb,boolean,bigint,jsonb)
  to authenticated;

commit;
