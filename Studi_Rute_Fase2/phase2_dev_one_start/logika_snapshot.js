// Logika game: data, sistem meta, dan mesin ekspedisi. Tidak menyentuh DOM.
// === LOGIK ===
const rnd=Math.random, acak=(a,b)=>a+rnd()*(b-a), pilih=a=>a[Math.floor(rnd()*a.length)];
const G=s=>1.14**(s-1);
const fmt=n=>{n=Math.floor(n);const a=Math.abs(n);if(a<1e4)return String(n);if(a>=1e36)return n.toExponential(2).replace('e+','e');for(const[v,s]of[[1e33,'Dc'],[1e30,'No'],[1e27,'Oc'],[1e24,'Sp'],[1e21,'Sx'],[1e18,'Qi'],[1e15,'Q'],[1e12,'T'],[1e9,'B'],[1e6,'M'],[1e3,'K']])if(a>=v)return(n/v).toFixed(a/v<100?1:0)+s;return String(n)};
const pct=(x,d=0)=>(x*100).toFixed(d)+'%';

const URUT=['ksatria','pemburu','penyihir','tabib','kurcaci'];
const HERO={
  ksatria:{n:'Arya',kelas:'Ksatria',sp:'knight_m',senj:['pedang','palu'],awal:'perkasa',hp:130,atk:8,def:4,spd:.9,buka:1,peran:'Penjaga depan. Menahan serangan dan menebas musuh terdepan.'},
  pemburu:{n:'Laras',kelas:'Pemburu',sp:'elf_f',senj:['busur','silang'],awal:'hujan',hp:75,atk:10,def:2,spd:1.15,buka:11,peran:'Pemanah jarak jauh. Mengincar musuh paling belakang dan sering kritis.'},
  penyihir:{n:'Bayu',kelas:'Penyihir',sp:'wizzard_m',senj:['tongkat','sabit'],awal:'meteor',hp:80,atk:12,def:2,spd:.85,buka:21,peran:'Perapal sihir area. Bola apinya mengenai semua musuh.'},
  tabib:{n:'Nawang',kelas:'Tabib',sp:'doc',senj:['gada','cambuk'],awal:'cahaya',hp:115,atk:7.5,def:3,spd:.85,buka:31,peran:'Penyembuh. Cahaya sucinya mengejar musuh, menembus satu sasaran, dan memulihkan 0.5% HP tiap kena.'},
  kurcaci:{n:'Ratri',kelas:'Kurcaci',sp:'dwarf_f',senj:['kapak','palu'],awal:'gempa',hp:125,atk:8.5,def:4,spd:.9,buka:51,peran:'Petarung tangguh. Kapaknya dilempar menembus musuh lalu kembali ke tangan.'}};
const SLOT={senjata:'Senjata',helm:'Helm',zirah:'Zirah',sarung:'Sarung',sepatu:'Sepatu',aksesori:'Aksesori'},SLOTS=Object.keys(SLOT);
const RARITY=[
  {n:'Normal',c:'#c3c9d4',m:1,aff:0,shard:1,w:700},
  {n:'Bagus',c:'#6fdc8c',m:1.35,aff:1,shard:3,w:240},
  {n:'Langka',c:'#5ab4f0',m:1.85,aff:2,shard:8,w:54},
  {n:'Epik',c:'#c98af2',m:2.6,aff:3,shard:20,w:5.5},
  {n:'Legenda',c:'#ffb53d',m:3.6,aff:3,shard:60,w:0}];
const STAGE_RARITY=[1,1,3,11,31];
const JENIS={
  pedang:{slot:'senjata',n:['Pedang Pendek','Pedang Panjang','Pedang Lengkung','Pedang Agung','Pedang Trisula'],ik:['short_sword1','long_sword1','falchion2','greatsword1','triple_sword'],st:g=>({atk:3*g})},
  busur:{slot:'senjata',n:['Busur Pendek','Busur Pemburu','Busur Panjang','Busur Perak','Busur Fajar'],ik:['shortbow1','shortbow3','longbow1','longbow2','longbow3'],st:g=>({atk:3.4*g})},
  tongkat:{slot:'senjata',n:['Tongkat Kayu','Tongkat Angin','Tongkat Api','Tongkat Bintang','Tongkat Purba'],ik:['quarterstaff','staff00','staff03','staff06','staff08'],st:g=>({atk:3.8*g})},
  gada:{slot:'senjata',n:['Pentung','Gada Besi','Gada Duri','Gada Cahaya','Gada Suci'],ik:['club','mace1','morningstar1','eveningstar1','mace_large3'],st:g=>({atk:3.3*g,hp:6*g})},
  helm:{slot:'helm',n:['Topi Lusuh','Helm Besi','Helm Duri','Helm Ksatria','Mahkota Perang'],ik:['hat1','helmet1','helmet3','helmet5','helmet_art1'],st:g=>({hp:9*g,def:1.5*g})},
  zirah:{slot:'zirah',n:['Zirah Kulit','Zirah Cincin','Zirah Sisik','Zirah Pelat','Zirah Naga Emas'],ik:['leather_armour1','ring_mail1','scale_mail2','plate1','gold_dragon_armour'],st:g=>({hp:15*g,def:2*g})},
  kapak:{slot:'senjata',n:['Kapak Tangan','Kapak Besi','Kapak Pembelah','Kapak Perang','Kapak Kembar Raja'],ik:['kapak1','kapak2','kapak3','kapak4','kapak5'],st:g=>({atk:3.6*g,def:.3*g})},
  palu:{slot:'senjata',n:['Pentung Besar','Gada Paku','Rantai Duri','Bintang Fajar','Palu Agung'],ik:['giant_club','giant_spiked_club2','dire_flail2','eveningstar3','mace_large1'],st:g=>({atk:3.7*g})},
  silang:{slot:'senjata',n:['Panah Silang Kecil','Arbalet Besi','Arbalet Baja','Arbalet Ungu','Panah Silang Emas'],ik:['hand_crossbow','arbalest1','arbalest2','arbalest3','hand_crossbow3'],st:g=>({atk:3.9*g})},
  sabit:{slot:'senjata',n:['Sabit Karat','Sabit Bulan','Sabit Merah','Galah Biru','Galah Emas'],ik:['scythe1','scythe2','scythe3','quarterstaff2','quarterstaff3'],st:g=>({atk:4.1*g})},
  cambuk:{slot:'senjata',n:['Cambuk Kulit','Cambuk Kait','Cambuk Ular','Rantai Suci','Rantai Malaikat'],ik:['bullwhip','bullwhip2','bullwhip3','flail1','flail3'],st:g=>({atk:3.6*g,hp:4*g})},
  sarung:{slot:'sarung',n:['Sarung Kulit','Sarung Ringan','Sarung Cakar','Sarung Besi','Sarung Naga'],ik:['glove1','glove2','glove3','glove4','glove5'],st:g=>({atk:1*g,hp:4*g})},
  sepatu:{slot:'sepatu',n:['Sepatu Kulit','Sepatu Bot','Sepatu Loreng','Sepatu Rawa','Sepatu Angin'],ik:['boots1_brown','boots2_jackboots','boots3_stripe','boots4_green','boots3_stripe'],st:g=>({hp:7*g,def:1*g})},
  aksesori:{slot:'aksesori',n:['Kalung Tulang','Kalung Kamea','Jimat Merah','Jimat Kristal','Jimat Pentagram'],ik:['bone_gray','cameo_blue','celtic_red','crystal_red','penta_orange'],st:g=>({atk:.9*g,hp:5*g})}};
const AFIKS={
  crit:{l:'Peluang kritis',aw:'Tajam',v:[.02,.05]},critd:{l:'Damage kritis',aw:'Mematikan',v:[.08,.2]},spd:{l:'Kecepatan serang',aw:'Kilat',v:[.03,.08]},
  life:{l:'Curi nyawa',aw:'Haus Darah',v:[.01,.03]},dodge:{l:'Menghindar',aw:'Lincah',v:[.01,.04]},cdr:{l:'Waktu jurus',aw:'Fokus',v:[.02,.06]},
  atk:{l:'ATK',aw:'Ganas',v:[.03,.08]},hp:{l:'HP',aw:'Kokoh',v:[.04,.1]},bos:{l:'Damage ke bos',aw:'Pembasmi',v:[.05,.14]},
  gold:{l:'Gold',aw:'Rezeki',v:[.06,.16]},drop:{l:'Peluang jarahan',aw:'Pemburu',v:[.05,.14]},xp:{l:'XP',aw:'Bijak',v:[.05,.14]}};
const SET={
  baja:{n:'Baja Leluhur',d2:'+15% HP',d4:'+40% pertahanan dan damage diterima -10%',b2:{hp:.15},b4:{def:.4,tahan:.1}},
  angin:{n:'Angin Timur',d2:'+10% kecepatan serang',d4:'+12% menghindar dan +8% kritis',b2:{spd:.1},b4:{dodge:.12,crit:.08}},
  bara:{n:'Bara Merah',d2:'+15% ATK',d4:'+50% damage kritis dan +3% curi nyawa',b2:{atk:.15},b4:{critd:.5,life:.03}},
  bintang:{n:'Bintang Jatuh',d2:'Waktu jurus 10% lebih cepat',d4:'+20% ATK dan waktu jurus 10% lebih cepat',b2:{cdr:.1},b4:{atk:.2,cdr:.1}}};
const UNIK=[
  {id:'fajar',n:'Fajar Merah',j:'pedang',ik:'spwpn_sword_of_power',d:'Serangan kritis memulihkan 1% HP.',fx:{fajar:1,crit:.05}},
  {id:'murka',n:'Murka Gunung',j:'pedang',ik:'spwpn_wrath_of_trog',d:'ATK +35%. Tebasan melebar ke semua musuh.',fx:{atk:.35,splash:.4}},
  {id:'angin',n:'Angin Utara',j:'busur',ik:'urand_storm_bow',d:'35% peluang melepas panah kedua.',fx:{ganda:.35}},
  {id:'napas',n:'Napas Naga',j:'tongkat',ik:'spwpn_staff_of_olgreb',d:'Damage area +40%.',fx:{splash:.4}},
  {id:'rahmat',n:'Gada Rahmat',j:'gada',ik:'urand_shillelagh',d:'Penyembuhan +50%.',fx:{heal:.5}},
  {id:'topeng',n:'Topeng Naga',j:'helm',ik:'urand_dragonmask',d:'Damage ke bos +40%.',fx:{bos:.4}},
  {id:'malam',n:'Jubah Malam',j:'zirah',ik:'urand_night',d:'Menghindar +15%.',fx:{dodge:.15}},
  {id:'rajanaga',n:'Zirah Raja Naga',j:'zirah',ik:'urand_dragon_king',d:'HP +50%.',fx:{hp:.5}},
  {id:'hidup',n:'Liontin Hidup',j:'aksesori',ik:'urand_vitality',d:'Curi nyawa +6%.',fx:{life:.06}},
  {id:'empat',n:'Kalung Empat Angin',j:'aksesori',ik:'urand_four_winds',d:'Waktu jurus 30% lebih cepat.',fx:{cdr:.3}},
  {id:'tujuh',n:'Cincin Ketujuh',j:'aksesori',ik:'urand_octoring',d:'Gold +80% dan jarahan +40%.',fx:{gold:.8,drop:.4}},
  {id:'bayang',n:'Cincin Bayangan',j:'aksesori',ik:'urand_shadows',d:'Peluang kritis +15%.',fx:{crit:.15}},
  {id:'kelam',n:'Pedang Ksatria Kelam',j:'pedang',ik:'urand_doom_knight',d:'Curi nyawa +5% dan damage kritis +40%.',fx:{life:.05,critd:.4}},
  {id:'naga',n:'Pembasmi Naga',j:'pedang',ik:'urand_wyrmbane',d:'ATK +45%.',fx:{atk:.45}},
  {id:'kiamat',n:'Palu Kiamat',j:'palu',ik:'urand_skullcrusher',d:'Damage ke bos +60%.',fx:{bos:.6}},
  {id:'jitu',n:'Silang Penembak Jitu',j:'silang',ik:'urand_sniper',d:'Kritis +20% dan damage kritis +50%.',fx:{crit:.2,critd:.5}},
  {id:'bara',n:'Bara Abadi',j:'sabit',ik:'urand_firestarter',d:'Damage area +50%.',fx:{splash:.5}},
  {id:'siksa',n:'Cambuk Siksa',j:'cambuk',ik:'spwpn_sceptre_of_torment',d:'Waktu jurus 25% lebih cepat.',fx:{cdr:.25}},
  {id:'beruang',n:'Tudung Beruang',j:'helm',ik:'urand_bear',d:'HP +30% dan pertahanan +30%.',fx:{hp:.3,def:.3}},
  {id:'salamander',n:'Sisik Salamander',j:'zirah',ik:'urand_salamander',d:'Damage diterima -20%.',fx:{tahan:.2}},
  {id:'pencuri',n:'Jubah Pencuri',j:'zirah',ik:'urand_thief',d:'Gold +60% dan menghindar +8%.',fx:{gold:.6,dodge:.08}},
  {id:'pendekar',n:'Sarung Pendekar',j:'sarung',ik:'urand_fencer',d:'Kecepatan serang +25%.',fx:{spd:.25}},
  {id:'cakar',n:'Cakar Merah',j:'sarung',ik:'urand_zhor',d:'ATK +25% dan kritis +8%.',fx:{atk:.25,crit:.08}},
  {id:'langkah',n:'Langkah Dewa',j:'sepatu',ik:'boots4_green',d:'Menghindar +12% dan kecepatan serang +12%.',fx:{dodge:.12,spd:.12}}];
const JURUS={
  tameng:{n:'Hantaman Perisai',h:'ksatria',r:0,ik:'shatter',cd:8,t:'tunggal',m:3,d:'Menghantam musuh terdepan dengan 300% ATK.'},
  perkasa:{n:'Tebasan Perkasa',h:'ksatria',r:1,ik:'iskenderuns_mystic_blast',cd:14,t:'sapu',m:2.5,d:'Menebas semua musuh dengan 250% ATK.'},
  perang:{n:'Teriakan Perang',h:'ksatria',r:1,ik:'berserker_rage',cd:22,t:'buff',v:.3,dur:8,d:'ATK regu +30% selama 8 detik.'},
  bteng:{n:'Benteng Baja',h:'ksatria',r:2,ik:'stoneskin',cd:24,t:'perisai',q:.3,d:'Perisai 30% HP untuk seluruh regu.'},
  pusar:{n:'Pusaran Pedang',h:'ksatria',r:3,ik:'tornado',cd:18,t:'hujan',jml:8,m:.8,d:'8 tebasan beruntun, masing-masing 80% ATK.'},
  surga:{n:'Pedang Surga',h:'ksatria',r:4,ik:'tso_bless_weapon',cd:26,t:'sapu',m:6,a:'suci',d:'Pedang cahaya memberi 600% ATK ke semua musuh.'},
  sjitu:{n:'Tembakan Jitu',h:'pemburu',r:0,ik:'stone_arrow',cd:8,t:'tunggal',m:3.5,d:'Satu panah kuat, 350% ATK.'},
  hujan:{n:'Hujan Panah',h:'pemburu',r:1,ik:'force_lance',cd:16,t:'hujan',jml:6,m:.8,d:'6 panah acak, masing-masing 80% ATK.'},
  pes:{n:'Panah Es',h:'pemburu',r:2,ik:'throw_icicle',cd:18,t:'sapu',m:1.2,beku:1.5,a:'es',d:'120% ATK ke semua musuh dan membekukan 1.5 detik.'},
  pracun:{n:'Panah Racun',h:'pemburu',r:2,ik:'venom_bolt',cd:16,t:'sapu',m:.8,bakar:.5,a:'racun',d:'80% ATK ke semua musuh dan meracuni selama 4 detik.'},
  jantung:{n:'Tembus Jantung',h:'pemburu',r:3,ik:'searing_ray',cd:18,t:'tunggal',m:9,d:'Panah tunggal 900% ATK.'},
  seribu:{n:'Badai Seribu Panah',h:'pemburu',r:4,ik:'airstrike',cd:26,t:'hujan',jml:20,m:.75,d:'20 panah, masing-masing 75% ATK.'},
  boles:{n:'Bola Es',h:'penyihir',r:0,ik:'bolt_of_cold',cd:9,t:'sapu',m:1.2,beku:.6,a:'es',d:'120% ATK ke semua musuh dan membekukan sebentar.'},
  rantai:{n:'Rantai Petir',h:'penyihir',r:1,ik:'chain_lightning',cd:14,t:'hujan',jml:5,m:1.1,a:'petir',d:'5 petir acak, masing-masing 110% ATK.'},
  meteor:{n:'Meteor',h:'penyihir',r:2,ik:'fire_storm',cd:20,t:'meteor',m:3,d:'Meteor memberi 300% ATK ke semua musuh.'},
  nova:{n:'Nova Api',h:'penyihir',r:3,ik:'ring_of_flames',cd:20,t:'sapu',m:3.5,bakar:.8,a:'api',d:'350% ATK ke semua musuh dan membakar 4 detik.'},
  hampa:{n:'Kutukan Hampa',h:'penyihir',r:3,ik:'agony',cd:24,t:'sapu',m:1,kutuk:.4,a:'hampa',d:'Musuh menerima +40% damage selama 10 detik.'},
  hmeteor:{n:'Hujan Meteor',h:'penyihir',r:4,ik:'ru_apocalypse',cd:30,t:'meteor',m:3,jml:3,d:'Tiga meteor, masing-masing 300% ATK.'},
  sdoa:{n:'Doa Kecil',h:'tabib',r:0,ik:'elyvilon_heal_other',cd:10,t:'pulih',q:.2,d:'Memulihkan 20% HP regu.'},
  cahaya:{n:'Cahaya Pemulih',h:'tabib',r:1,ik:'cure_poison',cd:22,t:'pulih',q:.35,bangun:1,d:'Memulihkan 35% HP regu dan membangkitkan rekan.'},
  pdoa:{n:'Perisai Doa',h:'tabib',r:2,ik:'condensation_shield',cd:22,t:'perisai',q:.35,d:'Perisai 35% HP untuk seluruh regu.'},
  berkah:{n:'Berkah Perang',h:'tabib',r:3,ik:'infusion',cd:26,t:'buff',v:.4,spd:.2,dur:10,d:'ATK regu +40% dan kecepatan +20% selama 10 detik.'},
  bgkit:{n:'Kebangkitan',h:'tabib',r:3,ik:'borgnjors_revivification',cd:30,t:'pulih',q:.6,bangun:1,d:'Memulihkan 60% HP dan membangkitkan rekan.'},
  gelPedang:{n:'Gelombang Pedang',h:'ksatria',r:2,ik:'blade_hands',cd:15,t:'tunggal',b:'besar',el:'fisik',m:3.2,d:'Gelombang tebasan yang menembus semua musuh, 320% ATK.'},
  panahPetir:{n:'Panah Petir',h:'pemburu',r:2,ik:'lightning_bolt',cd:15,t:'hujan',b:'petir',el:'petir',m:1.3,d:'5 petir menyambar musuh acak, 130% ATK masing-masing.'},
  semburApi:{n:'Semburan Api',h:'penyihir',r:2,ik:'sticky_flame',cd:14,t:'sapu',b:'semburan',pj:'bola',jml:7,m:.9,el:'api',d:'Tujuh bola api menyembur berbentuk kipas, 90% ATK masing-masing dan meledak.'},
  lingkarCahaya:{n:'Lingkar Cahaya',h:'tabib',r:2,ik:'urand_starlight',cd:16,t:'sapu',b:'semburan',pj:'suci',jml:12,lingkar:1,m:.75,el:'suci',d:'Dua belas cahaya suci memancar ke segala arah, 75% ATK masing-masing.'},
  hujanKapak:{n:'Hujan Kapak',h:'kurcaci',r:3,ik:'kapak1',cd:18,t:'sapu',b:'semburan',pj:'kapak',jml:5,m:1.1,el:'fisik',d:'Lima kapak dilempar berbentuk kipas lalu kembali, 110% ATK tiap kena.'},
  gempa:{n:'Hentakan Bumi',h:'kurcaci',r:0,ik:'qazlal_upheaval',cd:9,t:'sapu',m:2.2,b:'nova',el:'fisik',d:'Menghentak tanah, 220% ATK ke musuh di sekitar.'},
  badaiKapak:{n:'Badai Kapak',h:'kurcaci',r:1,ik:'kapak3',cd:16,t:'sapu',b:'orbit',el:'fisik',jml:3,dur:4,m:.8,d:'Tiga kapak berputar mengelilingi pahlawan selama 4 detik, 80% ATK per sabetan.'},
  kulitBatu:{n:'Kulit Batu',h:'kurcaci',r:1,ik:'armour',cd:20,t:'perisai',b:'perisai',el:'fisik',q:.35,d:'Perisai 35% HP maksimal.'},
  lemparRaksasa:{n:'Lemparan Raksasa',h:'kurcaci',r:2,ik:'kapak4',cd:16,t:'tunggal',b:'besar',el:'fisik',m:4,d:'Kapak raksasa yang menembus semua musuh, 400% ATK.'},
  amukKurcaci:{n:'Amuk Kurcaci',h:'kurcaci',r:3,ik:'fighting',cd:24,t:'buff',b:'buff',el:'api',v:.45,spd:.25,dur:8,d:'ATK +45% dan kecepatan serang +25% selama 8 detik.'},
  putaranGunung:{n:'Putaran Gunung',h:'kurcaci',r:4,ik:'kapak5',cd:22,t:'sapu',b:'putar',el:'fisik',m:5.5,d:'Kapak kembar berputar menghantam semua musuh dekat, 550% ATK.'},
  mukjizat:{n:'Mukjizat',h:'tabib',r:4,ik:'deaths_door',cd:36,t:'pulih',q:1,bangun:1,sh:.3,d:'Memulihkan seluruh HP, membangkitkan rekan, dan memberi perisai 30% HP.'}};
for(const k in JURUS)JURUS[k].id=k;
const PETI={
  kayu:{n:'Peti Kayu',ik:'misc_box',hue:-25,item:2,src:'elit',jurus:.25,gold:20,shard:0,b:'Elite, 35%'},
  perak:{n:'Peti Perak',ik:'misc_box',hue:190,item:3,src:'mini',jurus:.5,gold:60,shard:5,b:'Mini Bos'},
  emas:{n:'Peti Emas',ik:'misc_box',hue:0,item:4,src:'bos',jurus:1,gold:200,shard:20,b:'Bos Babak'}};
const BOBOT_JURUS={kayu:[70,30,0,0,0],perak:[40,40,18,2,0],emas:[10,35,35,18,2]};

const KONSUM={
  tonik:{n:'Tonik Pemulih',ik:'ruby',d:'Memulihkan 45% HP seluruh regu.',harga:20},
  amarah:{n:'Minyak Amarah',ik:'golden',d:'+50% ATK regu selama 60 detik.',harga:60},
  mujur:{n:'Air Mujur',ik:'effervescent',d:'Peluang jarahan ×2 selama 120 detik.',harga:90},
  gulung:{n:'Gulungan Lompat',ik:'scroll-yellow',d:'Lompat 2 stage ke depan.',harga:160},
  ilmu:{n:'Eliksir Ilmu',ik:'brilliant_blue',d:'XP ×2 selama 120 detik.',harga:80},
  bom:{n:'Bom Api',ik:'magenta',d:'Memberi 300% ATK ke semua musuh.',harga:50}};
const FOE={
  swampy:{n:'Lendir Rawa',sp:'swampy'},muddy:{n:'Lumpur Hidup',sp:'muddy',hpM:1.3,spdM:.8},goblin:{n:'Goblin',sp:'goblin',hpM:.8,spdM:1.3},siput:{n:'Siput Kecil',sp:'tiny_slug',hpM:.7},
  raksiput:{n:'Siput Besar',sp:'slug',sc:1.6},rajaogre:{n:'Raja Ogre',sp:'ogre'},
  orc:{sif:'perisai',n:'Prajurit Orc',sp:'orc_warrior',hpM:1.2},topeng:{n:'Orc Bertopeng',sp:'masked_orc',atkM:1.2},dukun:{sif:'sembuh',n:'Dukun Orc',sp:'orc_shaman',jarak:1,hpM:.8},goblinm:{n:'Goblin Merah',sp:'goblin',hue:-70,hpM:.8,spdM:1.3},
  kapten:{n:'Kapten Orc',sp:'masked_orc',sc:1.6,hue:40},panglima:{bj:'panggil',n:'Panglima Ogre',sp:'ogre',hue:-90},
  rangka:{n:'Rangka',sp:'skelet',spdM:1.1},zombi:{n:'Zombi Kecil',sp:'tiny_zombie',hpM:1.2},nekro:{sif:'sembuh',n:'Nekromancer',sp:'necromancer',jarak:1,hpM:.8},zombies:{n:'Zombi Es',sp:'ice_zombie',hpM:1.4,spdM:.8},
  rangkab:{n:'Rangka Raksasa',sp:'skelet',sc:2,hue:30},zombir:{bj:'pulih',n:'Zombi Raksasa',sp:'big_zombie'},
  labu:{sif:'ledak',n:'Labu Hidup',sp:'pumpkin_dude',hpM:1.1},lendirb:{n:'Lendir Busuk',sp:'swampy',hue:60,atkM:1.2},lumpurb:{n:'Lumpur Beracun',sp:'muddy',hue:80,hpM:1.3},jatuh:{n:'Malaikat Jatuh',sp:'angel',hue:150,jarak:1},
  rajalabu:{n:'Raja Labu',sp:'pumpkin_dude',sc:2,hue:-20},busuk:{bj:'racun',n:'Busuk Agung',sp:'big_zombie',hue:70},
  imp:{sif:'ledak',n:'Imp Api',sp:'imp',spdM:1.3,hpM:.8},wogol:{n:'Wogol',sp:'wogol',jarak:1},chort:{sif:'perisai',n:'Chort',sp:'chort',hpM:1.2,atkM:1.1},impb:{n:'Imp Biru',sp:'imp',hue:180,spdM:1.4,hpM:.7},
  rajachort:{n:'Chort Agung',sp:'chort',sc:1.7,hue:30},iblis:{bj:'bakar',n:'Iblis Bara',sp:'big_demon'},
  orcb:{n:'Orc Bayangan',sp:'masked_orc',hue:200,atkM:1.2},nekrob:{n:'Penyihir Hampa',sp:'necromancer',hue:200,jarak:1},chortb:{sif:'perisai',n:'Chort Hampa',sp:'chort',hue:190,hpM:1.2},jatuhb:{sif:'sembuh',n:'Serafim Hampa',sp:'angel',hue:210,jarak:1},
  wogolb:{n:'Penjaga Takhta',sp:'wogol',sc:2,hue:200},raja:{bj:'acak',n:'Raja Kegelapan',sp:'big_demon',hue:200,sc:1.3},
  // Babak 7: Hutan Kabut
  penggali:{n:'Cacing Penggali',sp:'tiny_slug',hue:110,sc:1.3,ai:'gali',hpM:1.1,atkM:1.3},pemanggil:{sif:'panggil',n:'Dukun Lumut',sp:'orc_shaman',hue:100,jarak:1,hpM:.9},
  kabutan:{sif:'samar',n:'Kadal Kabut',sp:'lizard_m',spdM:1.2,atkM:1.1},semak:{n:'Semak Duri',sp:'muddy',hue:100,sc:1.3,ai:'menara',hpM:1.6},spora:{n:'Spora',sp:'swampy',hue:120,sc:.7,hpM:.35,spdM:1.4},
  tetua:{n:'Tetua Hutan',sp:'ogre',hue:110,sc:1.5},ratukabut:{n:'Ratu Kabut',sp:'necromancer',hue:110,sc:2.3},
  // Babak 8: Benteng Es
  beruntun:{sif:'beruntun',n:'Pemanah Beku',sp:'elf_m',hue:180,jarak:1,hpM:.9},tamengEs:{sif:'tameng',n:'Ksatria Beku',sp:'knight_f',hue:80,hpM:1.5,spdM:.85},
  kedip:{sif:'kedip',n:'Penyihir Kristal',sp:'wizzard_f',hue:190,jarak:1,hpM:.8},rohbeku:{sif:'dingin',n:'Roh Beku',sp:'wogol',hue:210,sc:1.2,hpM:1.2},
  jenderal:{n:'Jenderal Beku',sp:'masked_orc',hue:170,sc:1.6},raksasaes:{n:'Raksasa Es',sp:'ogre',hue:170,sc:1.45}};
const ACT=[
  {n:'Gua Lembap',tint:'#a8cfc6',par:'spora',air:'blue',foes:['swampy','muddy','goblin','siput'],mini:'raksiput',bos:'rajaogre'},
  {n:'Benteng Orc',tint:'#d8bd98',par:'debu',air:'',foes:['orc','topeng','dukun','goblinm'],mini:'kapten',bos:'panglima'},
  {n:'Makam Sunyi',tint:'#b4a8ea',par:'arwah',air:'',foes:['rangka','zombi','nekro','zombies'],mini:'rangkab',bos:'zombir'},
  {n:'Taman Busuk',tint:'#a8d088',par:'daun',air:'blue',foes:['labu','lendirb','lumpurb','jatuh'],mini:'rajalabu',bos:'busuk'},
  {n:'Kawah Bara',tint:'#f4a584',par:'bara',air:'red',foes:['imp','wogol','chort','impb'],mini:'rajachort',bos:'iblis'},
  {n:'Takhta Hampa',tint:'#8c8ee0',par:'hampa',air:'red',foes:['orcb','nekrob','chortb','jatuhb'],mini:'wogolb',bos:'raja'},
  {n:'Hutan Kabut',tint:'#9cc79e',par:'kabut',air:'blue',foes:['penggali','pemanggil','kabutan','semak'],mini:'tetua',bos:'ratukabut'},
  {n:'Benteng Es',tint:'#b9dcff',par:'salju',air:'blue',foes:['beruntun','tamengEs','kedip','rohbeku'],mini:'jenderal',bos:'raksasaes'}];
const NB=ACT.length;
// Skill tree melingkar: root di tengah, enam cabang keluar. Baris: [id, nama, ikon, maks, teks, efek, cincin, jalur, syarat, opsi]
const TENGAH=720,CINCIN=83;
const SK={root:{n:'Tekad Petualang',max:1,x:TENGAH,y:TENGAH,ik:'recall',d:'+5% ATK dan HP semua pahlawan. Membuka enam cabang.',fx:{atk:.05,hp:.05},all:1}};
function cabang(cb,nama,butuh,sudut,baris){
  baris.forEach(([id,n,ik,max,d,fx,c,j,req,op])=>{
    const a=(sudut+j*(22/c+5))*Math.PI/180;
    SK[id]={n,ik,max,d,fx,cb:nama,h:butuh,req,x:Math.round(TENGAH+Math.cos(a)*c*CINCIN),y:Math.round(TENGAH+Math.sin(a)*c*CINCIN),...op}
  });
}
const KUNCI={kunci:1,cost:3,minP:8},AK=(a)=>({atau:a,cost:3,minP:14});
cabang('k','Ksatria','ksatria',-90,[
  ['k1','Latihan Pedang','sure_blade',5,'+8% ATK Ksatria per tingkat.',{atk:.08},1,0,'root'],
  ['k2','Zirah Berat','ozocubus_armour',5,'+10% HP Ksatria per tingkat.',{hp:.1},2,-1,'k1'],
  ['k3','Bahu Baja','stoneskin',5,'+12% pertahanan Ksatria per tingkat.',{def:.12},2,1,'k1'],
  ['k4','Balas Serang','deflect_missiles',5,'Memantulkan 15% ATK per tingkat saat terkena serangan.',{pantul:.15},3,-1,'k2'],
  ['k5','Darah Juang','vampiric_draining',4,'+2% curi nyawa per tingkat.',{life:.02},3,1,'k3'],
  ['k6','Provokasi','cause_fear',5,'Damage yang diterima Ksatria -4% per tingkat.',{tahan:.04},4,-1,'k4'],
  ['k7','Gempa Pedang','shatter',5,'Tebasan melebar: +12% damage ke musuh lain per tingkat.',{splash:.12},4,1,'k5'],
  ['k8','Benteng Terakhir','condensation_shield',1,'Sekali tiap ruangan, Ksatria bertahan dengan 1 HP.',{},5,0,['k6','k7'],KUNCI],
  ['k9','Amarah Raja','berserker_rage',1,'Damage jurus Tebasan Perkasa ×2.',{},6,-1,'k8',AK('k10')],
  ['k10','Perisai Baja','urand_war',1,'Jurus Ksatria memberi perisai 15% HP.',{},6,1,'k8',AK('k9')]]);
cabang('p','Pemburu','pemburu',-30,[
  ['p1','Mata Elang','magic_dart',5,'+8% ATK Pemburu per tingkat.',{atk:.08},1,0,'root'],
  ['p2','Titik Lemah','searing_ray',5,'+3% peluang kritis Pemburu per tingkat.',{crit:.03},2,-1,'p1'],
  ['p3','Tali Kencang','swiftness',5,'+6% kecepatan serang Pemburu per tingkat.',{spd:.06},2,1,'p1'],
  ['p4','Luka Dalam','excruciating_wounds',5,'+15% damage kritis Pemburu per tingkat.',{critd:.15},3,-1,'p2'],
  ['p5','Panah Ganda','poison_arrow',4,'+7% peluang panah kedua per tingkat.',{ganda:.07},3,1,'p3'],
  ['p6','Pemburu Bos','lehudibs_crystal_spear',5,'+12% damage Pemburu ke elite dan bos per tingkat.',{bos:.12},4,-1,'p4'],
  ['p7','Lincah','phase_shift',5,'+3% menghindar Pemburu per tingkat.',{dodge:.03},4,1,'p5'],
  ['p8','Tembakan Pertama','iron_shot',1,'Serangan ke musuh dengan HP penuh selalu kritis.',{},5,0,['p6','p7'],KUNCI],
  ['p9','Hujan Deras','tornado',1,'Jurus hujan panah menembak 4 panah tambahan.',{},6,-1,'p8',AK('p10')],
  ['p10','Panah Pembunuh','urand_morg',1,'Damage ×2 ke musuh dengan HP di bawah 25%.',{},6,1,'p8',AK('p9')]]);
cabang('s','Penyihir','penyihir',30,[
  ['s1','Mantra Dasar','fireball',5,'+8% ATK Penyihir per tingkat.',{atk:.08},1,0,'root'],
  ['s2','Ledakan Luas','ring_of_flames',5,'+10% damage area per tingkat.',{splash:.1},2,-1,'s1'],
  ['s3','Pikiran Tenang','haste',5,'Waktu jurus Penyihir 4% lebih cepat per tingkat.',{cdr:.04},2,1,'s1'],
  ['s4','Api Lengket','sticky_flame',5,'Membakar musuh 10% ATK per detik selama 3 detik, per tingkat.',{},3,-1,'s2'],
  ['s5','Fokus Sihir','inner_flame',5,'+3% peluang kritis Penyihir per tingkat.',{crit:.03},3,1,'s3'],
  ['s6','Sentuhan Beku','freeze',5,'5% peluang membekukan musuh 1 detik per tingkat.',{},4,-1,'s4'],
  ['s7','Arus Mana','lightning_bolt',5,'+6% kecepatan serang Penyihir per tingkat.',{spd:.06},4,1,'s5'],
  ['s8','Rantai Petir','chain_lightning',1,'Setiap serangan ke-4 memberi damage ×2.',{},5,0,['s6','s7'],KUNCI],
  ['s9','Meteor Ganda','orb_of_destruction',1,'Jurus meteor jatuh satu kali lagi.',{},6,-1,'s8',AK('s10')],
  ['s10','Kutukan Hampa','summon_dragon',1,'Meteor membuat musuh menerima +25% damage selama 8 detik.',{},6,1,'s8',AK('s9')]]);
cabang('t','Tabib','tabib',90,[
  ['t1','Sentuhan Lembut','elyvilon_heal_other',5,'+12% penyembuhan per tingkat.',{heal:.12},1,0,'root'],
  ['t2','Daya Hidup','regeneration',5,'+5% HP semua pahlawan per tingkat.',{hp:.05},2,-1,'t1',{all:1}],
  ['t3','Doa Cepat','static_discharge',5,'Waktu jurus Tabib 5% lebih cepat per tingkat.',{cdr:.05},2,1,'t1'],
  ['t4','Udara Bersih','cure_poison',5,'Pulih 0.4% HP per detik saat ekspedisi, per tingkat.',{regen:.004},3,-1,'t2'],
  ['t5','Berkat Senjata','tso_bless_weapon',5,'+4% ATK semua pahlawan per tingkat.',{atk:.04},3,1,'t3',{all:1}],
  ['t6','Perlindungan','robe_art1',5,'+8% pertahanan semua pahlawan per tingkat.',{def:.08},4,-1,'t4',{all:1}],
  ['t7','Refleks Bersama','cloak2',5,'+2% menghindar semua pahlawan per tingkat.',{dodge:.02},4,1,'t5',{all:1}],
  ['t8','Kebangkitan','borgnjors_revivification',1,'Bangkit sekali tiap ekspedisi dengan 30% HP.',{},5,0,['t6','t7'],KUNCI],
  ['t9','Cahaya Agung','deaths_door',1,'Jurus penyembuh 50% lebih kuat.',{},6,-1,'t8',AK('t10')],
  ['t10','Darah Suci','sublimation_of_blood',1,'+3% curi nyawa semua pahlawan.',{life:.03},6,1,'t8',{...AK('t9'),all:1}]]);
cabang('e','Ekspedisi',null,150,[
  ['e1','Tangan Emas','gozag_bribe_branch',5,'+12% gold per tingkat.',{gold:.12},1,0,'root'],
  ['e2','Mata Harta','apportation',5,'+10% peluang jarahan per tingkat.',{drop:.1},2,-1,'e1'],
  ['e3','Pelajar Cepat','spectral_weapon',5,'+10% XP per tingkat.',{xp:.1},2,1,'e1'],
  ['e4','Naluri Langka','song_of_slaying',4,'+15% peluang item langka per tingkat.',{rare:.15},3,-1,'e2'],
  ['e5','Tas Besar','gozag_call_merchant',3,'+6 slot tas per tingkat.',{},3,1,'e3'],
  ['e6','Pelebur Ulung','zin_donate',4,'+25% serpihan dari melebur per tingkat.',{},4,-1,'e4'],
  ['e7','Jam Pasir','gozag_potion_petition',3,'+2 jam batas hasil tambang offline dan +10% hasilnya per tingkat.',{},4,1,'e5'],
  ['e8','Peti Bos','flame_tongue',1,'Peti Emas berisi satu item tambahan.',{},5,0,['e6','e7'],KUNCI],
  ['e9','Raja Harta','petrify',1,'Gold dari bos ×3.',{},6,-1,'e8',AK('e10')],
  ['e10','Kolektor','fulminant_prism',1,'Semua item jatuh dengan level 3 lebih tinggi.',{},6,1,'e8',AK('e9')]]);
cabang('u','Kurcaci','kurcaci',210,[
  ['u1','Otot Tambang','maces_flails',5,'+8% ATK Kurcaci per tingkat.',{atk:.08},1,0,'root'],
  ['u2','Janggut Baja','armour',5,'+10% HP Kurcaci per tingkat.',{hp:.1},2,-1,'u1'],
  ['u3','Lengan Pelempar','throwing',5,'+6% kecepatan serang Kurcaci per tingkat.',{spd:.06},2,1,'u1'],
  ['u4','Kulit Granit','shields',5,'+10% pertahanan Kurcaci per tingkat.',{def:.1},3,-1,'u2'],
  ['u5','Mata Tukang','stabbing',5,'+3% peluang kritis Kurcaci per tingkat.',{crit:.03},3,1,'u3'],
  ['u6','Pantang Mundur','dodging',5,'Damage yang diterima Kurcaci -3% per tingkat.',{tahan:.03},4,-1,'u4'],
  ['u7','Tebasan Lebar','long_blades',5,'+12% damage area per tingkat.',{splash:.12},4,1,'u5'],
  ['u8','Kapak Bumerang','kapak2',1,'Kapak yang kembali ke tangan memberi damage ×1.5.',{},5,0,['u6','u7'],KUNCI],
  ['u9','Gempa Leluhur','rune_slime',1,'Hentakan Bumi juga memperlambat musuh di sekitar selama 3 detik.',{},6,-1,'u8',AK('u10')],
  ['u10','Dua Kapak','kapak5',1,'Serangan dasar melempar kapak kedua.',{},6,1,'u8',AK('u9')],
  ['u11','Tubuh Gunung','invocations',4,'+7% HP Kurcaci per tingkat.',{hp:.07},7,-2,['u9','u10']],
  ['u12','Ayunan Tambang','kiku_bless_weapon',4,'+6% ATK Kurcaci per tingkat.',{atk:.06},7,0,['u9','u10']],
  ['u13','Kaki Kokoh','evocations',4,'Jeda lompat Kurcaci 5% lebih singkat per tingkat.',{dash:.05},7,2,['u9','u10']],
  ['u14','Raja Gunung','charms',1,'+15% HP dan +15% pertahanan Kurcaci.',{hp:.15,def:.15},8,-1,['u11','u12','u13'],AK('u15')],
  ['u15','Pandai Perang','symbol_of_torment',1,'+15% ATK dan +25% damage kritis Kurcaci.',{atk:.15,critd:.25},8,1,['u11','u12','u13'],AK('u14')]]);
// Keystone: simpul netral di celah antar cabang. Bonus besar dengan kekurangan; tiap keystone bisa diambil terpisah.
[['x1','Amukan Kaca','ks_kaca','+50% ATK semua pahlawan, tetapi HP maksimal -30%.',{atk:.5,hp:-.3},-60,['k4','k5','p4','p5']],
 ['x2','Mata Gila','ks_gila','+20% peluang kritis, tetapi pertahanan -40%.',{crit:.2,def:-.4},0,['p4','p5','s4','s5']],
 ['x3','Mana Liar','spellcasting','Waktu jurus 30% lebih cepat, tetapi HP maksimal -20%.',{cdr:.3,hp:-.2},60,['s4','s5','t4','t5']],
 ['x4','Sumpah Tanpa Ramuan','fire_magic','+40% ATK dan +20% HP, tetapi Tonik tidak bisa dipakai dan jantung tidak memulihkan.',{atk:.4,hp:.2},120,['t4','t5','e4','e5']],
 ['x5','Serakah','ks_serakah','+100% gold dan +50% jarahan, tetapi musuh punya +30% HP.',{gold:1,drop:.5},180,['e4','e5','u4','u5']],
 ['x6','Kulit Raksasa','ks_raksasa','HP maksimal ×2, tetapi kecepatan serang -25%.',{hp:1,spd:-.25},240,['u4','u5','k4','k5']]].forEach(([id,n,ik,d,fx,sudut,req])=>{
  const a=sudut*Math.PI/180;SK[id]={n,ik,max:1,d,fx,cb:'Keystone',h:null,req,ks:1,cost:4,x:Math.round(TENGAH+Math.cos(a)*4.6*CINCIN),y:Math.round(TENGAH+Math.sin(a)*4.6*CINCIN)}});
// Lingkaran lanjutan: tiga jalur setelah skill puncak, lalu satu pilihan spesialisasi.
cabang('k','Ksatria','ksatria',-90,[
  ['k11','Tubuh Benteng','statue_form',4,'+7% HP Ksatria per tingkat.',{hp:.07},7,-2,['k9','k10']],
  ['k12','Ayunan Berat','axes',4,'+6% ATK Ksatria per tingkat.',{atk:.06},7,0,['k9','k10']],
  ['k13','Langkah Baja','jump',4,'Jeda lompat Ksatria 5% lebih singkat per tingkat.',{dash:.05},7,2,['k9','k10']],
  ['k14','Pelindung Agung','shroud_of_golubria',1,'+18% pertahanan dan +6% HP semua pahlawan.',{def:.18,hp:.06},8,-1,['k11','k12','k13'],{...AK('k15'),all:1}],
  ['k15','Pemecah Takhta','blade_hands',1,'+30% damage Ksatria kepada elite dan bos.',{bos:.30},8,1,['k11','k12','k13'],AK('k14')]]);
cabang('p','Pemburu','pemburu',-30,[
  ['p11','Panah Penembus','portal_projectile',2,'Panah dasar menembus +1 musuh per tingkat.',{tembus:1},7,-2,['p9','p10']],
  ['p12','Tangan Kilat','quicksilver_bolt',4,'+6% kecepatan serang Pemburu per tingkat.',{spd:.06},7,0,['p9','p10']],
  ['p13','Jejak Ringan','invisibility',4,'+5% kecepatan gerak Pemburu per tingkat.',{gerak:.05},7,2,['p9','p10']],
  ['p14','Pengintai','controlled_blink',1,'+12% hindar dan +20% jangkauan ambil Pemburu.',{dodge:.12,magnet:.20},8,-1,['p11','p12','p13'],AK('p15')],
  ['p15','Pembidik Raja','battlesphere',1,'+12% kritis dan +25% damage kritis Pemburu.',{crit:.12,critd:.25},8,1,['p11','p12','p13'],AK('p14')]]);
cabang('s','Penyihir','penyihir',30,[
  ['s11','Mantra Cepat','conjurations',4,'Waktu jurus Penyihir 4% lebih cepat per tingkat.',{cdr:.04},7,-2,['s9','s10']],
  ['s12','Gema Ledakan','hellfire_burst',4,'+8% damage area per tingkat.',{splash:.08},7,0,['s9','s10']],
  ['s13','Tenaga Arcana','irradiate',4,'+6% ATK Penyihir per tingkat.',{atk:.06},7,2,['s9','s10']],
  ['s14','Badai Sihir','conjure_ball_lightning',1,'+20% damage area dan +10% kritis Penyihir.',{splash:.20,crit:.10},8,-1,['s11','s12','s13'],AK('s15')],
  ['s15','Penyerap Jiwa','death_channel',1,'+5% curi nyawa dan +12% HP Penyihir.',{life:.05,hp:.12},8,1,['s11','s12','s13'],AK('s14')]]);
cabang('t','Tabib','tabib',90,[
  ['t11','Napas Kehidupan','cigotuvis_embrace',4,'Pulih 0.2% HP per detik saat ekspedisi, per tingkat.',{regen:.002},7,-2,['t9','t10']],
  ['t12','Doa Mendalam','urand_starlight',4,'+8% daya penyembuhan per tingkat.',{heal:.08},7,0,['t9','t10']],
  ['t13','Langkah Suci','dispel_undead',4,'Waktu jurus Tabib 4% lebih cepat per tingkat.',{cdr:.04},7,2,['t9','t10']],
  ['t14','Pelindung Jiwa','repel_missiles',1,'+8% HP dan +8% pertahanan semua pahlawan.',{hp:.08,def:.08},8,-1,['t11','t12','t13'],{...AK('t15'),all:1}],
  ['t15','Restu Fajar','summon_guardian_golem',1,'Serangan kritis memulihkan 1% HP. +5% curi nyawa semua pahlawan.',{fajar:1,life:.05},8,1,['t11','t12','t13'],{...AK('t14'),all:1}]]);
cabang('e','Ekspedisi',null,150,[
  ['e11','Pencari Jejak','passwall',4,'+8% peluang jarahan per tingkat.',{drop:.08},7,-2,['e9','e10']],
  ['e12','Catatan Kuno','necromancy',4,'+8% XP per tingkat.',{xp:.08},7,0,['e9','e10']],
  ['e13','Pemungut Harta','misc_orb',4,'+8% gold per tingkat.',{gold:.08},7,2,['e9','e10']],
  ['e14','Tarikan Harta','gravitas',1,'+50% jangkauan ambil dan +15% gold.',{magnet:.5,gold:.15},8,-1,['e11','e12','e13'],AK('e15')],
  ['e15','Ahli Serpihan','earth_magic',1,'+40% serpihan dari peleburan dan peti.',{shard:.4},8,1,['e11','e12','e13'],AK('e14')]]);
const RN={
  r1:{n:'Darah Leluhur',max:10,x:50,y:10,ik:'rune_demonic_1',cost:1,d:'+15% ATK dan HP semua pahlawan per tingkat.',fx:{atk:.15,hp:.15}},
  r2:{n:'Warisan Emas',max:10,x:22,y:40,req:'r1',ik:'gozag_bribe_branch',cost:1,d:'+25% gold per tingkat.',fx:{gold:.25}},
  r3:{n:'Ingatan Lama',max:5,x:50,y:40,req:'r1',ik:'recall',cost:2,d:'Mulai 2 stage lebih dalam per tingkat setelah reinkarnasi.',fx:{}},
  r4:{n:'Bijak Abadi',max:10,x:78,y:40,req:'r1',ik:'spectral_weapon',cost:1,d:'+20% XP per tingkat.',fx:{xp:.2}},
  r5:{n:'Sentuhan Takdir',max:5,x:12,y:82,req:'r2',ik:'song_of_slaying',cost:3,d:'+20% peluang item langka per tingkat.',fx:{rare:.2}},
  r6:{n:'Titik Tambahan',max:5,x:37,y:82,req:'r3',ik:'rune_tomb',cost:3,d:'+1 skill point awal per tingkat.',fx:{}},
  r7:{n:'Kamp Warisan',max:5,x:63,y:82,req:'r3',ik:'gozag_call_merchant',cost:2,d:'Biaya Kamp 5% lebih murah per tingkat.',fx:{kamp:.05}},
  r8:{n:'Jurus Abadi',max:5,x:88,y:82,req:'r4',ik:'haste',cost:3,d:'Waktu jurus 4% lebih cepat per tingkat.',fx:{cdr:.04}}};
const KAMP={
  bengkel:{n:'Bengkel Senjata',ik:'sure_blade',d:'+6% ATK semua pahlawan per tingkat.',fx:{atk:.06},dasar:25,g:1.28},
  barak:{n:'Barak Latihan',ik:'ozocubus_armour',d:'+6% HP semua pahlawan per tingkat.',fx:{hp:.06},dasar:25,g:1.28},
  altar:{n:'Altar Ilmu',ik:'spectral_weapon',d:'+5% XP per tingkat.',fx:{xp:.05},dasar:40,g:1.3},
  kas:{n:'Kas Ekspedisi',ik:'gozag_bribe_branch',d:'+5% gold per tingkat.',fx:{gold:.05},dasar:40,g:1.3},
  gudang:{n:'Gudang',ik:'gozag_call_merchant',d:'+2 slot tas per tingkat.',fx:{},dasar:120,g:2,max:12}};

let S,D,R={},onChange=()=>{};
let nid=1,uid=1;
const fx=e=>{if(R.fx&&R.fx.length<120)R.fx.push(e)};
const catat=(t,c)=>{R.log.unshift({t,c,w:Date.now()});R.log.length=Math.min(R.log.length,80);onChange('log')};
const sk=k=>S.sk[k]||0, rn=k=>S.rn[k]||0, kp=k=>S.kamp[k]||0;
const biayaSk=k=>SK[k].cost||1, biayaRn=k=>RN[k].cost*(rn(k)+1);
const biayaKamp=k=>Math.ceil(KAMP[k].dasar*KAMP[k].g**kp(k)*(1-.05*rn('r7')));
const reqSk=k=>SK[k].req?[].concat(SK[k].req):[];
const poinCabang=b=>Object.keys(SK).reduce((n,k)=>n+(k!=='root'&&k[0]===b?sk(k)*biayaSk(k):0),0);
const kapasitas=()=>36+6*sk('e5')+2*kp('gudang');
const xpPerlu=L=>Math.floor(24*1.27**(L-1));
const hargaJual=it=>Math.ceil(4*G(it.il)*(it.r+1)**1.5);
const shardDari=it=>Math.ceil(RARITY[it.r].shard*(1+.25*sk('e6'))*(1+D.p.shard));
const biayaTempa=it=>({gold:Math.ceil(30*G(it.il)*1.5**it.plus),shard:3*(it.plus+1)});
function buatItem(j,r,il,uni){
  const J=JENIS[j],g=1.12**(il-1)*RARITY[r].m*acak(.88,1.12),st=J.st(g),aff={};
  const aks=Object.keys(AFIKS).sort(()=>rnd()-.5).slice(0,RARITY[r].aff);
  aks.forEach(k=>{const a=AFIKS[k];aff[k]=acak(a.v[0],a.v[1])*(1+r*.2)});
  const u=uni&&UNIK.find(x=>x.id===uni),set=!u&&r===3&&['helm','zirah','sarung','sepatu'].includes(J.slot)&&rnd()<.35?pilih(Object.keys(SET)):null;
  return {id:nid++,j,slot:J.slot,n:u?u.n:set?J.n[r]+' '+SET[set].n:J.n[r]+(aks[0]?' '+AFIKS[aks[0]].aw:''),ik:u?u.ik:J.ik[r],r,il,plus:0,st,aff,uni:uni||null,set};
}
function rollRarity(src,s){
  const min={biasa:0,elit:1,mini:1,bos:2}[src],luck=1+D.p.rare;
  if(s>=STAGE_RARITY[4]){
    const c={biasa:0,elit:.005,mini:.03,bos:.1+S.pity}[src]*luck;
    if(rnd()<c)return 4;
  }
  let tot=0;const w=RARITY.map((x,i)=>{const v=i<min||i>3||s<STAGE_RARITY[i]?0:x.w*(i?luck**i:1);tot+=v;return v});
  let t=rnd()*tot,r=0;for(;r<3;r++){if(t<w[r])break;t-=w[r]}
  return r;
}
function jenisAcak(){return pilih([...terbuka().flatMap(h=>HERO[h].senj),'helm','zirah','sarung','sepatu','aksesori'])}
function rollItem(src,s){
  const il=s+3*sk('e10'),r=rollRarity(src,s);
  if(src==='bos')S.pity+=.006;
  if(r===4){S.pity=0;const pool=UNIK.filter(u=>JENIS[u.j].slot!=='senjata'||terbuka().some(h=>HERO[h].senj.includes(u.j))),u=pilih(pool);S.kodeks.u[u.id]=1;onChange('kodeks');return buatItem(u.j,4,il,u.id)}
  return buatItem(jenisAcak(),r,il);
}
function bisaPakai(it,h){return it.slot!=='senjata'||HERO[h].senj.includes(it.j)}
const nilai=it=>{const m=1+.1*it.plus;return (it.st.atk||0)*3*m+(it.st.hp||0)*.35*m+(it.st.def||0)*1.5*m+Object.values(it.aff).reduce((a,b)=>a+b,0)*4*1.12**(it.il-1)+(it.uni?10*1.12**(it.il-1):0)};
const lebihBaik=(it,h)=>{if(!bisaPakai(it,h))return false;const e=S.eq[h][it.slot];return !e||nilai(it)>nilai(e)};
const adaLebihBaik=it=>terbuka().some(h=>lebihBaik(it,h));
// Pakai otomatis: item diberikan ke pahlawan yang paling diuntungkan, bukan selalu pahlawan pertama. Pahlawan yang sedang berekspedisi diutamakan.
const penerimaTerbaik=it=>{let best=null,sk=0;for(const h of terbuka()){if(!lebihBaik(it,h))continue;const e=S.eq[h][it.slot],v=(e?nilai(it)/Math.max(1e-9,nilai(e)):1e9)*(R.run&&R.run.hero===h?1.5:1);if(v>sk){sk=v;best=h}}return best};

function isiJurus(){for(const h of URUT){const a=HERO[h].awal;S.kartu[a]=S.kartu[a]||1;S.pasang[h]=S.pasang[h]||[a,null]}}
function hitung(coba){
  const MOD=()=>({atk:0,hp:0,def:0,crit:0,critd:0,spd:0,life:0,dodge:0,cdr:0,splash:0,heal:0,bos:0,ganda:0,pantul:0,tahan:0,fajar:0,dash:0,gerak:0,magnet:0,tembus:0,_a:0,_h:0,_d:0});
  const m={},p={gold:0,drop:0,xp:0,rare:0,regen:0,kamp:0,shard:0};URUT.forEach(h=>m[h]=MOD());
  const tam=(h,k,v)=>{if(k in p)p[k]+=v;else if(h)m[h][k]=(m[h][k]||0)+v;else URUT.forEach(x=>m[x][k]=(m[x][k]||0)+v)};
  for(const k in S.sk){const d=SK[k];if(d)for(const f in d.fx)tam(d.all?null:d.h,f,d.fx[f]*S.sk[k])}
  for(const k in S.rn)for(const f in RN[k].fx)tam(null,f,RN[k].fx[f]*S.rn[k]);
  for(const k in S.kamp)for(const f in KAMP[k].fx)tam(null,f,KAMP[k].fx[f]*S.kamp[k]);
  tam(null,'atk',Object.keys(S.kodeks.u).length*.02);
  tam(null,'gold',Object.keys(S.kodeks.m).filter(k=>S.kodeks.m[k]>=10).length*.01);
  for(const h of URUT){const cSet={};for(const sl of SLOTS){const e=S.eq[h][sl];if(!e)continue;const q=1+.1*e.plus;if(e.set)cSet[e.set]=(cSet[e.set]||0)+1;
    m[h]._a+=(e.st.atk||0)*q;m[h]._h+=(e.st.hp||0)*q;m[h]._d+=(e.st.def||0)*q;
    for(const a in e.aff)tam(h,a,e.aff[a]);
    if(e.uni){const u=UNIK.find(x=>x.id===e.uni);for(const f in u.fx)tam(h,f,u.fx[f])}}
    for(const k in cSet){if(cSet[k]>=2)for(const f in SET[k].b2)tam(h,f,SET[k].b2[f]);if(cSet[k]>=4)for(const f in SET[k].b4)tam(h,f,SET[k].b4[f])}}
  const amarah=(S.buff.amarah>0?1.5:1)*(S.buff.perang>0?1+(S.buffV.atk||0):1),lv=1+.13*(S.L-1);
  D={h:{},p:{gold:1+p.gold,drop:(1+p.drop)*(S.buff.mujur>0?2:1),xp:(1+p.xp)*(S.buff.ilmu>0?2:1),rare:p.rare,regen:p.regen,shard:p.shard}};
  for(const h of URUT){const b=HERO[h],x=m[h];
    D.h[h]={atk:(b.atk*lv+x._a)*(1+x.atk)*amarah,hp:(b.hp*lv+x._h)*(1+x.hp),def:(b.def+x._d)*(1+x.def),crit:Math.min(.8,.05+(h==='pemburu'?.08:0)+x.crit),critd:1.6+x.critd,
      spd:b.spd*(1+x.spd)*(S.buff.perang>0?1+(S.buffV.spd||0):1),life:x.life,dodge:Math.min(.6,x.dodge),cdr:Math.min(.6,x.cdr),splash:x.splash,heal:x.heal,bos:x.bos,ganda:x.ganda,pantul:x.pantul,tahan:Math.min(.5,x.tahan),fajar:x.fajar,dash:x.dash,gerak:x.gerak,magnet:x.magnet,tembus:x.tembus}}
  
}
function dapatJurus(id){
  const baru=!S.kartu[id];S.kartu[id]=(S.kartu[id]||0)+1;onChange('jurus');return baru;
}
function rollJurus(k){
  const hs=terbuka(),w=BOBOT_JURUS[k].map((v,i)=>i===4&&STG()<31?0:v*(i?(1+D.p.rare)**i:1)),tot=w.reduce((a,b)=>a+b,0);
  let t=rnd()*tot,r=0;for(;r<4;r++){if(t<w[r])break;t-=w[r]}
  const c=Object.values(JURUS).filter(j=>hs.includes(j.h)&&j.r===r);
  return pilih(c.length?c:Object.values(JURUS).filter(j=>hs.includes(j.h))).id;
}
function terima(it){if(S.inv.length>=kapasitas()){S.gold+=hargaJual(it);return false}S.inv.push(it);onChange('inv');return true}
function bukaPeti(k){
  if(S.peti[k]<=0)return null;S.peti[k]--;majuMisi('peti');
  const d=PETI[k],s=STG(),h=[],g=Math.ceil(d.gold*G(s)*acak(.8,1.3));S.gold+=g;h.push({t:'gold',v:g});
  if(d.shard){const v=Math.ceil(d.shard*(1+s/10)*(1+D.p.shard));S.shard+=v;h.push({t:'shard',v})}
  const n=d.item+(k==='emas'&&sk('e8')?1:0);
  for(let i=0;i<n;i++){const it=rollItem(k==='emas'&&i>0?'mini':d.src,s),m=terima(it);h.push({t:'item',it,jual:!m});if(it.r>=3)catat('Peti: '+it.n+' ('+RARITY[it.r].n+').',RARITY[it.r].c)}
  if(rnd()<d.jurus){const id=rollJurus(k),b=dapatJurus(id);h.push({t:'jurus',id,baru:b});if(JURUS[id].r>=3)catat('Jurus: '+JURUS[id].n+' ('+RARITY[JURUS[id].r].n+').',RARITY[JURUS[id].r].c)}
  if(rnd()<.35){const q=pilih(Object.keys(KONSUM));if(tambahKonsum(q))h.push({t:'kon',k:q})}
  onChange('peti');onChange('stat');
  return h;
}
const bintang=id=>Math.min(5,S.kartu[id]||1),kuatJ=id=>1+.15*(bintang(id)-1);
function pasangJurus(h,sl,id){
  if(!S.kartu[id]||JURUS[id].h!==h||!slotBuka(sl))return false;
  const p=S.pasang[h],lain=1-sl;if(p[lain]===id)p[lain]=p[sl];p[sl]=id;
  if(R.p&&R.run&&R.run.hero===h)R.p.j[sl]=Math.max(R.p.j[sl],2);
  onChange('jurus');onChange('regu');return true;
}
function tambahKonsum(k,n=1){
  const a=S.inv.find(x=>x.kon===k);if(a){a.n+=n;onChange('inv');return true}
  if(S.inv.length>=kapasitas())return false;
  S.inv.push({id:nid++,kon:k,n});onChange('inv');return true;
}
function pakai(it,h){
  if(!bisaPakai(it,h))return false;
  const lama=S.eq[h][it.slot];S.inv=S.inv.filter(x=>x!==it);S.eq[h][it.slot]=it;if(lama)S.inv.push(lama);
  hitung();onChange('inv');onChange('stat');return true;
}
function lepas(h,sl){
  const e=S.eq[h][sl];if(!e||S.inv.length>=kapasitas())return false;
  S.eq[h][sl]=null;S.inv.push(e);hitung();onChange('inv');onChange('stat');return true;
}
function jual(it){S.gold+=hargaJual(it);S.inv=S.inv.filter(x=>x!==it);onChange('inv')}
function lebur(it){S.shard+=shardDari(it);S.inv=S.inv.filter(x=>x!==it);onChange('inv')}
function tempa(it){
  const c=biayaTempa(it);if(it.plus>=10||S.gold<c.gold||S.shard<c.shard)return false;
  S.gold-=c.gold;S.shard-=c.shard;it.plus++;majuMisi('tempa');hitung();onChange('inv');onChange('stat');return true;
}
function beli(k){const h=hargaKonsum(k);if(S.gold<h)return false;if(!tambahKonsum(k)){catat('Tas penuh. Kosongkan satu slot dulu.','#ff8a7a');return false}S.gold-=h;return true}
function naikKamp(k){const d=KAMP[k],c=biayaKamp(k);if((d.max&&kp(k)>=d.max)||S.gold<c)return false;S.gold-=c;S.kamp[k]=kp(k)+1;hitung();onChange('kamp');onChange('stat');onChange('inv');return true}
function halangan(k){
  const d=SK[k],r=reqSk(k);
  if(sk(k)>=d.max)return 'Sudah maksimal.';
  if(d.h&&!terbuka().includes(d.h))return HERO[d.h].kelas+' belum bergabung. Terbuka setelah mengalahkan Babak '+BUKA[d.h]+'.';
  if(r.length&&!r.some(x=>sk(x)>0))return 'Pelajari '+r.map(x=>SK[x].n).join(' atau ')+' lebih dulu.';
  if(d.atau&&sk(d.atau)>0)return 'Terkunci karena memilih '+SK[d.atau].n+'. Atur ulang poin untuk menggantinya.';
  if(d.minP&&poinCabang(k[0])<d.minP)return 'Butuh '+d.minP+' poin di cabang ini. Sekarang '+poinCabang(k[0])+'.';
  if(S.sp<biayaSk(k))return 'Skill point belum cukup.';
  return '';
}
const bisaBelajar=k=>!halangan(k);
function belajar(k){if(!bisaBelajar(k))return false;S.sp-=biayaSk(k);S.sk[k]=sk(k)+1;hitung();onChange('skill');onChange('stat');onChange('inv');return true}
function aturUlangSkill(){let n=0;for(const k in S.sk)n+=S.sk[k]*biayaSk(k);S.sk={};S.sp+=n;hitung();onChange('skill');onChange('stat');onChange('inv')}
function bisaRune(k){const d=RN[k];return rn(k)<d.max&&S.runes>=biayaRn(k)&&(!d.req||rn(d.req)>0)}
function beliRune(k){if(!bisaRune(k))return false;S.runes-=biayaRn(k);S.rn[k]=rn(k)+1;hitung();onChange('rune');onChange('stat');return true}
function dapatItem(it){
  if(S.opt.autoEquip){const h=penerimaTerbaik(it);if(h){S.inv.push(it);pakai(it,h);if(S.inv.length>kapasitas())jual(S.inv[S.inv.length-1]);catat(HERO[h].n+' memakai '+it.n+'.',RARITY[it.r].c);return}}
  fx({k:'jarah',it});
  if(it.r<=S.opt.autoSell&&!adaLebihBaik(it)){S.gold+=hargaJual(it);return}
  if(S.inv.length>=kapasitas()){S.gold+=hargaJual(it);catat('Tas penuh. '+it.n+' langsung dijual.','#b0a8c2');return}
  S.inv.push(it);onChange('inv');
  if(it.r>=2)catat('Menemukan '+it.n+' ('+RARITY[it.r].n+').',RARITY[it.r].c);
}

const noAct=s=>Math.floor((s-1)/10)%NB,actDari=s=>ACT[noAct(s)];

// ===== EKSPEDISI: inti game aksi =====
// Satuan dunia: piksel tile 16. Logika tidak menyentuh DOM supaya bisa diuji tanpa browser.
const TL=16;
const BUKA={ksatria:0,pemburu:1,penyihir:2,tabib:3,kurcaci:5};
const terbuka=()=>URUT.filter(h=>S.prog>=BUKA[h]);
const slotBuka=sl=>sl===0||S.prog>=1;
const SERANG={ksatria:{cd:.5,j:'tebas'},pemburu:{cd:.42,j:'panah'},penyihir:{cd:.6,j:'bola'},tabib:{cd:.55,j:'suci'},kurcaci:{cd:.62,j:'kapak'}};
const STG=()=>R.run?Math.round((R.run.babak-1)*10+R.run.lantai*1.4+1+R.run.tingkat*NB*10):Math.max(1,S.prog*10);
const hargaKonsum=k=>Math.ceil(KONSUM[k].harga*G(STG()));
const TINGKAT=['Normal','Mimpi Buruk','Neraka','Hampa','Abadi'];
const romawi=n=>{let o='';for(const [v,h] of [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']])while(n>=v){o+=h;n-=v}return o};
// Setelah Abadi, tingkat berlanjut tanpa batas: Abadi II, Abadi III, dan seterusnya.
const MUTASI={ledak:{n:'Musuh Meledak',d:'Separuh musuh biasa meledak saat mati.'},racun:{n:'Lantai Beracun',d:'Kolam racun muncul di dekatmu tiap 6 detik.'},
  pengawal:{n:'Bos Dikawal',d:'Bos dan penjaga muncul bersama dua elite.'},gesit:{n:'Musuh Gesit',d:'Semua musuh 25% lebih cepat.'},tebal:{n:'Elite Berlapis',d:'Elite dan penjaga punya +60% HP.'}};
// Pengubah ditentukan oleh tingkat, jadi Abadi II selalu sama bagi semua pemain. 1 pengubah di Abadi II-III, 2 mulai Abadi IV, 3 mulai Abadi VII.
function mutasiT(t){if(t<5)return [];let x=t*7919+13;const r=()=>{x=(x*1103515245+12345)%2147483648;return x/2147483648},k=Object.keys(MUTASI),n=t>=10?3:t>=7?2:1,o=[];
  while(o.length<n){const id=k[Math.floor(r()*k.length)];if(!o.includes(id))o.push(id)}return o}
const mutasi=id=>!!R.run?.mutasi?.includes(id);
const namaT=t=>t<TINGKAT.length?TINGKAT[t]:'Abadi '+romawi(t-TINGKAT.length+2);
const PAKTA={tebal:{n:'Musuh Tangguh',d:'+30% HP musuh'},garang:{n:'Musuh Ganas',d:'+25% serangan musuh'},kering:{n:'Tanpa Jantung',d:'Musuh tidak menjatuhkan pemulih HP'}};
const bonusPakta=()=>1+.2*(R.run?.pakta?.length||0)+.25*(R.run?.mutasi?.length||0);
const CAPAIAN={pertama:'Musuh Pertama',ratus:'Pemburu Monster',bos:'Penakluk Bos',duo:'Peramu Duo',menang:'Ekspedisi Selesai',harian:'Juara Harian',abadi:'Melampaui Abadi',bayangan:'Pemburu Bayangan',misi:'Tekun Harian',kebal:'Tak Tersentuh'};
// --- Misi Harian: tiga tugas per hari UTC, sama untuk semua pemain. ---
const MISI={bunuh:{t:'Kalahkan {n} monster',n:150},elit:{t:'Kalahkan {n} elite atau bos',n:6},ruang:{t:'Bersihkan {n} ruangan',n:12},peti:{t:'Buka {n} peti',n:3},
  menang:{t:'Menangkan {n} ekspedisi',n:1},berkat:{t:'Ambil {n} berkat',n:10},tempa:{t:'Tempa item {n} kali',n:3}};
const teksMisi=id=>MISI[id].t.replace('{n}',MISI[id].n);
function misiHariIni(){const t=tanggalUTC();if(S.misi?.tgl===t)return S.misi;const r=acakHarian(t),k=Object.keys(MISI),l=[];for(let i=0;i<7;i++)r();
  while(l.length<3){const id=k[Math.floor(r()*k.length)];if(!l.some(x=>x.id===id))l.push({id,v:0,klaim:false})}S.misi={tgl:t,l,bonus:false};return S.misi}
function majuMisi(id,n=1){if(!S)return;const m=misiHariIni();for(const x of m.l)if(x.id===id&&x.v<MISI[id].n){x.v=Math.min(MISI[id].n,x.v+n);if(x.v>=MISI[id].n)catat('Misi selesai: '+teksMisi(id)+'. Ambil hadiahnya di Kamp.','#9fe0a0');onChange('kamp')}}
const hadiahMisi=()=>({rune:2,gold:Math.ceil(400*G(Math.max(1,S.prog*10)))});
function klaimMisi(i){const m=misiHariIni(),x=m.l[i];if(!x||x.klaim||x.v<MISI[x.id].n)return false;const h=hadiahMisi();x.klaim=true;S.runes+=h.rune;S.gold+=h.gold;dapatPeti('perak');
  if(m.l.every(y=>y.klaim)&&!m.bonus){m.bonus=true;dapatPeti('emas');capai('misi')}onChange('kamp');onChange('rune');simpan();return true}
function capai(id){if(S.capaian[id])return;S.capaian[id]=Date.now();S.runes++;catat('Pencapaian: '+CAPAIAN[id]+' (+1 rune)','#ffd27a');onChange('rune')}
const indeksBabak=(t,b)=>t*NB+b-1;
const bolehBabak=(t,b)=>indeksBabak(t,b)<=S.prog;

// Penyesuaian data lama untuk mode aksi.
Object.assign(JURUS.tameng,{b:'terjang',el:'fisik',d:'Menerjang ke depan dan menghantam semua musuh yang dilewati, 300% ATK.'});
Object.assign(JURUS.perkasa,{b:'putar',el:'fisik',d:'Tebasan berputar di sekeliling pahlawan, 250% ATK.'});
Object.assign(JURUS.perang,{b:'buff',el:'api',d:'ATK +30% selama 8 detik.'});
Object.assign(JURUS.bteng,{b:'perisai',el:'suci',d:'Perisai 30% HP maksimal.'});
Object.assign(JURUS.pusar,{b:'orbit',el:'fisik',jml:4,dur:3.5,m:.9,d:'Empat pedang berputar mengelilingi pahlawan selama 3.5 detik, 90% ATK per sabetan.'});
Object.assign(JURUS.surga,{b:'langit',el:'suci',m:6,d:'Pedang cahaya raksasa jatuh di kerumunan musuh, 600% ATK.'});
Object.assign(JURUS.sjitu,{b:'besar',el:'fisik',d:'Panah besar yang menembus semua musuh, 350% ATK.'});
Object.assign(JURUS.hujan,{b:'hujan',el:'fisik',d:'6 panah jatuh dari langit ke musuh acak, 80% ATK masing-masing.'});
Object.assign(JURUS.pes,{b:'kipas',el:'es',jml:7,d:'Tujuh panah es menyebar, 120% ATK dan membekukan.'});
Object.assign(JURUS.pracun,{b:'kipas',el:'racun',jml:7,d:'Tujuh panah racun menyebar, 80% ATK dan meracuni.'});
Object.assign(JURUS.jantung,{b:'besar',el:'darah',d:'Panah merah raksasa yang menembus semua musuh, 900% ATK.'});
Object.assign(JURUS.seribu,{b:'hujan',el:'fisik',d:'20 panah menghujani seluruh ruangan, 75% ATK masing-masing.'});
Object.assign(JURUS.boles,{b:'nova',el:'es',d:'Ledakan es di sekitar pahlawan, 120% ATK dan membekukan.'});
Object.assign(JURUS.rantai,{b:'petir',el:'petir',d:'5 petir menyambar musuh acak, 110% ATK masing-masing.'});
Object.assign(JURUS.meteor,{b:'meteor',el:'api',d:'Meteor jatuh di kerumunan musuh, 300% ATK dan membakar.'});
Object.assign(JURUS.nova,{b:'nova',el:'api',d:'Gelombang api di sekitar pahlawan, 350% ATK dan membakar.'});
Object.assign(JURUS.hampa,{b:'hampa',el:'hampa',dur:3,d:'Pusaran hampa menarik musuh ke tengah selama 3 detik. Musuh di dalamnya menerima +40% damage.'});
Object.assign(JURUS.hmeteor,{b:'meteor',el:'api',d:'Tiga meteor jatuh di tiga titik, 300% ATK masing-masing.'});
Object.assign(JURUS.sdoa,{b:'pulih',el:'suci',d:'Memulihkan 20% HP.'});
Object.assign(JURUS.cahaya,{b:'pulih',el:'suci',q:.35,d:'Memulihkan 35% HP dan menghapus racun.'});
Object.assign(JURUS.pdoa,{b:'perisai',el:'suci',d:'Perisai 35% HP maksimal.'});
Object.assign(JURUS.berkah,{b:'buff',el:'suci',d:'ATK +40% dan kecepatan serang +20% selama 10 detik.'});
Object.assign(JURUS.bgkit,{b:'pulih',el:'suci',d:'Memulihkan 60% HP dan kebal 2 detik.'});
Object.assign(JURUS.mukjizat,{b:'pulih',el:'suci',d:'Memulihkan seluruh HP, kebal 3 detik, dan perisai 30% HP.'});
Object.assign(KONSUM.gulung,{n:'Gulungan Kabur',d:'Keluar dari ruangan pertempuran tanpa menyelesaikannya.'});
Object.assign(KONSUM.tonik,{d:'Memulihkan 45% HP saat ekspedisi.'});
Object.assign(KONSUM.amarah,{d:'+50% ATK selama 60 detik.'});
Object.assign(KONSUM.bom,{d:'Memberi 300% ATK ke semua musuh di ruangan.'});
Object.assign(RN.r3,{n:'Bekal Berkat',d:'Mulai tiap ekspedisi dengan 1 berkat acak per tingkat.'});
KAMP.tambang={n:'Tambang Emas',ik:'misc_stone',d:'Menghasilkan gold terus-menerus, juga saat game ditutup.',fx:{},dasar:60,g:1.45};
// Perilaku musuh di ruangan.
const AI_LOMPAT=new Set(['swampy','muddy','lendirb','lumpurb','spora']),AI_SERBU=new Set(['jenderal','orc','topeng','kapten','chort','chortb','orcb','rajachort','rangkab']);
const POLA_BOS={ratukabut:['kedip','racun','panggil','spiral'],raksasaes:['es','hantam','cincin','serbu'],rajaogre:['hantam','cincin','serbu'],panglima:['panggil','serbu','cincin'],zombir:['racun','hantam','panggil'],busuk:['racun','spiral','panggil'],iblis:['spiral','cincin','api'],raja:['spiral','hantam','panggil','cincin','api']};
const POLA_BOS_2={ratukabut:['kedip','spiral','kedip','racun','panggil'],raksasaes:['es','serbu','es','spiral','hantam'],rajaogre:['serbu','spiral','hantam','cincin'],panglima:['panggil','spiral','serbu','cincin'],zombir:['racun','spiral','panggil','hantam'],busuk:['spiral','racun','api','panggil'],iblis:['api','spiral','serbu','cincin'],raja:['spiral','api','panggil','serbu','cincin']};
const SIFAT_ELITE={cepat:'Cepat',perisai:'Berperisai',bagi:'Membelah',api:'Jejak Api'};
const POLA_MINI={tetua:['panggil','racun'],jenderal:['serbu','es'],raksiput:['cincin','hantam'],kapten:['serbu','panggil'],rangkab:['hantam','cincin'],rajalabu:['racun','hantam'],rajachort:['api','serbu'],wogolb:['spiral','panggil']};
const aiFoe=k=>FOE[k].ai?FOE[k].ai:FOE[k].jarak?'tembak':AI_LOMPAT.has(k)?'lompat':AI_SERBU.has(k)?'serbu':'kejar';

// Berkat: pilihan kekuatan sementara selama ekspedisi, punya rarity seperti Hades.
const MR=[1,1.5,2,2.6,3.5];
const BERKAT=[
  {id:'tajam',n:'Mata Pedang',ik:'sure_blade',v:.15,d:x=>`+${pct(x)} ATK`},
  {id:'cepat',n:'Tangan Kilat',ik:'swiftness',v:.12,d:x=>`+${pct(x)} kecepatan serang`},
  {id:'kritis',n:'Titik Lemah',ik:'searing_ray',v:.06,d:x=>`+${pct(x)} peluang kritis`},
  {id:'ganas',n:'Luka Dalam',ik:'excruciating_wounds',v:.25,d:x=>`+${pct(x)} damage kritis`},
  {id:'banyak',n:'Tembakan Ganda',ik:'magic_dart',v:1,maks:3,tetap:1,d:x=>`+1 serangan beruntun (total ${x})`},
  {id:'kipas',n:'Serangan Kipas',ik:'dazzling_spray',v:1,maks:2,tetap:1,d:x=>`+2 serangan menyamping (total ${x*2})`},
  {id:'tembus',n:'Tembus',ik:'force_lance',v:1,maks:3,tetap:1,d:x=>`Proyektil menembus ${x} musuh`},
  {id:'pantul',n:'Memantul',ik:'deflect_missiles',v:1,maks:3,tetap:1,d:x=>`Proyektil memantul dari dinding ${x} kali`},
  {id:'rantai',n:'Petir Berantai',ik:'chain_lightning',v:.3,d:x=>`25% peluang petir melompat ke 2 musuh, ${pct(x)} ATK`},
  {id:'api',n:'Elemen Api',ik:'sticky_flame',v:.2,d:x=>`Serangan membakar ${pct(x)} ATK per detik selama 3 detik`},
  {id:'es',n:'Elemen Es',ik:'freeze',v:.08,d:x=>`Serangan memperlambat dan ${pct(x)} peluang membekukan`},
  {id:'racun',n:'Racun',ik:'venom_bolt',v:.12,d:x=>`Serangan meracuni ${pct(x)} ATK per detik, menumpuk`},
  {id:'ledak',n:'Ledakan Maut',ik:'fireball',v:.5,d:x=>`Musuh yang mati meledak, ${pct(x)} ATK di sekitarnya`},
  {id:'orbit',n:'Bilah Pengawal',ik:'spectral_weapon',v:1,maks:4,tetap:1,d:x=>`${x} bilah berputar mengelilingimu`},
  {id:'roh',n:'Roh Penembak',ik:'urand_shadows',v:.5,d:x=>`Roh menembak tiap detik, ${pct(x)} ATK`},
  {id:'algojo',n:'Algojo',ik:'agony',v:.06,d:x=>`Musuh biasa di bawah ${pct(Math.min(.3,x))} HP langsung mati`},
  {id:'raksasa',n:'Pembunuh Raksasa',ik:'lehudibs_crystal_spear',v:.25,d:x=>`+${pct(x)} damage ke elite dan bos`},
  {id:'nyawa',n:'Jantung Baja',ik:'regeneration',v:.2,d:x=>`+${pct(x)} HP maksimal`},
  {id:'curi',n:'Haus Darah',ik:'vampiric_draining',v:.02,d:x=>`+${pct(x,1)} curi nyawa`},
  {id:'jiwa',n:'Pemakan Jiwa',ik:'sublimation_of_blood',v:.015,d:x=>`Pulih ${pct(x,1)} HP tiap membunuh`},
  {id:'cangkang',n:'Cangkang',ik:'condensation_shield',v:.1,d:x=>`Perisai ${pct(x)} HP terisi ulang tiap 8 detik`},
  {id:'duri',n:'Duri',ik:'ozocubus_armour',v:.5,d:x=>`Memantulkan ${pct(x)} ATK ke musuh yang menyentuhmu`},
  {id:'hindar',n:'Bayangan',ik:'phase_shift',v:.06,d:x=>`+${pct(x)} menghindar`},
  {id:'lari',n:'Langkah Angin',ik:'tornado',v:.1,d:x=>`+${pct(x)} kecepatan gerak`},
  {id:'dash',n:'Lompatan',ik:'controlled_blink',v:.15,d:x=>`Waktu lompat ${pct(Math.min(.6,x))} lebih cepat`},
  {id:'magnet',n:'Magnet',ik:'apportation',v:.5,d:x=>`+${pct(x)} jarak mengambil barang`},
  {id:'emas',n:'Ketamakan',ik:'gozag_bribe_branch',v:.2,d:x=>`+${pct(x)} gold`},
  {id:'fokus',n:'Fokus',ik:'haste',v:.12,d:x=>`Waktu jurus ${pct(Math.min(.6,x))} lebih cepat`},
  {id:'bangkit',n:'Kebangkitan',ik:'borgnjors_revivification',v:1,maks:1,tetap:1,minR:3,d:()=>'Bangkit sekali dengan 50% HP'},
  {id:'putar_arya',h:'ksatria',n:'Lingkar Baja',ik:'blade_hands',v:.65,maks:3,d:x=>`Setiap serangan ke-4 menyapu sekitar, ${pct(x)} ATK`},
  {id:'pecah_laras',h:'pemburu',n:'Panah Pecah',ik:'portal_projectile',v:.45,maks:3,d:x=>`Panah membelah jadi dua, masing-masing ${pct(x)} damage`},
  {id:'kolam_bayu',h:'penyihir',n:'Bara Tertinggal',ik:'hellfire_burst',v:.18,maks:3,d:x=>`Bola api meninggalkan kolam 3 detik, ${pct(x)} ATK per denyut`},
  {id:'balik_ratri',h:'kurcaci',n:'Kapak Pulang',ik:'throwing',v:.35,maks:3,d:x=>`Kapak yang kembali ke tangan memberi +${pct(x)} damage.`},
  {id:'cahaya_nawang',h:'tabib',n:'Doa Penjaga',ik:'shroud_of_golubria',v:.1,maks:3,d:x=>`Jurus penyembuh juga memberi perisai ${pct(x)} HP`}];
const BK={};BERKAT.forEach(b=>BK[b.id]=b);
const nilaiB=id=>R.run&&R.run.b[id]||0;
const DUO=[{id:'api_petir',a:'api',b:'rantai',n:'Badai Bara',ik:'conjure_ball_lightning',d:'Petir berantai juga membakar musuh.'},
  {id:'es_tembus',a:'es',b:'tembus',n:'Panah Glasial',ik:'throw_icicle',d:'Proyektil penembus membekukan sasaran.'},
  {id:'racun_ledak',a:'racun',b:'ledak',n:'Wabah Meledak',ik:'poisonous_cloud',d:'Musuh beracun yang mati meninggalkan awan racun.'},
  {id:'api_ledak',a:'api',b:'ledak',n:'Ledakan Bara',ik:'bolt_of_fire',d:'Ledakan saat musuh mati 50% lebih luas dan 50% lebih kuat.'},
  {id:'es_rantai',a:'es',b:'rantai',n:'Petir Beku',ik:'ice_storm',d:'Petir berantai membekukan sasaran 0.6 detik.'},
  {id:'orbit_duri',a:'orbit',b:'duri',n:'Benteng Berduri',ik:'short_blades',d:'Bilah pengawal memberi damage ×2.'},
  {id:'jiwa_curi',a:'jiwa',b:'curi',n:'Pesta Darah',ik:'sublimation_of_blood',d:'Tiap membunuh memulihkan 1.5% HP tambahan dan 5% peluang menjatuhkan jantung.'},
  {id:'kritis_ganas',a:'kritis',b:'ganas',n:'Titik Mati',ik:'stabbing',d:'Serangan kritis punya 15% peluang memberi damage ×2 lagi.'},
  {id:'lari_dash',a:'lari',b:'dash',n:'Langkah Bayang',ik:'dodging',d:'Melompat meninggalkan ledakan bayangan, 80% ATK.'},
  {id:'cangkang_duri',a:'cangkang',b:'duri',n:'Kerak Berduri',ik:'shields',d:'Selama perisai aktif, pantulan duri ×2.'}];
const duoB=id=>!!R.run?.duo?.includes(id);

const KUNCI_S='dungeon-strip-v3';
function baru(){
  S={v:3,L:1,xp:0,gold:0,shard:0,sp:1,prog:0,runes:0,rn:{},sk:{},kamp:{},kartu:{},pasang:{},peti:{kayu:0,perak:0,emas:0},buff:{},buffV:{},inv:[],eq:{},pity:0,
    kodeks:{m:{},u:{}},rate:{gold:0},hero:'ksatria',stat:{run:0,menang:0,bunuh:0},harian:{},capaian:{},opt:{autoEquip:false,autoSell:-1,autoPeti:false,auto:false,suara:true,pakta:[]},last:Date.now()};
  URUT.forEach(h=>{S.eq[h]={senjata:null,helm:null,zirah:null,sarung:null,sepatu:null,aksesori:null}});isiJurus();
  S.eq.ksatria.senjata=buatItem('pedang',0,1);
  S.inv.push(buatItem('helm',1,1),{id:nid++,kon:'tonik',n:3},{id:nid++,kon:'amarah',n:1});
  hitung();
}
function muat(teks){
  try{const o=JSON.parse(teks);if(!o||!o.S)return false;const s=o.S;
    if(s.v===2){s.prog=Math.max(0,Math.min(6,Math.floor(((s.rekor||1)-1)/10)));s.stat={run:0,menang:0,bunuh:0};s.hero='ksatria';s.v=3;
      ['stage','gel','maxStage','rekor','reink','rate'].forEach(k=>delete s[k]);s.rate={gold:0};s.opt={...s.opt,auto:false}}
    if(s.v!==3)return false;
    S=s;nid=o.nid||Date.now();S.kartu=S.kartu||{};S.pasang=S.pasang||{};S.peti=S.peti||{kayu:0,perak:0,emas:0};S.buffV=S.buffV||{};S.stat=S.stat||{run:0,menang:0,bunuh:0};S.harian=S.harian||{};S.capaian=S.capaian||{};S.opt=S.opt||{};S.opt.pakta=S.opt.pakta||[];S.opt.auto=false;isiJurus();
    for(const h of URUT){S.eq[h]=S.eq[h]||{};for(const k of SLOTS)S.eq[h][k]=S.eq[h][k]||null}
    senjataAwal();hitung();pulihkanRun(o.run,o.uid);return true}catch(e){return false}
}
function senjataAwal(){for(const h of terbuka())if(!S.eq[h].senjata)S.eq[h].senjata=buatItem(HERO[h].senj[0],1,Math.max(1,S.prog*10))}
function dataRun(){
  if(!R.run)return null;
  const p={...R.p,terjang:null};
  return {fase:R.fase,run:R.run,p,ruang:R.ruang||null,mus:R.mus||[],
    pp:(R.pp||[]).map(b=>({...b,kena:[...(b.kena||[])].map(m=>m.uid)})),pm:R.pm||[],zona:R.zona||[],ambil:R.ambil||[],
    tawar:R.tawar||null,setelahPilih:R.setelahPilih||null,antrePilih:R.antrePilih||0,dialog:R.dialog||null,hasil:R.hasil||null,aspek:R.aspek||null};
}
function pulihkanRun(data,nomorUid){
  if(!data||!data.run||!['peta','ruang','pilih','hasil'].includes(data.fase)){R.run=null;R.fase='kamp';return}
  R.run=data.run;R.p=data.p;R.ruang=data.ruang;R.mus=data.mus||[];R.pm=data.pm||[];R.zona=data.zona||[];R.ambil=data.ambil||[];
  const mus=new Map(R.mus.map(m=>[m.uid,m]));R.pp=(data.pp||[]).map(b=>({...b,kena:new Set((b.kena||[]).map(id=>mus.get(id)).filter(Boolean))}));
  R.tawar=data.tawar;R.setelahPilih=data.setelahPilih;R.antrePilih=data.antrePilih||0;R.dialog=data.dialog;R.hasil=data.hasil;R.aspek=data.aspek;
  R.antre=[];R.fx=[];R.fase=data.fase;R.st=statRun();R.p.max=R.st.max;R.p.hp=Math.min(R.p.hp,R.p.max);R.p.dashT=0;R.p.terjang=null;
  uid=Math.max(nomorUid||1,...R.mus.map(m=>m.uid+1));
}
function buatSimpanan(){S.last=Date.now();return JSON.stringify({S,nid,uid,run:dataRun()})}
function simpan(){try{localStorage.setItem(KUNCI_S,buatSimpanan())}catch(e){}}
function laju(){return kp('tambang')*2*G(Math.max(1,S.prog*10))/60}
function hitungOffline(detik){const batas=(2+2*sk('e7'))*3600,t=Math.min(detik,batas),g=laju()*t*(1+.1*sk('e7'));S.gold+=g;return {t,gold:g}}
function dapatPeti(k){S.peti[k]++;if(R.run)R.run.peti[k]=(R.run.peti[k]||0)+1;fx({k:'peti',tier:k});onChange('peti');if(S.opt.autoPeti)bukaPeti(k)}

// --- statistik pahlawan di dalam ekspedisi ---
function statRun(){
  const r=R.run,h=r.hero,d=D.h[h],b=r.b,buf=(S.buff.amarah>0?1.5:1);
  return {atk:d.atk*(1+(b.tajam||0))*buf,max:d.hp*(1+(b.nyawa||0))*(r.kutukHP||1),def:d.def,crit:Math.min(.9,d.crit+(b.kritis||0)),critd:d.critd+(b.ganas||0),
    aspd:d.spd/HERO[h].spd*(1+(b.cepat||0)),life:d.life+(b.curi||0),dodge:Math.min(.6,d.dodge+(b.hindar||0)),tahan:d.tahan,cdr:Math.min(.6,d.cdr+(b.fokus||0)),
    gerak:68*(1+(b.lari||0)+d.gerak),dashCd:1.5*(1-Math.min(.6,(b.dash||0)+d.dash)),magnet:26*(1+(b.magnet||0)+d.magnet),splash:d.splash,heal:d.heal,bos:d.bos+(b.raksasa||0),ganda:d.ganda,pantul:d.pantul+(b.duri||0),fajar:d.fajar,tembus:d.tembus};
}
function segarkanStat(){if(!R.run)return;const p=R.p,lama=p.max||1;R.st=statRun();p.max=R.st.max;p.hp=Math.min(p.max,p.hp*(p.max/lama))}

// --- peta rute ---
const tanggalUTC=()=>new Date().toISOString().slice(0,10);
function acakHarian(tanggal){let x=Number(tanggal.replaceAll('-',''))|0;return ()=>{x+=0x6D2B79F5;let y=x;y=Math.imul(y^y>>>15,y|1);y^=y+Math.imul(y^y>>>7,y|61);return ((y^y>>>14)>>>0)/4294967296}}
function buatPeta(seed){
  const rand=seed?acakHarian(seed):rnd;
  const L=[],jum=[2,3,3,4,3,3,1];
  for(let i=0;i<7;i++){const n=i===6?1:jum[i]+(rand()<.3&&i>0&&i<5?1:0),baris=[];
    for(let j=0;j<n;j++){let t='tempur';
      if(i===6)t='bos';else if(i===5)t='api';else if(i>0){const w=[['tempur',38],['elit',i>1?14:0],['tantangan',i>1?9:0],['peti',12],['toko',i>1?10:0],['misteri',14],['api',i>2?6:0]];let tot=w.reduce((a,b)=>a+b[1],0),x=rand()*tot;for(const [k,v] of w){if(x<v){t=k;break}x-=v}}
      baris.push({id:i+'-'+j,lapis:i,j,x:n===1?.5:(j+.5)/n,t,ke:[]})}
    L.push(baris)}
  for(let i=0;i<6;i++){const a=L[i],b=L[i+1];
    a.forEach(n=>{const pos=n.x*(b.length);const c=Math.min(b.length-1,Math.floor(pos));n.ke.push(b[c].id);if(rand()<.45&&b.length>1){const d=Math.min(b.length-1,Math.max(0,c+(rand()<.5?-1:1)));if(!n.ke.includes(b[d].id))n.ke.push(b[d].id)}});
    b.forEach(m=>{if(!a.some(n=>n.ke.includes(m.id))){let best=a[0];for(const n of a)if(Math.abs(n.x-m.x)<Math.abs(best.x-m.x))best=n;best.ke.push(m.id)}})}
  return L;
}
const nodeDari=id=>{const [i,j]=id.split('-').map(Number);return R.run.peta[i][j]};
function bisaPilihNode(id){const r=R.run;if(R.fase!=='peta')return false;const n=nodeDari(id);if(!r.posisi)return n.lapis===0;return nodeDari(r.posisi).ke.includes(id)}

// --- memulai dan mengakhiri ekspedisi ---
function mulaiRun(h,babak,tingkat=0,harian=false){
  if(!terbuka().includes(h)||!bolehBabak(tingkat,babak))return false;
  S.hero=h;S.stat.run++;
  R.run={hero:h,babak,tingkat,mutasi:mutasiT(tingkat),pakta:tingkat>0?[...(S.opt.pakta||[])]:[],harian:harian?tanggalUTC():null,lantai:0,peta:buatPeta(harian?tanggalUTC():null),posisi:null,b:{},lv:{},rar:{},level:1,xp:0,gold:0,kill:0,loot:[],peti:{},waktu:0,bangkitT8:false,ruang:0};
  R.p={x:0,y:0,r:5,hp:1,max:1,sh:0,inv:0,dash:0,dashT:0,dx:0,dy:1,cd:0,ax:1,ay:0,gerak:false,j:[2,4],tShell:8,benteng:false,hitN:0,racun:null};
  R.st=statRun();R.p.max=R.st.max;R.p.hp=R.p.max;
  for(let i=0;i<rn('r3');i++){const o=tawarBerkat(1)[0];if(o)ambilBerkat(o)}
  R.fase='peta';R.antre=[];onChange('run');simpan();return true;
}
function akhirRun(menang){
  const r=R.run;if(!r||R.fase==='hasil')return;
  const runeSebelum=S.runes;
  let rune=0,baruBuka=null;
  if(menang){S.stat.menang++;const idx=indeksBabak(r.tingkat,r.babak);rune=r.babak*2*(1+r.tingkat)+(idx===S.prog?5:0);
    if(idx===S.prog){S.prog++;baruBuka=URUT.find(h=>BUKA[h]===S.prog)||null;if(baruBuka)senjataAwal()}}
  rune=Math.ceil(rune*bonusPakta());if(menang&&r.harian&&!S.harian[r.harian]?.menang)rune+=3;S.runes+=rune;
  if(r.harian){const rek=S.harian[r.harian]||{};S.harian[r.harian]={menang:rek.menang||menang,kill:Math.max(rek.kill||0,r.kill),waktu:menang?Math.min(rek.waktu||Infinity,r.waktu):rek.waktu||null};if(menang)capai('harian')}
  if(menang){capai('menang');majuMisi('menang');if(r.tingkat>=TINGKAT.length)capai('abadi');S.stat.rekorT=Math.max(S.stat.rekorT||0,r.tingkat)}
  R.hasil={menang,babak:r.babak,tingkat:r.tingkat,harian:r.harian,pakta:r.pakta,lantai:r.lantai,kill:r.kill,gold:r.gold,loot:r.loot,peti:r.peti,rune:S.runes-runeSebelum,baruBuka,level:r.level,waktu:r.waktu};
  R.fase='hasil';fx({k:menang?'menangRun':'kalahRun'});onChange('all');simpan();
}
function kembaliKamp(){R.run=null;R.hasil=null;R.fase='kamp';R.ruang=null;onChange('all');simpan()}

// --- ruangan ---
function buatRuang(t){
  const pot=R.aspek==='p',babak=R.run?.babak||1,tingkat=R.run?.tingkat||0,
    tambahan=Math.min(3,Math.floor((babak-1)/2)+Math.floor(tingkat/2)),
    C=(pot?10:16)+tambahan*2,Rw=(pot?16:10)+tambahan,g=[];
  for(let y=0;y<Rw+2;y++){g.push([]);for(let x=0;x<C+2;x++)g[y].push(x===0||y===0||x===C+1||y===Rw+1?1:0)}
  const peti=[],pilar=[],duri=[],medan=[];
  const bebas=(x,y)=>g[y]&&g[y][x]===0&&!(Math.abs(x-(C+1)/2)<1.6)&&y>1&&y<Rw;
  if(t==='tempur'||t==='elit'||t==='tantangan'){
    const tata=pilih(['kosong','pilar','tengah','peti','duri']);
    if(tata==='pilar')for(const [fx2,fy] of [[.25,.3],[.75,.3],[.25,.7],[.75,.7]]){const x=Math.round(fx2*C)+1,y=Math.round(fy*Rw)+1;if(bebas(x,y)){g[y][x]=2;pilar.push({x,y})}}
    if(tata==='tengah'){const cx=Math.floor((C+1)/2),cy=Math.floor((Rw+1)/2);for(const [dx,dy] of [[-2,0],[2,0],[-2,-1],[2,1]]){const x=cx+dx,y=cy+dy;if(g[y]&&g[y][x]===0){g[y][x]=2;pilar.push({x,y})}}}
    if(tata==='peti'||rnd()<.5)for(let i=0;i<4;i++){const x=1+Math.floor(rnd()*C),y=2+Math.floor(rnd()*(Rw-2));if(bebas(x,y)){g[y][x]=3;peti.push({x,y,hp:2})}}
    if(tata==='duri')for(let i=0;i<6;i++){const x=1+Math.floor(rnd()*C),y=2+Math.floor(rnd()*(Rw-3));if(bebas(x,y))duri.push({x,y})}
    const jm={1:'licin',5:'lava',7:'lumpur',8:'licin'}[(babak-1)%NB+1];if(jm)for(let i=0;i<Math.max(5,Math.floor(C*Rw/(jm==='lumpur'?18:24)));i++){const x=2+Math.floor(rnd()*(C-2)),y=2+Math.floor(rnd()*(Rw-2));if(bebas(x,y))medan.push({x,y,t:jm})}
  }
  const pintu={x:Math.floor((C+1)/2),y:0};
  return {t,C,Rw,g,peti,pilar,duri,medan,pintu,buka:false,bersih:false,gel:[],gelI:0,tGel:.8,obj:null,seed:Math.floor(rnd()*1e6),dekor:Math.floor(rnd()*1e6),tDuri:0,batas:t==='tantangan'?60:0};
}
const W_=r=>(r.C+2)*TL,H_=r=>(r.Rw+2)*TL;
function solid(x,y,terbang){const r=R.ruang,tx=Math.floor(x/TL),ty=Math.floor(y/TL);if(!r.g[ty]||r.g[ty][tx]===undefined)return true;const v=r.g[ty][tx];return v===1||(!terbang&&(v===2||v===3))}
function geser(o,dx,dy,terbang){
  const r=o.r;
  if(dx){const nx=o.x+dx,sx=nx+Math.sign(dx)*r;if(!solid(sx,o.y-r*.8,terbang)&&!solid(sx,o.y+r*.8,terbang))o.x=nx;else{o.dindingX=true}}
  if(dy){const ny=o.y+dy,sy=ny+Math.sign(dy)*r;if(!solid(o.x-r*.8,sy,terbang)&&!solid(o.x+r*.8,sy,terbang))o.y=ny;else{o.dindingY=true}}
}
function masukRuang(n){
  const r=R.run;r.lantai=n.lapis;r.ruang++;r.posisi=n.id;
  const ru=buatRuang(n.t);R.ruang=ru;R.mus=[];R.pp=[];R.pm=[];R.zona=[];R.ambil=[];R.antre=[];R.dialog=null;
  R.p.x=W_(ru)/2;R.p.y=H_(ru)-TL*1.8;R.p.benteng=false;R.p.inv=1;R.p.racun=null;
  const a=actDari((r.babak-1)*10+1),lvl=(r.babak-1)+r.tingkat*NB;
  if(n.t==='tempur'){const g=2+(n.lapis>=3?1:0);for(let i=0;i<g;i++){const k=Math.min(7,3+Math.floor(lvl*.4)+Math.floor(n.lapis/2)+(i>0?1:0));ru.gel.push(Array.from({length:k},()=>({key:pilih(a.foes),peran:'biasa'})))}}
  else if(n.t==='elit'){ru.gel.push([{key:a.mini,peran:'mini'},{key:pilih(a.foes),peran:'biasa'},{key:pilih(a.foes),peran:'biasa'}]);ru.gel.push(Array.from({length:4},()=>({key:pilih(a.foes),peran:'elit'})).slice(0,2+Math.floor(n.lapis/3)))}
  else if(n.t==='tantangan'){for(let i=0;i<3;i++){const jumlah=3+Math.floor(n.lapis/2)+i;ru.gel.push(Array.from({length:jumlah},(_,j)=>({key:pilih(a.foes),peran:i===2&&j<2?'elit':'biasa'})))}}
  else if(n.t==='bos'){ru.gel.push([{key:a.bos,peran:'bos'},...(mutasi('pengawal')?[0,1].map(()=>({key:pilih(a.foes),peran:'elit'})):[])])}
  else{ru.bersih=true;ru.buka=true;
    if(n.t==='peti')ru.obj={t:'peti',x:W_(ru)/2,y:H_(ru)/2,buka:false,mimik:rnd()<.15};
    if(n.t==='toko')ru.obj={t:'toko',x:W_(ru)/2,y:H_(ru)/2-TL,stok:buatToko()};
    if(n.t==='api')ru.obj={t:'api',x:W_(ru)/2,y:TL*2.2,pakai:false};
    if(n.t==='misteri')ru.obj={t:'misteri',x:W_(ru)/2,y:H_(ru)/2-TL,jenis:pilih(['malaikat','iblis','harta','jebakan','pedagang','altar','sergap','mancur']),pakai:false}}
  R.fase='ruang';fx({k:'masukRuang',t:n.t});onChange('run');simpan();
}
function buatMusuh(key,peran){
  const d=FOE[key],r=R.run,lvl=(r.babak-1)+r.tingkat*NB,lt=r.lantai,mul={biasa:1,elit:3.2,mini:12,bos:46}[peran];
  const sg=STG(),hp=24*1.14**(sg-1)*(d.hpM||1)*mul*(r.pakta?.includes('tebal')?1.3:1)*(sk('x5')?1.3:1),atk=4.5*1.12**(sg-1)*(d.atkM||1)*({biasa:1,elit:1.25,mini:1.35,bos:1.5}[peran])*(r.pakta?.includes('garang')?1.25:1);
  const ai=peran==='bos'||peran==='mini'?'bos':aiFoe(key),sc=(d.sc||1)*(peran==='elit'?1.3:peran==='mini'?1.4:1);
  S.kodeks.m[key]=S.kodeks.m[key]||0;
  const sifatElite=peran==='elit'?pilih(Object.keys(SIFAT_ELITE)):null;
  const m={uid:uid++,key,n:(sifatElite?SIFAT_ELITE[sifatElite]+' ':'')+d.n,sp:d.sp,hue:d.hue||0,sc,peran,bos:peran==='bos'||peran==='mini',ai,x:0,y:0,r:Math.max(5,6*sc*(peran==='bos'?1.6:1)),
    hp,max:hp,atk,spd:(d.spdM||1)*(ai==='serbu'?28:ai==='tembak'?24:ai==='lompat'?0:30),cd:acak(1,2),st:'jalan',t:0,vx:0,vy:0,face:-1,
    pola:peran==='bos'?POLA_BOS[key]||['hantam','cincin']:peran==='mini'?POLA_MINI[key]||['hantam','cincin']:null,pi:0,tPola:2.5,bakar:null,racun:0,tRacun:0,lambat:0,beku:0,rentan:0,rV:.4,
    sif:d.sif||null,sifatElite,fase:1,tSif:4,terbang:ai==='tembak'&&['necromancer','angel'].includes(d.sp),tSentuh:0,kenaT:-9,mati:false};
  if(sifatElite==='cepat')m.spd*=1.55;
  if(mutasi('gesit'))m.spd*=1.25;if(mutasi('tebal')&&peran!=='biasa'&&peran!=='bos'){m.hp*=1.6;m.max=m.hp}
  return m;
}
function munculkan(spec){
  const ru=R.ruang;let x,y,n=0;
  do{x=TL*(1.5+rnd()*(ru.C-1));y=TL*(1.8+rnd()*(ru.Rw-2.2));n++}while(n<40&&(solid(x,y)||Math.hypot(x-R.p.x,y-R.p.y)<70));
  if(spec.peran==='bos'||spec.peran==='mini'){x=W_(ru)/2;y=TL*3.2}
  R.zona.push({t:'muncul',x,y,r:8,dl:.75,spec});
}
function tambahMusuh(spec,x,y){const m=buatMusuh(spec.key,spec.peran);m.x=x;m.y=y;if(spec.rahasia){m.rahasia=true;m.n='Bayangan '+m.n;m.hp=m.max*=1.8;m.atk*=1.25;m.hue=((m.hue||0)+170)%360}R.mus.push(m);if(m.bos)fx({k:'bosMasuk',n:m.n,peran:m.peran});return m}

// --- serangan pahlawan ---
function terdekat(x,y,maks=1e9){let b=null,bd=maks;for(const m of R.mus){if(m.mati||m.bawah)continue;const d=Math.hypot(m.x-x,m.y-y)-m.r;if(d<bd){bd=d;b=m}}return b}
function tembakPP(x,y,a,o){R.pp.push({x,y,vx:Math.cos(a)*o.v,vy:Math.sin(a)*o.v,r:o.r||3,dmg:o.dmg,tembus:o.tembus||0,pantul:o.pantul||0,hidup:o.hidup||1.4,hAwal:o.hidup||1.4,balik:o.balik||0,j:o.j,kena:new Set(),ledak:o.ledak||0,el:o.el||null,homing:o.homing||0,a,jurus:!!o.jurus,kritP:o.kritP,pecah:!!o.pecah})}
function kolamBayu(b){if(R.run.hero==='penyihir'&&b.j==='bola'&&nilaiB('kolam_bayu'))zonaKita(b.x,b.y,22,R.st.atk*nilaiB('kolam_bayu'),{dur:3,tick:.65,j:'bara',el:'api'})}
function serangDasar(){
  const p=R.p,st=R.st,h=R.run.hero,t=S.opt.auto?terdekat(p.x,p.y):null;
  const a=t?Math.atan2(t.y-p.y,t.x-p.x):Math.atan2(p.ay,p.ax);p.ax=Math.cos(a);p.ay=Math.sin(a);p.hitN++;
  const n=1+nilaiB('banyak'),kip=nilaiB('kipas'),jenis=SERANG[h].j,ganda=rnd()<st.ganda;
  const dmg=st.atk*(h==='penyihir'&&sk('s8')&&p.hitN%4===0?2:1);
  fx({k:'serang',j:jenis,a});
  if(h==='ksatria'&&nilaiB('putar_arya')&&p.hitN%4===0){for(const m of R.mus)if(!m.mati&&Math.hypot(m.x-p.x,m.y-p.y)-m.r<43)kenai(m,st.atk*nilaiB('putar_arya'),{jurus:1,a:Math.atan2(m.y-p.y,m.x-p.x)});fx({k:'putarHero'})}
  const diDepan=jenis==='tebas'?R.mus.filter(m=>!m.mati&&Math.hypot(m.x-p.x,m.y-p.y)-m.r<34&&Math.abs(((Math.atan2(m.y-p.y,m.x-p.x)-a+Math.PI*3)%(Math.PI*2))-Math.PI)<1.15).sort((u,v)=>Math.hypot(u.x-p.x,u.y-p.y)-Math.hypot(v.x-p.x,v.y-p.y)):[];
  if(diDepan.length){
    diDepan.forEach((m,i)=>kenai(m,dmg*(i===0?1:.7+st.splash),{a}));
    return;
  }
  const o={tebas:{v:220,r:6,hidup:.75,j:'gelombang',tembus:1},panah:{v:290,r:3,hidup:1.4,j:'panah'},bola:{v:210,r:5,hidup:1.4,j:'bola',ledak:24},suci:{v:190,r:4,hidup:1.5,j:'suci',homing:S.opt.auto?3:1.6,tembus:1},kapak:{v:200,r:5,hidup:1.1,j:'kapak',tembus:99,balik:1}}[jenis];
  const pancar=(arah,off)=>{const ox=-Math.sin(arah)*off,oy=Math.cos(arah)*off;tembakPP(p.x+ox,p.y-4+oy,arah,{...o,dmg:dmg*(jenis==='tebas'?.7:1),tembus:(o.tembus||0)+nilaiB('tembus')+(jenis==='panah'?st.tembus:0),pantul:nilaiB('pantul')})};
  for(let i=0;i<n;i++)pancar(a,(i-(n-1)/2)*7);
  if(h==='kurcaci'&&sk('u10'))pancar(a+.3,0);
  for(let k=1;k<=kip;k++){pancar(a+.42*k,0);pancar(a-.42*k,0)}
  if(ganda)setTimeoutLogik(()=>pancar(a,0),.1);
}
function setTimeoutLogik(f,t){R.antre.push({t,f})}
function lompat(arah){const p=R.p;if(R.fase!=='ruang'||p.dash>0||p.dashT>0)return false;if(duoB('lari_dash')){const x0=p.x,y0=p.y;zonaKita(x0,y0,22,R.st.atk*.8,{j:'ledakMati',el:'hampa'});setTimeoutLogik(()=>zonaKita(p.x,p.y,22,R.st.atk*.8,{j:'ledakMati',el:'hampa'}),.18)}const l=Math.hypot(arah.x,arah.y);if(l>.1){p.dx=arah.x/l;p.dy=arah.y/l}p.dashT=.18;p.dashV=240;p.inv=Math.max(p.inv,.3);p.dash=R.st.dashCd;fx({k:'lompat'});return true}
function kenai(m,dmg,o={}){
  if(m.mati||m.bawah)return;const st=R.st;if(o.j==='suci'&&R.run.hero==='tabib')pulihkan(R.p.max*.005);let x=dmg*acak(.9,1.1);
  let c=o.kritP??(rnd()<st.crit);if(R.run.hero==='pemburu'&&sk('p8')&&m.hp>=m.max)c=true;if(c){x*=st.critd;if(duoB('kritis_ganas')&&rnd()<.15)x*=2}
  if(m.bos||m.peran==='elit')x*=1+st.bos;if(m.rentan>0)x*=1+m.rV;if(m.sif==='perisai'||m.sifatElite==='perisai')x*=.7;if(m.sif==='tameng')x*=m.tamengNaik?.25:1.4;
  if(R.run.hero==='pemburu'&&sk('p10')&&m.hp<m.max*.25)x*=2;
  m.hp-=x;m.kenaT=R.run.waktu;
  if(m.peran==='bos'&&m.fase===1&&m.hp>0&&m.hp<=m.max*.5){m.fase=2;m.atk*=1.25;m.spd*=1.3;m.pola=POLA_BOS_2[m.key]||['spiral','serbu','cincin','hantam'];m.pi=0;m.st='jalan';m.tPola=.65;fx({k:'bosFase',m})}
  if(o.a!==undefined&&!m.bos){m.vx+=Math.cos(o.a)*(o.dorong||60);m.vy+=Math.sin(o.a)*(o.dorong||60)}
  if(st.life)pulihkan(x*st.life);
  if(c&&st.fajar)pulihkan(R.p.max*.01);
  if(!o.jurus&&!o.efek){
    if(nilaiB('api'))m.bakar={t:3,v:st.atk*nilaiB('api')};
    if(R.run.hero==='penyihir'&&sk('s4'))m.bakar={t:3,v:st.atk*.1*sk('s4')};
    if(nilaiB('es')){m.lambat=1.5;if(rnd()<nilaiB('es'))m.beku=1}
    if(R.run.hero==='penyihir'&&sk('s6')&&rnd()<.05*sk('s6'))m.beku=1;
    if(nilaiB('racun')){m.racun+=st.atk*nilaiB('racun');m.tRacun=4}
    if(nilaiB('rantai')&&rnd()<.25){let n=0;for(const q of R.mus){if(q===m||q.mati||n>=2)continue;if(Math.hypot(q.x-m.x,q.y-m.y)<70){n++;fx({k:'rantai',x1:m.x,y1:m.y,x2:q.x,y2:q.y});kenai(q,st.atk*nilaiB('rantai'),{efek:1});if(duoB('api_petir'))q.bakar={t:3,v:st.atk*nilaiB('api')};if(duoB('es_rantai'))q.beku=Math.max(q.beku,.6)}}}
  }
  if(o.el==='es')m.beku=Math.max(m.beku,o.beku||1.2);if(o.el==='api')m.bakar={t:4,v:st.atk*.4};if(o.el==='racun'){m.racun+=st.atk*.5;m.tRacun=4}
  fx({k:'kena',m,v:x,c,j:o.j||'',el:o.el});
  const ambang=Math.min(.3,nilaiB('algojo'));if(!m.bos&&m.peran!=='elit'&&ambang&&m.hp>0&&m.hp<m.max*ambang)m.hp=0;
  if(m.hp<=0)bunuh(m);
}
function pulihkan(v){const p=R.p;p.hp=Math.min(p.max,p.hp+v)}
function zonaKita(x,y,r,dmg,o={}){R.zona.push({t:'ledakKita',x,y,r,dl:o.dl||0,dmg,el:o.el,j:o.j,beku:o.beku,dur:o.dur||0,tick:o.tick||0,tk:0,tarik:o.tarik||0})}
function bunuh(m){
  if(m.mati)return;m.mati=true;const r=R.run,s=STG();r.kill++;S.stat.bunuh++;majuMisi('bunuh');if(m.peran!=='biasa')majuMisi('elit');S.kodeks.m[m.key]=(S.kodeks.m[m.key]||0)+1;
  capai('pertama');if(S.stat.bunuh>=100)capai('ratus');if(m.peran==='bos')capai('bos');
  fx({k:'mati',m});
  const nilai={biasa:1,elit:4,mini:12,bos:40}[m.peran];
  for(let i=0;i<Math.min(6,nilai);i++)R.ambil.push({t:'xp',x:m.x+acak(-6,6),y:m.y+acak(-6,6),v:Math.ceil(nilai/Math.min(6,nilai)*2),vx:acak(-40,40),vy:acak(-40,40)});
  const kk=m.bos?6:m.peran==='elit'?3:rnd()<.5?1:0;for(let i=0;i<kk;i++)R.ambil.push({t:'gold',x:m.x,y:m.y,v:2*G(s)*D.p.gold*bonusPakta()*(1+nilaiB('emas'))*(m.peran==='bos'&&sk('e9')?3:1),vx:acak(-60,60),vy:acak(-60,60)});
  if(!r.pakta?.includes('kering')&&rnd()<.03)R.ambil.push({t:'hati',x:m.x,y:m.y,vx:0,vy:0});
  const axp=4*1.15**(s-1)*nilai*D.p.xp;S.xp+=axp;while(S.xp>=xpPerlu(S.L)){S.xp-=xpPerlu(S.L);S.L++;S.sp++;hitung();segarkanStat();catat('Akun naik ke level '+S.L+'. +1 skill point.','#7fc4f5');onChange('skill')}
  if(m.peran==='biasa'){if(rnd()<.05*D.p.drop)jarahan(rollItem('biasa',s))}
  else if(m.peran==='elit'){jarahan(rollItem('elit',s));if(rnd()<.35)dapatPeti('kayu')}
  else if(m.peran==='mini'){dapatPeti('perak');jarahan(rollItem('mini',s))}
  else dapatPeti('emas');
  if(m.rahasia){dapatPeti('emas');const rr=8*(1+r.tingkat);S.runes+=rr;r.runeRahasia=(r.runeRahasia||0)+rr;for(let i=0;i<2;i++)jarahan(rollItem('bos',s));capai('bayangan');catat('Bos rahasia tumbang! Peti Emas, '+rr+' rune, dan 2 jarahan bos.','#c49cff');onChange('rune')}
  if(nilaiB('jiwa'))pulihkan(R.p.max*nilaiB('jiwa'));
  if(nilaiB('ledak'))zonaKita(m.x,m.y,duoB('api_ledak')?36:24,R.st.atk*nilaiB('ledak')*(duoB('api_ledak')?1.5:1),{j:'ledakMati',el:duoB('api_ledak')?'api':undefined});
  if(duoB('jiwa_curi')){pulihkan(R.p.max*.015);if(rnd()<.05)R.ambil.push({t:'hati',x:m.x,y:m.y,vx:0,vy:0})}
  if(duoB('racun_ledak')&&m.racun>0)zonaKita(m.x,m.y,25,R.st.atk*nilaiB('racun')*.6,{j:'wabah',el:'racun',dur:3,tick:.6});
  if(mutasi('ledak')&&m.peran==='biasa'&&m.sif!=='ledak'&&rnd()<.5)R.zona.push({t:'bahaya',x:m.x,y:m.y,r:20,dl:.6,dmg:m.atk*1.2,j:'ledak'});
  if(m.sif==='ledak')R.zona.push({t:'bahaya',x:m.x,y:m.y,r:22,dl:.5,dmg:m.atk*1.4,j:'ledak'});
  if(m.sifatElite==='bagi')for(let i=0;i<2;i++){const q=tambahMusuh({key:m.key,peran:'biasa'},m.x+(i?9:-9),m.y);q.hp=q.max*=.4;q.atk*=.7;q.sc*=.8;q.r*=.8}
  if(m.sifatElite==='api')R.zona.push({t:'bahaya',x:m.x,y:m.y,r:22,dl:.35,dmg:m.atk*.7,kolam:5,j:'api',el:'api'});
  if(rnd()<.06*(m.bos?10:1))tambahKonsum(pilih(Object.keys(KONSUM).filter(k=>k!=='gulung')));
  onChange('run');
}
function jarahan(it){R.run.loot.push(it);dapatItem(it)}
function lukai(dmg,dari){
  const p=R.p,st=R.st;if(p.inv>0||R.fase!=='ruang')return;
  if(rnd()<st.dodge){fx({k:'hindar'});p.inv=.25;return}
  const amuk=1.25**(Math.max(0,((R.ruang&&R.ruang.waktu)||0)-90)/15);dmg*=amuk;
  let x=dmg*(1-Math.min(.8,st.def/(st.def+dmg*5)))*(1-st.tahan);
  const serap=Math.min(p.sh,x);p.sh-=serap;x-=serap;p.hp-=x;if(R.ruang&&x>0)R.ruang.kena=true;p.inv=.55;fx({k:'luka',v:x});
  if(dari&&st.pantul&&!dari.mati)kenai(dari,st.atk*st.pantul*(duoB('cangkang_duri')&&p.sh>0?2:1),{efek:1});
  if(p.hp<=0){
    if(R.run.hero==='ksatria'&&sk('k8')&&!p.benteng){p.benteng=true;p.hp=1;fx({k:'teksP',s:'Bertahan!'});return}
    if(nilaiB('bangkit')&&!R.run.bangkitB){R.run.bangkitB=true;p.hp=p.max*.5;p.inv=2;fx({k:'bangkit'});return}
    if(sk('t8')&&!R.run.bangkitT8){R.run.bangkitT8=true;p.hp=p.max*.3;p.inv=2;fx({k:'bangkit'});return}
    p.hp=0;fx({k:'pMati'});akhirRun(false);
  }
}
function tembakMusuh(m,a,v=82,r=3.5,dmg){R.pm.push({x:m.x,y:m.y-4,vx:Math.cos(a)*v,vy:Math.sin(a)*v,r,dmg:dmg??m.atk,hidup:5,w:m.bos?'#ff5a8a':'#c070ff'})}

// --- jurus aktif ---
function pakaiJurus(sl){
  const p=R.p;if(R.fase!=='ruang'||!slotBuka(sl))return false;const id=S.pasang[R.run.hero][sl];if(!id||p.j[sl]>0)return false;
  const s=JURUS[id],st=R.st,q=kuatJ(id),dm=st.atk*s.m*q||0,t=terdekat(p.x,p.y);
  p.j[sl]=s.cd*(1-st.cdr)*(1-.03*(bintang(id)-1));
  fx({k:'jurus',s,sl});
  const padat=()=>{let b=t,bn=-1;for(const m of R.mus){if(m.mati)continue;const n=R.mus.filter(o=>!o.mati&&Math.hypot(o.x-m.x,o.y-m.y)<40).length;if(n>bn){bn=n;b=m}}return b};
  const arah=t?Math.atan2(t.y-p.y,t.x-p.x):Math.atan2(p.ay,p.ax);
  switch(s.b){
    case 'terjang':{p.dashT=.22;p.dx=Math.cos(arah);p.dy=Math.sin(arah);p.dashV=320;p.inv=.4;p.terjang={dmg:dm,kena:new Set()};break}
    case 'putar':{const m2=sk('k9')&&id==='perkasa'?2:1;for(const m of R.mus)if(!m.mati&&Math.hypot(m.x-p.x,m.y-p.y)-m.r<50)kenai(m,dm*m2,{jurus:1,a:Math.atan2(m.y-p.y,m.x-p.x),dorong:140});break}
    case 'orbit':R.orbitJ={n:s.jml,t:s.dur,dmg:dm,kena:new Map()};break;
    case 'langit':{const m=padat();if(m)zonaKita(m.x,m.y,56,dm,{dl:.75,el:'suci',j:'langit'});break}
    case 'besar':tembakPP(p.x,p.y-4,arah,{v:340,r:7,hidup:1.6,j:s.el==='darah'?'besarMerah':'besar',dmg:dm,tembus:99,jurus:1});break;
    case 'hujan':{const n=s.jml+(sk('p9')&&R.run.hero==='pemburu'?4:0);for(let i=0;i<n;i++){const hidup=R.mus.filter(m=>!m.mati),m=pilih(hidup.length?hidup:[{x:p.x+acak(-60,60),y:p.y-40}]);zonaKita(m.x+acak(-6,6),m.y+acak(-6,6),13,dm,{dl:.3+i*.06,j:'panahJatuh'})}break}
    case 'kipas':for(let i=0;i<s.jml;i++)tembakPP(p.x,p.y-4,arah+(i-(s.jml-1)/2)*.2,{v:260,r:4,hidup:1.2,j:'panahEl',dmg:dm,el:s.el,beku:1.6,jurus:1,tembus:1});break;
    case 'semburan':{const n=s.jml;for(let i=0;i<n;i++){const a=s.lingkar?i/n*Math.PI*2:arah+(i-(n-1)/2)*(1.2/(n-1));tembakPP(p.x,p.y-4,a,{v:s.pj==='kapak'?200:230,r:5,hidup:s.pj==='kapak'?1.1:1.3,j:s.pj,dmg:dm,jurus:1,tembus:s.pj==='kapak'?99:s.pj==='suci'?1:0,ledak:s.pj==='bola'?22:0,balik:s.pj==='kapak'?1:0})}break}
    case 'nova':zonaKita(p.x,p.y,54,dm,{el:s.el,j:'nova',beku:s.el==='es'?1.5:0});if(id==='gempa'&&sk('u9'))for(const m of R.mus)if(!m.mati&&Math.hypot(m.x-p.x,m.y-p.y)<64)m.lambat=3;break;
    case 'petir':{const hidup=R.mus.filter(m=>!m.mati);for(let i=0;i<5;i++){const m=pilih(hidup.length?hidup:[{x:p.x,y:p.y-50}]);zonaKita(m.x,m.y,12,dm,{dl:.08+i*.12,j:'petir',el:'petir'})}break}
    case 'meteor':{const n=(id==='hmeteor'?3:1)+(sk('s9')?1:0);const hidup=R.mus.filter(m=>!m.mati);for(let i=0;i<n;i++){const m=i===0?padat():pilih(hidup.length?hidup:[p]);if(m)zonaKita(m.x+acak(-8,8),m.y+acak(-8,8),44,dm,{dl:1+i*.35,el:'api',j:'meteor'});if(sk('s10'))for(const o of hidup)if(Math.hypot(o.x-m.x,o.y-m.y)<50){o.rentan=8;o.rV=.25}}break}
    case 'hampa':{const m=padat();if(m)zonaKita(m.x,m.y,46,dm*.25,{dur:s.dur,tick:.5,tarik:60,j:'hampa',el:'hampa'});break}
    case 'pulih':{const k=(s.q||.2)*(1+st.heal)*(sk('t9')?1.5:1)*q;pulihkan(p.max*k);p.racun=null;if(R.run.hero==='tabib'&&nilaiB('cahaya_nawang'))p.sh=Math.max(p.sh,p.max*nilaiB('cahaya_nawang'));if(id==='bgkit')p.inv=2;if(id==='mukjizat'){p.inv=3;p.sh=p.max*.3}break}
    case 'perisai':p.sh=Math.max(p.sh,p.max*s.q*q);break;
    case 'buff':S.buff.perang=s.dur;S.buffV={atk:s.v*q,spd:s.spd||0};hitung();segarkanStat();break;
  }
  if(sk('k10')&&R.run.hero==='ksatria')p.sh=Math.max(p.sh,p.max*.15);
  return true;
}

// --- berkat ---
function rollRarB(){const luck=1+D.p.rare,w=[60,25,10,4,1].map((v,i)=>v*(i?luck**i:1)),tot=w.reduce((a,b)=>a+b,0);let t=rnd()*tot,r=0;for(;r<4;r++){if(t<w[r])break;t-=w[r]}return r}
function tawarBerkat(n=3,minR=0){
  const r=R.run,boleh=BERKAT.filter(b=>(!b.h||b.h===r.hero)&&!(b.maks&&(r.lv[b.id]||0)>=b.maks)),hasil=[];
  while(hasil.length<n&&boleh.length){const i=Math.floor(rnd()*boleh.length),b=boleh.splice(i,1)[0];let rr=Math.max(minR,rollRarB());if(b.minR&&rr<b.minR){if(rnd()<.7)continue;rr=b.minR}hasil.push({id:b.id,r:rr})}
  return hasil;
}
function ambilBerkat(o){
  majuMisi('berkat');const r=R.run,b=BK[o.id];r.lv[o.id]=(r.lv[o.id]||0)+1;r.rar[o.id]=Math.max(r.rar[o.id]??-1,o.r);
  r.b[o.id]=(r.b[o.id]||0)+(b.tetap?b.v:b.v*MR[o.r]);
  r.duo=r.duo||[];for(const d of DUO)if(r.b[d.a]&&r.b[d.b]&&!r.duo.includes(d.id)){r.duo.push(d.id);capai('duo');fx({k:'duo',d})}
  if(o.id==='nyawa'){segarkanStat();pulihkan(R.p.max*b.v*MR[o.r])}else segarkanStat();
  fx({k:'berkat',o});onChange('run');
}
function pilihBerkat(i){
  if(R.fase!=='pilih'||!R.tawar||!R.tawar[i])return false;
  ambilBerkat(R.tawar[i]);R.tawar=null;R.fase=R.setelahPilih||'ruang';R.setelahPilih=null;
  if(R.antrePilih>0){R.antrePilih--;bukaPilihan()}simpan();
  return true;
}
function bukaPilihan(minR=0,kembali='ruang'){R.tawar=tawarBerkat(3,minR);if(!R.tawar.length){R.fase=kembali;return}R.setelahPilih=R.fase==='pilih'?R.setelahPilih:kembali;R.fase='pilih';onChange('run')}
function naikLevelRun(){const r=R.run;r.level++;pulihkan(R.p.max*.1);fx({k:'naikRun'});if(R.fase==='pilih'){R.antrePilih=(R.antrePilih||0)+1;return}bukaPilihan(0,R.fase)}
const xpRun=l=>Math.floor(8*1.32**(l-1));

// --- interaksi ruangan non-tempur ---
function buatToko(){const s=STG();return [...tawarBerkat(2,1).map(o=>({t:'berkat',o,harga:Math.ceil(60*G(s)*(1+o.r*.5))})),{t:'pulih',harga:Math.ceil(30*G(s))},{t:'item',harga:Math.ceil(90*G(s))}]}
function beliToko(i){
  const o=R.ruang&&R.ruang.obj;if(!o||o.t!=='toko')return false;const x=o.stok[i];if(!x||x.terjual||S.gold<x.harga)return false;
  S.gold-=x.harga;x.terjual=true;
  if(x.t==='berkat')ambilBerkat(x.o);else if(x.t==='pulih')pulihkan(R.p.max*.4);else jarahan(rollItem('mini',STG()));
  onChange('run');return true;
}
const hargaEvent=()=>{const g=G(STG())*D.p.gold;return {item:Math.ceil(160*g),berkat:Math.ceil(110*g),koin:Math.ceil(30*g)}};
function pakaiObj(pilihan){
  const o=R.ruang&&R.ruang.obj;if(!o||o.pakai)return false;
  if(o.t==='peti'){o.pakai=true;o.buka=true;
    if(o.mimik){fx({k:'mimik'});const m=tambahMusuh({key:actDari((R.run.babak-1)*10+1).mini,peran:'mini'},o.x,o.y);m.n='Peti Mimik';m.sp='chort';R.ruang.bersih=false;R.ruang.buka=false;R.ruang.gel=[];o.t='kosong';return true}
    const g=20*G(STG())*D.p.gold;S.gold+=g;R.run.gold+=g;jarahan(rollItem('elit',STG()));if(rnd()<.5)jarahan(rollItem('biasa',STG()));
    if(rnd()<.5)bukaPilihan(1,'ruang');fx({k:'petiBuka'});return true}
  if(o.t==='api'){o.pakai=true;if(pilihan==='naik'){const ks=Object.keys(R.run.rar).filter(k=>R.run.rar[k]<4&&!BK[k].tetap);if(ks.length){const k=pilih(ks),rl=R.run.rar[k];R.run.b[k]+=BK[k].v*(MR[rl+1]-MR[rl]);R.run.rar[k]=rl+1;segarkanStat();fx({k:'naikBerkat',id:k})}else pulihkan(R.p.max*.35)}else pulihkan(R.p.max*.35);fx({k:'apiPakai'});return true}
  if(o.t==='misteri'){o.pakai=true;const j=o.jenis;
    if(j==='malaikat'){if(pilihan==='a')pulihkan(R.p.max*.4);else bukaPilihan(0,'ruang')}
    else if(j==='iblis'){if(pilihan==='a'){R.run.kutukHP=(R.run.kutukHP||1)*.8;segarkanStat();bukaPilihan(3,'ruang')}}
    else if(j==='harta'){const g=40*G(STG())*D.p.gold;S.gold+=g;R.run.gold+=g}
    else if(j==='pedagang'){const h=hargaEvent();if(pilihan==='a'&&S.gold>=h.item){S.gold-=h.item;jarahan(rollItem('bos',STG()));jarahan(rollItem('mini',STG()))}else if(pilihan==='b'&&S.gold>=h.berkat){S.gold-=h.berkat;bukaPilihan(3,'ruang')}else if(pilihan!=='x'){o.pakai=false;catat('Gold tidak cukup.','#ff8a7a');return false}}
    else if(j==='altar'){if(pilihan==='a'){R.p.hp=Math.max(1,R.p.hp-R.p.max*.3);fx({k:'luka',v:R.p.max*.3});bukaPilihan(2,'ruang')}
      else if(pilihan==='b'){if(rnd()<.5){jarahan(rollItem('bos',STG()));catat('Koin jatuh bergambar mahkota. Altar memberimu harta!','#ffd27a')}else{R.run.kutukHP=(R.run.kutukHP||1)*.9;segarkanStat();catat('Koin jatuh bergambar tengkorak. HP maksimal -10%.','#ff8a7a')}}}
    else if(j==='sergap'){if(pilihan==='a'){const a=actDari((R.run.babak-1)*10+1);R.ruang.bersih=false;R.ruang.buka=false;R.ruang.gel=[[{key:pilih(a.foes),peran:'elit'},{key:pilih(a.foes),peran:'elit'},{key:pilih(a.foes),peran:'biasa'},{key:pilih(a.foes),peran:'biasa'}]];R.ruang.gelI=0;R.ruang.tGel=.4;R.ruang.hadiahSergap=true}
      else{R.p.hp=Math.max(1,R.p.hp-R.p.max*.15);fx({k:'luka',v:R.p.max*.15})}}
    else if(j==='mancur'){const h=hargaEvent();if(pilihan==='a'&&S.gold>=h.koin){S.gold-=h.koin;naikLevelRun();catat('Air mancur berkilau. Level ekspedisi naik!','#7fc4f5')}else if(pilihan==='b'){R.run.b.tajam=(R.run.b.tajam||0)+.1;segarkanStat();catat('Senjatamu diberkati: +10% ATK untuk ekspedisi ini.','#ffd27a')}else if(pilihan==='a'){o.pakai=false;catat('Gold tidak cukup.','#ff8a7a');return false}}
    else if(j==='jebakan'){if(pilihan==='a'){R.ruang.bersih=false;R.ruang.buka=false;R.ruang.gel=[[{key:actDari((R.run.babak-1)*10+1).mini,peran:'mini'}]];R.ruang.gelI=0;R.ruang.tGel=.5;R.ruang.hadiahJebakan=true}}
    onChange('run');return true}
  return false;
}
function pakaiKonsum(it){
  const k=it.kon,p=R.p;
  if(k==='tonik'){if(sk('x4')){catat('Sumpah Tanpa Ramuan melarang Tonik.','#ff8a7a');return false}if(!R.run||R.fase!=='ruang'){catat('Tonik hanya bisa dipakai saat ekspedisi.','#ff8a7a');return false}if(p.hp>=p.max){catat('HP sudah penuh.','#b0a8c2');return false}pulihkan(p.max*.45);fx({k:'pulihP'})}
  else if(k==='amarah'){S.buff.amarah=60;hitung();segarkanStat()}
  else if(k==='mujur'){S.buff.mujur=120;hitung()}
  else if(k==='ilmu'){S.buff.ilmu=120;hitung()}
  else if(k==='bom'){if(!R.run||R.fase!=='ruang'||!R.mus.some(m=>!m.mati)){catat('Bom hanya bisa dipakai saat bertarung.','#ff8a7a');return false}fx({k:'bom'});for(const m of R.mus)if(!m.mati)kenai(m,R.st.atk*3,{jurus:1})}
  else if(k==='gulung'){if(!R.run||R.fase!=='ruang'||R.ruang.t==='bos'||R.ruang.bersih){catat('Gulungan hanya untuk kabur dari pertempuran biasa.','#ff8a7a');return false}R.ruang.bersih=true;R.ruang.buka=true;R.mus=[];R.pm=[];R.zona=[];fx({k:'kabur'})}
  it.n--;if(it.n<=0)S.inv=S.inv.filter(x=>x!==it);onChange('inv');return true;
}
function keluarRuang(){const n=nodeDari(R.run.posisi);if(n.t==='bos'){akhirRun(true);return}R.fase='peta';R.ruang=null;fx({k:'keluar'});onChange('run')}

// --- pilot otomatis: dipakai mode Auto dan pengujian ---
function pilot(){
  const p=R.p,ru=R.ruang;let vx=0,vy=0,bahaya=0;
  for(const m of R.mus){if(m.mati)continue;const dx=p.x-m.x,dy=p.y-m.y,d=Math.hypot(dx,dy)||1,j=m.ai==='tembak'?30:m.bos?44:(m.st==='bidik'||m.st==='serbu')?60:30;if(d<j){const w=(j-d)/j;vx+=dx/d*w*2;vy+=dy/d*w*2;bahaya+=w}}
  for(const b of R.pm){const dx=p.x-b.x,dy=p.y-b.y,d=Math.hypot(dx,dy)||1;if(d<34&&(b.vx*dx+b.vy*dy)>0){const w=(34-d)/34;vx+=-b.vy/82*w*1.6;vy+=b.vx/82*w*1.6;bahaya+=w}}
  for(const z of R.zona)if(z.t==='bahaya'||z.t==='kolam'){const dx=p.x-z.x,dy=p.y-z.y,d=Math.hypot(dx,dy)||1;if(d<z.r+10){vx+=dx/d*2;vy+=dy/d*2;bahaya+=1}}
  const cx=W_(ru)/2,cy=H_(ru)/2;vx+=(cx-p.x)/400;vy+=(cy-p.y)/400;
  const tj=terdekat(p.x,p.y),jauh=R.run.hero==='ksatria'?120:190;if(tj&&bahaya<.25&&Math.hypot(tj.x-p.x,tj.y-p.y)>jauh){const q=jalanKe(tj.x,tj.y);vx=q.x;vy=q.y;bahaya=1}
  if(!R.mus.some(m=>!m.mati)&&!R.zona.some(z=>z.t==='muncul')){
    if(false){}
    else if(ru.obj&&!ru.obj.pakai&&ru.obj.t!=='kosong'){const q=jalanKe(ru.obj.x,ru.obj.y+14);vx=q.x;vy=q.y;bahaya=1}
    else if(ru.buka){const q=jalanKe(ru.pintu.x*TL+TL/2,TL*1.2);vx=q.x;vy=q.y;bahaya=1}}
  const d=Math.hypot(vx,vy),pl=R.pilotS||(R.pilotS={t:0,x:p.x,y:p.y,macet:0,sisi:1});
  if(bahaya<.25||d<.05){pl.t=0;return {x:0,y:0}}
  pl.t+=.05;if(pl.t>2.4&&R.mus.some(m=>!m.mati)){if(pl.t>2.9)pl.t=0;return {x:0,y:0}}
  if(Math.hypot(p.x-pl.x,p.y-pl.y)<.4)pl.macet+=.05;else{pl.macet=Math.max(0,pl.macet-.1)}pl.x=p.x;pl.y=p.y;
  let ux=vx/d,uy=vy/d;if(pl.macet>.6){if(pl.macet>2.5){pl.macet=0;pl.sisi*=-1}ux=-uy*pl.sisi;uy=vx/d*pl.sisi}
  return {x:ux,y:uy};
}
// Arah ke tujuan lewat pencarian jalan sederhana di grid ubin.
function jalanKe(tx,ty){
  const ru=R.ruang,p=R.p,gx=Math.floor(tx/TL),gy=Math.max(1,Math.floor(ty/TL)),sx=Math.floor(p.x/TL),sy=Math.floor(p.y/TL);
  if(gx===sx&&gy===sy)return {x:tx-p.x,y:ty-p.y};
  const lw=(x,y)=>ru.g[y]&&ru.g[y][x]===0||(x===gx&&y===gy),dari=new Map(),k=(x,y)=>x+','+y,q=[[gx,gy]];dari.set(k(gx,gy),null);
  while(q.length){const [x,y]=q.shift();if(x===sx&&y===sy)break;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(!dari.has(k(nx,ny))&&lw(nx,ny)){dari.set(k(nx,ny),[x,y]);q.push([nx,ny])}}}
  const n=dari.get(k(sx,sy));if(!n)return {x:tx-p.x,y:ty-p.y};
  return {x:(n[0]+.5)*TL-p.x,y:(n[1]+.5)*TL-p.y};
}
function pilotKeputusan(dt){
  R.tPilot=(R.tPilot||0)-dt;if(R.fase!=='ruang'&&R.tPilot>0)return;R.tPilot=.9;
  if(R.fase==='pilih'&&R.tawar){let b=0;R.tawar.forEach((o,i)=>{if(o.r>R.tawar[b].r)b=i});pilihBerkat(b);return}
  if(R.fase==='peta'){const r=R.run,c=r.posisi?nodeDari(r.posisi).ke.map(nodeDari):r.peta[0];const sehat=R.p.hp>R.p.max*.6;const urut={elit:sehat?0:5,tantangan:sehat?0:5,tempur:1,peti:2,misteri:3,toko:4,api:sehat?6:-1,bos:0};c.sort((a,b)=>urut[a.t]-urut[b.t]);masukRuang(c[0]);return}
  if(R.fase==='ruang'&&R.ruang.obj&&!R.ruang.obj.pakai){const o=R.ruang.obj;if(Math.hypot(R.p.x-o.x,R.p.y-o.y-14)<22){if(o.t==='toko'){o.stok.forEach((x,i)=>{if(x.t==='berkat'&&S.gold>x.harga*3)beliToko(i)});o.pakai=true}else if(!pakaiObj(o.t==='api'?(R.p.hp<R.p.max*.6?'pulih':'naik'):'a'))pakaiObj('x')}}
  if(R.fase==='ruang')for(const sl of [0,1]){const id=S.pasang[R.run.hero][sl];if(!id||R.p.j[sl]>0)continue;const s=JURUS[id];const ada=R.mus.some(m=>!m.mati);if((s.b==='pulih'&&R.p.hp<R.p.max*.6)||(s.b==='perisai'&&ada)||(s.b!=='pulih'&&s.b!=='perisai'&&ada))pakaiJurus(sl)}
}

// --- satu langkah simulasi ---
function step(dt,inp={x:0,y:0}){
  for(const b in S.buff)if(S.buff[b]>0){S.buff[b]-=dt;if(S.buff[b]<=0){delete S.buff[b];hitung();segarkanStat();onChange('stat')}}
  S.gold+=laju()*dt;
  if(!R.run)return;
  if(R.jeda)return;
  if(S.opt.auto)pilotKeputusan(dt);
  if(R.fase!=='ruang'||R.dialog)return;
  const r=R.run,p=R.p,ru=R.ruang,st=R.st;r.waktu+=dt;if(!ru.bersih&&mutasi('racun')){ru.tRacun=(ru.tRacun??4)-dt;if(ru.tRacun<=0){ru.tRacun=6;const a=rnd()*6.28;R.zona.push({t:'bahaya',x:p.x+Math.cos(a)*18,y:p.y+Math.sin(a)*18,r:20,dl:.9,dmg:4.5*1.12**(STG()-1)*.6,kolam:4,j:'racun',el:'racun'})}}
  if(p.lambatT>0)p.lambatT-=dt;
  if(!ru.bersih){ru.waktu=(ru.waktu||0)+dt;if(ru.waktu>180){p.hp-=p.max*.01*dt*1.25**((ru.waktu-180)/15);if(p.hp<=0){p.inv=0;lukai(1)}}}
  if(S.opt.auto)inp=pilot();
  for(const q of R.antre)q.t-=dt;const siap=R.antre.filter(q=>q.t<=0);R.antre=R.antre.filter(q=>q.t>0);siap.forEach(q=>q.f());
  // gerak
  p.inv-=dt;p.dash-=dt;p.j[0]-=dt;p.j[1]-=dt;p.tShell-=dt;
  if(nilaiB('cangkang')&&p.tShell<=0){p.tShell=8;p.sh=Math.max(p.sh,p.max*nilaiB('cangkang'))}
  if(D.p.regen)pulihkan(p.max*D.p.regen*dt);
  if(p.racun){p.racun.t-=dt;p.hp-=p.racun.v*dt;if(p.racun.t<=0)p.racun=null;if(p.hp<=0){p.inv=0;lukai(1)}}
  const m0=Math.hypot(inp.x,inp.y);p.gerak=m0>.15;
  if(p.dashT>0){p.dashT-=dt;geser(p,p.dx*(p.dashV||230)*dt,p.dy*(p.dashV||230)*dt);
    if(p.terjang)for(const m of R.mus)if(!m.mati&&!p.terjang.kena.has(m)&&Math.hypot(m.x-p.x,m.y-p.y)<m.r+10){p.terjang.kena.add(m);kenai(m,p.terjang.dmg,{jurus:1,a:Math.atan2(p.dy,p.dx),dorong:120})}
    if(p.dashT<=0)p.terjang=null}
  else if(p.gerak){const k=Math.min(1,m0),licin=ru.medan?.some(s=>s.t==='licin'&&Math.abs(p.x-(s.x+.5)*TL)<TL*.7&&Math.abs(p.y-(s.y+.5)*TL)<TL*.7);
    if(licin){p.slipX=(p.slipX||0)*Math.max(0,1-dt*2)+inp.x*dt*2;p.slipY=(p.slipY||0)*Math.max(0,1-dt*2)+inp.y*dt*2;p.dx=p.slipX;p.dy=p.slipY}else{p.slipX=inp.x/m0;p.slipY=inp.y/m0;p.dx=p.slipX;p.dy=p.slipY}
    const lbt=(p.lambatT>0||ru.medan?.some(s=>s.t==='lumpur'&&Math.abs(p.x-(s.x+.5)*TL)<TL*.6&&Math.abs(p.y-(s.y+.5)*TL)<TL*.6))?.62:1;geser(p,p.dx*st.gerak*k*lbt*dt,p.dy*st.gerak*k*lbt*dt);p.ax=p.dx;p.ay=p.dy}
  if(ru.medan?.some(s=>s.t==='lava'&&Math.abs(p.x-(s.x+.5)*TL)<TL*.55&&Math.abs(p.y-(s.y+.5)*TL)<TL*.55)){p.tLava=(p.tLava||0)-dt;if(p.tLava<=0){p.tLava=.75;lukai(p.max*.035)}}
  // Serangan dasar hanya terjadi saat tombol serang ditahan, atau dalam mode Auto.
  p.cd-=dt;
  if(!S.opt.auto&&Number.isFinite(inp.ax)&&Number.isFinite(inp.ay)){const l=Math.hypot(inp.ax,inp.ay);if(l>.1){p.ax=inp.ax/l;p.ay=inp.ay/l}}
  if((inp.serang||p.klikHingga>r.waktu||(S.opt.auto&&R.mus.some(m=>!m.mati)))&&p.dashT<=0&&p.cd<=0){p.cd=SERANG[r.hero].cd/st.aspd;p.klikHingga=0;serangDasar()}
  // bilah orbit
  const nb=nilaiB('orbit');
  if(nb||R.orbitJ){R.sudutOrbit=(R.sudutOrbit||0)+dt*3.6;const daftar=[];for(let i=0;i<nb;i++)daftar.push({a:R.sudutOrbit+i*Math.PI*2/nb,r:24,d:st.atk*.4*(duoB('orbit_duri')?2:1),k:'b'});
    if(R.orbitJ){R.orbitJ.t-=dt;for(let i=0;i<R.orbitJ.n;i++)daftar.push({a:-R.sudutOrbit*1.3+i*Math.PI*2/R.orbitJ.n,r:34,d:R.orbitJ.dmg,k:'j'});if(R.orbitJ.t<=0)R.orbitJ=null}
    R.orbitPos=daftar.map(o=>({x:p.x+Math.cos(o.a)*o.r,y:p.y-4+Math.sin(o.a)*o.r*.8,k:o.k}));
    daftar.forEach((o,i)=>{const x=R.orbitPos[i].x,y=R.orbitPos[i].y;for(const m of R.mus){if(m.mati)continue;if(Math.hypot(m.x-x,m.y-y)<m.r+5){const kk=o.k+i+'-'+m.uid;const tk=(R.tOrbit=R.tOrbit||new Map()).get(kk)||-9;if(r.waktu-tk>.35){R.tOrbit.set(kk,r.waktu);kenai(m,o.d,{jurus:o.k==='j',efek:1,j:'orbit'})}}}})}
  else R.orbitPos=null;
  // roh penembak
  if(nilaiB('roh')){R.tRoh=(R.tRoh||1)-dt;if(R.tRoh<=0){R.tRoh=1;const t=terdekat(p.x,p.y);if(t)tembakPP(p.x-10,p.y-14,Math.atan2(t.y-p.y+14,t.x-p.x+10),{v:220,r:3,hidup:1.2,j:'roh',dmg:st.atk*nilaiB('roh')})}}
  // proyektil kita
  for(const b of R.pp){b.hidup-=dt;
    if(b.homing){const t=terdekat(b.x,b.y,80);if(t){const a=Math.atan2(t.y-b.y,t.x-b.x),v=Math.hypot(b.vx,b.vy),ca=Math.atan2(b.vy,b.vx);let da=((a-ca+Math.PI*3)%(Math.PI*2))-Math.PI;const na=ca+Math.max(-b.homing*dt,Math.min(b.homing*dt,da));b.vx=Math.cos(na)*v;b.vy=Math.sin(na)*v}}
    if(b.balik&&!b.pulang&&b.hidup<b.hAwal*.5){b.pulang=true;b.kena.clear()}
    if(b.pulang){const dx=p.x-b.x,dy=p.y-6-b.y,d=Math.hypot(dx,dy)||1,v=Math.hypot(b.vx,b.vy);b.vx=dx/d*v;b.vy=dy/d*v;b.hidup=Math.max(b.hidup,.05);if(d<10)b.hidup=0}
    b.x+=b.vx*dt;b.y+=b.vy*dt;b.a=Math.atan2(b.vy,b.vx);
    if(b.balik&&!b.pulang&&solid(b.x,b.y,true)){b.pulang=true;b.kena.clear()}
    if(!b.pulang&&solid(b.x,b.y,true)){if(b.pantul>0){b.pantul--;const tx=solid(b.x-b.vx*dt,b.y,true),ty=solid(b.x,b.y-b.vy*dt,true);if(!tx)b.vx*=-1;else if(!ty)b.vy*=-1;else{b.vx*=-1;b.vy*=-1}b.x+=b.vx*dt*2;b.y+=b.vy*dt*2}else{if(b.ledak){zonaKita(b.x,b.y,b.ledak,b.dmg*(.6+st.splash),{j:'bolaLedak'});kolamBayu(b)}b.hidup=0;fx({k:'tumbuk',x:b.x,y:b.y,j:b.j})}}
    const tx=Math.floor(b.x/TL),ty=Math.floor(b.y/TL);if(ru.g[ty]&&ru.g[ty][tx]===3){const c=ru.peti.find(c=>c.x===tx&&c.y===ty);if(c){c.hp--;b.hidup=0;fx({k:'krat',pecah:c.hp<=0,x:(tx+.5)*TL,y:(ty+.5)*TL});if(c.hp<=0){ru.g[ty][tx]=0;R.ambil.push({t:'gold',x:(tx+.5)*TL,y:(ty+.5)*TL,v:3*G(STG()),vx:0,vy:0})}}}
    if(b.hidup<=0)continue;
    for(const m of R.mus){if(m.mati||m.bawah||b.kena.has(m))continue;if(Math.hypot(m.x-b.x,m.y-4-b.y)<m.r+b.r){b.kena.add(m);
      if(b.ledak){zonaKita(b.x,b.y,b.ledak,b.dmg*(.6+st.splash),{j:'bolaLedak'});kolamBayu(b);b.hidup=0}
      kenai(m,b.dmg*(b.pulang?1+(sk('u8')?.5:0)+nilaiB('balik_ratri'):1),{a:b.a,j:b.j,el:b.tembus>0&&duoB('es_tembus')?'es':b.el,beku:b.beku,jurus:b.jurus,dorong:b.jurus?90:40});
      if(r.hero==='pemburu'&&b.j==='panah'&&!b.pecah&&nilaiB('pecah_laras'))for(const da of [-.5,.5])tembakPP(b.x,b.y,b.a+da,{v:270,r:2.5,hidup:.7,j:'panah',dmg:b.dmg*nilaiB('pecah_laras'),pecah:true});
      if(r.hero==='tabib'&&b.j==='suci')pulihkan(p.max*.005*(1+st.heal));
      if(b.tembus>0)b.tembus--;else{b.hidup=0;break}}}}
  R.pp=R.pp.filter(b=>b.hidup>0);
  // musuh
  R.tMedan=(R.tMedan||0)-dt;if(R.tMedan<=0){R.tMedan=.25;hitungMedan()}
  const ruX=W_(ru),ruY=H_(ru);
  for(const m of R.mus){if(m.mati)continue;
    if(m.bakar){m.bakar.t-=dt;m.hp-=m.bakar.v*dt;if(m.bakar.t<=0)m.bakar=null}
    if(m.tRacun>0){m.tRacun-=dt;m.hp-=m.racun*dt;if(m.tRacun<=0)m.racun=0}
    if(m.rentan>0)m.rentan-=dt;if(m.lambat>0)m.lambat-=dt;
    if(m.hp<=0){bunuh(m);continue}
    m.vx*=Math.pow(.02,dt);m.vy*=Math.pow(.02,dt);geser(m,m.vx*dt,m.vy*dt,m.terbang);
    if(m.beku>0){m.beku-=dt;continue}
    const k=m.lambat>0?.55:1,am=arahMedan(m),d=Math.hypot(p.x-m.x,p.y-m.y)||1,dx=am?am.x*d:p.x-m.x,dy=am?am.y*d:p.y-m.y;m.face=dx<0?-1:1;m.t+=dt;m.cd-=dt*k;
    if(m.sif==='sembuh'){m.tSif-=dt;if(m.tSif<=0){m.tSif=5;const x=R.mus.filter(o=>!o.mati).sort((a,b)=>a.hp/a.max-b.hp/b.max)[0];x.hp=Math.min(x.max,x.hp+x.max*(x.bos?.03:.08));fx({k:'mPulih',m:x})}}
    if(m.sif==='panggil'){m.tSif-=dt;if(m.tSif<=0){m.tSif=6;if(R.mus.filter(o=>!o.mati).length<10){for(let i=0;i<2;i++)R.zona.push({t:'muncul',x:m.x+acak(-14,14),y:m.y+acak(-10,10),r:6,dl:.6,spec:{key:'spora',peran:'biasa'}});fx({k:'mPanggil',m})}}}
    if(m.sif==='tameng'){m.tTameng=(m.tTameng??3)-dt;if(m.tTameng<=0){m.tamengNaik=!m.tamengNaik;m.tTameng=m.tamengNaik?3.2:1.6}}
    if(m.sif==='kedip'){m.tSif-=dt;if(m.tSif<=0){m.tSif=acak(3.5,5);let x,y,n=0;do{const a=rnd()*6.28,r=acak(60,95);x=p.x+Math.cos(a)*r;y=p.y+Math.sin(a)*r;n++}while(n<20&&solid(x,y));if(!solid(x,y)){fx({k:'mKedip',m,x0:m.x,y0:m.y});m.x=x;m.y=y;m.cd=Math.min(m.cd,.5)}}}
    if(m.sif==='dingin'&&d<46){p.lambatT=Math.max(p.lambatT||0,.4)}
    if(m.ai==='kejar'){geser(m,dx/d*m.spd*k*dt,dy/d*m.spd*k*dt,m.terbang)}
    else if(m.ai==='gali'){m.tGali=(m.tGali??acak(1,2))-dt;
      if(m.bawah){geser(m,dx/d*m.spd*1.6*k*dt,dy/d*m.spd*1.6*k*dt);if(m.tGali<=0||d<18){m.bawah=false;m.tGali=2.4;R.zona.push({t:'bahaya',x:m.x,y:m.y,r:20,dl:.35,dmg:m.atk*1.3,j:'hantam'});fx({k:'mMuncul',m})}}
      else{geser(m,dx/d*m.spd*.5*k*dt,dy/d*m.spd*.5*k*dt);if(m.tGali<=0){m.bawah=true;m.tGali=acak(1.6,2.6);fx({k:'mGali',m})}}}
    else if(m.ai==='menara'){if(m.cd<=0){m.cd=acak(2.6,3.4);fx({k:'mTembak',m});const o=rnd();for(let i=0;i<8;i++)tembakMusuh(m,o+i*Math.PI/4,60,3.5)}}
    else if(m.ai==='lompat'){if(m.st==='jalan'&&m.cd<=0){m.st='lompat';m.t=0;m.lx=dx/d;m.ly=dy/d}if(m.st==='lompat'){geser(m,m.lx*95*k*dt,m.ly*95*k*dt);if(m.t>.45){m.st='jalan';m.cd=acak(.9,1.4)}}}
    else if(m.ai==='tembak'){const ingin=d>110?1:d<70?-1:0;geser(m,dx/d*m.spd*ingin*k*dt+Math.sin(m.t*1.3+m.uid)*10*dt,dy/d*m.spd*ingin*k*dt,m.terbang);if(m.cd<=0){m.cd=acak(1.8,2.6);fx({k:'mTembak',m});setTimeoutLogik(()=>{if(!m.mati&&R.ruang===ru){const a=Math.atan2(p.y-m.y,p.x-m.x);tembakMusuh(m,a);if(m.sif==='beruntun')for(const t of [.16,.32])setTimeoutLogik(()=>{if(!m.mati&&R.ruang===ru)tembakMusuh(m,Math.atan2(p.y-m.y,p.x-m.x),96)},t);if(m.peran==='elit'){tembakMusuh(m,a+.3);tembakMusuh(m,a-.3)}}},.35)}}
    else if(m.ai==='serbu'){if(m.st==='jalan'){geser(m,dx/d*m.spd*k*dt,dy/d*m.spd*k*dt);if(m.cd<=0&&d<120){m.st='bidik';m.t=0;m.lx=dx/d;m.ly=dy/d;fx({k:'mBidik',m})}}
      else if(m.st==='bidik'){if(m.t>.65){m.st='serbu';m.t=0}}
      else if(m.st==='serbu'){m.dindingX=m.dindingY=false;geser(m,m.lx*210*dt,m.ly*210*dt);if(m.t>.45||m.dindingX||m.dindingY){m.st='jalan';m.cd=acak(2,3)}}}
    else if(m.ai==='bos')langkahBos(m,dt,dx,dy,d,k);
    if(!m.bawah&&d<m.r+p.r+1&&m.tSentuh<=0){m.tSentuh=.8;lukai(m.atk*(m.st==='serbu'?1.6:1),m)}
    m.tSentuh-=dt;
    m.x=Math.max(TL+m.r,Math.min(ruX-TL-m.r,m.x));m.y=Math.max(TL*1.5+m.r,Math.min(ruY-TL-m.r,m.y));
  }
  // proyektil musuh
  for(const b of R.pm){b.hidup-=dt;b.x+=b.vx*dt;b.y+=b.vy*dt;if(solid(b.x,b.y,true))b.hidup=0;else if(Math.hypot(b.x-p.x,b.y-(p.y-4))<b.r+p.r-1){b.hidup=0;lukai(b.dmg)}}
  R.pm=R.pm.filter(b=>b.hidup>0);
  // zona
  for(const z of R.zona){
    if(!z.aktif){z.dl-=dt;if(z.dl>0)continue;z.aktif=1;
      if(z.t==='muncul'){tambahMusuh(z.spec,z.x,z.y);z.selesai=1;continue}
      if(z.t==='ledakKita'){fx({k:'zona',z});for(const m of R.mus)if(!m.mati&&Math.hypot(m.x-z.x,m.y-z.y)<z.r+m.r)kenai(m,z.dmg,{jurus:1,el:z.el,beku:z.beku,a:Math.atan2(m.y-z.y,m.x-z.x),dorong:80});if(!z.dur){z.selesai=1;continue}}
      if(z.t==='bahaya'){fx({k:'zonaB',z});if(Math.hypot(p.x-z.x,p.y-z.y)<z.r+p.r)lukai(z.dmg);if(z.kolam){z.t='kolam';z.dur=z.kolam;z.tk=0}else{z.selesai=1;continue}}}
    if(z.dur){z.dur-=dt;z.tk-=dt;
      if(z.t==='ledakKita'&&z.tick&&z.tk<=0){z.tk=z.tick;for(const m of R.mus)if(!m.mati&&Math.hypot(m.x-z.x,m.y-z.y)<z.r+m.r){kenai(m,z.dmg,{jurus:1,efek:1});m.rentan=1;m.rV=.4}}
      if(z.tarik)for(const m of R.mus)if(!m.mati&&!m.bos){const dx=z.x-m.x,dy=z.y-m.y,d=Math.hypot(dx,dy)||1;if(d<z.r*1.6)geser(m,dx/d*z.tarik*dt,dy/d*z.tarik*dt,true)}
      if(z.t==='kolam'&&Math.hypot(p.x-z.x,p.y-z.y)<z.r){if(z.el==='es')p.lambatT=Math.max(p.lambatT||0,.3);if(z.tk<=0){z.tk=.5;if(z.el==='api')lukai(z.dmg*.35);else if(z.el==='es')lukai(z.dmg*.25);else p.racun={t:2,v:z.dmg*.3}}}
      if(z.dur<=0)z.selesai=1}}
  R.zona=R.zona.filter(z=>!z.selesai);
  // duri lantai
  ru.tDuri=(ru.tDuri+dt)%2.4;
  if(ru.tDuri>1.6&&ru.duri.some(s=>Math.abs(p.x-(s.x+.5)*TL)<8&&Math.abs(p.y-(s.y+.5)*TL)<8))lukai(st.max*.06);
  // barang
  const mg=st.magnet;
  for(const a of R.ambil){a.vx*=Math.pow(.05,dt);a.vy*=Math.pow(.05,dt);a.x+=a.vx*dt;a.y+=a.vy*dt;const dx=p.x-a.x,dy=p.y-a.y,d=Math.hypot(dx,dy)||1;
    if(d<mg||a.tarik){a.tarik=1;a.x+=dx/d*Math.min(d,160*dt);a.y+=dy/d*Math.min(d,160*dt)}
    if(ru.bersih)a.tarik=1;
    if(d<7){a.ambil=1;
      if(a.t==='xp'){r.xp+=a.v*(1+nilaiB('ilmu'))*(S.buff.ilmu>0?2:1);while(r.xp>=xpRun(r.level)){r.xp-=xpRun(r.level);naikLevelRun()}}
      else if(a.t==='gold'){S.gold+=a.v;r.gold+=a.v}
      else if(a.t==='hati'){if(!sk('x4'))pulihkan(p.max*.2)}
      fx({k:'ambil',t:a.t})}}
  R.ambil=R.ambil.filter(a=>!a.ambil);
  // gelombang dan pintu
  if(!ru.bersih&&!R.mus.some(m=>!m.mati)&&!R.zona.some(z=>z.t==='muncul')){
    if(ru.gelI>=ru.gel.length&&ru.t==='bos'&&R.run.tingkat>=TINGKAT.length&&!ru.cekRahasia){ru.cekRahasia=true;if(rnd()<.35){const lain=ACT.filter(a=>a.bos!==ACT[(R.run.babak-1)%NB].bos);ru.gel.push([{key:pilih(lain).bos,peran:'bos',rahasia:true}]);ru.tGel=2.2;catat('Bayangan bergerak... Bos rahasia datang!','#c49cff')}}
    if(ru.gelI<ru.gel.length){ru.tGel-=dt;if(ru.tGel<=0){ru.gel[ru.gelI].forEach(munculkan);ru.gelI++;ru.tGel=1}}
    else{ru.bersih=true;ru.buka=true;R.mus=[];R.pm=[];fx({k:'bersih'});majuMisi('ruang');if(!ru.kena&&ru.t!=='kosong')capai('kebal');if(ru.hadiahJebakan)jarahan(rollItem('bos',STG()));if(ru.hadiahSergap){dapatPeti('perak');catat('Penyergap dikalahkan! Peti Perak didapat.','#ffd27a')}
      if(ru.t==='tantangan'&&ru.waktu<ru.batas){dapatPeti('perak');const bonus=Math.ceil(8*G(STG())*D.p.gold);S.gold+=bonus;R.run.gold+=bonus;catat('Tantangan selesai tepat waktu! Peti Perak dan '+fmt(bonus)+' gold.','#ffd27a');fx({k:'tantangan'});onChange('peti')}
      for(const a of R.ambil)a.tarik=1}}
  if(ru.buka&&R.fase==='ruang'&&p.y<TL*2&&Math.abs(p.x-(ru.pintu.x+.5)*TL)<TL*1.2)keluarRuang();
  p.x=Math.max(TL+p.r,Math.min(ruX-TL-p.r,p.x));p.y=Math.max(TL*1.2+p.r,Math.min(ruY-TL-p.r,p.y));
}
// Peta jarak ke pahlawan supaya musuh bisa memutari pilar dan peti.
function hitungMedan(){
  const ru=R.ruang,p=R.p,W2=ru.C+2,H2=ru.Rw+2,d=new Int16Array(W2*H2).fill(-1),sx=Math.floor(p.x/TL),sy=Math.floor(p.y/TL),q=[sx+sy*W2];d[q[0]]=0;
  for(let i=0;i<q.length;i++){const c=q[i],x=c%W2,y=(c-x)/W2;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,n=nx+ny*W2;if(nx<0||ny<0||nx>=W2||ny>=H2||d[n]>=0||ru.g[ny][nx]!==0)continue;d[n]=d[c]+1;q.push(n)}}
  R.medan={d,W2};
}
function arahMedan(m){
  const md=R.medan;if(!md||m.terbang)return null;const x=Math.floor(m.x/TL),y=Math.floor(m.y/TL),i=x+y*md.W2,v=md.d[i];if(v<=1)return null;
  let b=null,bv=v;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const n=(x+dx)+(y+dy)*md.W2,w=md.d[n];if(w>=0&&w<bv){bv=w;b=[x+dx,y+dy]}}
  if(!b)return null;const tx=(b[0]+.5)*TL-m.x,ty=(b[1]+.5)*TL-m.y,l=Math.hypot(tx,ty)||1;return {x:tx/l,y:ty/l};
}
function langkahBos(m,dt,dx,dy,d,k){
  const p=R.p;
  if(m.st==='jalan'){geser(m,dx/d*(m.fase===2?30:20)*k*dt,dy/d*(m.fase===2?30:20)*k*dt);m.tPola-=dt*k;if(m.tPola<=0){m.st=m.pola[m.pi%m.pola.length];m.pi++;m.t=0;m.tPola=m.peran==='bos'?(m.fase===2?1.65:2.6):3.4;fx({k:'bosJurus',m,j:m.st});
      if(m.st==='hantam'){m.tx=p.x;m.ty=p.y;R.zona.push({t:'bahaya',x:p.x,y:p.y,r:30,dl:1.1,dmg:m.atk*1.6,j:'hantam'})}
      if(m.st==='racun')for(let i=0;i<3;i++)R.zona.push({t:'bahaya',x:p.x+acak(-30,30),y:p.y+acak(-30,30),r:20,dl:.9,dmg:m.atk*.6,kolam:5,j:'racun'});
      if(m.st==='api')for(let i=0;i<5;i++){const a=Math.atan2(dy,dx)+(i-2)*.35;R.zona.push({t:'bahaya',x:m.x+Math.cos(a)*40,y:m.y+Math.sin(a)*40,r:16,dl:.7+i*.05,dmg:m.atk,kolam:3,j:'api'})}
      if(m.st==='serbu'){m.lx=dx/d;m.ly=dy/d}
      if(m.st==='es')for(let i=0;i<4;i++){const a=rnd()*6.28,r=acak(20,60);R.zona.push({t:'bahaya',x:p.x+Math.cos(a)*r*(i?1:0),y:p.y+Math.sin(a)*r*(i?1:0),r:22,dl:.9+i*.12,dmg:m.atk*.8,kolam:4,j:'es',el:'es'})}}}
  else if(m.st==='hantam'){if(m.t<1.1){const q=m.t/1.1;m.x+=(m.tx-m.x)*Math.min(1,dt*3*q);m.y+=(m.ty-m.y)*Math.min(1,dt*3*q)}else{m.st='jalan';fx({k:'bosHantam',m})}}
  else if(m.st==='cincin'){if(m.t>.6){const n=m.peran==='bos'?(m.fase===2?24:16):10,o=rnd();for(let i=0;i<n;i++)tembakMusuh(m,o+i*Math.PI*2/n,m.fase===2?92:70);m.st='jalan'}}
  else if(m.st==='spiral'){m.tsp=(m.tsp||0)-dt;if(m.tsp<=0){m.tsp=m.fase===2?.09:.12;const a=m.t*(m.fase===2?6:4);tembakMusuh(m,a,m.fase===2?100:75,3);tembakMusuh(m,a+Math.PI,m.fase===2?100:75,3);if(m.fase===2)tembakMusuh(m,a+Math.PI/2,90,3)}if(m.t>(m.fase===2?2.7:2.2))m.st='jalan'}
  else if(m.st==='panggil'){if(m.t>.7){const a=actDari((R.run.babak-1)*10+1);for(let i=0;i<(m.peran==='bos'?3:2);i++)if(R.mus.filter(o=>!o.mati).length<8)munculkan({key:pilih(a.foes),peran:'biasa'});m.st='jalan'}}
  else if(m.st==='serbu'){if(m.t<.7){}else if(m.t<1.3){m.dindingX=m.dindingY=false;geser(m,m.lx*200*dt,m.ly*200*dt)}else m.st='jalan'}
  else if(m.st==='racun'||m.st==='api'||m.st==='es'){if(m.t>.8)m.st='jalan'}
  else if(m.st==='kedip'){if(m.t>.45&&!m.sudahKedip){m.sudahKedip=true;let x,y,n=0;do{const a=rnd()*6.28,r=acak(55,85);x=p.x+Math.cos(a)*r;y=p.y+Math.sin(a)*r;n++}while(n<20&&solid(x,y));fx({k:'mKedip',m,x0:m.x,y0:m.y});if(!solid(x,y)){m.x=x;m.y=y}}
    if(m.t>.9){m.sudahKedip=false;const n=m.fase===2?14:10,o=rnd();for(let i=0;i<n;i++)tembakMusuh(m,o+i*Math.PI*2/n,80);m.st='jalan'}}
  else m.st='jalan';
}

