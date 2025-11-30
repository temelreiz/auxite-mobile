import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Platform,
  TextInput,
  Alert,
  Modal,
  Image,
  SafeAreaView,
  Dimensions,
  Linking,
  Animated
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Svg, { Path, Line, Circle, Text as SvgText, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================
// SECURE STORAGE KEYS
// ============================================
const STORAGE_KEYS = {
  HAS_WALLET: 'auxite_has_wallet',
  ENCRYPTED_SEED: 'auxite_encrypted_seed',
  PIN_HASH: 'auxite_pin_hash',
  WALLET_ADDRESS: 'auxite_wallet_address',
  BIOMETRIC_ENABLED: 'auxite_biometric_enabled',
};

// ============================================
// BIP39 WORD LIST (TAM 2048 KELİME)
// ============================================
const BIP39_WORDLIST = 'abandon,ability,able,about,above,absent,absorb,abstract,absurd,abuse,access,accident,account,accuse,achieve,acid,acoustic,acquire,across,act,action,actor,actress,actual,adapt,add,addict,address,adjust,admit,adult,advance,advice,aerobic,affair,afford,afraid,again,age,agent,agree,ahead,aim,air,airport,aisle,alarm,album,alcohol,alert,alien,all,alley,allow,almost,alone,alpha,already,also,alter,always,amateur,amazing,among,amount,amused,analyst,anchor,ancient,anger,angle,angry,animal,ankle,announce,annual,another,answer,antenna,antique,anxiety,any,apart,apology,appear,apple,approve,april,arch,arctic,area,arena,argue,arm,armed,armor,army,around,arrange,arrest,arrive,arrow,art,artefact,artist,artwork,ask,aspect,assault,asset,assist,assume,asthma,athlete,atom,attack,attend,attitude,attract,auction,audit,august,aunt,author,auto,autumn,average,avocado,avoid,awake,aware,away,awesome,awful,awkward,axis,baby,bachelor,bacon,badge,bag,balance,balcony,ball,bamboo,banana,banner,bar,barely,bargain,barrel,base,basic,basket,battle,beach,bean,beauty,because,become,beef,before,begin,behave,behind,believe,below,belt,bench,benefit,best,betray,better,between,beyond,bicycle,bid,bike,bind,biology,bird,birth,bitter,black,blade,blame,blanket,blast,bleak,bless,blind,blood,blossom,blouse,blue,blur,blush,board,boat,body,boil,bomb,bone,bonus,book,boost,border,boring,borrow,boss,bottom,bounce,box,boy,bracket,brain,brand,brass,brave,bread,breeze,brick,bridge,brief,bright,bring,brisk,broccoli,broken,bronze,broom,brother,brown,brush,bubble,buddy,budget,buffalo,build,bulb,bulk,bullet,bundle,bunker,burden,burger,burst,bus,business,busy,butter,buyer,buzz,cabbage,cabin,cable,cactus,cage,cake,call,calm,camera,camp,can,canal,cancel,candy,cannon,canoe,canvas,canyon,capable,capital,captain,car,carbon,card,cargo,carpet,carry,cart,case,cash,casino,castle,casual,cat,catalog,catch,category,cattle,caught,cause,caution,cave,ceiling,celery,cement,census,century,cereal,certain,chair,chalk,champion,change,chaos,chapter,charge,chase,chat,cheap,check,cheese,chef,cherry,chest,chicken,chief,child,chimney,choice,choose,chronic,chuckle,chunk,churn,cigar,cinnamon,circle,citizen,city,civil,claim,clap,clarify,claw,clay,clean,clerk,clever,click,client,cliff,climb,clinic,clip,clock,clog,close,cloth,cloud,clown,club,clump,cluster,clutch,coach,coast,coconut,code,coffee,coil,coin,collect,color,column,combine,come,comfort,comic,common,company,concert,conduct,confirm,congress,connect,consider,control,convince,cook,cool,copper,copy,coral,core,corn,correct,cost,cotton,couch,country,couple,course,cousin,cover,coyote,crack,cradle,craft,cram,crane,crash,crater,crawl,crazy,cream,credit,creek,crew,cricket,crime,crisp,critic,crop,cross,crouch,crowd,crucial,cruel,cruise,crumble,crunch,crush,cry,crystal,cube,culture,cup,cupboard,curious,current,curtain,curve,cushion,custom,cute,cycle,dad,damage,damp,dance,danger,daring,dash,daughter,dawn,day,deal,debate,debris,decade,december,decide,decline,decorate,decrease,deer,defense,define,defy,degree,delay,deliver,demand,demise,denial,dentist,deny,depart,depend,deposit,depth,deputy,derive,describe,desert,design,desk,despair,destroy,detail,detect,develop,device,devote,diagram,dial,diamond,diary,dice,diesel,diet,differ,digital,dignity,dilemma,dinner,dinosaur,direct,dirt,disagree,discover,disease,dish,dismiss,disorder,display,distance,divert,divide,divorce,dizzy,doctor,document,dog,doll,dolphin,domain,donate,donkey,donor,door,dose,double,dove,draft,dragon,drama,drastic,draw,dream,dress,drift,drill,drink,drip,drive,drop,drum,dry,duck,dumb,dune,during,dust,dutch,duty,dwarf,dynamic,eager,eagle,early,earn,earth,easily,east,easy,echo,ecology,economy,edge,edit,educate,effort,egg,eight,either,elbow,elder,electric,elegant,element,elephant,elevator,elite,else,embark,embody,embrace,emerge,emotion,employ,empower,empty,enable,enact,end,endless,endorse,enemy,energy,enforce,engage,engine,enhance,enjoy,enlist,enough,enrich,enroll,ensure,enter,entire,entry,envelope,episode,equal,equip,era,erase,erode,erosion,error,erupt,escape,essay,essence,estate,eternal,ethics,evidence,evil,evoke,evolve,exact,example,excess,exchange,excite,exclude,excuse,execute,exercise,exhaust,exhibit,exile,exist,exit,exotic,expand,expect,expire,explain,expose,express,extend,extra,eye,eyebrow,fabric,face,faculty,fade,faint,faith,fall,false,fame,family,famous,fan,fancy,fantasy,farm,fashion,fat,fatal,father,fatigue,fault,favorite,feature,february,federal,fee,feed,feel,female,fence,festival,fetch,fever,few,fiber,fiction,field,figure,file,film,filter,final,find,fine,finger,finish,fire,firm,first,fiscal,fish,fit,fitness,fix,flag,flame,flash,flat,flavor,flee,flight,flip,float,flock,floor,flower,fluid,flush,fly,foam,focus,fog,foil,fold,follow,food,foot,force,forest,forget,fork,fortune,forum,forward,fossil,foster,found,fox,fragile,frame,frequent,fresh,friend,fringe,frog,front,frost,frown,frozen,fruit,fuel,fun,funny,furnace,fury,future,gadget,gain,galaxy,gallery,game,gap,garage,garbage,garden,garlic,garment,gas,gasp,gate,gather,gauge,gaze,general,genius,genre,gentle,genuine,gesture,ghost,giant,gift,giggle,ginger,giraffe,girl,give,glad,glance,glare,glass,glide,glimpse,globe,gloom,glory,glove,glow,glue,goat,goddess,gold,good,goose,gorilla,gospel,gossip,govern,gown,grab,grace,grain,grant,grape,grass,gravity,great,green,grid,grief,grit,grocery,group,grow,grunt,guard,guess,guide,guilt,guitar,gun,gym,habit,hair,half,hammer,hamster,hand,happy,harbor,hard,harsh,harvest,hat,have,hawk,hazard,head,health,heart,heavy,hedgehog,height,hello,helmet,help,hen,hero,hidden,high,hill,hint,hip,hire,history,hobby,hockey,hold,hole,holiday,hollow,home,honey,hood,hope,horn,horror,horse,hospital,host,hotel,hour,hover,hub,huge,human,humble,humor,hundred,hungry,hunt,hurdle,hurry,hurt,husband,hybrid,ice,icon,idea,identify,idle,ignore,ill,illegal,illness,image,imitate,immense,immune,impact,impose,improve,impulse,inch,include,income,increase,index,indicate,indoor,industry,infant,inflict,inform,inhale,inherit,initial,inject,injury,inmate,inner,innocent,input,inquiry,insane,insect,inside,inspire,install,intact,interest,into,invest,invite,involve,iron,island,isolate,issue,item,ivory,jacket,jaguar,jar,jazz,jealous,jeans,jelly,jewel,job,join,joke,journey,joy,judge,juice,jump,jungle,junior,junk,just,kangaroo,keen,keep,ketchup,key,kick,kid,kidney,kind,kingdom,kiss,kit,kitchen,kite,kitten,kiwi,knee,knife,knock,know,lab,label,labor,ladder,lady,lake,lamp,language,laptop,large,later,latin,laugh,laundry,lava,law,lawn,lawsuit,layer,lazy,leader,leaf,learn,leave,lecture,left,leg,legal,legend,leisure,lemon,lend,length,lens,leopard,lesson,letter,level,liar,liberty,library,license,life,lift,light,like,limb,limit,link,lion,liquid,list,little,live,lizard,load,loan,lobster,local,lock,logic,lonely,long,loop,lottery,loud,lounge,love,loyal,lucky,luggage,lumber,lunar,lunch,luxury,lyrics,machine,mad,magic,magnet,maid,mail,main,major,make,mammal,man,manage,mandate,mango,mansion,manual,maple,marble,march,margin,marine,market,marriage,mask,mass,master,match,material,math,matrix,matter,maximum,maze,meadow,mean,measure,meat,mechanic,medal,media,melody,melt,member,memory,mention,menu,mercy,merge,merit,merry,mesh,message,metal,method,middle,midnight,milk,million,mimic,mind,minimum,minor,minute,miracle,mirror,misery,miss,mistake,mix,mixed,mixture,mobile,model,modify,mom,moment,monitor,monkey,monster,month,moon,moral,more,morning,mosquito,mother,motion,motor,mountain,mouse,move,movie,much,muffin,mule,multiply,muscle,museum,mushroom,music,must,mutual,myself,mystery,myth,naive,name,napkin,narrow,nasty,nation,nature,near,neck,need,negative,neglect,neither,nephew,nerve,nest,net,network,neutral,never,news,next,nice,night,noble,noise,nominee,noodle,normal,north,nose,notable,note,nothing,notice,novel,now,nuclear,number,nurse,nut,oak,obey,object,oblige,obscure,observe,obtain,obvious,occur,ocean,october,odor,off,offer,office,often,oil,okay,old,olive,olympic,omit,once,one,onion,online,only,open,opera,opinion,oppose,option,orange,orbit,orchard,order,ordinary,organ,orient,original,orphan,ostrich,other,outdoor,outer,output,outside,oval,oven,over,own,owner,oxygen,oyster,ozone,pact,paddle,page,pair,palace,palm,panda,panel,panic,panther,paper,parade,parent,park,parrot,party,pass,patch,path,patient,patrol,pattern,pause,pave,payment,peace,peanut,pear,peasant,pelican,pen,penalty,pencil,people,pepper,perfect,permit,person,pet,phone,photo,phrase,physical,piano,picnic,picture,piece,pig,pigeon,pill,pilot,pink,pioneer,pipe,pistol,pitch,pizza,place,planet,plastic,plate,play,please,pledge,pluck,plug,plunge,poem,poet,point,polar,pole,police,pond,pony,pool,popular,portion,position,possible,post,potato,pottery,poverty,powder,power,practice,praise,predict,prefer,prepare,present,pretty,prevent,price,pride,primary,print,priority,prison,private,prize,problem,process,produce,profit,program,project,promote,proof,property,prosper,protect,proud,provide,public,pudding,pull,pulp,pulse,pumpkin,punch,pupil,puppy,purchase,purity,purpose,purse,push,put,puzzle,pyramid,quality,quantum,quarter,question,quick,quit,quiz,quote,rabbit,raccoon,race,rack,radar,radio,rail,rain,raise,rally,ramp,ranch,random,range,rapid,rare,rate,rather,raven,raw,razor,ready,real,reason,rebel,rebuild,recall,receive,recipe,record,recycle,reduce,reflect,reform,refuse,region,regret,regular,reject,relax,release,relief,rely,remain,remember,remind,remove,render,renew,rent,reopen,repair,repeat,replace,report,require,rescue,resemble,resist,resource,response,result,retire,retreat,return,reunion,reveal,review,reward,rhythm,rib,ribbon,rice,rich,ride,ridge,rifle,right,rigid,ring,riot,ripple,risk,ritual,rival,river,road,roast,robot,robust,rocket,romance,roof,rookie,room,rose,rotate,rough,round,route,royal,rubber,rude,rug,rule,run,runway,rural,sad,saddle,sadness,safe,sail,salad,salmon,salon,salt,salute,same,sample,sand,satisfy,satoshi,sauce,sausage,save,say,scale,scan,scare,scatter,scene,scheme,school,science,scissors,scorpion,scout,scrap,screen,script,scrub,sea,search,season,seat,second,secret,section,security,seed,seek,segment,select,sell,seminar,senior,sense,sentence,series,service,session,settle,setup,seven,shadow,shaft,shallow,share,shed,shell,sheriff,shield,shift,shine,ship,shiver,shock,shoe,shoot,shop,short,shoulder,shove,shrimp,shrug,shuffle,shy,sibling,sick,side,siege,sight,sign,silent,silk,silly,silver,similar,simple,since,sing,siren,sister,situate,six,size,skate,sketch,ski,skill,skin,skirt,skull,slab,slam,sleep,slender,slice,slide,slight,slim,slogan,slot,slow,slush,small,smart,smile,smoke,smooth,snack,snake,snap,sniff,snow,soap,soccer,social,sock,soda,soft,solar,soldier,solid,solution,solve,someone,song,soon,sorry,sort,soul,sound,soup,source,south,space,spare,spatial,spawn,speak,special,speed,spell,spend,sphere,spice,spider,spike,spin,spirit,split,spoil,sponsor,spoon,sport,spot,spray,spread,spring,spy,square,squeeze,squirrel,stable,stadium,staff,stage,stairs,stamp,stand,start,state,stay,steak,steel,stem,step,stereo,stick,still,sting,stock,stomach,stone,stool,story,stove,strategy,street,strike,strong,struggle,student,stuff,stumble,style,subject,submit,subway,success,such,sudden,suffer,sugar,suggest,suit,summer,sun,sunny,sunset,super,supply,supreme,sure,surface,surge,surprise,surround,survey,suspect,sustain,swallow,swamp,swap,swarm,swear,sweet,swift,swim,swing,switch,sword,symbol,symptom,syrup,system,table,tackle,tag,tail,talent,talk,tank,tape,target,task,taste,tattoo,taxi,teach,team,tell,ten,tenant,tennis,tent,term,test,text,thank,that,theme,then,theory,there,they,thing,this,thought,three,thrive,throw,thumb,thunder,ticket,tide,tiger,tilt,timber,time,tiny,tip,tired,tissue,title,toast,tobacco,today,toddler,toe,together,toilet,token,tomato,tomorrow,tone,tongue,tonight,tool,tooth,top,topic,topple,torch,tornado,tortoise,toss,total,tourist,toward,tower,town,toy,track,trade,traffic,tragic,train,transfer,trap,trash,travel,tray,treat,tree,trend,trial,tribe,trick,trigger,trim,trip,trophy,trouble,truck,true,truly,trumpet,trust,truth,try,tube,tuition,tumble,tuna,tunnel,turkey,turn,turtle,twelve,twenty,twice,twin,twist,two,type,typical,ugly,umbrella,unable,unaware,uncle,uncover,under,undo,unfair,unfold,unhappy,uniform,unique,unit,universe,unknown,unlock,until,unusual,unveil,update,upgrade,uphold,upon,upper,upset,urban,urge,usage,use,used,useful,useless,usual,utility,vacant,vacuum,vague,valid,valley,valve,van,vanish,vapor,various,vast,vault,vehicle,velvet,vendor,venture,venue,verb,verify,version,very,vessel,veteran,viable,vibrant,vicious,victory,video,view,village,vintage,violin,virtual,virus,visa,visit,visual,vital,vivid,vocal,voice,void,volcano,volume,vote,voyage,wage,wagon,wait,walk,wall,walnut,want,warfare,warm,warrior,wash,wasp,waste,water,wave,way,wealth,weapon,wear,weasel,weather,web,wedding,weekend,weird,welcome,west,wet,whale,what,wheat,wheel,when,where,whip,whisper,wide,width,wife,wild,will,win,window,wine,wing,wink,winner,winter,wire,wisdom,wise,wish,witness,wolf,woman,wonder,wood,wool,word,work,world,worry,worth,wrap,wreck,wrestle,wrist,write,wrong,yard,year,yellow,you,young,youth,zebra,zero,zone,zoo'.split(',');

// ============================================
// WALLET UTILITIES
// ============================================
function generateSeedPhrase() {
  const words = [];
  const usedIndices = new Set();
  while (words.length < 12) {
    const randomIndex = Math.floor(Math.random() * BIP39_WORDLIST.length);
    if (!usedIndices.has(randomIndex)) {
      usedIndices.add(randomIndex);
      words.push(BIP39_WORDLIST[randomIndex]);
    }
  }
  return words;
}

async function deriveAddressFromSeed(seedPhrase) {
  const seedString = seedPhrase.join(' ');
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    seedString
  );
  return '0x' + hash.substring(0, 40);
}

async function hashPin(pin) {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    pin + 'AUXITE_SALT_2024'
  );
}

async function encryptSeed(seedPhrase, pin) {
  const seedString = seedPhrase.join(',');
  // Basit base64 encoding - gerçek uygulamada AES kullanın
  return btoa(seedString);
}

async function decryptSeed(encryptedSeed, pin) {
  try {
    const decoded = atob(encryptedSeed);
    return decoded.split(',');
  } catch (error) {
    return null;
  }
}

// ============================================
// WALLETCONNECT AYARLARI
// ============================================
const WALLETCONNECT_PROJECT_ID = '3a14105336ff5cc9242e7526aaeacb79';
const SEPOLIA_CHAIN_ID = 11155111;
const SEPOLIA_CHAIN_ID_HEX = '0xaa36a7';

// ============================================
// RENKLER - Robinhood Mavi Tema
// ============================================
const Colors = {
  background: '#0a0e17',
  card: '#141a26',
  cardHover: '#1c2333',
  border: 'rgba(255,255,255,0.08)',
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255,255,255,0.85)',
  textMuted: 'rgba(255,255,255,0.5)',
  primary: '#00d09c',
  primaryDark: '#00b386',
  gold: '#ffc107',
  silver: '#e0e0e0',
  platinum: '#64b5f6',
  palladium: '#b39ddb',
  up: '#00d09c',
  down: '#ff5252',
  neutral: 'rgba(255,255,255,0.5)',
  error: '#ff5252',
  warning: '#ffb74d',
};

// ============================================
// DİL SİSTEMİ (i18n)
// ============================================
const translations = {
  tr: {
    // Genel
    appName: 'Auxite',
    loading: 'Yükleniyor...',
    live: 'Canlı',
    demo: 'Demo',
    
    // Tab Bar
    home: 'Ana Sayfa',
    markets: 'Piyasalar',
    swap: 'Dönüştür',
    allocate: 'Tahsis Et',
    wallet: 'Cüzdan',
    
    // Ana Sayfa
    dailyPnL: 'Bugünkü Kar/Zarar',
    riskScore: 'Risk Skoru',
    correlation: 'Korelasyon',
    lowRisk: 'Düşük Risk',
    mediumRisk: 'Orta Risk',
    highRisk: 'Yüksek Risk',
    send: 'Gönder',
    receive: 'Al',
    
    // Piyasalar
    marketsTitle: 'Piyasalar',
    all: 'Tümü',
    spot: 'Spot',
    staked: 'Tahsis',
    name: 'İsim',
    price: 'Fiyat',
    change24h: '24s',
    
    // Haberler
    news: 'Haberler',
    viewAll: 'Tümünü Gör',
    newsLoading: 'Haberler yükleniyor...',
    noNews: 'Haber bulunamadı',
    refreshNews: 'Haberleri Yenile',
    hoursAgo: 'saat önce',
    minutesAgo: 'dk önce',
    daysAgo: 'gün önce',
    
    // Tahsis Et
    totalStaked: 'Toplam Tahsis',
    rewards: 'Kazanılan Ödül',
    stake: 'Tahsis Et',
    unstake: 'Geri Çek',
    balance: 'Bakiye',
    confirm: 'Onayla',
    cancel: 'İptal',
    success: 'Başarılı',
    transactionComplete: 'İşlem tamamlandı!',
    confirmTransaction: 'İşlem Onayı',
    
    // Cüzdan
    totalAssetValue: 'Toplam Varlık Değeri',
    walletAddress: 'Cüzdan Adresi',
    assets: 'Varlık',
    transactions: 'İşlem',
    locations: 'Lokasyon',
    security: 'Güvenlik',
    biometricActive: 'Biyometrik aktif',
    notifications: 'Bildirimler',
    newNotifications: 'yeni bildirim',
    settings: 'Ayarlar',
    themeLanguageNetwork: 'Tema, dil, ağ',
    help: 'Yardım',
    faqSupport: 'SSS, destek',
    logout: 'Çıkış Yap',
    
    // Auth
    walletTitle: 'Auxite Wallet',
    authRequired: 'Güvenli erişim için kimlik doğrulama gerekli',
    authenticate: 'Kimlik Doğrula',
    
    // Profil
    profileInfo: 'Profil Bilgileri',
    auxiteUser: 'Auxite Kullanıcısı',
    
    // Wallet Connect
    connectWallet: 'Cüzdan Bağla',
    disconnect: 'Bağlantıyı Kes',
    connecting: 'Bağlanıyor...',
    connected: 'Bağlı',
    notConnected: 'Bağlı Değil',
    hotWallets: 'Sıcak Cüzdanlar',
    coldWallets: 'Soğuk Cüzdanlar (Hardware)',
    mostPopular: 'En popüler cüzdan',
    walletsSupported: '100+ cüzdan desteği',
    forCoinbaseUsers: 'Coinbase kullanıcıları için',
    hardwareSecure: 'Hardware wallet (güvenli)',
    sepoliaInfo: 'Sepolia test ağına bağlanacaksınız',
    walletSecure: 'Cüzdanınız güvendedir, biz sadece adresinizi okuruz',
    testEthInfo: 'Test ETH için: sepolia-faucet.pk910.de',
    connectionFailed: 'Bağlantı başarısız',
    tapToConnect: 'Bağlanmak için dokun',
    
    // Onboarding
    welcomeTitle: 'Auxite Wallet\'a Hoş Geldiniz',
    welcomeSubtitle: 'Fiziksel metal destekli tokenlarınızı güvenle saklayın',
    createNewWallet: 'Yeni Cüzdan Oluştur',
    importWallet: 'Mevcut Cüzdanı İçe Aktar',
    seedPhraseTitle: 'Kurtarma İfadeniz',
    seedPhraseWarning: '⚠️ Bu 12 kelimeyi güvenli bir yere yazın!',
    iWroteItDown: 'Yazdım, Devam Et',
    verifyTitle: 'Kurtarma İfadesini Doğrula',
    selectWord: 'Kelime #',
    verifyError: 'Yanlış kelime',
    setPinTitle: 'PIN Oluştur',
    setPinSubtitle: '6 haneli güvenlik PIN\'inizi belirleyin',
    confirmPinTitle: 'PIN\'i Onayla',
    pinMismatch: 'PIN\'ler eşleşmiyor',
    enterPinTitle: 'PIN Girin',
    wrongPin: 'Yanlış PIN',
    forgotPin: 'PIN\'imi Unuttum',
    securityTip: 'Güvenlik İpucu',
    neverShare: 'Kurtarma ifadenizi asla paylaşmayın',
    keysOnDevice: 'Anahtarlarınız yalnızca cihazınızda',
  },
  en: {
    // General
    appName: 'Auxite',
    loading: 'Loading...',
    live: 'Live',
    demo: 'Demo',
    
    // Tab Bar
    home: 'Home',
    markets: 'Markets',
    swap: 'Swap',
    allocate: 'Allocate',
    wallet: 'Wallet',
    
    // Home
    dailyPnL: 'Today\'s PnL',
    riskScore: 'Risk Score',
    correlation: 'Correlation',
    lowRisk: 'Low Risk',
    mediumRisk: 'Medium Risk',
    highRisk: 'High Risk',
    send: 'Send',
    receive: 'Receive',
    
    // Markets
    marketsTitle: 'Markets',
    all: 'All',
    spot: 'Spot',
    staked: 'Staked',
    name: 'Name',
    price: 'Price',
    change24h: '24h',
    
    // News
    news: 'News',
    viewAll: 'View All',
    newsLoading: 'Loading news...',
    noNews: 'No news found',
    refreshNews: 'Refresh News',
    hoursAgo: 'hours ago',
    minutesAgo: 'mins ago',
    daysAgo: 'days ago',
    
    // Allocate
    totalStaked: 'Total Staked',
    rewards: 'Rewards Earned',
    stake: 'Stake',
    unstake: 'Unstake',
    balance: 'Balance',
    confirm: 'Confirm',
    cancel: 'Cancel',
    success: 'Success',
    transactionComplete: 'Transaction complete!',
    confirmTransaction: 'Confirm Transaction',
    
    // Wallet
    totalAssetValue: 'Total Asset Value',
    walletAddress: 'Wallet Address',
    assets: 'Assets',
    transactions: 'Transactions',
    locations: 'Locations',
    security: 'Security',
    biometricActive: 'Biometric active',
    notifications: 'Notifications',
    newNotifications: 'new notifications',
    settings: 'Settings',
    themeLanguageNetwork: 'Theme, language, network',
    help: 'Help',
    faqSupport: 'FAQ, support',
    logout: 'Log Out',
    
    // Auth
    walletTitle: 'Auxite Wallet',
    authRequired: 'Authentication required for secure access',
    authenticate: 'Authenticate',
    
    // Profile
    profileInfo: 'Profile Info',
    auxiteUser: 'Auxite User',
    
    // Wallet Connect
    connectWallet: 'Connect Wallet',
    disconnect: 'Disconnect',
    connecting: 'Connecting...',
    connected: 'Connected',
    notConnected: 'Not Connected',
    hotWallets: 'Hot Wallets',
    coldWallets: 'Cold Wallets (Hardware)',
    mostPopular: 'Most popular wallet',
    walletsSupported: '100+ wallets supported',
    forCoinbaseUsers: 'For Coinbase users',
    hardwareSecure: 'Hardware wallet (secure)',
    sepoliaInfo: 'You will connect to Sepolia test network',
    walletSecure: 'Your wallet is secure, we only read your address',
    testEthInfo: 'Get test ETH: sepolia-faucet.pk910.de',
    connectionFailed: 'Connection failed',
    tapToConnect: 'Tap to connect',
    
    // Onboarding
    welcomeTitle: 'Welcome to Auxite Wallet',
    welcomeSubtitle: 'Securely store your physical metal-backed tokens',
    createNewWallet: 'Create New Wallet',
    importWallet: 'Import Existing Wallet',
    seedPhraseTitle: 'Your Recovery Phrase',
    seedPhraseWarning: '⚠️ Write down these 12 words in a safe place!',
    iWroteItDown: 'I Wrote It Down, Continue',
    verifyTitle: 'Verify Recovery Phrase',
    selectWord: 'Word #',
    verifyError: 'Wrong word',
    setPinTitle: 'Create PIN',
    setPinSubtitle: 'Set your 6-digit security PIN',
    confirmPinTitle: 'Confirm PIN',
    pinMismatch: 'PINs do not match',
    enterPinTitle: 'Enter PIN',
    wrongPin: 'Wrong PIN',
    forgotPin: 'Forgot PIN',
    securityTip: 'Security Tip',
    neverShare: 'Never share your recovery phrase',
    keysOnDevice: 'Your keys stay on your device',
  }
};

// Dil context
const LanguageContext = React.createContext({
  language: 'tr',
  setLanguage: (lang) => {},
  t: (key) => key,
});

// ============================================
// METAL İKONLARI
// ============================================
const METAL_ICONS = {
  AUXG: require('./assets/metals/auxg.png'),
  AUXS: require('./assets/metals/auxs.png'),
  AUXPT: require('./assets/metals/auxpt.png'),
  AUXPD: require('./assets/metals/auxpd.png'),
};

// Auxite Ana Logo
const AUXITE_LOGO = require('./assets/auxite-main-logo.png');

// ============================================
// METAL BİLGİLERİ
// ============================================
const METALS = {
  AUXG: { symbol: 'AUXG', name: 'Gold', nameTr: 'Altın', nameEn: 'Gold', color: '#ffc107' },
  AUXS: { symbol: 'AUXS', name: 'Silver', nameTr: 'Gümüş', nameEn: 'Silver', color: '#e0e0e0' },
  AUXPT: { symbol: 'AUXPT', name: 'Platinum', nameTr: 'Platin', nameEn: 'Platinum', color: '#64b5f6' },
  AUXPD: { symbol: 'AUXPD', name: 'Palladium', nameTr: 'Paladyum', nameEn: 'Palladium', color: '#b39ddb' },
};

const METAL_ORDER = ['AUXG', 'AUXS', 'AUXPT', 'AUXPD'];

// ============================================
// DİĞER VARLIKLAR (BTC, ETH, USDT, TRY)
// ============================================
const OTHER_ASSETS = {
  BTC: { symbol: 'BTC', name: 'Bitcoin', color: '#f7931a' },
  ETH: { symbol: 'ETH', name: 'Ethereum', color: '#627eea' },
  USDT: { symbol: 'USDT', name: 'Tether', color: '#26a17b' },
  TRY: { symbol: 'TRY', name: 'Türk Lirası', color: '#e30a17' },
};

// Mock fiyatlar - diğer varlıklar
const OTHER_ASSET_PRICES = {
  BTC: { price: 97250.00, change: 2.34 },
  ETH: { price: 3420.50, change: -1.12 },
  USDT: { price: 1.00, change: 0.00 },
  TRY: { price: 0.029, change: -0.15 },
};

// ============================================
// API AYARLARI
// ============================================
const API_IP = 'auxite-wallet.vercel.app';
const API_PORT = '';
const AUXITE_API = 'https://auxite-wallet.vercel.app/api/prices';
const CHART_API = 'https://auxite-wallet.vercel.app/api/chart-data';
const HISTORY_API = 'https://auxite-wallet.vercel.app/api/prices/history';
const CRYPTO_API = 'https://auxite-wallet.vercel.app/api/crypto';
const NEWS_API = "https://cryptopanic.com/api/v1/posts/?auth_token=free&currencies=BTC,ETH,GOLD&filter=important&public=true";

// Metal symbol mapping for GoldAPI
const SYMBOL_MAP = {
  AUXG: 'XAU',
  AUXS: 'XAG',
  AUXPT: 'XPT',
  AUXPD: 'XPD',
};

// ============================================
// FORMAT FONKSİYONLARI
// ============================================
function formatCompact(num: number): string {
  if (num >= 1000000000) {
    return '$' + (num / 1000000000).toFixed(2) + 'B';
  }
  if (num >= 1000000) {
    return '$' + (num / 1000000).toFixed(2) + 'M';
  }
  if (num >= 1000) {
    return '$' + (num / 1000).toFixed(2) + 'K';
  }
  return '$' + num.toFixed(2);
}

function formatPrice(num: number): string {
  if (num >= 1000) {
    return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return '$' + num.toFixed(2);
}

function formatBalance(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'K';
  }
  return num.toFixed(2);
}

// ============================================
// MOCK DATA
// ============================================
const MOCK_PRICES = {
  AUXG: { base: 84.43, ask: 86.12, bid: 83.59 },
  AUXS: { base: 1.00, ask: 1.03, bid: 0.99 },
  AUXPT: { base: 32.80, ask: 33.62, bid: 32.39 },
  AUXPD: { base: 33.75, ask: 34.59, bid: 33.33 },
};

const PORTFOLIO = [
  { symbol: 'AUXG', balance: 998953.91 },
  { symbol: 'AUXS', balance: 9999215.64 },
  { symbol: 'AUXPT', balance: 499000.00 },
  { symbol: 'AUXPD', balance: 498999.00 },
];

// ============================================
// GRAFİK VERİSİ OLUŞTURMA
// ============================================
function generateChartData(basePrice, hours = 24) {
  const data = [];
  let price = basePrice;
  const now = Date.now();
  
  for (let i = hours; i >= 0; i--) {
    const change = (Math.random() - 0.5) * basePrice * 0.02;
    price = price + change;
    if (price < basePrice * 0.9) price = basePrice * 0.9;
    if (price > basePrice * 1.1) price = basePrice * 1.1;
    
    data.push({
      time: now - i * 3600000,
      price: Math.round(price * 100) / 100,
    });
  }
  return data;
}

// ============================================
// CANDLESTICK VE VOLUME VERİSİ OLUŞTURMA (FALLBACK)
// ============================================
function generateCandleData(basePrice, count = 50) {
  const data = [];
  let price = basePrice;
  const now = Date.now();
  
  for (let i = count; i >= 0; i--) {
    const volatility = basePrice * 0.015;
    const open = price;
    const change1 = (Math.random() - 0.5) * volatility;
    const change2 = (Math.random() - 0.5) * volatility;
    const change3 = (Math.random() - 0.5) * volatility;
    
    const high = Math.max(open, open + change1, open + change2) + Math.random() * volatility * 0.5;
    const low = Math.min(open, open + change1, open + change2) - Math.random() * volatility * 0.5;
    const close = open + change3;
    
    price = close;
    
    data.push({
      time: now - i * 3600000,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume: Math.round(Math.random() * 1000000 + 500000),
    });
  }
  return data;
}

// ============================================
// CANLI GRAFİK VERİSİ ÇEKME
// ============================================
async function fetchChartData(symbol, period = '1h') {
  try {
    const response = await fetch(`${CHART_API}?symbol=${symbol}&period=${period}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error('Chart API error');
    }
    
    const json = await response.json();
    
    if (json.data && json.data.length > 0) {
      return { data: json.data, isLive: true };
    }
    
    return null;
  } catch (error) {
    console.log('Chart fetch error:', error);
    return null;
  }
}

// ============================================
// TEKNİK ANALİZ HESAPLAMALARI
// ============================================

// MA (Simple Moving Average)
function calculateMA(data, period = 20) {
  const ma = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      ma.push(null);
      continue;
    }
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += data[j].close;
    }
    ma.push(sum / period);
  }
  return ma;
}

// EMA (Exponential Moving Average)
function calculateEMA(data, period = 20) {
  const ema = [];
  const multiplier = 2 / (period + 1);
  
  // İlk EMA değeri SMA olarak
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i].close;
    ema.push(null);
  }
  ema[period - 1] = sum / period;
  
  // Sonraki EMA değerleri
  for (let i = period; i < data.length; i++) {
    const currentEMA = (data[i].close - ema[i - 1]) * multiplier + ema[i - 1];
    ema.push(currentEMA);
  }
  return ema;
}

// Bollinger Bands
function calculateBOLL(data, period = 20, stdDev = 2) {
  const ma = calculateMA(data, period);
  const upper = [];
  const lower = [];
  const middle = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      upper.push(null);
      lower.push(null);
      middle.push(null);
      continue;
    }
    
    // Standart sapma hesapla
    let sumSquares = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sumSquares += Math.pow(data[j].close - ma[i], 2);
    }
    const std = Math.sqrt(sumSquares / period);
    
    middle.push(ma[i]);
    upper.push(ma[i] + stdDev * std);
    lower.push(ma[i] - stdDev * std);
  }
  return { upper, middle, lower };
}

// MACD
function calculateMACD(data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);
  
  const macdLine = [];
  for (let i = 0; i < data.length; i++) {
    if (fastEMA[i] === null || slowEMA[i] === null) {
      macdLine.push(null);
    } else {
      macdLine.push(fastEMA[i] - slowEMA[i]);
    }
  }
  
  // Signal line (MACD'nin EMA'sı)
  const signalLine = [];
  const validMacd = macdLine.filter(v => v !== null);
  const signalMultiplier = 2 / (signalPeriod + 1);
  
  let signalStart = macdLine.findIndex(v => v !== null);
  for (let i = 0; i < data.length; i++) {
    if (i < signalStart + signalPeriod - 1) {
      signalLine.push(null);
    } else if (i === signalStart + signalPeriod - 1) {
      let sum = 0;
      for (let j = signalStart; j <= i; j++) {
        sum += macdLine[j];
      }
      signalLine.push(sum / signalPeriod);
    } else {
      const prevSignal = signalLine[i - 1];
      if (prevSignal !== null && macdLine[i] !== null) {
        signalLine.push((macdLine[i] - prevSignal) * signalMultiplier + prevSignal);
      } else {
        signalLine.push(null);
      }
    }
  }
  
  // Histogram
  const histogram = [];
  for (let i = 0; i < data.length; i++) {
    if (macdLine[i] === null || signalLine[i] === null) {
      histogram.push(null);
    } else {
      histogram.push(macdLine[i] - signalLine[i]);
    }
  }
  
  return { macdLine, signalLine, histogram };
}

// RSI hesaplama
function calculateRSI(data, period = 14) {
  const rsi = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      rsi.push(50);
      continue;
    }
    let gains = 0;
    let losses = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const change = data[j].close - data[j - 1].close;
      if (change > 0) gains += change;
      else losses -= change;
    }
    const avgGain = gains / period;
    const avgLoss = losses / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi.push(100 - (100 / (1 + rs)));
  }
  return rsi;
}

// ============================================
// CANDLESTICK GRAFİK KOMPONENTİ
// ============================================
function CandlestickChart({ data, width, height, color, ma, ema, boll, showMA, showEMA, showBOLL }) {
  if (!data || data.length === 0) return null;

  const padding = { top: 15, right: 55, bottom: 15, left: 8 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Tüm fiyatları al (high/low dahil)
  const allHighs = data.map(d => d.high);
  const allLows = data.map(d => d.low);
  const minPrice = Math.min(...allLows) * 0.999;
  const maxPrice = Math.max(...allHighs) * 1.001;
  const priceRange = maxPrice - minPrice || 1;

  const getY = (price) => padding.top + (1 - (price - minPrice) / priceRange) * chartHeight;
  
  // Mum genişliği hesapla
  const candleWidth = Math.max(3, Math.min(8, (chartWidth / data.length) * 0.7));
  const candleGap = (chartWidth - candleWidth * data.length) / (data.length - 1 || 1);
  const getX = (i) => padding.left + i * (candleWidth + candleGap) + candleWidth / 2;

  // Grid çizgileri için değerler
  const gridCount = 4;
  const gridValues = [];
  for (let i = 0; i <= gridCount; i++) {
    gridValues.push(minPrice + (priceRange * i / gridCount));
  }

  // Son fiyat
  const lastCandle = data[data.length - 1];
  const lastX = getX(data.length - 1);
  const lastY = getY(lastCandle.close);
  const isLastUp = lastCandle.close >= lastCandle.open;

  return (
    <Svg width={width} height={height}>
      {/* Arka plan */}
      <Rect x={0} y={0} width={width} height={height} fill={Colors.background} rx={8} />
      
      {/* Yatay grid çizgileri */}
      {gridValues.map((val, i) => {
        const y = getY(val);
        return (
          <React.Fragment key={`grid-${i}`}>
            <Line
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke={Colors.border}
              strokeWidth={0.5}
              opacity={0.5}
            />
            <SvgText
              x={width - padding.right + 4}
              y={y + 3}
              fill={Colors.textMuted}
              fontSize={9}
            >
              ${val.toFixed(2)}
            </SvgText>
          </React.Fragment>
        );
      })}

      {/* Bollinger Bands */}
      {showBOLL && boll && boll.upper && boll.upper.length > 0 && (
        <>
          {/* Üst band */}
          <Path 
            d={boll.upper.map((v, i) => v !== null ? `${i === 0 || boll.upper[i-1] === null ? 'M' : 'L'} ${getX(i)} ${getY(v)}` : '').join(' ')} 
            stroke={Colors.gold}
            strokeWidth={1}
            fill="none"
            opacity={0.6}
          />
          {/* Alt band */}
          <Path 
            d={boll.lower.map((v, i) => v !== null ? `${i === 0 || boll.lower[i-1] === null ? 'M' : 'L'} ${getX(i)} ${getY(v)}` : '').join(' ')} 
            stroke={Colors.gold}
            strokeWidth={1}
            fill="none"
            opacity={0.6}
          />
          {/* Orta band */}
          <Path 
            d={boll.middle.map((v, i) => v !== null ? `${i === 0 || boll.middle[i-1] === null ? 'M' : 'L'} ${getX(i)} ${getY(v)}` : '').join(' ')} 
            stroke={Colors.gold}
            strokeWidth={1}
            fill="none"
            opacity={0.4}
            strokeDasharray="2,2"
          />
        </>
      )}

      {/* MA Line */}
      {showMA && ma && ma.length > 0 && (
        <Path 
          d={ma.map((v, i) => v !== null ? `${i === 0 || ma[i-1] === null ? 'M' : 'L'} ${getX(i)} ${getY(v)}` : '').join(' ')} 
          stroke="#FF6B6B"
          strokeWidth={1.5}
          fill="none"
        />
      )}

      {/* EMA Line */}
      {showEMA && ema && ema.length > 0 && (
        <Path 
          d={ema.map((v, i) => v !== null ? `${i === 0 || ema[i-1] === null ? 'M' : 'L'} ${getX(i)} ${getY(v)}` : '').join(' ')} 
          stroke="#4ECDC4"
          strokeWidth={1.5}
          fill="none"
        />
      )}

      {/* Candlestick'ler */}
      {data.map((candle, i) => {
        const x = getX(i);
        const isUp = candle.close >= candle.open;
        const candleColor = isUp ? Colors.up : Colors.down;
        
        const highY = getY(candle.high);
        const lowY = getY(candle.low);
        const openY = getY(candle.open);
        const closeY = getY(candle.close);
        
        const bodyTop = Math.min(openY, closeY);
        const bodyHeight = Math.max(1, Math.abs(openY - closeY));

        return (
          <React.Fragment key={i}>
            {/* Wick (fitil) */}
            <Line
              x1={x}
              y1={highY}
              x2={x}
              y2={lowY}
              stroke={candleColor}
              strokeWidth={1}
            />
            {/* Body (gövde) */}
            <Rect
              x={x - candleWidth / 2}
              y={bodyTop}
              width={candleWidth}
              height={bodyHeight}
              fill={isUp ? candleColor : candleColor}
              stroke={candleColor}
              strokeWidth={0.5}
            />
          </React.Fragment>
        );
      })}

      {/* Son fiyat yatay çizgisi */}
      <Line
        x1={lastX + candleWidth / 2}
        y1={lastY}
        x2={width - padding.right}
        y2={lastY}
        stroke={isLastUp ? Colors.up : Colors.down}
        strokeWidth={1}
        strokeDasharray="3,2"
      />

      {/* Son fiyat etiketi */}
      <Rect
        x={width - padding.right + 2}
        y={lastY - 8}
        width={48}
        height={16}
        fill={isLastUp ? Colors.up : Colors.down}
        rx={3}
      />
      <SvgText
        x={width - padding.right + 6}
        y={lastY + 4}
        fill={Colors.textPrimary}
        fontSize={10}
        fontWeight="bold"
      >
        ${lastCandle.close.toFixed(2)}
      </SvgText>
    </Svg>
  );
}

// ============================================
// VOLUME GRAFİK KOMPONENTİ
// ============================================
function VolumeChart({ data, width, height }) {
  if (!data || data.length === 0) return null;

  const padding = { top: 5, right: 50, bottom: 5, left: 10 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxVolume = Math.max(...data.map(d => d.volume));
  const barWidth = Math.max(2, (chartWidth / data.length) * 0.7);
  const gap = (chartWidth / data.length) * 0.3;

  return (
    <Svg width={width} height={height}>
      {data.map((candle, i) => {
        const x = padding.left + i * (barWidth + gap);
        const barHeight = (candle.volume / maxVolume) * chartHeight;
        const y = padding.top + chartHeight - barHeight;
        const isUp = candle.close >= candle.open;

        return (
          <Path
            key={i}
            d={`M ${x} ${y} L ${x + barWidth} ${y} L ${x + barWidth} ${y + barHeight} L ${x} ${y + barHeight} Z`}
            fill={isUp ? Colors.up + '80' : Colors.down + '80'}
          />
        );
      })}
    </Svg>
  );
}

// ============================================
// RSI GRAFİK KOMPONENTİ
// ============================================
function RSIChart({ data, width, height }) {
  if (!data || data.length === 0) return null;

  const rsiData = calculateRSI(data);
  const padding = { top: 5, right: 50, bottom: 5, left: 10 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const getY = (value) => padding.top + (1 - value / 100) * chartHeight;
  const getX = (i) => padding.left + (i / (rsiData.length - 1)) * chartWidth;

  const pathD = rsiData.map((value, i) => 
    `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(value)}`
  ).join(' ');

  return (
    <Svg width={width} height={height}>
      {/* Overbought/Oversold lines */}
      <Line x1={padding.left} y1={getY(70)} x2={width - padding.right} y2={getY(70)} 
        stroke={Colors.down + '50'} strokeWidth={1} strokeDasharray="4,4" />
      <Line x1={padding.left} y1={getY(30)} x2={width - padding.right} y2={getY(30)} 
        stroke={Colors.up + '50'} strokeWidth={1} strokeDasharray="4,4" />
      <Line x1={padding.left} y1={getY(50)} x2={width - padding.right} y2={getY(50)} 
        stroke={Colors.border} strokeWidth={1} />
      
      {/* RSI Line */}
      <Path d={pathD} stroke={Colors.gold} strokeWidth={1.5} fill="none" />
      
      {/* Labels */}
      <SvgText x={width - padding.right + 5} y={getY(70) + 4} fill={Colors.down} fontSize={9}>70</SvgText>
      <SvgText x={width - padding.right + 5} y={getY(30) + 4} fill={Colors.up} fontSize={9}>30</SvgText>
      
      {/* Current RSI value */}
      <SvgText x={padding.left} y={padding.top + 12} fill={Colors.gold} fontSize={10}>
        RSI: {rsiData[rsiData.length - 1].toFixed(1)}
      </SvgText>
    </Svg>
  );
}

// ============================================
// MACD GRAFİK KOMPONENTİ
// ============================================
function MACDChart({ data, macd, width, height }) {
  if (!data || !macd || data.length === 0) return null;

  const padding = { top: 5, right: 50, bottom: 5, left: 10 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const { macdLine, signalLine, histogram } = macd;
  
  // Min/max değerleri bul
  const validValues = [...macdLine, ...signalLine, ...histogram].filter(v => v !== null);
  const maxVal = Math.max(...validValues.map(v => Math.abs(v)));
  
  const getY = (value) => {
    if (value === null) return null;
    return padding.top + chartHeight / 2 - (value / maxVal) * (chartHeight / 2);
  };
  const getX = (i) => padding.left + (i / (data.length - 1)) * chartWidth;

  // MACD line path
  const macdPath = macdLine.map((value, i) => {
    if (value === null) return null;
    return `${i === 0 || macdLine[i-1] === null ? 'M' : 'L'} ${getX(i)} ${getY(value)}`;
  }).filter(p => p !== null).join(' ');

  // Signal line path
  const signalPath = signalLine.map((value, i) => {
    if (value === null) return null;
    return `${i === 0 || signalLine[i-1] === null ? 'M' : 'L'} ${getX(i)} ${getY(value)}`;
  }).filter(p => p !== null).join(' ');

  const barWidth = Math.max(2, (chartWidth / data.length) * 0.6);

  return (
    <Svg width={width} height={height}>
      {/* Zero line */}
      <Line 
        x1={padding.left} 
        y1={padding.top + chartHeight / 2} 
        x2={width - padding.right} 
        y2={padding.top + chartHeight / 2} 
        stroke={Colors.border} 
        strokeWidth={1} 
      />

      {/* Histogram */}
      {histogram.map((value, i) => {
        if (value === null) return null;
        const x = getX(i) - barWidth / 2;
        const y = getY(value);
        const zeroY = padding.top + chartHeight / 2;
        const barHeight = Math.abs(y - zeroY);
        const isPositive = value >= 0;

        return (
          <Path
            key={`hist-${i}`}
            d={`M ${x} ${isPositive ? y : zeroY} 
                L ${x + barWidth} ${isPositive ? y : zeroY} 
                L ${x + barWidth} ${isPositive ? zeroY : y} 
                L ${x} ${isPositive ? zeroY : y} Z`}
            fill={isPositive ? Colors.up + '60' : Colors.down + '60'}
          />
        );
      })}

      {/* MACD Line */}
      <Path d={macdPath} stroke="#4ECDC4" strokeWidth={1.5} fill="none" />

      {/* Signal Line */}
      <Path d={signalPath} stroke="#FF6B6B" strokeWidth={1.5} fill="none" />

      {/* Labels */}
      <SvgText x={padding.left} y={padding.top + 12} fill={Colors.textMuted} fontSize={9}>
        MACD: <SvgText fill="#4ECDC4">{macdLine[macdLine.length - 1]?.toFixed(2) || '--'}</SvgText>
        {' '}Signal: <SvgText fill="#FF6B6B">{signalLine[signalLine.length - 1]?.toFixed(2) || '--'}</SvgText>
      </SvgText>
    </Svg>
  );
}

// ============================================
// WALLET CONNECT MODAL
// ============================================
function WalletConnectModal({ visible, onClose, onConnect, connecting, language = 'tr', t }) {
  const walletOptions = [
    {
      id: 'metamask',
      name: 'MetaMask',
      icon: '🦊',
      description: language === 'tr' ? 'En popüler cüzdan' : 'Most popular wallet',
      category: 'hot',
      color: '#f6851b',
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      icon: '🔗',
      description: language === 'tr' ? '100+ cüzdan desteği' : '100+ wallets supported',
      category: 'hot',
      color: '#3b99fc',
    },
    {
      id: 'coinbase',
      name: 'Coinbase Wallet',
      icon: '🔵',
      description: language === 'tr' ? 'Coinbase kullanıcıları için' : 'For Coinbase users',
      category: 'hot',
      color: '#0052ff',
    },
    {
      id: 'trust',
      name: 'Trust Wallet',
      icon: '🛡️',
      description: language === 'tr' ? 'Mobil cüzdan' : 'Mobile wallet',
      category: 'hot',
      color: '#3375bb',
    },
    {
      id: 'rainbow',
      name: 'Rainbow',
      icon: '🌈',
      description: language === 'tr' ? 'Güzel ve basit' : 'Beautiful and simple',
      category: 'hot',
      color: '#001e59',
    },
  ];

  const [selectedWallet, setSelectedWallet] = useState(null);

  const handleConnect = (walletId) => {
    setSelectedWallet(walletId);
    onConnect(walletId);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={walletModalStyles.overlay}>
        <View style={walletModalStyles.container}>
          {/* Header */}
          <View style={walletModalStyles.header}>
            <Text style={walletModalStyles.title}>{t('connectWallet')}</Text>
            <TouchableOpacity onPress={onClose} style={walletModalStyles.closeBtn}>
              <Feather name="x" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
          
          {/* Info */}
          <View style={walletModalStyles.infoBox}>
            <Feather name="info" size={16} color={Colors.platinum} />
            <Text style={walletModalStyles.infoText}>{t('sepoliaInfo')}</Text>
          </View>

          {/* Wallet List */}
          <ScrollView style={walletModalStyles.walletList}>
            <Text style={walletModalStyles.sectionTitle}>🔥 {t('hotWallets')}</Text>
            
            {walletOptions.map((wallet) => (
              <TouchableOpacity
                key={wallet.id}
                style={[
                  walletModalStyles.walletItem,
                  connecting && selectedWallet === wallet.id && walletModalStyles.walletItemActive
                ]}
                onPress={() => handleConnect(wallet.id)}
                disabled={connecting}
              >
                <View style={[walletModalStyles.walletIcon, { backgroundColor: wallet.color + '20' }]}>
                  {connecting && selectedWallet === wallet.id ? (
                    <ActivityIndicator size="small" color={wallet.color} />
                  ) : (
                    <Text style={walletModalStyles.walletEmoji}>{wallet.icon}</Text>
                  )}
                </View>
                <View style={walletModalStyles.walletInfo}>
                  <Text style={walletModalStyles.walletName}>{wallet.name}</Text>
                  <Text style={walletModalStyles.walletDesc}>{wallet.description}</Text>
                </View>
                <Feather name="chevron-right" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Security Info */}
          <View style={walletModalStyles.securityBox}>
            <Feather name="shield" size={14} color={Colors.up} />
            <Text style={walletModalStyles.securityText}>{t('walletSecure')}</Text>
          </View>

          {/* Cancel */}
          <TouchableOpacity style={walletModalStyles.cancelBtn} onPress={onClose} disabled={connecting}>
            <Text style={walletModalStyles.cancelText}>{t('cancel')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const walletModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 12,
    backgroundColor: Colors.platinum + '15',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.platinum + '30',
  },
  infoText: {
    fontSize: 12,
    color: Colors.platinum,
    marginLeft: 8,
    flex: 1,
  },
  walletList: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 12,
  },
  walletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: Colors.background,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  walletItemActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  walletIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletEmoji: {
    fontSize: 24,
  },
  walletInfo: {
    flex: 1,
    marginLeft: 12,
  },
  walletName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  walletDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  securityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 10,
    backgroundColor: Colors.up + '10',
    borderRadius: 8,
  },
  securityText: {
    fontSize: 11,
    color: Colors.up,
    marginLeft: 6,
  },
  cancelBtn: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 12,
  },
  cancelText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
});

// ============================================
// PROFESYonel GRAFİK SAYFASI
// ============================================
function ChartScreen({ metal, currentPrice, onClose, prices }) {
  const [activeTab, setActiveTab] = useState('price');
  const [period, setPeriod] = useState('1h');
  const [selectedIndicator, setSelectedIndicator] = useState('VOL');
  const [showMA, setShowMA] = useState(false);
  const [showEMA, setShowEMA] = useState(false);
  const [showBOLL, setShowBOLL] = useState(false);
  const [candleData, setCandleData] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [tradeMode, setTradeMode] = useState(null);
  const [tradeAmount, setTradeAmount] = useState("");
  const [tradeLoading, setTradeLoading] = useState(false);
  const [orderType, setOrderType] = useState("limit");
  const [isChartLive, setIsChartLive] = useState(false);
  
  // Grafik verisini çek
  useEffect(() => {
    let mounted = true;
    let isFirstLoad = candleData.length === 0;
    
    async function loadChartData() {
      // Sadece ilk yüklemede loading göster
      if (isFirstLoad) {
        setChartLoading(true);
      }
      
      const result = await fetchChartData(metal, period);
      
      if (mounted) {
        if (result && result.data && result.data.length > 0) {
          setCandleData(result.data);
          setIsChartLive(true);
        } else if (isFirstLoad) {
          // Fallback: Mock veri (sadece ilk yüklemede)
          setCandleData(generateCandleData(currentPrice || 100, 50));
          setIsChartLive(false);
        }
        setChartLoading(false);
        isFirstLoad = false;
      }
    }
    
    loadChartData();
    
    // Her 60 saniyede bir güncelle
    const interval = setInterval(loadChartData, 60000);
    
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [metal, period]);
  
  if (!metal) return null;

  const metalInfo = METALS[metal];
  
  // Teknik göstergeleri hesapla
  const ma20 = candleData.length > 0 ? calculateMA(candleData, 20) : [];
  const ema20 = candleData.length > 0 ? calculateEMA(candleData, 20) : [];
  const boll = candleData.length > 0 ? calculateBOLL(candleData, 20, 2) : { upper: [], middle: [], lower: [] };
  const macd = candleData.length > 0 ? calculateMACD(candleData) : { macdLine: [], signalLine: [], histogram: [] };
  const rsi = candleData.length > 0 ? calculateRSI(candleData) : [];
  
  const lastCandle = candleData[candleData.length - 1] || { open: 0, high: 0, low: 0, close: currentPrice || 0, volume: 0 };
  const firstCandle = candleData[0] || { open: currentPrice || 0 };
  const change = firstCandle.open > 0 ? ((lastCandle.close - firstCandle.open) / firstCandle.open) * 100 : 0;
  const isUp = change >= 0;

  const high24h = candleData.length > 0 ? Math.max(...candleData.map(d => d.high)) : 0;
  const low24h = candleData.length > 0 ? Math.min(...candleData.map(d => d.low)) : 0;
  const volume24h = candleData.reduce((sum, d) => sum + d.volume, 0);

  const tabs = [
    { key: 'price', label: 'Fiyat' },
    { key: 'info', label: 'Bilgiler' },
    { key: 'data', label: 'İşlem Verileri' },
    { key: 'allocate', label: 'Tahsis Et' },
  ];

  const periods = [
    { key: '15m', label: '15d' },
    { key: '1h', label: '1s' },
    { key: '4h', label: '4s' },
    { key: '1d', label: '1G' },
    { key: '1w', label: '1H' },
  ];

  const indicators = [
    { key: 'MA', label: 'MA' },
    { key: 'EMA', label: 'EMA' },
    { key: 'BOLL', label: 'BOLL' },
    { key: 'AVL', label: 'AVL' },
    { key: 'VOL', label: 'VOL' },
    { key: 'MACD', label: 'MACD' },
    { key: 'RSI', label: 'RSI' },
  ];

  const chartWidth = SCREEN_WIDTH - 16;

  const renderPriceTab = () => (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      {/* Periyot seçimi - sıklaştırılmış */}
      <View style={styles.tradePeriodRow}>
        {periods.map(p => (
          <TouchableOpacity
            key={p.key}
            style={[styles.tradePeriodBtn, period === p.key && styles.tradePeriodBtnActive]}
            onPress={() => setPeriod(p.key)}
          >
            <Text style={[styles.tradePeriodText, period === p.key && styles.tradePeriodTextActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
        
        {/* Canlı/Demo göstergesi */}
        <View style={[styles.chartLiveIndicator, !isChartLive && styles.chartDemoIndicator]}>
          <View style={[styles.chartLiveDot, !isChartLive && styles.chartDemoDot]} />
          <Text style={[styles.chartLiveText, !isChartLive && styles.chartDemoText]}>
            {isChartLive ? 'Canlı' : 'Demo'}
          </Text>
        </View>
      </View>

      {/* Chart */}
      <View style={styles.tradeChartSection}>
        {chartLoading && candleData.length === 0 ? (
          <View style={styles.chartLoadingContainer}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.chartLoadingText}>Grafik yükleniyor...</Text>
          </View>
        ) : (
          <CandlestickChart 
            data={candleData} 
            width={chartWidth} 
            height={220} 
            color={metalInfo.color}
            ma={ma20}
            ema={ema20}
            boll={boll}
            showMA={showMA}
            showEMA={showEMA}
            showBOLL={showBOLL}
          />
        )}
      </View>

      {/* Alt Gösterge Seçimi - tek satırda */}
      <View style={styles.indicatorSelectorRow}>
        {indicators.map(ind => {
          const isOverlayActive = (ind.key === 'MA' && showMA) || 
                                  (ind.key === 'EMA' && showEMA) || 
                                  (ind.key === 'BOLL' && showBOLL);
          const overlayColor = ind.key === 'MA' ? '#FF6B6B' : 
                               ind.key === 'EMA' ? '#4ECDC4' : 
                               ind.key === 'BOLL' ? Colors.gold : null;
          
          return (
            <TouchableOpacity
              key={ind.key}
              style={[
                styles.indicatorBtnCompact, 
                selectedIndicator === ind.key && styles.indicatorBtnCompactActive,
                isOverlayActive && { backgroundColor: overlayColor + '25', borderColor: overlayColor, borderWidth: 1 }
              ]}
              onPress={() => {
                setSelectedIndicator(ind.key);
                // Overlay göstergelerini toggle et
                if (ind.key === 'MA') setShowMA(!showMA);
                if (ind.key === 'EMA') setShowEMA(!showEMA);
                if (ind.key === 'BOLL') setShowBOLL(!showBOLL);
              }}
            >
              <Text style={[
                styles.indicatorBtnTextCompact, 
                selectedIndicator === ind.key && styles.indicatorBtnTextCompactActive,
                isOverlayActive && { color: overlayColor },
              ]}>
                {ind.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Seçilen Gösterge */}
      <View style={styles.tradeIndicatorSection}>
        {selectedIndicator === 'VOL' && (
          <>
            <Text style={styles.tradeIndicatorLabel}>Hacim (VOL)</Text>
            <VolumeChart data={candleData} width={chartWidth} height={60} />
          </>
        )}
        {selectedIndicator === 'RSI' && (
          <>
            <Text style={styles.tradeIndicatorLabel}>RSI (14)</Text>
            <RSIChart data={candleData} width={chartWidth} height={80} />
          </>
        )}
        {selectedIndicator === 'MACD' && (
          <>
            <Text style={styles.tradeIndicatorLabel}>MACD (12,26,9)</Text>
            <MACDChart data={candleData} macd={macd} width={chartWidth} height={100} />
          </>
        )}
        {selectedIndicator === 'MA' && (
          <View style={styles.indicatorStatusBox}>
            <View style={[styles.indicatorStatusDot, { backgroundColor: '#FF6B6B' }]} />
            <Text style={styles.indicatorStatusText}>
              MA (20) {showMA ? 'aktif - grafikte kırmızı çizgi' : 'kapalı - açmak için tekrar tıklayın'}
            </Text>
          </View>
        )}
        {selectedIndicator === 'EMA' && (
          <View style={styles.indicatorStatusBox}>
            <View style={[styles.indicatorStatusDot, { backgroundColor: '#4ECDC4' }]} />
            <Text style={styles.indicatorStatusText}>
              EMA (20) {showEMA ? 'aktif - grafikte turkuaz çizgi' : 'kapalı - açmak için tekrar tıklayın'}
            </Text>
          </View>
        )}
        {selectedIndicator === 'BOLL' && (
          <View style={styles.indicatorStatusBox}>
            <View style={[styles.indicatorStatusDot, { backgroundColor: Colors.gold }]} />
            <Text style={styles.indicatorStatusText}>
              Bollinger Bands {showBOLL ? 'aktif - grafikte sarı bantlar' : 'kapalı - açmak için tekrar tıklayın'}
            </Text>
          </View>
        )}
        {selectedIndicator === 'AVL' && (
          <View style={styles.indicatorStatusBox}>
            <View style={[styles.indicatorStatusDot, { backgroundColor: Colors.primary }]} />
            <Text style={styles.indicatorStatusText}>
              Ortalama Hacim Çizgisi - VOL grafiğinde gösterilir
            </Text>
          </View>
        )}
      </View>

      {/* Günlük performans */}
      <View style={styles.tradePerfRow}>
        <View style={styles.tradePerfItem}>
          <Text style={styles.tradePerfLabel}>Bugün</Text>
          <Text style={[styles.tradePerfValue, { color: Colors.up }]}>+2.29%</Text>
        </View>
        <View style={styles.tradePerfItem}>
          <Text style={styles.tradePerfLabel}>7 Gün</Text>
          <Text style={[styles.tradePerfValue, { color: Colors.up }]}>+12.51%</Text>
        </View>
        <View style={styles.tradePerfItem}>
          <Text style={styles.tradePerfLabel}>30 Gün</Text>
          <Text style={[styles.tradePerfValue, { color: Colors.up }]}>+9.38%</Text>
        </View>
        <View style={styles.tradePerfItem}>
          <Text style={styles.tradePerfLabel}>90 Gün</Text>
          <Text style={styles.tradePerfValue}>--</Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderInfoTab = () => (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>Hakkında</Text>
        <Text style={styles.infoCardText}>
          {metalInfo.nameTr} ({metal}), Auxite platformunda işlem gören tokenize edilmiş kıymetli metal varlığıdır. 
          Her token, fiziksel {metalInfo.nameTr.toLowerCase()} ile 1:1 oranında desteklenmektedir.
        </Text>
      </View>
      
      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>Token Bilgileri</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Ağ</Text>
          <Text style={styles.infoValue}>Base Sepolia</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Kontrat</Text>
          <Text style={styles.infoValue}>0x1234...5678</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Ondalık</Text>
          <Text style={styles.infoValue}>18</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>Pazar Verileri</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Piyasa Değeri</Text>
          <Text style={styles.infoValue}>$45.2M</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Dolaşımdaki Arz</Text>
          <Text style={styles.infoValue}>523,456 {metal}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Toplam Arz</Text>
          <Text style={styles.infoValue}>1,000,000 {metal}</Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderDataTab = () => (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>24 Saatlik İstatistikler</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>En Yüksek</Text>
          <Text style={[styles.infoValue, { color: Colors.up }]}>${high24h.toFixed(2)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>En Düşük</Text>
          <Text style={[styles.infoValue, { color: Colors.down }]}>${low24h.toFixed(2)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Hacim ({metal})</Text>
          <Text style={styles.infoValue}>{(volume24h / 1000000).toFixed(2)}M</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Hacim (USDT)</Text>
          <Text style={styles.infoValue}>${(volume24h * lastCandle.close / 1000000).toFixed(2)}M</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>Son İşlemler</Text>
        {[...Array(5)].map((_, i) => (
          <View key={i} style={styles.tradeRow}>
            <Text style={[styles.tradePrice, { color: i % 2 === 0 ? Colors.up : Colors.down }]}>
              ${(lastCandle.close + (Math.random() - 0.5) * 2).toFixed(2)}
            </Text>
            <Text style={styles.tradeAmount}>{(Math.random() * 100).toFixed(2)}</Text>
            <Text style={styles.tradeTime}>{new Date().toLocaleTimeString('tr-TR')}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderAllocateTab = () => {
    const portfolioItem = PORTFOLIO.find(p => p.symbol === metal);
    const balance = portfolioItem?.balance || 0;
    
    return (
      <ScrollView style={{ flex: 1, padding: 16 }}>
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Mevcut Bakiye</Text>
          <Text style={styles.allocateBalance}>{balance.toLocaleString('tr-TR')}g</Text>
          <Text style={styles.allocateValue}>≈ ${(balance * lastCandle.close).toLocaleString('en-US', { maximumFractionDigits: 2 })}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Hızlı Tahsis</Text>
          <View style={styles.allocateButtons}>
            <TouchableOpacity style={styles.allocateBtn}>
              <Text style={styles.allocateBtnText}>25%</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.allocateBtn}>
              <Text style={styles.allocateBtnText}>50%</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.allocateBtn}>
              <Text style={styles.allocateBtnText}>75%</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.allocateBtn}>
              <Text style={styles.allocateBtnText}>100%</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      
      {/* Header */}
      <View style={styles.tradeHeader}>
        <TouchableOpacity onPress={onClose} style={styles.tradeBackBtn}>
          <Feather name="arrow-left" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.tradeHeaderCenter}>
          <MetalIcon symbol={metal} size={28} />
          <Text style={[styles.tradeHeaderSymbol, { color: metalInfo.color }]}>{metal}/USDT</Text>
        </View>
        <TouchableOpacity style={styles.tradeStarBtn}>
          <Feather name="star" size={18} color={Colors.gold} />
        </TouchableOpacity>
      </View>

      {/* Fiyat bilgisi */}
      <View style={styles.tradePriceRow}>
        <View style={styles.tradePriceLeft}>
          <Text style={[styles.tradeCurrentPrice, { color: isUp ? Colors.up : Colors.down }]}>
            ${lastCandle.close.toFixed(2)}
          </Text>
          <Text style={[styles.tradePriceChange, { color: isUp ? Colors.up : Colors.down }]}>
            {isUp ? '+' : ''}{change.toFixed(2)}%
          </Text>
        </View>
        <View style={styles.tradeStats}>
          <View style={styles.tradeStatItem}>
            <Text style={styles.tradeStatLabel}>24s Yüksek</Text>
            <Text style={styles.tradeStatValue}>${high24h.toFixed(2)}</Text>
          </View>
          <View style={styles.tradeStatItem}>
            <Text style={styles.tradeStatLabel}>24s Düşük</Text>
            <Text style={styles.tradeStatValue}>${low24h.toFixed(2)}</Text>
          </View>
          <View style={styles.tradeStatItem}>
            <Text style={styles.tradeStatLabel}>24s Hacim</Text>
            <Text style={styles.tradeStatValue}>{(volume24h / 1000000).toFixed(1)}M</Text>
          </View>
        </View>
      </View>

      {/* Tabs - Tahsis Et yeşil buton */}
      <View style={styles.tradeTabs}>
        {tabs.slice(0, 3).map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tradeTab, activeTab === tab.key && styles.tradeTabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tradeTabText, activeTab === tab.key && styles.tradeTabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.tradeTabAllocate, activeTab === 'allocate' && styles.tradeTabAllocateActive]}
          onPress={() => setActiveTab('allocate')}
        >
          <Text style={styles.tradeTabAllocateText}>Tahsis Et</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={{ flex: 1 }}>
        {activeTab === 'price' && renderPriceTab()}
        {activeTab === 'info' && renderInfoTab()}
        {activeTab === 'data' && renderDataTab()}
        {activeTab === 'allocate' && renderAllocateTab()}
      </View>

      {/* Bottom Buttons */}
      <View style={styles.tradeBottomBar}>
        <TouchableOpacity style={styles.tradeBuyBtn} onPress={() => setTradeMode("buy")}>
          <Text style={styles.tradeBtnText}>Al</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tradeSellBtn} onPress={() => setTradeMode("sell")}>
          <Text style={styles.tradeBtnText}>Sat</Text>
        </TouchableOpacity>
      </View>


      {/* Trade Modal - Binance Style */}
      <Modal visible={tradeMode !== null} transparent animationType="slide">
        <View style={styles.tradeModalOverlay}>
          <View style={styles.tradeModalContent}>
            {/* Header */}
            <View style={styles.tradeModalHeader}>
              <Text style={styles.tradeModalTitle}>{metal}/USDT</Text>
              <TouchableOpacity onPress={() => { setTradeMode(null); setTradeAmount(""); }}>
                <Feather name="x" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Buy/Sell Toggle */}
            <View style={styles.tradeToggleRow}>
              <TouchableOpacity
                style={[styles.tradeToggleBtn, tradeMode === "buy" && styles.tradeToggleBtnBuyActive]}
                onPress={() => setTradeMode("buy")}
              >
                <Text style={[styles.tradeToggleText, tradeMode === "buy" && styles.tradeToggleTextActive]}>Al</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tradeToggleBtn, tradeMode === "sell" && styles.tradeToggleBtnSellActive]}
                onPress={() => setTradeMode("sell")}
              >
                <Text style={[styles.tradeToggleText, tradeMode === "sell" && styles.tradeToggleTextActive]}>Sat</Text>
              </TouchableOpacity>
            </View>

            {/* Order Type */}
            <View style={styles.tradeOrderTypeRow}>
              <TouchableOpacity style={styles.tradeOrderTypeBtn} onPress={() => setOrderType("limit")}>
                <Text style={orderType === "limit" ? styles.tradeOrderTypeTextActive : styles.tradeOrderTypeText}>Limit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.tradeOrderTypeBtn} onPress={() => setOrderType("market")}>
                <Text style={orderType === "market" ? styles.tradeOrderTypeTextActive : styles.tradeOrderTypeText}>Market</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.tradeOrderTypeBtn} onPress={() => setOrderType("stop")}>
                <Text style={orderType === "stop" ? styles.tradeOrderTypeTextActive : styles.tradeOrderTypeText}>Stop</Text>
              </TouchableOpacity>
            </View>

            {/* Price Input - Only for Limit and Stop */}
            {orderType !== "market" && (
              <View style={styles.tradeInputGroup}>
                <Text style={styles.tradeInputLabel}>Fiyat (USDT)</Text>
                <View style={styles.tradeInputRow}>
                  <TouchableOpacity style={styles.tradeInputBtn}><Text style={styles.tradeInputBtnText}>-</Text></TouchableOpacity>
                  <TextInput style={styles.tradeInputField} value={String(prices?.prices?.[metal]?.toFixed(2) || 0)} keyboardType="numeric" placeholderTextColor={Colors.textMuted} />
                  <TouchableOpacity style={styles.tradeInputBtn}><Text style={styles.tradeInputBtnText}>+</Text></TouchableOpacity>
                </View>
              </View>
            )}

            {/* Market Price Info */}
            {orderType === "market" && (
              <View style={styles.tradeInputGroup}>
                <Text style={styles.tradeInputLabel}>Piyasa Fiyatı</Text>
                <View style={[styles.tradeInputRow, {justifyContent: "center", paddingVertical: 12}]}>
                  <Text style={{color: Colors.primary, fontSize: 18, fontWeight: "700"}}>${prices?.prices?.[metal]?.toFixed(2) || 0}</Text>
                </View>
              </View>
            )}

            {/* Amount Input */}
            <View style={styles.tradeInputGroup}>
              <Text style={styles.tradeInputLabel}>Miktar (g)</Text>
              <View style={styles.tradeInputRow}>
                <TouchableOpacity style={styles.tradeInputBtn}><Text style={styles.tradeInputBtnText}>-</Text></TouchableOpacity>
                <TextInput style={styles.tradeInputField} value={tradeAmount} onChangeText={setTradeAmount} placeholder="0.00" keyboardType="numeric" placeholderTextColor={Colors.textMuted} />
                <TouchableOpacity style={styles.tradeInputBtn}><Text style={styles.tradeInputBtnText}>+</Text></TouchableOpacity>
              </View>
            </View>

            {/* Percent Buttons */}
            <View style={styles.tradePercentRow}>
              <TouchableOpacity style={styles.tradePercentBtn} onPress={() => setTradeAmount("25")}><Text style={styles.tradePercentText}>25%</Text></TouchableOpacity>
              <TouchableOpacity style={styles.tradePercentBtn} onPress={() => setTradeAmount("50")}><Text style={styles.tradePercentText}>50%</Text></TouchableOpacity>
              <TouchableOpacity style={styles.tradePercentBtn} onPress={() => setTradeAmount("75")}><Text style={styles.tradePercentText}>75%</Text></TouchableOpacity>
              <TouchableOpacity style={styles.tradePercentBtn} onPress={() => setTradeAmount("100")}><Text style={styles.tradePercentText}>100%</Text></TouchableOpacity>
            </View>

            {/* Total */}
            <View style={styles.tradeTotalRow}>
              <Text style={styles.tradeTotalLabel}>Toplam (USDT)</Text>
              <Text style={styles.tradeTotalValue}>${(parseFloat(tradeAmount || 0) * (prices?.prices?.[metal] || 0)).toFixed(2)}</Text>
            </View>

            {/* Available */}
            <View style={styles.tradeAvailableRow}>
              <Text style={styles.tradeAvailableLabel}>Kullanılabilir</Text>
              <Text style={styles.tradeAvailableValue}>1,000.00 USDT</Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.tradeSubmitBtn, {backgroundColor: tradeMode === "buy" ? Colors.up : Colors.down}]}
              onPress={() => { setTradeMode(null); setTradeAmount(""); Alert.alert("Başarılı", metal + " " + (tradeMode === "buy" ? "alım" : "satım") + " emri verildi"); }}
            >
              <Text style={styles.tradeSubmitText}>{tradeMode === "buy" ? "Al" : "Sat"} {metal}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ============================================
// METAL İKON KOMPONENTİ
// ============================================
function MetalIcon({ symbol, size = 44 }) {
  return (
    <Image 
      source={METAL_ICONS[symbol]} 
      style={{ width: size, height: size, borderRadius: size / 2 }}
      resizeMode="contain"
    />
  );
}

// ============================================
// CRYPTO CHART SCREEN (ETH, BTC, USDT, TRY)
// ============================================
function CryptoChartScreen({ crypto, currentPrice, priceChange, onClose, language = 'tr' }) {
  const [activeTab, setActiveTab] = useState('price');
  const [period, setPeriod] = useState('4h');
  const [selectedIndicator, setSelectedIndicator] = useState('VOL');
  const [showMA, setShowMA] = useState(true);
  const [tradeMode, setTradeMode] = useState(null); // 'buy' veya 'sell'
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradePrice, setTradePrice] = useState('');
  const [orderType, setOrderType] = useState('limit'); // limit, market, stop
  
  // Modal açıldığında fiyatı set et
  useEffect(() => {
    if (tradeMode && currentPrice) {
      setTradePrice(currentPrice.toFixed(2));
    }
  }, [tradeMode, currentPrice]);
  
  const cryptoInfo = OTHER_ASSETS[crypto];
  const cryptoColor = cryptoInfo?.color || Colors.primary;
  
  // Mock candle data for demo
  const [candleData] = useState(() => {
    const data = [];
    let price = currentPrice || 100;
    for (let i = 0; i < 50; i++) {
      const change = (Math.random() - 0.48) * price * 0.02;
      const open = price;
      const close = price + change;
      const high = Math.max(open, close) + Math.random() * price * 0.01;
      const low = Math.min(open, close) - Math.random() * price * 0.01;
      data.push({ open, high, low, close, volume: Math.random() * 1000000 });
      price = close;
    }
    return data;
  });

  const lastCandle = candleData[candleData.length - 1] || { close: currentPrice };
  const high24h = Math.max(...candleData.map(d => d.high));
  const low24h = Math.min(...candleData.map(d => d.low));
  const volume24h = candleData.reduce((sum, d) => sum + d.volume, 0);

  const isUp = priceChange >= 0;

  const tabs = [
    { key: 'price', label: language === 'tr' ? 'Fiyat' : 'Price' },
    { key: 'info', label: language === 'tr' ? 'Bilgiler' : 'Info' },
    { key: 'data', label: language === 'tr' ? 'İşlem Verileri' : 'Trade Data' },
  ];

  const periods = [
    { key: '15m', label: '15m' },
    { key: '1h', label: '1h' },
    { key: '4h', label: '4h' },
    { key: '1d', label: '1D' },
    { key: '1w', label: '1W' },
  ];

  const chartWidth = SCREEN_WIDTH - 16;

  const renderPriceTab = () => (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      {/* Periyot seçimi */}
      <View style={styles.tradePeriodRow}>
        {periods.map(p => (
          <TouchableOpacity
            key={p.key}
            style={[styles.tradePeriodBtn, period === p.key && styles.tradePeriodBtnActive]}
            onPress={() => setPeriod(p.key)}
          >
            <Text style={[styles.tradePeriodText, period === p.key && styles.tradePeriodTextActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
        
        <View style={styles.chartLiveIndicator}>
          <View style={styles.chartLiveDot} />
          <Text style={styles.chartLiveText}>LIVE</Text>
        </View>
      </View>

      {/* Chart */}
      <View style={styles.tradeChartSection}>
        <CandlestickChart 
          data={candleData} 
          width={chartWidth} 
          height={220} 
          color={cryptoColor}
          showMA={showMA}
        />
      </View>

      {/* Gösterge Seçimi */}
      <View style={styles.indicatorSelectorRow}>
        {['MA', 'EMA', 'BOLL', 'VOL', 'RSI'].map(ind => (
          <TouchableOpacity
            key={ind}
            style={[
              styles.indicatorBtnCompact, 
              selectedIndicator === ind && styles.indicatorBtnCompactActive
            ]}
            onPress={() => setSelectedIndicator(ind)}
          >
            <Text style={[
              styles.indicatorBtnTextCompact, 
              selectedIndicator === ind && styles.indicatorBtnTextCompactActive
            ]}>
              {ind}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Volume */}
      {selectedIndicator === 'VOL' && (
        <View style={styles.tradeIndicatorSection}>
          <Text style={styles.tradeIndicatorLabel}>
            {language === 'tr' ? 'Hacim (VOL)' : 'Volume (VOL)'}
          </Text>
          <VolumeChart data={candleData} width={chartWidth} height={60} />
        </View>
      )}

      {/* Performans */}
      <View style={styles.tradePerfRow}>
        <View style={styles.tradePerfItem}>
          <Text style={styles.tradePerfLabel}>{language === 'tr' ? 'Bugün' : 'Today'}</Text>
          <Text style={[styles.tradePerfValue, { color: isUp ? Colors.up : Colors.down }]}>
            {isUp ? '+' : ''}{priceChange?.toFixed(2) || '0.00'}%
          </Text>
        </View>
        <View style={styles.tradePerfItem}>
          <Text style={styles.tradePerfLabel}>7 {language === 'tr' ? 'Gün' : 'Day'}</Text>
          <Text style={[styles.tradePerfValue, { color: Colors.up }]}>+5.67%</Text>
        </View>
        <View style={styles.tradePerfItem}>
          <Text style={styles.tradePerfLabel}>30 {language === 'tr' ? 'Gün' : 'Day'}</Text>
          <Text style={[styles.tradePerfValue, { color: Colors.down }]}>-1.23%</Text>
        </View>
        <View style={styles.tradePerfItem}>
          <Text style={styles.tradePerfLabel}>90 {language === 'tr' ? 'Gün' : 'Day'}</Text>
          <Text style={[styles.tradePerfValue, { color: Colors.up }]}>+25.89%</Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderInfoTab = () => (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>{language === 'tr' ? 'Hakkında' : 'About'}</Text>
        <Text style={styles.infoCardText}>
          {crypto === 'BTC' && (language === 'tr' 
            ? 'Bitcoin (BTC), 2009 yılında Satoshi Nakamoto tarafından oluşturulan ilk ve en büyük kripto para birimidir. Merkezi olmayan dijital bir para birimi olarak tasarlanmıştır.'
            : 'Bitcoin (BTC) is the first and largest cryptocurrency, created in 2009 by Satoshi Nakamoto. It was designed as a decentralized digital currency.'
          )}
          {crypto === 'ETH' && (language === 'tr'
            ? 'Ethereum (ETH), akıllı sözleşmeler ve merkezi olmayan uygulamalar (dApps) için bir platformdur. 2015 yılında Vitalik Buterin tarafından kurulmuştur.'
            : 'Ethereum (ETH) is a platform for smart contracts and decentralized applications (dApps). It was founded by Vitalik Buterin in 2015.'
          )}
          {crypto === 'USDT' && (language === 'tr'
            ? 'Tether (USDT), ABD dolarına 1:1 oranında sabitlenmiş bir stablecoin\'dir. Değer dalgalanmalarından korunmak için kullanılır.'
            : 'Tether (USDT) is a stablecoin pegged 1:1 to the US dollar. It is used to protect against value fluctuations.'
          )}
          {crypto === 'TRY' && (language === 'tr'
            ? 'Türk Lirası (TRY), Türkiye Cumhuriyeti\'nin resmi para birimidir. Auxite platformunda TRY/USD paritesi takip edilmektedir.'
            : 'Turkish Lira (TRY) is the official currency of the Republic of Turkey. TRY/USD parity is tracked on the Auxite platform.'
          )}
        </Text>
      </View>
      
      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>{language === 'tr' ? 'Pazar Verileri' : 'Market Data'}</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{language === 'tr' ? 'Piyasa Değeri' : 'Market Cap'}</Text>
          <Text style={styles.infoValue}>
            {crypto === 'BTC' ? '$1.85T' : crypto === 'ETH' ? '$420B' : crypto === 'USDT' ? '$119B' : '$-'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{language === 'tr' ? '24s Hacim' : '24h Volume'}</Text>
          <Text style={styles.infoValue}>
            {crypto === 'BTC' ? '$45.2B' : crypto === 'ETH' ? '$18.5B' : crypto === 'USDT' ? '$52B' : '$-'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{language === 'tr' ? 'Dolaşımdaki Arz' : 'Circulating Supply'}</Text>
          <Text style={styles.infoValue}>
            {crypto === 'BTC' ? '19.5M BTC' : crypto === 'ETH' ? '120M ETH' : crypto === 'USDT' ? '119B USDT' : '-'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderDataTab = () => (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>{language === 'tr' ? '24 Saatlik İstatistikler' : '24h Statistics'}</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{language === 'tr' ? 'En Yüksek' : 'High'}</Text>
          <Text style={[styles.infoValue, { color: Colors.up }]}>${high24h.toFixed(2)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{language === 'tr' ? 'En Düşük' : 'Low'}</Text>
          <Text style={[styles.infoValue, { color: Colors.down }]}>${low24h.toFixed(2)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{language === 'tr' ? 'Hacim' : 'Volume'}</Text>
          <Text style={styles.infoValue}>${(volume24h / 1000000).toFixed(2)}M</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>{language === 'tr' ? 'Son İşlemler' : 'Recent Trades'}</Text>
        {[...Array(5)].map((_, i) => (
          <View key={i} style={styles.tradeRow}>
            <Text style={[styles.tradePrice, { color: i % 2 === 0 ? Colors.up : Colors.down }]}>
              ${(currentPrice + (Math.random() - 0.5) * currentPrice * 0.01).toFixed(2)}
            </Text>
            <Text style={styles.tradeAmount}>{(Math.random() * 10).toFixed(4)}</Text>
            <Text style={styles.tradeTime}>{new Date().toLocaleTimeString()}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      
      {/* Header */}
      <View style={styles.tradeHeader}>
        <TouchableOpacity onPress={onClose} style={styles.tradeBackBtn}>
          <Feather name="arrow-left" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.tradeHeaderCenter}>
          <CryptoIcon symbol={crypto} size={28} />
          <Text style={[styles.tradeHeaderSymbol, { color: cryptoColor }]}>
            {crypto}/{crypto === 'TRY' ? 'USD' : 'USDT'}
          </Text>
        </View>
        <TouchableOpacity style={styles.tradeStarBtn}>
          <Feather name="star" size={18} color={Colors.gold} />
        </TouchableOpacity>
      </View>

      {/* Fiyat bilgisi */}
      <View style={styles.tradePriceRow}>
        <View>
          <Text style={[styles.tradeBigPrice, { color: cryptoColor }]}>
            ${currentPrice?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
          </Text>
          <Text style={styles.tradePriceUsd}>
            ≈ ₺{((currentPrice || 0) * 34.5).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
          </Text>
        </View>
        <View style={styles.tradePriceStats}>
          <View style={styles.tradeStat}>
            <Text style={styles.tradeStatLabel}>24h High</Text>
            <Text style={[styles.tradeStatValue, { color: Colors.up }]}>${high24h.toFixed(2)}</Text>
          </View>
          <View style={styles.tradeStat}>
            <Text style={styles.tradeStatLabel}>24h Low</Text>
            <Text style={[styles.tradeStatValue, { color: Colors.down }]}>${low24h.toFixed(2)}</Text>
          </View>
          <View style={styles.tradeStat}>
            <Text style={styles.tradeStatLabel}>24h Vol</Text>
            <Text style={styles.tradeStatValue}>${(volume24h / 1000000).toFixed(1)}M</Text>
          </View>
        </View>
      </View>

      {/* Değişim badge */}
      <View style={styles.tradeChangeBadge}>
        <View style={[styles.changeIndicator, { backgroundColor: isUp ? Colors.up + '20' : Colors.down + '20' }]}>
          <Feather name={isUp ? 'trending-up' : 'trending-down'} size={14} color={isUp ? Colors.up : Colors.down} />
          <Text style={[styles.changeText, { color: isUp ? Colors.up : Colors.down }]}>
            {isUp ? '+' : ''}{priceChange?.toFixed(2) || '0.00'}%
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tradeTabsRow}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tradeTab, activeTab === tab.key && styles.tradeTabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tradeTabText, activeTab === tab.key && styles.tradeTabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <View style={{ flex: 1 }}>
        {activeTab === 'price' && renderPriceTab()}
        {activeTab === 'info' && renderInfoTab()}
        {activeTab === 'data' && renderDataTab()}
      </View>

      {/* Bottom Buttons - Al/Sat */}
      <View style={styles.tradeBottomBar}>
        <TouchableOpacity style={styles.tradeBuyBtn} onPress={() => setTradeMode("buy")}>
          <Text style={styles.tradeBtnText}>{language === 'tr' ? 'Al' : 'Buy'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tradeSellBtn} onPress={() => setTradeMode("sell")}>
          <Text style={styles.tradeBtnText}>{language === 'tr' ? 'Sat' : 'Sell'}</Text>
        </TouchableOpacity>
      </View>

      {/* Trade Modal */}
      <Modal visible={tradeMode !== null} transparent animationType="slide">
        <View style={styles.tradeModalOverlay}>
          <View style={styles.tradeModalContent}>
            {/* Header */}
            <View style={styles.tradeModalHeader}>
              <Text style={styles.tradeModalTitle}>{crypto}/USDT</Text>
              <TouchableOpacity onPress={() => { setTradeMode(null); setTradeAmount(''); setTradePrice(''); }}>
                <Feather name="x" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Al / Sat Toggle */}
            <View style={styles.tradeToggleRow}>
              <TouchableOpacity 
                style={[styles.tradeToggleBtn, tradeMode === 'buy' && styles.tradeToggleBtnBuyActive]}
                onPress={() => setTradeMode('buy')}
              >
                <Text style={[styles.tradeToggleText, tradeMode === 'buy' && styles.tradeToggleTextActive]}>
                  {language === 'tr' ? 'Al' : 'Buy'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tradeToggleBtn, tradeMode === 'sell' && styles.tradeToggleBtnSellActive]}
                onPress={() => setTradeMode('sell')}
              >
                <Text style={[styles.tradeToggleText, tradeMode === 'sell' && styles.tradeToggleTextActive]}>
                  {language === 'tr' ? 'Sat' : 'Sell'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Order Type */}
            <View style={styles.tradeOrderTypeRow}>
              {['limit', 'market', 'stop'].map((type) => (
                <TouchableOpacity key={type} style={styles.tradeOrderTypeBtn} onPress={() => setOrderType(type)}>
                  <Text style={orderType === type ? styles.tradeOrderTypeTextActive : styles.tradeOrderTypeText}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
              {/* Fiyat Input */}
              <View style={styles.tradeInputGroup}>
                <Text style={styles.tradeInputLabel}>{language === 'tr' ? 'Fiyat (USDT)' : 'Price (USDT)'}</Text>
                <View style={styles.tradeInputRow}>
                  <TouchableOpacity 
                    style={styles.tradeInputBtn}
                    onPress={() => setTradePrice((prev) => (Math.max(0, parseFloat(prev || 0) - (currentPrice * 0.001))).toFixed(2))}
                  >
                    <Text style={styles.tradeInputBtnText}>−</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={styles.tradeInputField}
                    value={tradePrice}
                    onChangeText={setTradePrice}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor={Colors.textMuted}
                  />
                  <TouchableOpacity 
                    style={styles.tradeInputBtn}
                    onPress={() => setTradePrice((prev) => (parseFloat(prev || 0) + (currentPrice * 0.001)).toFixed(2))}
                  >
                    <Text style={styles.tradeInputBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Miktar Input */}
              <View style={styles.tradeInputGroup}>
                <Text style={styles.tradeInputLabel}>{language === 'tr' ? 'Miktar' : 'Amount'} ({crypto})</Text>
                <View style={styles.tradeInputRow}>
                  <TouchableOpacity 
                    style={styles.tradeInputBtn}
                    onPress={() => setTradeAmount((prev) => (Math.max(0, parseFloat(prev || 0) - 0.001)).toFixed(6))}
                  >
                    <Text style={styles.tradeInputBtnText}>−</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={styles.tradeInputField}
                    value={tradeAmount}
                    onChangeText={setTradeAmount}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor={Colors.textMuted}
                  />
                  <TouchableOpacity 
                    style={styles.tradeInputBtn}
                    onPress={() => setTradeAmount((prev) => (parseFloat(prev || 0) + 0.001).toFixed(6))}
                  >
                    <Text style={styles.tradeInputBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Yüzde Butonları */}
              <View style={styles.tradePercentRow}>
                {['25%', '50%', '75%', '100%'].map((pct) => (
                  <TouchableOpacity 
                    key={pct} 
                    style={styles.tradePercentBtn}
                    onPress={() => {
                      const mockBalance = tradeMode === 'buy' ? 1000 : 0.1;
                      const percent = parseInt(pct) / 100;
                      const price = parseFloat(tradePrice) || currentPrice;
                      if (tradeMode === 'buy') {
                        setTradeAmount(((mockBalance * percent) / price).toFixed(6));
                      } else {
                        setTradeAmount((mockBalance * percent).toFixed(6));
                      }
                    }}
                  >
                    <Text style={styles.tradePercentText}>{pct}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Toplam */}
              <View style={styles.tradeTotalRow}>
                <Text style={styles.tradeTotalLabel}>{language === 'tr' ? 'Toplam (USDT)' : 'Total (USDT)'}</Text>
                <Text style={styles.tradeTotalValue}>
                  ${((parseFloat(tradeAmount) || 0) * (parseFloat(tradePrice) || currentPrice)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>

              {/* Kullanılabilir Bakiye */}
              <View style={styles.tradeAvailableRow}>
                <Text style={styles.tradeAvailableLabel}>{language === 'tr' ? 'Kullanılabilir' : 'Available'}</Text>
                <Text style={styles.tradeAvailableValue}>
                  {tradeMode === 'buy' ? '1,000.00 USDT' : `0.10 ${crypto}`}
                </Text>
              </View>
            </ScrollView>

            {/* İşlem Butonu */}
            <TouchableOpacity 
              style={[styles.tradeSubmitBtn, { backgroundColor: tradeMode === 'buy' ? Colors.up : Colors.down }]}
              onPress={() => {
                if (!tradeAmount || parseFloat(tradeAmount) <= 0) {
                  Alert.alert(language === 'tr' ? 'Hata' : 'Error', language === 'tr' ? 'Lütfen geçerli bir miktar girin' : 'Please enter a valid amount');
                  return;
                }
                Alert.alert(
                  language === 'tr' ? 'İşlem Onayı' : 'Confirm Transaction',
                  `${tradeAmount} ${crypto} @ $${tradePrice}\n${language === 'tr' ? 'Toplam' : 'Total'}: $${((parseFloat(tradeAmount) || 0) * (parseFloat(tradePrice) || currentPrice)).toFixed(2)} USDT`,
                  [
                    { text: language === 'tr' ? 'İptal' : 'Cancel', style: 'cancel' },
                    { 
                      text: language === 'tr' ? 'Onayla' : 'Confirm', 
                      onPress: () => {
                        Alert.alert(language === 'tr' ? 'Başarılı' : 'Success', language === 'tr' ? 'İşlem tamamlandı!' : 'Transaction complete!');
                        setTradeMode(null);
                        setTradeAmount('');
                        setTradePrice('');
                      }
                    }
                  ]
                );
              }}
            >
              <Text style={styles.tradeSubmitText}>
                {tradeMode === 'buy' ? (language === 'tr' ? 'Al' : 'Buy') : (language === 'tr' ? 'Sat' : 'Sell')} {crypto}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ============================================
// KRİPTO İKON KOMPONENTİ
// ============================================
function CryptoIcon({ symbol, size = 32 }) {
  const halfSize = size / 2;
  
  if (symbol === 'BTC') {
    // Bitcoin icon - orange with ₿ symbol
    return (
      <Svg width={size} height={size} viewBox="0 0 32 32">
        <Circle cx="16" cy="16" r="15" fill="#f7931a" />
        <Path 
          d="M21.5 14.2c.3-2-1.2-3-3.3-3.8l.7-2.7-1.6-.4-.7 2.6c-.4-.1-.8-.2-1.3-.3l.7-2.7-1.6-.4-.7 2.7c-.3-.1-.7-.2-1-.3l-2.2-.5-.4 1.7s1.2.3 1.2.3c.7.2.8.6.8 1l-.8 3.2c0 0 .1 0 .2.1h-.2l-1.1 4.5c-.1.2-.3.5-.8.4 0 0-1.2-.3-1.2-.3l-.8 1.8 2.1.5c.4.1.8.2 1.2.3l-.7 2.8 1.6.4.7-2.7c.4.1.9.2 1.3.3l-.7 2.7 1.6.4.7-2.8c2.9.5 5.1.3 6-2.3.7-2.1 0-3.3-1.5-4.1 1.1-.3 1.9-1 2.1-2.4zm-3.8 5.3c-.5 2.1-4.1 1-5.2.7l.9-3.7c1.2.3 4.9.9 4.3 3zm.5-5.4c-.5 1.9-3.4.9-4.4.7l.8-3.4c1 .3 4.1.7 3.6 2.7z" 
          fill="white"
        />
      </Svg>
    );
  }
  
  if (symbol === 'ETH') {
    // Ethereum icon - purple/blue with diamond
    return (
      <Svg width={size} height={size} viewBox="0 0 32 32">
        <Circle cx="16" cy="16" r="15" fill="#627eea" />
        <Path d="M16 5l-7 11.5 7 4.2 7-4.2L16 5z" fill="white" opacity="0.6" />
        <Path d="M16 5v10.5l7 4.2L16 5z" fill="white" opacity="0.8" />
        <Path d="M16 21.5l-7-4.2 7 9.7 7-9.7-7 4.2z" fill="white" opacity="0.6" />
        <Path d="M16 21.5v5.5l7-9.7-7 4.2z" fill="white" opacity="0.8" />
      </Svg>
    );
  }
  
  if (symbol === 'USDT') {
    // Tether icon - green with T
    return (
      <Svg width={size} height={size} viewBox="0 0 32 32">
        <Circle cx="16" cy="16" r="15" fill="#26a17b" />
        <Path 
          d="M17.5 17.3v-.1c-.1 0-.5 0-1.5 0s-1.3 0-1.5 0v.1c-2.7.1-4.7.6-4.7 1.1 0 .6 2.1 1.1 4.7 1.2v3.8h3v-3.8c2.6-.1 4.7-.6 4.7-1.2 0-.5-2-1-4.7-1.1zm-1.5.8c-3 0-5.2-.4-5.2-.9s2.2-.9 5.2-.9 5.2.4 5.2.9-2.3.9-5.2.9z" 
          fill="white"
        />
        <Path d="M18.5 14.6v-2.2h4v-3h-13v3h4v2.2c-3.1.2-5.4.8-5.4 1.6 0 .9 2.5 1.5 5.5 1.7v6h3.8v-6c3-.2 5.4-.8 5.4-1.7.1-.8-2.3-1.4-5.3-1.6zm-2.5 2.6c-3.8 0-6.8-.6-6.8-1.3 0-.7 3-1.3 6.8-1.3s6.8.6 6.8 1.3c0 .7-3 1.3-6.8 1.3z" fill="white"/>
      </Svg>
    );
  }
  
  if (symbol === 'TRY') {
    // Turkish Lira icon - red with ₺
    return (
      <Svg width={size} height={size} viewBox="0 0 32 32">
        <Circle cx="16" cy="16" r="15" fill="#e30a17" />
        <Path 
          d="M12 9h3v2.5l5-1.5v2.5l-5 1.5v1.5l5-1.5v2.5l-5 1.5v5h-3v-5l-2 .6v-2.5l2-.6v-1.5l-2 .6v-2.5l2-.6V9z" 
          fill="white"
        />
      </Svg>
    );
  }
  
  // Fallback - letter icon
  const colors = {
    BTC: '#f7931a',
    ETH: '#627eea',
    USDT: '#26a17b',
    TRY: '#e30a17'
  };
  
  return (
    <View style={{ 
      width: size, 
      height: size, 
      borderRadius: size / 2, 
      backgroundColor: colors[symbol] || Colors.primary + '30',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <Text style={{ color: 'white', fontSize: size * 0.45, fontWeight: 'bold' }}>
        {symbol.charAt(0)}
      </Text>
    </View>
  );
}

// ============================================
// HABER SERVİSİ - ÇİFT DİLLİ
// ============================================

// Haber kategorisi belirleme
function categorizeNews(title, description) {
  const text = (title + ' ' + description).toLowerCase();
  
  if (text.includes('gold') || text.includes('altın') || text.includes('xau') || text.includes('ons')) {
    return { category: 'gold', icon: 'trending-up', color: Colors.gold };
  }
  if (text.includes('silver') || text.includes('gümüş') || text.includes('xag')) {
    return { category: 'silver', icon: 'disc', color: Colors.silver };
  }
  if (text.includes('platinum') || text.includes('platin')) {
    return { category: 'platinum', icon: 'award', color: Colors.platinum };
  }
  if (text.includes('palladium') || text.includes('paladyum')) {
    return { category: 'palladium', icon: 'hexagon', color: Colors.palladium };
  }
  
  return { category: 'general', icon: 'globe', color: Colors.primary };
}

// Zaman formatlama - dile göre
function formatTimeAgo(dateString, language = 'tr') {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (language === 'tr') {
    if (diffMins < 60) return `${diffMins} dk önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    return `${diffDays} gün önce`;
  } else {
    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  }
}

// Türkçe haberler (BigPara benzeri güncel haberler)
function getTurkishNews() {
  const now = new Date();
  return [
    {
      id: '1',
      title: 'Altın Fiyatları Güne Yükselişle Başladı',
      description: 'Ons altın, küresel piyasalardaki belirsizlikler nedeniyle güvenli liman talebinin artmasıyla değer kazandı...',
      source: 'BigPara',
      timeAgo: formatTimeAgo(new Date(now - 2 * 3600000), 'tr'),
      category: 'gold',
      icon: 'trending-up',
      color: Colors.gold,
      link: 'https://bigpara.hurriyet.com.tr'
    },
    {
      id: '2', 
      title: 'Gümüş Piyasasında Hareketlilik Sürüyor',
      description: 'Endüstriyel talep beklentileri ve yatırımcı ilgisi gümüş fiyatlarını desteklemeye devam ediyor...',
      source: 'BloombergHT',
      timeAgo: formatTimeAgo(new Date(now - 4 * 3600000), 'tr'),
      category: 'silver',
      icon: 'disc',
      color: Colors.silver,
      link: 'https://www.bloomberght.com'
    },
    {
      id: '3',
      title: 'Platin ve Paladyum Fiyatlarında Toparlanma',
      description: 'Otomotiv sektöründeki talep artışı platin grubu metallerin fiyatlarını yukarı taşıdı...',
      source: 'Dünya',
      timeAgo: formatTimeAgo(new Date(now - 6 * 3600000), 'tr'),
      category: 'platinum',
      icon: 'award',
      color: Colors.platinum,
      link: 'https://www.dunya.com'
    },
    {
      id: '4',
      title: 'Değerli Metaller Haftalık Görünüm',
      description: 'Analistler önümüzdeki hafta altın, gümüş ve platin piyasalarını etkileyecek faktörleri değerlendirdi...',
      source: 'Para Analiz',
      timeAgo: formatTimeAgo(new Date(now - 8 * 3600000), 'tr'),
      category: 'general',
      icon: 'globe',
      color: Colors.primary,
      link: 'https://www.paraanaliz.com'
    },
    {
      id: '5',
      title: 'Merkez Bankası Altın Rezervlerini Artırdı',
      description: 'TCMB, altın rezervlerini artırmaya devam ediyor. Son verilere göre toplam rezerv yeni zirveye ulaştı...',
      source: 'Ekonomist',
      timeAgo: formatTimeAgo(new Date(now - 12 * 3600000), 'tr'),
      category: 'gold',
      icon: 'trending-up',
      color: Colors.gold,
      link: 'https://www.ekonomist.com.tr'
    },
  ];
}

// İngilizce haberler
function getEnglishNews() {
  const now = new Date();
  return [
    {
      id: '1',
      title: 'Gold Prices Rally on Safe-Haven Demand',
      description: 'Gold futures climbed higher as investors sought safety amid global economic uncertainties...',
      source: 'Kitco',
      timeAgo: formatTimeAgo(new Date(now - 2 * 3600000), 'en'),
      category: 'gold',
      icon: 'trending-up',
      color: Colors.gold,
      link: 'https://www.kitco.com'
    },
    {
      id: '2', 
      title: 'Silver Outperforms Gold in Latest Trading',
      description: 'Silver prices gained momentum as industrial demand expectations improved significantly...',
      source: 'Reuters',
      timeAgo: formatTimeAgo(new Date(now - 4 * 3600000), 'en'),
      category: 'silver',
      icon: 'disc',
      color: Colors.silver,
      link: 'https://www.reuters.com'
    },
    {
      id: '3',
      title: 'Platinum Group Metals See Increased Interest',
      description: 'Platinum and palladium prices showed strength as automotive sector demand recovers...',
      source: 'Bloomberg',
      timeAgo: formatTimeAgo(new Date(now - 6 * 3600000), 'en'),
      category: 'platinum',
      icon: 'award',
      color: Colors.platinum,
      link: 'https://www.bloomberg.com'
    },
    {
      id: '4',
      title: 'Precious Metals Weekly Outlook',
      description: 'Analysts discuss key factors that could drive gold, silver, platinum and palladium...',
      source: 'Investing.com',
      timeAgo: formatTimeAgo(new Date(now - 8 * 3600000), 'en'),
      category: 'general',
      icon: 'globe',
      color: Colors.primary,
      link: 'https://www.investing.com'
    },
    {
      id: '5',
      title: 'Central Banks Continue Gold Buying Spree',
      description: 'Global central banks added significant gold reserves in the latest quarter according to WGC data...',
      source: 'FT',
      timeAgo: formatTimeAgo(new Date(now - 12 * 3600000), 'en'),
      category: 'gold',
      icon: 'trending-up',
      color: Colors.gold,
      link: 'https://www.ft.com'
    },
  ];
}

// Canlı haberleri çek
// Canlı haberleri çek
async function fetchLiveNews(language = "tr") {
  console.log("Fetching live news...");
  try {
    // Vercel API kullan
    
    const url = "https://auxite-wallet.vercel.app/api/news?lang=" + language;
    const response = await fetch(url);
    const data = await response.json();
    if (data.articles && data.articles.length > 0) {
      console.log("Got " + data.articles.length + " articles");
      return data.articles.map((item, index) => ({
        id: String(index),
        title: item.title,
        description: item.description || item.title,
        source: item.source || "News",
        timeAgo: formatTimeAgo(new Date(item.publishedAt), language),
        category: "general",
        icon: "trending-up",
        color: Colors.primary,
        link: item.url || "",
      }));
    }
    return null;
  } catch (error) {
    console.log("News fetch error:", error);
    return null;
  }
}
// Haberleri dile göre getir
function getNews(language = 'tr') {
  if (language === 'tr') {
    return getTurkishNews();
  }
  return getEnglishNews();
}

// ============================================
// API FONKSİYONLARI
// ============================================
function createMockData() {
  const prices = {};
  const bidPrices = {};
  const basePrices = {};
  const changes = {};
  const directions = {};
  
  for (let i = 0; i < METAL_ORDER.length; i++) {
    const symbol = METAL_ORDER[i];
    const mock = MOCK_PRICES[symbol];
    const variation = 1 + (Math.random() - 0.5) * 0.01;
    
    basePrices[symbol] = Math.round(mock.base * variation * 100) / 100;
    prices[symbol] = Math.round(mock.ask * variation * 100) / 100;
    bidPrices[symbol] = Math.round(mock.bid * variation * 100) / 100;
    
    const changeVal = (Math.random() - 0.5) * 0.5;
    changes[symbol] = Math.round(changeVal * 100) / 100;
    directions[symbol] = changeVal > 0.05 ? 'up' : changeVal < -0.05 ? 'down' : 'neutral';
  }
  
  return { prices, bidPrices, basePrices, changes, directions, isLive: false };
}

// Crypto fiyatlarını çek
async function fetchCryptoPrices() {
  try {
    const response = await fetch(CRYPTO_API, {
      method: "GET",
      headers: { "Accept": "application/json" },
    });
    if (!response.ok) return null;
    const data = await response.json();
    return {
      BTC: { price: data.bitcoin?.usd || 95000, change: data.bitcoin?.usd_24h_change || 0 },
      ETH: { price: data.ethereum?.usd || 3400, change: data.ethereum?.usd_24h_change || 0 },
      USDT: { price: 1.00, change: 0 },
      TRY: { price: data.tether?.try || 34.5, change: 0 },
    };
  } catch (error) {
    console.log("Crypto fetch error:", error);
    return null;
  }
}

async function fetchPrices() {
  try {
    const response = await fetch(AUXITE_API, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) return createMockData();

    const data = await response.json();
    
    if (data.prices && typeof data.prices === 'object') {
      return { 
        prices: data.prices, 
        bidPrices: data.bidPrices || data.prices, 
        basePrices: data.basePrices || data.prices, 
        changes: data.changes || { AUXG: 0, AUXS: 0, AUXPT: 0, AUXPD: 0 }, 
        directions: data.directions || { AUXG: 'neutral', AUXS: 'neutral', AUXPT: 'neutral', AUXPD: 'neutral' },
        isLive: true 
      };
    }
    
    return createMockData();
  } catch (error) {
    return createMockData();
  }
}

// ============================================
// YENİ ANA SAYFA (BINANCE TARZI)
// ============================================
function NewHomeScreen({ prices, isLive, onRefresh, refreshing, lastUpdated, onNavigateToSwap, onNavigateToAllocate, onNavigateToSend, language = 'tr', t, onToggleLanguage, cryptoPrices = {} }) {
  const [selectedMetal, setSelectedMetal] = useState(null);
  const [showChart, setShowChart] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [showAllAssets, setShowAllAssets] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [showCryptoChart, setShowCryptoChart] = useState(false);

  // Haberleri çek - başlangıçta ve her 5 dakikada bir
  useEffect(() => {
    loadNews();
    const interval = setInterval(loadNews, 5 * 60 * 1000); // 5 dakikada bir yenile
    return () => clearInterval(interval);
  }, [language]);

  async function loadNews() {
    console.log("Loading news...");
    setNewsLoading(true);
    const liveNews = await fetchLiveNews(language);
    const newsData = liveNews || getNews(language);
    setNews(newsData);
    setNewsLoading(false);
  }

  // Haber linkini aç
  function openNewsLink(url) {
    if (url) {
      Linking.openURL(url).catch(err => console.log('Link açılamadı:', err));
    }
  }

  let totalValue = 0;
  if (prices && prices.prices) {
    for (let i = 0; i < PORTFOLIO.length; i++) {
      const item = PORTFOLIO[i];
      const price = prices.prices[item.symbol] || 0;
      totalValue = totalValue + (item.balance * price);
    }
  }

  // Risk & Korelasyon State
  const [riskMetrics, setRiskMetrics] = useState({
    AUXG: { volatility: 0, avgReturn: 0, priceRange: 0 },
    AUXS: { volatility: 0, avgReturn: 0, priceRange: 0 },
    AUXPT: { volatility: 0, avgReturn: 0, priceRange: 0 },
    AUXPD: { volatility: 0, avgReturn: 0, priceRange: 0 },
  });
  const [metricsLoading, setMetricsLoading] = useState(true);

  // API'den Risk Metriklerini Çek (auxite-wallet ile senkron)
  useEffect(() => {
    const fetchWithTimeout = (url, timeout = 10000) => {
      return Promise.race([
        fetch(url),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), timeout)
        )
      ]);
    };

    const fetchRiskMetrics = async () => {
      const newMetrics = {};
      
      for (const [auxSymbol, goldSymbol] of Object.entries(SYMBOL_MAP)) {
        try {
          const res = await fetchWithTimeout(`${HISTORY_API}?metal=${goldSymbol}&days=7`, 10000);
          if (res.ok) {
            const data = await res.json();
            if (data.metrics) {
              newMetrics[auxSymbol] = data.metrics;
            }
          }
        } catch (err) {
          console.log(`Metrics fetch error for ${auxSymbol}:`, err.message || err);
        }
      }
      
      // Veri geldiyse güncelle, gelmediyse varsayılan değerler kullan
      if (Object.keys(newMetrics).length > 0) {
        setRiskMetrics(prev => ({ ...prev, ...newMetrics }));
      } else {
        // Varsayılan değerler - API çalışmadığında
        setRiskMetrics({
          AUXG: { volatility: 1.2, avgReturn: 0.5, priceRange: 2.1 },
          AUXS: { volatility: 1.8, avgReturn: 0.3, priceRange: 3.2 },
          AUXPT: { volatility: 2.1, avgReturn: -0.2, priceRange: 4.5 },
          AUXPD: { volatility: 2.5, avgReturn: 0.1, priceRange: 5.1 },
        });
      }
      setMetricsLoading(false);
    };

    fetchRiskMetrics();
    // Her 1 saatte bir yenile (auxite-wallet ile aynı)
    const interval = setInterval(fetchRiskMetrics, 3600000);
    return () => clearInterval(interval);
  }, []);

  // Risk Skoru Hesaplama - Gerçek Volatilite Verisi ile
  const calculateRiskScore = () => {
    const volatilities = Object.values(riskMetrics).map(m => m.volatility || 0);
    const avgVolatility = volatilities.reduce((a, b) => a + b, 0) / volatilities.length;
    
    // Volatilite bazlı risk skoru (0-100)
    // %1 volatilite = 25 risk, %2 = 50, %4+ = 100
    let score = Math.min(100, Math.round(avgVolatility * 25));
    
    // Negatif getiriler varsa risk artar
    const negativeReturns = Object.values(riskMetrics).filter(m => m.avgReturn < 0).length;
    if (negativeReturns >= 2) score += 10;
    if (negativeReturns >= 3) score += 10;
    
    score = Math.min(100, Math.max(0, score));
    
    let level = 'low';
    let levelText = language === 'tr' ? 'Düşük Risk' : 'Low Risk';
    if (score > 60) {
      level = 'high';
      levelText = language === 'tr' ? 'Yüksek Risk' : 'High Risk';
    } else if (score > 35) {
      level = 'medium';
      levelText = language === 'tr' ? 'Orta Risk' : 'Medium Risk';
    }
    
    return { score, level, levelText, avgVolatility };
  };

  // Korelasyon Hesaplama - auxite-wallet ile aynı değerler
  const calculateCorrelations = () => {
    // Sabit korelasyon değerleri (altın referans)
    const correlations = {
      'AUXG-AUXS': 0.85,
      'AUXG-AUXPT': 0.75,
      'AUXS-AUXPD': 0.65,
    };
    
    // Getiri yönüne göre trend belirleme
    const getTrend = (m1, m2) => {
      const r1 = riskMetrics[m1]?.avgReturn || 0;
      const r2 = riskMetrics[m2]?.avgReturn || 0;
      return (r1 + r2) >= 0 ? 'up' : 'down';
    };
    
    return [
      { pair: 'AUXG-AUXS', value: correlations['AUXG-AUXS'], trend: getTrend('AUXG', 'AUXS') },
      { pair: 'AUXG-AUXPT', value: correlations['AUXG-AUXPT'], trend: getTrend('AUXG', 'AUXPT') },
      { pair: 'AUXS-AUXPD', value: correlations['AUXS-AUXPD'], trend: getTrend('AUXS', 'AUXPD') },
    ];
  };

  const riskData = calculateRiskScore();
  const correlationData = calculateCorrelations();

  // Menü item'ları - dile göre
  const menuItems = [
    { icon: 'user', title: t('profileInfo'), subtitle: '0xD24B...E944' },
    { icon: 'shield', title: t('security'), subtitle: t('biometricActive') },
    { icon: 'bell', title: t('notifications'), subtitle: `3 ${t('newNotifications')}` },
    { icon: 'settings', title: t('settings'), subtitle: t('themeLanguageNetwork') },
    { icon: 'help-circle', title: t('help'), subtitle: t('faqSupport') },
  ];

  // Chart screen göster
  // Crypto Chart göster
  if (showCryptoChart && selectedCrypto) {
    const cryptoPrice = cryptoPrices[selectedCrypto]?.price || 0;
    const cryptoChange = cryptoPrices[selectedCrypto]?.change || 0;
    return (
      <CryptoChartScreen 
        crypto={selectedCrypto}
        currentPrice={cryptoPrice}
        priceChange={cryptoChange}
        onClose={() => { setShowCryptoChart(false); setSelectedCrypto(null); }}
        language={language}
      />
    );
  }

  if (showChart && selectedMetal) {
    const metalPrice = prices?.prices?.[selectedMetal] || 0;
    return (
      <ChartScreen 
        metal={selectedMetal} 
        currentPrice={metalPrice}
        onClose={() => { setShowChart(false); setSelectedMetal(null); }}
        prices={prices}
      />
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.menuBtn} onPress={() => setShowMenu(true)}>
            <Feather name="menu" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          
          <View style={styles.topBarCenter}>
            <MetalIcon symbol="AUXS" size={32} />
            <Text style={styles.topBarBrandText}>Auxite</Text>
          </View>
          
          <View style={styles.topBarRight}>
            {/* Dil Değiştirme Butonu */}
            <TouchableOpacity style={styles.langSwitchBtn} onPress={onToggleLanguage}>
              <Text style={styles.langSwitchText}>{language === 'tr' ? 'TR' : 'EN'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.topBarIconBtn}>
              <Feather name="bell" size={20} color={Colors.textPrimary} />
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>3</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.topBarIconBtn}>
              <Feather name="message-circle" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* PNL Banner */}
        <TouchableOpacity style={styles.pnlBanner}>
          <Text style={styles.pnlLabel}>{t('dailyPnL')}</Text>
          <Text style={[styles.pnlValue, { color: Colors.up }]}>+$1,234.56 (+0.61%)</Text>
          <Feather name="chevron-down" size={16} color={Colors.textMuted} />
        </TouchableOpacity>

        {/* Feature Cards Row */}
        <View style={styles.featureCardsRow}>
          {/* Risk Card */}
          <View style={styles.featureCard}>
            <View style={styles.featureCardHeader}>
              <Text style={styles.featureCardTitle}>{t('riskScore')}</Text>
              <View style={styles.liveIndicatorSmall}>
                <View style={styles.liveDotSmall} />
                <Text style={styles.liveTextSmall}>7{language === 'tr' ? 'g' : 'd'}</Text>
              </View>
            </View>
            {metricsLoading ? (
              <View style={styles.metricsLoadingContainer}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            ) : (
              <View style={styles.riskGaugeContainer}>
                <View style={styles.riskGauge}>
                  <View style={[
                    styles.riskGaugeFill, 
                    { 
                      width: `${riskData.score}%`,
                      backgroundColor: riskData.level === 'high' ? Colors.down : riskData.level === 'medium' ? Colors.warning : Colors.up
                    }
                  ]} />
                </View>
                <View style={styles.riskValueContainer}>
                  <Text style={[
                    styles.riskValue,
                    { color: riskData.level === 'high' ? Colors.down : riskData.level === 'medium' ? Colors.warning : Colors.up }
                  ]}>{riskData.score}</Text>
                  <Text style={styles.riskLabel}>{riskData.levelText}</Text>
                  <Text style={styles.riskVolatility}>Vol: {riskData.avgVolatility?.toFixed(2) || '0.00'}%</Text>
                </View>
              </View>
            )}
          </View>

          {/* Correlation Card */}
          <View style={styles.featureCard}>
            <View style={styles.featureCardHeader}>
              <Text style={styles.featureCardTitle}>{t('correlation')}</Text>
              <View style={styles.liveIndicatorSmall}>
                <View style={styles.liveDotSmall} />
                <Text style={styles.liveTextSmall}>7{language === 'tr' ? 'g' : 'd'}</Text>
              </View>
            </View>
            {metricsLoading ? (
              <View style={styles.metricsLoadingContainer}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            ) : (
              <View style={styles.correlationList}>
                {correlationData.map((item, index) => (
                  <View key={index} style={styles.correlationItem}>
                    <Text style={styles.correlationPair}>{item.pair}</Text>
                    <Text style={[styles.correlationValue, { color: item.trend === 'up' ? Colors.up : Colors.down }]}>
                      {item.value.toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity style={styles.quickActionBtn} onPress={onNavigateToSwap}>
            <View style={[styles.quickActionIcon, { backgroundColor: Colors.primary + '20' }]}>
              <Feather name="repeat" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.quickActionText}>{t('swap')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionBtn} onPress={onNavigateToAllocate}>
            <View style={[styles.quickActionIcon, { backgroundColor: Colors.gold + '20' }]}>
              <Feather name="pie-chart" size={18} color={Colors.gold} />
            </View>
            <Text style={styles.quickActionText}>{t('allocate')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionBtn} onPress={onNavigateToSend}>
            <View style={[styles.quickActionIcon, { backgroundColor: Colors.platinum + '20' }]}>
              <Feather name="send" size={18} color={Colors.platinum} />
            </View>
            <Text style={styles.quickActionText}>{t('send')}</Text>
          </TouchableOpacity>
        </View>

        {/* Piyasalar Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('markets')}</Text>
          <View style={styles.sectionTabs}>
            <Text style={styles.sectionTabActive}>{t('spot')}</Text>
            <Text style={styles.sectionTab}>{t('staked')}</Text>
          </View>
        </View>

        {/* Table Header */}
        <View style={styles.assetTableHeader}>
          <Text style={[styles.assetTableHeaderText, { flex: 2 }]}>{t('name')}</Text>
          <Text style={[styles.assetTableHeaderText, { flex: 1, textAlign: 'right' }]}>{t('price')}</Text>
          <Text style={[styles.assetTableHeaderText, { flex: 1, textAlign: 'right' }]}>{t('change24h')}</Text>
        </View>

        {/* Asset Rows */}
        {prices && prices.prices && METAL_ORDER.map(function(symbol) {
          const metal = METALS[symbol];
          const price = prices.prices[symbol] || 0;
          const change = (prices.changes && prices.changes[symbol]) || 0;
          
          let changeColor = Colors.textPrimary;
          if (change > 0) changeColor = Colors.up;
          if (change < 0) changeColor = Colors.down;

          return (
            <TouchableOpacity 
              key={symbol} 
              style={styles.assetRow}
              onPress={() => { setSelectedMetal(symbol); setShowChart(true); }}
            >
              <View style={styles.assetInfo}>
                <MetalIcon symbol={symbol} size={32} />
                <View style={styles.assetTextContainer}>
                  <Text style={[styles.assetSymbol, { color: metal.color }]}>{symbol}</Text>
                  <Text style={styles.assetName}>/USDT</Text>
                </View>
              </View>
              <Text style={styles.assetPrice}>${price.toFixed(2)}</Text>
              <View style={[styles.assetChangeBadge, { backgroundColor: changeColor + '20' }]}>
                <Text style={[styles.assetChangeText, { color: changeColor }]}>
                  {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Tümünü Gör / Gizle Butonu - Diğer Varlıklar için */}
        <TouchableOpacity 
          style={styles.viewAllAssetsBtn} 
          onPress={() => setShowAllAssets(!showAllAssets)}
        >
          <Text style={styles.viewAllAssetsText}>
            {showAllAssets 
              ? (language === 'tr' ? 'Diğer Varlıkları Gizle' : 'Hide Other Assets')
              : (language === 'tr' ? 'Diğer Varlıkları Göster' : 'Show Other Assets')
            }
          </Text>
          <Feather name={showAllAssets ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.primary} />
        </TouchableOpacity>

        {/* Diğer Varlıklar - BTC, ETH, USDT, TRY - Sadece showAllAssets true ise göster */}
        {showAllAssets && Object.keys(OTHER_ASSETS).map(function(symbol) {
          const asset = OTHER_ASSETS[symbol];
          const priceData = cryptoPrices[symbol];
          const change = priceData.change;
          
          let changeColor = Colors.textPrimary;
          if (change > 0) changeColor = Colors.up;
          if (change < 0) changeColor = Colors.down;

          return (
            <TouchableOpacity 
              key={symbol} 
              style={styles.assetRow}
              onPress={() => {
                setSelectedCrypto(symbol);
                setShowCryptoChart(true);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.assetInfo}>
                <CryptoIcon symbol={symbol} size={32} />
                <View style={styles.assetTextContainer}>
                  <Text style={[styles.assetSymbol, { color: asset.color }]}>{symbol}</Text>
                  <Text style={styles.assetName}>/{symbol === 'TRY' ? 'USD' : 'USDT'}</Text>
                </View>
              </View>
              <Text style={styles.assetPrice}>
                {symbol === 'TRY' ? '₺' : '$'}{priceData.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <View style={[styles.assetChangeBadge, { backgroundColor: changeColor + '20' }]}>
                <Text style={[styles.assetChangeText, { color: changeColor }]}>
                  {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Haberler Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('news')}</Text>
        </View>

        {/* Haber Kartları */}
        {newsLoading ? (
          <View style={styles.newsLoading}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.newsLoadingText}>{t('newsLoading')}</Text>
          </View>
        ) : news.length === 0 ? (
          <View style={styles.newsEmpty}>
            <Feather name="inbox" size={32} color={Colors.textMuted} />
            <Text style={styles.newsEmptyText}>{t('noNews')}</Text>
          </View>
        ) : (
          news.slice(0, 3).map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.newsCard}
              onPress={() => openNewsLink(item.link)}
              activeOpacity={0.7}
            >
              <View style={[styles.newsImagePlaceholder, { backgroundColor: item.color + '20' }]}>
                <Feather name={item.icon} size={24} color={item.color} />
              </View>
              <View style={styles.newsContent}>
                <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.newsDescription} numberOfLines={2}>{item.description}</Text>
                <View style={styles.newsMeta}>
                  <Text style={styles.newsSource}>{item.source}</Text>
                  <Text style={styles.newsTime}>{item.timeAgo}</Text>
                  <Feather name="external-link" size={12} color={Colors.textMuted} style={{ marginLeft: 6 }} />
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Tümünü Gör */}
        {!newsLoading && news.length > 0 && (
          <TouchableOpacity style={styles.viewAllNewsBtn}>
            <Text style={styles.viewAllNewsText}>{t('viewAll')}</Text>
            <Feather name="chevron-right" size={16} color={Colors.primary} />
          </TouchableOpacity>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Dropdown Menu Modal */}
      <Modal visible={showMenu} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.menuOverlay} 
          activeOpacity={1} 
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuDropdown}>
            <View style={styles.menuHeader}>
              <View style={styles.menuAvatar}>
                <Feather name="user" size={24} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.menuUsername}>Auxite Kullanıcısı</Text>
                <Text style={styles.menuWallet}>0xD24B...E944</Text>
              </View>
            </View>
            
            <View style={styles.menuDivider} />
            
            {menuItems.map((item, index) => (
              <TouchableOpacity key={index} style={styles.menuDropdownItem}>
                <Feather name={item.icon} size={18} color={Colors.textMuted} />
                <View style={styles.menuDropdownTextContainer}>
                  <Text style={styles.menuDropdownTitle}>{item.title}</Text>
                  <Text style={styles.menuDropdownSubtitle}>{item.subtitle}</Text>
                </View>
                <Feather name="chevron-right" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            ))}
            
            <View style={styles.menuDivider} />
            
            <TouchableOpacity style={styles.menuLogoutBtn}>
              <Feather name="log-out" size={18} color={Colors.error} />
              <Text style={styles.menuLogoutText}>Çıkış Yap</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ============================================
// ANA SAYFA (HOME) - ESKİ
// ============================================
function HomeScreen({ prices, isLive, onRefresh, refreshing, lastUpdated, onNavigateToSwap }) {
  const [selectedMetal, setSelectedMetal] = useState(null);
  const [showChart, setShowChart] = useState(false);

  let totalValue = 0;
  if (prices && prices.prices) {
    for (let i = 0; i < PORTFOLIO.length; i++) {
      const item = PORTFOLIO[i];
      const price = prices.prices[item.symbol] || 0;
      totalValue = totalValue + (item.balance * price);
    }
  }

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.primary}
          colors={[Colors.primary]}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MetalIcon symbol="AUXG" size={36} />
          <Text style={styles.greeting}>Auxite Wallet</Text>
        </View>
        <View style={[styles.liveIndicator, !isLive && styles.demoIndicator]}>
          <View style={[styles.liveDot, !isLive && styles.demoDot]} />
          <Text style={[styles.liveText, !isLive && styles.demoText]}>
            {isLive ? 'Canlı' : 'Demo'}
          </Text>
        </View>
      </View>

      {/* Portfolio Summary */}
      <View style={styles.portfolioCard}>
        <Text style={styles.portfolioLabel}>Toplam Portföy Değeri</Text>
        <Text style={styles.portfolioValue}>
          {formatCompact(totalValue)}
        </Text>
        <Text style={styles.portfolioCurrency}>USDT</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={onNavigateToSwap}>
          <Feather name="repeat" size={18} color={Colors.textPrimary} style={styles.actionIconStyle} />
          <Text style={styles.actionText}>Dönüştür</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButtonOutline}>
          <Feather name="bar-chart-2" size={18} color={Colors.textPrimary} style={styles.actionIconStyle} />
          <Text style={styles.actionText}>Detaylar</Text>
        </TouchableOpacity>
      </View>

      {/* Section Title */}
      <Text style={styles.sectionTitle}>Varlıklarınız</Text>

      {/* Metal Cards */}
      {prices && prices.prices && METAL_ORDER.map(function(symbol) {
        const metal = METALS[symbol];
        let portfolioItem = null;
        for (let i = 0; i < PORTFOLIO.length; i++) {
          if (PORTFOLIO[i].symbol === symbol) {
            portfolioItem = PORTFOLIO[i];
            break;
          }
        }
        const price = prices.prices[symbol] || 0;
        const change = (prices.changes && prices.changes[symbol]) || 0;
        const direction = (prices.directions && prices.directions[symbol]) || 'neutral';
        
        let changeColor = Colors.textPrimary; // nötr beyaz
        if (change > 0) changeColor = Colors.up;
        if (change < 0) changeColor = Colors.down;

        return (
          <TouchableOpacity 
            key={symbol} 
            style={styles.card} 
            activeOpacity={0.7}
            onPress={function() { setSelectedMetal(symbol); setShowChart(true); }}
          >
            <View style={styles.cardHeader}>
              <View style={styles.metalInfo}>
                <MetalIcon symbol={symbol} size={36} />
                <View style={styles.metalTextContainer}>
                  <Text style={[styles.metalSymbol, { color: metal.color }]}>{symbol}</Text>
                  <Text style={styles.metalName}>{metal.nameTr}</Text>
                </View>
              </View>
              <View style={[styles.changeBadge, { backgroundColor: changeColor + '15' }]}>
                <Feather 
                  name={change > 0 ? 'trending-up' : change < 0 ? 'trending-down' : 'minus'} 
                  size={12} 
                  color={changeColor} 
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.changeText, { color: changeColor }]}>
                  {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                </Text>
              </View>
            </View>
            
            <View style={styles.priceContainer}>
              <Text style={styles.price}>{formatPrice(price)}</Text>
              <Text style={styles.unit}>/gram</Text>
            </View>

            {portfolioItem ? (
              <View style={styles.balanceContainer}>
                <Text style={styles.balanceLabel}>Bakiye</Text>
                <Text style={styles.balance}>
                  {formatBalance(portfolioItem.balance)}g
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        );
      })}

      {/* Last Updated */}
      {lastUpdated ? (
        <View style={styles.lastUpdatedContainer}>
          <Feather name="clock" size={12} color={Colors.textMuted} style={{ marginRight: 6 }} />
          <Text style={styles.lastUpdated}>
            Son güncelleme: {lastUpdated.toLocaleTimeString('tr-TR')}
          </Text>
        </View>
      ) : null}

      {/* Chart Screen */}
      {showChart && selectedMetal ? (
        <Modal visible={true} animationType="slide">
          <ChartScreen
            metal={selectedMetal}
            currentPrice={selectedMetal && prices?.prices ? prices.prices[selectedMetal] : 0}
            onClose={function() { setShowChart(false); setSelectedMetal(null); }}
            prices={prices}
          />
        </Modal>
      ) : null}
    </ScrollView>
  );
}

// ============================================
// PİYASALAR (MARKETS)
// ============================================
function MarketsScreen({ prices, isLive, onRefresh, refreshing, language = 'tr', t, cryptoPrices = {} }) {
  const [selectedMetal, setSelectedMetal] = useState(null);
  const [showChart, setShowChart] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [showCryptoChart, setShowCryptoChart] = useState(false);

  // Trade panel göster
  if (showChart && selectedMetal) {
    return (
      <ChartScreen
        metal={selectedMetal}
        prices={prices}
        onClose={() => { setShowChart(false); setSelectedMetal(null); }}
        language={language}
      />
    );
  }

  if (showCryptoChart && selectedCrypto) {
    const cryptoPrice = cryptoPrices[selectedCrypto]?.price || 0;
    const cryptoChange = cryptoPrices[selectedCrypto]?.change || 0;
    return (
      <CryptoChartScreen
        crypto={selectedCrypto}
        currentPrice={cryptoPrice}
        priceChange={cryptoChange}
        onClose={() => { setShowCryptoChart(false); setSelectedCrypto(null); }}
        language={language}
      />
    );
  }
  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.primary}
          colors={[Colors.primary]}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>{t('markets')}</Text>
        <View style={[styles.liveIndicator, !isLive && styles.demoIndicator]}>
          <View style={[styles.liveDot, !isLive && styles.demoDot]} />
          <Text style={[styles.liveText, !isLive && styles.demoText]}>
            {isLive ? t('live') : t('demo')}
          </Text>
        </View>
      </View>

      {/* Price Table Header */}
      <View style={styles.tableHeader}>
        <View style={[styles.tableCell, { paddingLeft: 8 }]}>
          <Text style={styles.tableHeaderText}>{language === 'tr' ? 'METAL' : 'METAL'}</Text>
        </View>
        <Text style={[styles.tableHeaderText, { flex: 1 }]}>{language === 'tr' ? 'ALIŞ' : 'BID'}</Text>
        <Text style={[styles.tableHeaderText, { flex: 1 }]}>{language === 'tr' ? 'SATIŞ' : 'ASK'}</Text>
        <Text style={[styles.tableHeaderText, { flex: 0.8 }]}>{language === 'tr' ? 'DEĞİŞİM' : 'CHANGE'}</Text>
      </View>

      {/* Price Rows */}
      {prices && prices.prices && METAL_ORDER.map(function(symbol) {
        const metal = METALS[symbol];
        const askPrice = prices.prices[symbol] || 0;
        const bidPrice = prices.bidPrices ? prices.bidPrices[symbol] || 0 : askPrice;
        const change = (prices.changes && prices.changes[symbol]) || 0;
        const direction = (prices.directions && prices.directions[symbol]) || 'neutral';
        
        let changeColor = Colors.textPrimary;
        if (change > 0) changeColor = Colors.up;
        if (change < 0) changeColor = Colors.down;

        return (
          <TouchableOpacity key={symbol} style={styles.tableRow} onPress={() => { setSelectedMetal(symbol); setShowChart(true); }}>
            <View style={styles.tableCell}>
              <MetalIcon symbol={symbol} size={28} />
              <View style={{ marginLeft: 8 }}>
                <Text style={[styles.tableCellSymbol, { color: metal.color }]}>{symbol}</Text>
                <Text style={styles.tableCellName}>{language === 'tr' ? metal.nameTr : metal.nameEn}</Text>
              </View>
            </View>
            <Text style={[styles.tableCellPrice, { flex: 1 }]}>${bidPrice.toFixed(2)}</Text>
            <Text style={[styles.tableCellPrice, { flex: 1 }]}>${askPrice.toFixed(2)}</Text>
            <View style={[styles.tableChangeBadge, { backgroundColor: changeColor + '15' }]}>
              <Text style={[styles.tableChangeText, { color: changeColor }]}>
                {change >= 0 ? '+' : ''}{change.toFixed(1)}%
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}

      {/* How It Works */}
      <View style={styles.howItWorksCard}>
        <View style={styles.howItWorksHeader}>
          <Feather name="shield" size={18} color={Colors.primary} style={{ marginRight: 10 }} />
          <Text style={styles.howItWorksTitle}>{language === 'tr' ? 'Nasıl Çalışır' : 'How It Works'}</Text>
        </View>
        <View style={styles.howItWorksList}>
          <View style={styles.howItWorksItem}>
            <Text style={styles.howItWorksBullet}>•</Text>
            <Text style={styles.howItWorksText}>
              {language === 'tr' ? 'Her token fiziksel bir barla 1:1 desteklenir' : 'Each token is 1:1 backed by physical bars'}
            </Text>
          </View>
          <View style={styles.howItWorksItem}>
            <Text style={styles.howItWorksBullet}>•</Text>
            <Text style={styles.howItWorksText}>
              {language === 'tr' ? 'Barlar İstanbul, İsviçre, Dubai, Singapur ve Londra\'daki güvenli kasalarda saklanır' : 'Bars are stored in secure vaults in Istanbul, Switzerland, Dubai, Singapore and London'}
            </Text>
          </View>
          <View style={styles.howItWorksItem}>
            <Text style={styles.howItWorksBullet}>•</Text>
            <Text style={styles.howItWorksText}>
              {language === 'tr' ? 'Her bar benzersiz bir seri numarasına ve sertifikaya sahiptir' : 'Each bar has a unique serial number and certificate'}
            </Text>
          </View>
          <View style={styles.howItWorksItem}>
            <Text style={styles.howItWorksBullet}>•</Text>
            <Text style={styles.howItWorksText}>
              {language === 'tr' ? 'Bar ağırlıkları: 1g, 5g, 10g, 20g, 50g, 100g, 500g, 1kg' : 'Bar weights: 1g, 5g, 10g, 20g, 50g, 100g, 500g, 1kg'}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

// ============================================
// SWAP (DÖNÜŞTÜR)
// ============================================
function SwapScreen({ prices, isLive }) {
  const [fromMetal, setFromMetal] = useState('AUXG');
  const [toMetal, setToMetal] = useState('AUXS');
  const [amount, setAmount] = useState('');
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const fromBalance = PORTFOLIO.find(p => p.symbol === fromMetal)?.balance || 0;
  const fromPrice = prices?.bidPrices?.[fromMetal] || prices?.prices?.[fromMetal] || 0;
  const toPrice = prices?.prices?.[toMetal] || 0;
  
  const amountNum = parseFloat(amount) || 0;
  const fromValue = amountNum * fromPrice;
  const toAmount = toPrice > 0 ? fromValue / toPrice : 0;

  const handleSwap = function() {
    if (amountNum <= 0) {
      Alert.alert('Hata', 'Lütfen geçerli bir miktar girin');
      return;
    }
    if (amountNum > fromBalance) {
      Alert.alert('Hata', 'Yetersiz bakiye');
      return;
    }
    Alert.alert(
      'İşlem Onayı',
      `${amountNum.toFixed(2)}g ${fromMetal} → ${toAmount.toFixed(2)}g ${toMetal}\n\nBu işlemi onaylıyor musunuz?`,
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Onayla', onPress: () => Alert.alert('Başarılı', 'İşlem tamamlandı!') }
      ]
    );
  };

  const swapMetals = function() {
    const temp = fromMetal;
    setFromMetal(toMetal);
    setToMetal(temp);
    setAmount('');
  };

  const MetalPicker = function({ visible, onClose, onSelect, exclude }) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Metal Seçin</Text>
            {METAL_ORDER.filter(s => s !== exclude).map(function(symbol) {
              const metal = METALS[symbol];
              return (
                <TouchableOpacity 
                  key={symbol} 
                  style={styles.modalOption}
                  onPress={function() { onSelect(symbol); onClose(); }}
                >
                  <MetalIcon symbol={symbol} size={40} />
                  <Text style={[styles.modalOptionText, { color: metal.color }]}>{symbol}</Text>
                  <Text style={styles.modalOptionName}>{metal.nameTr}</Text>
                  <Feather name="chevron-right" size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity style={styles.modalCancel} onPress={onClose}>
              <Text style={styles.modalCancelText}>İptal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Dönüştür</Text>
        <View style={[styles.liveIndicator, !isLive && styles.demoIndicator]}>
          <View style={[styles.liveDot, !isLive && styles.demoDot]} />
          <Text style={[styles.liveText, !isLive && styles.demoText]}>
            {isLive ? 'Canlı' : 'Demo'}
          </Text>
        </View>
      </View>

      {/* From Card */}
      <View style={styles.swapCard}>
        <View style={styles.swapCardHeader}>
          <Text style={styles.swapLabel}>Gönder</Text>
          <View style={styles.swapBalanceContainer}>
            <Feather name="briefcase" size={12} color={Colors.textMuted} style={{ marginRight: 4 }} />
            <Text style={styles.swapBalance}>{fromBalance.toLocaleString('tr-TR')}g</Text>
          </View>
        </View>
        
        <View style={styles.swapInputRow}>
          <TextInput
            style={styles.swapInput}
            placeholder="0.00"
            placeholderTextColor={Colors.textMuted}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
          <TouchableOpacity 
            style={styles.swapMetalSelector}
            onPress={function() { setShowFromPicker(true); }}
          >
            <MetalIcon symbol={fromMetal} size={28} />
            <Text style={[styles.swapMetalText, { color: METALS[fromMetal].color }]}>{fromMetal}</Text>
            <Feather name="chevron-down" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.swapValueRow}>
          <Text style={styles.swapValue}>≈ ${fromValue.toFixed(2)} USDT</Text>
          <TouchableOpacity onPress={function() { setAmount(fromBalance.toString()); }} style={styles.maxButton}>
            <Text style={styles.swapMax}>MAX</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Swap Button */}
      <TouchableOpacity style={styles.swapArrowButton} onPress={swapMetals}>
        <Feather name="arrow-down" size={20} color={Colors.primary} />
      </TouchableOpacity>

      {/* To Card */}
      <View style={styles.swapCard}>
        <View style={styles.swapCardHeader}>
          <Text style={styles.swapLabel}>Al</Text>
          <View style={styles.swapBalanceContainer}>
            <Feather name="briefcase" size={12} color={Colors.textMuted} style={{ marginRight: 4 }} />
            <Text style={styles.swapBalance}>
              {(PORTFOLIO.find(p => p.symbol === toMetal)?.balance || 0).toLocaleString('tr-TR')}g
            </Text>
          </View>
        </View>
        
        <View style={styles.swapInputRow}>
          <Text style={styles.swapOutputAmount}>{toAmount.toFixed(4)}</Text>
          <TouchableOpacity 
            style={styles.swapMetalSelector}
            onPress={function() { setShowToPicker(true); }}
          >
            <MetalIcon symbol={toMetal} size={28} />
            <Text style={[styles.swapMetalText, { color: METALS[toMetal].color }]}>{toMetal}</Text>
            <Feather name="chevron-down" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.swapValue}>≈ ${(toAmount * toPrice).toFixed(2)} USDT</Text>
      </View>

      {/* Rate Info */}
      <View style={styles.rateInfo}>
        <Feather name="repeat" size={14} color={Colors.textMuted} style={{ marginRight: 8 }} />
        <View>
          <Text style={styles.rateLabel}>Dönüşüm Oranı</Text>
          <Text style={styles.rateValue}>
            1 {fromMetal} = {toPrice > 0 ? (fromPrice / toPrice).toFixed(4) : '0'} {toMetal}
          </Text>
        </View>
      </View>

      {/* Swap Button */}
      <TouchableOpacity 
        style={[styles.swapButton, amountNum <= 0 && styles.swapButtonDisabled]} 
        onPress={handleSwap}
        disabled={amountNum <= 0}
      >
        <Feather name="check-circle" size={20} color={Colors.textPrimary} style={{ marginRight: 8 }} />
        <Text style={styles.swapButtonText}>Dönüştür</Text>
      </TouchableOpacity>

      <MetalPicker 
        visible={showFromPicker} 
        onClose={function() { setShowFromPicker(false); }}
        onSelect={setFromMetal}
        exclude={toMetal}
      />
      <MetalPicker 
        visible={showToPicker} 
        onClose={function() { setShowToPicker(false); }}
        onSelect={setToMetal}
        exclude={fromMetal}
      />
    </ScrollView>
  );
}

// ============================================
// PROFİL
// ============================================
function WalletScreen({ prices, isLive, language = 'tr', t, setLanguage, walletAddress, isWalletConnected, onConnectWallet, onDisconnectWallet }) {
  const [showStakedAssets, setShowStakedAssets] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showOnChainDeposit, setShowOnChainDeposit] = useState(false);
  const [depositSearchQuery, setDepositSearchQuery] = useState('');
  const [showSendModal, setShowSendModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [showAssetsModal, setShowAssetsModal] = useState(false);
  const [showLocationsModal, setShowLocationsModal] = useState(false);
  const [allocateAsset, setAllocateAsset] = useState('AUXG');
  const [allocateType, setAllocateType] = useState('stake');
  const [allocateAmount, setAllocateAmount] = useState('');
  // Prop olarak gelen walletAddress kullan, yoksa demo adres
  const displayAddress = walletAddress || '0x0000...0000';
  
  // Deposit coins list
  const depositCoins = [
    { id: 'BTC', name: 'Bitcoin', icon: '₿', color: '#F7931A' },
    { id: 'ETH', name: 'Ethereum', icon: 'Ξ', color: '#627EEA' },
    { id: 'XRP', name: 'Ripple', icon: '✕', color: '#23292F' },
    { id: 'SOL', name: 'Solana', icon: '◎', color: '#9945FF' },
  ];
  
  const filteredDepositCoins = depositCoins.filter(coin => 
    coin.id.toLowerCase().includes(depositSearchQuery.toLowerCase()) ||
    coin.name.toLowerCase().includes(depositSearchQuery.toLowerCase())
  );
  
  // Toplam değer hesapla
  let totalValue = 0;
  if (prices && prices.prices) {
    for (let i = 0; i < PORTFOLIO.length; i++) {
      const item = PORTFOLIO[i];
      const price = prices.prices[item.symbol] || 0;
      totalValue += item.balance * price;
    }
  }
  
  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>{t('wallet')}</Text>
        <View style={styles.headerRight}>
          {/* Dil Değiştirme Butonu */}
          <TouchableOpacity 
            style={styles.languageBtn}
            onPress={() => setLanguage(language === 'tr' ? 'en' : 'tr')}
          >
            <Text style={styles.languageBtnText}>{language === 'tr' ? '🇹🇷 TR' : '🇬🇧 EN'}</Text>
          </TouchableOpacity>
          <View style={[styles.liveIndicator, !isWalletConnected && styles.demoIndicator]}>
            <View style={[styles.liveDot, !isWalletConnected && styles.demoDot]} />
            <Text style={[styles.liveText, !isWalletConnected && styles.demoText]}>
              {isWalletConnected ? t('connected') : t('notConnected')}
            </Text>
          </View>
        </View>
      </View>

      {/* Wallet Connection Card */}
      {!isWalletConnected ? (
        <TouchableOpacity style={styles.connectWalletCard} onPress={onConnectWallet}>
          <View style={styles.connectWalletIcon}>
            <Feather name="link" size={28} color={Colors.primary} />
          </View>
          <View style={styles.connectWalletInfo}>
            <Text style={styles.connectWalletTitle}>{t('connectWallet')}</Text>
            <Text style={styles.connectWalletSubtitle}>{t('tapToConnect')}</Text>
          </View>
          <Feather name="chevron-right" size={24} color={Colors.primary} />
        </TouchableOpacity>
      ) : (
        <>
          {/* Toplam Değer */}
          <View style={styles.portfolioCard}>
            <Text style={styles.portfolioLabel}>{t('totalAssetValue')}</Text>
            <Text style={styles.portfolioValue}>{formatCompact(totalValue)}</Text>
            <Text style={styles.portfolioCurrency}>USDT</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={styles.actionButton} onPress={() => setShowDepositModal(true)}>
              <View style={[styles.actionIconCircle, { backgroundColor: Colors.primary + "20" }]}>
                <Feather name="download" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.actionButtonText}>{language === "tr" ? "Yatır" : "Deposit"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => setShowSendModal(true)}>
              <View style={[styles.actionIconCircle, { backgroundColor: Colors.up + "20" }]}>
                <Feather name="send" size={20} color={Colors.up} />
              </View>
              <Text style={styles.actionButtonText}>{language === "tr" ? "Gönder" : "Send"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => setShowConvertModal(true)}>
              <View style={[styles.actionIconCircle, { backgroundColor: "#f7931a20" }]}>
                <Feather name="repeat" size={20} color="#f7931a" />
              </View>
              <Text style={styles.actionButtonText}>{language === "tr" ? "Dönüştür" : "Convert"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => setShowAllocateModal(true)}>
              <View style={[styles.actionIconCircle, { backgroundColor: Colors.up + "20" }]}>
                <Feather name="lock" size={20} color={Colors.up} />
              </View>
              <Text style={styles.actionButtonText}>{language === "tr" ? "Tahsis" : "Allocate"}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Stats */}
      <View style={styles.statsRow}>
        <TouchableOpacity style={styles.statBox} onPress={() => setShowAssetsModal(true)}>
          <Feather name="layers" size={20} color={Colors.primary} style={{ marginBottom: 8 }} />
          <Text style={styles.statValue}>4</Text>
          <Text style={styles.statLabel}>{t('assets')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statBox} onPress={() => setShowStakedAssets(true)}>
          <Feather name="lock" size={20} color={Colors.primary} style={{ marginBottom: 8 }} />
          <Text style={styles.statValue}>4</Text>
          <Text style={styles.statLabel}>{language === "tr" ? "Tahsisli" : "Staked"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statBox} onPress={() => setShowLocationsModal(true)}>
          <Feather name="map-pin" size={20} color={Colors.primary} style={{ marginBottom: 8 }} />
          <Text style={styles.statValue}>5</Text>
          <Text style={styles.statLabel}>{t('locations')}</Text>
        </TouchableOpacity>
      </View>

      {/* Varlıklar */}
      <View style={styles.allocatedSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{language === "tr" ? "Varlıklar" : "Assets"}</Text>
        </View>
        {/* Tablo Header */}
        <View style={styles.allocTableHeader}>
          <Text style={[styles.allocTableHeaderText, {flex: 1.2}]}>{language === "tr" ? "Varlık" : "Asset"}</Text>
          <Text style={[styles.allocTableHeaderText, {flex: 1, textAlign: 'right'}]}>{language === "tr" ? "Miktar" : "Amount"}</Text>
          <Text style={[styles.allocTableHeaderText, {flex: 1.2, textAlign: 'right'}]}>{language === "tr" ? "Güncel Değer" : "Current Value"}</Text>
        </View>
        {PORTFOLIO.map((item) => {
          const price = prices?.prices?.[item.symbol] || 0;
          const value = item.balance * price;
          // Rakamları formatla
          const formattedBalance = item.balance >= 1000000 
            ? (item.balance / 1000000).toFixed(2) + 'M' 
            : item.balance >= 1000 
              ? (item.balance / 1000).toFixed(2) + 'K' 
              : item.balance.toFixed(2);
          const formattedValue = value >= 1000000 
            ? '$' + (value / 1000000).toFixed(2) + 'M' 
            : value >= 1000 
              ? '$' + (value / 1000).toFixed(2) + 'K' 
              : '$' + value.toFixed(2);
          return (
            <View key={item.symbol} style={styles.allocTableRow}>
              <View style={[styles.allocTableCell, {flex: 1.2, flexDirection: "row", alignItems: "center"}]}>
                <MetalIcon symbol={item.symbol} size={24} />
                <Text style={styles.allocAssetText}>{item.symbol}</Text>
              </View>
              <Text style={[styles.allocTableCell, {flex: 1, textAlign: 'right'}]}>{formattedBalance}g</Text>
              <Text style={[styles.allocTableCell, {flex: 1.2, textAlign: 'right', color: Colors.up}]}>{formattedValue}</Text>
            </View>
          );
        })}
      </View>

      {/* Tahsisli Varlıklar */}
      <View style={styles.allocatedSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{language === "tr" ? "Tahsisli Varlıklar" : "Allocated Assets"}</Text>
        </View>
        {/* Tablo Header */}
        <View style={styles.allocTableHeader}>
          <Text style={[styles.allocTableHeaderText, {flex: 1.2}]}>{language === "tr" ? "Varlık" : "Asset"}</Text>
          <Text style={[styles.allocTableHeaderText, {flex: 1}]}>{language === "tr" ? "Tahsisli" : "Allocated"}</Text>
          <Text style={[styles.allocTableHeaderText, {flex: 1}]}>{language === "tr" ? "Lokasyon" : "Location"}</Text>
          <Text style={[styles.allocTableHeaderText, {flex: 0.8}]}>{language === "tr" ? "İşlem" : "Action"}</Text>
        </View>
        {/* Örnek Satırlar */}
        <View style={styles.allocTableRow}>
          <View style={[styles.allocTableCell, {flex: 1.2, flexDirection: "row", alignItems: "center"}]}>
            <MetalIcon symbol="AUXG" size={24} />
            <Text style={styles.allocAssetText}>AUXG</Text>
          </View>
          <Text style={[styles.allocTableCell, {flex: 1}]}>2.5g</Text>
          <Text style={[styles.allocTableCell, {flex: 1}]}>Istanbul</Text>
          <TouchableOpacity style={[styles.allocTableCell, {flex: 0.8}]}>
            <Feather name="external-link" size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.allocTableRow}>
          <View style={[styles.allocTableCell, {flex: 1.2, flexDirection: "row", alignItems: "center"}]}>
            <MetalIcon symbol="AUXS" size={24} />
            <Text style={styles.allocAssetText}>AUXS</Text>
          </View>
          <Text style={[styles.allocTableCell, {flex: 1}]}>15g</Text>
          <Text style={[styles.allocTableCell, {flex: 1}]}>Zurich</Text>
          <TouchableOpacity style={[styles.allocTableCell, {flex: 0.8}]}>
            <Feather name="external-link" size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Disconnect / Connect Button */}
      {isWalletConnected ? (
        <TouchableOpacity style={styles.disconnectButton} onPress={onDisconnectWallet}>
          <Feather name="link-2" size={18} color={Colors.error} style={{ marginRight: 8 }} />
          <Text style={styles.disconnectText}>{t('disconnect')}</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.connectButton} onPress={onConnectWallet}>
          <Feather name="link" size={18} color={Colors.primary} style={{ marginRight: 8 }} />
          <Text style={styles.connectButtonText}>{t('connectWallet')}</Text>
        </TouchableOpacity>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Auxite Wallet v1.0.0</Text>
        <Text style={styles.footerSubtext}>Sepolia Testnet</Text>
      </View>

      {/* Deposit Modal */}
      {/* Deposit Method Selection Modal */}
      <Modal visible={showDepositModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: 30 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{language === "tr" ? "Yatırma Yöntemi Seçin" : "Select Deposit Method"}</Text>
              <TouchableOpacity onPress={() => setShowDepositModal(false)}>
                <Feather name="x" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            {/* On-Chain Deposit Option */}
            <TouchableOpacity 
              style={styles.depositMethodCard}
              onPress={() => {
                setShowDepositModal(false);
                setShowOnChainDeposit(true);
              }}
            >
              <View style={[styles.depositMethodIcon, { backgroundColor: Colors.cardBg }]}>
                <Feather name="download" size={20} color={Colors.textPrimary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.depositMethodTitle}>On-Chain Deposit</Text>
                <Text style={styles.depositMethodDesc}>
                  {language === "tr" 
                    ? "Diğer borsalardan/cüzdanlardan kripto yatırın" 
                    : "Deposit crypto from other exchanges/wallets"}
                </Text>
              </View>
              <Feather name="chevron-right" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
            
            {/* Deposit Fiat Option */}
            <TouchableOpacity 
              style={styles.depositMethodCard}
              onPress={() => {
                setShowDepositModal(false);
                Alert.alert(
                  language === "tr" ? "Fiat Yatırma" : "Deposit Fiat",
                  language === "tr" ? "Yakında aktif olacak" : "Coming soon"
                );
              }}
            >
              <View style={[styles.depositMethodIcon, { backgroundColor: Colors.cardBg }]}>
                <Feather name="credit-card" size={20} color={Colors.textPrimary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.depositMethodTitle}>
                  {language === "tr" ? "Fiat Yatır" : "Deposit Fiat"}
                </Text>
                <Text style={styles.depositMethodDesc}>
                  {language === "tr" 
                    ? "SWIFT, kart, Apple/Google Pay ile USD/TRY yatırın" 
                    : "Deposit USD/TRY via SWIFT, card, Apple/Google Pay"}
                </Text>
              </View>
              <Feather name="chevron-right" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* On-Chain Deposit - Select Coin Modal */}
      <Modal visible={showOnChainDeposit} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: Colors.background }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
            <TouchableOpacity 
              onPress={() => setShowOnChainDeposit(false)}
              style={{ padding: 8 }}
            >
              <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={{ flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary, marginRight: 40 }}>
              {language === "tr" ? "Coin Seç" : "Select Coin"}
            </Text>
          </View>

          {/* Search */}
          <View style={{ padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.cardBg, borderRadius: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: Colors.border }}>
              <Feather name="search" size={20} color={Colors.textMuted} />
              <TextInput
                style={{ flex: 1, paddingVertical: 14, paddingHorizontal: 12, color: Colors.textPrimary, fontSize: 16 }}
                placeholder={language === "tr" ? "Coin Ara" : "Search Coins"}
                placeholderTextColor={Colors.textMuted}
                value={depositSearchQuery}
                onChangeText={setDepositSearchQuery}
              />
            </View>
          </View>

          {/* Trending Label */}
          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.textMuted }}>
              {language === "tr" ? "Popüler" : "Trending"}
            </Text>
          </View>

          {/* Coin List */}
          <ScrollView style={{ flex: 1, paddingHorizontal: 16 }}>
            {filteredDepositCoins.map((coin) => (
              <TouchableOpacity
                key={coin.id}
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.border }}
                onPress={() => {
                  setShowOnChainDeposit(false);
                  Alert.alert(
                    `${coin.name} Deposit`,
                    language === "tr" ? "Deposit adresi yakında" : "Deposit address coming soon"
                  );
                }}
              >
                <View style={{ 
                  width: 40, 
                  height: 40, 
                  borderRadius: 20, 
                  backgroundColor: coin.color, 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  marginRight: 12 
                }}>
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{coin.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: Colors.textPrimary, fontWeight: '600', fontSize: 16 }}>{coin.id}</Text>
                  <Text style={{ color: Colors.textMuted, fontSize: 14 }}>{coin.name}</Text>
                </View>
                <Feather name="chevron-right" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Send Modal */}
      <Modal visible={showSendModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{language === "tr" ? "Gönder" : "Send"}</Text>
              <TouchableOpacity onPress={() => setShowSendModal(false)}>
                <Feather name="x" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalText}>{language === "tr" ? "Alıcı Adresi" : "Recipient Address"}</Text>
              <TextInput style={styles.modalInput} placeholder="0x..." placeholderTextColor={Colors.textMuted} />
              <Text style={styles.modalText}>{language === "tr" ? "Miktar" : "Amount"}</Text>
              <TextInput style={styles.modalInput} placeholder="0.00" keyboardType="numeric" placeholderTextColor={Colors.textMuted} />
            </View>
            <TouchableOpacity style={styles.modalButton} onPress={() => { Alert.alert(language === "tr" ? "Gönderildi" : "Sent"); setShowSendModal(false); }}>
              <Text style={styles.modalButtonText}>{language === "tr" ? "Gönder" : "Send"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>


      {/* Convert Modal */}
      <Modal visible={showConvertModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{language === "tr" ? "Dönüştür" : "Convert"}</Text>
              <TouchableOpacity onPress={() => setShowConvertModal(false)}>
                <Feather name="x" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalText}>{language === "tr" ? "Varlık dönüştürme yakında" : "Asset conversion coming soon"}</Text>
            </View>
            <TouchableOpacity style={styles.modalButton} onPress={() => setShowConvertModal(false)}>
              <Text style={styles.modalButtonText}>{language === "tr" ? "Tamam" : "OK"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Allocate Modal */}
      <Modal visible={showAllocateModal} transparent animationType="slide">
        <View style={styles.tradeModalOverlay}>
          <View style={styles.tradeModalContent}>
            {/* Header */}
            <View style={styles.tradeModalHeader}>
              <Text style={styles.tradeModalTitle}>{language === "tr" ? "Varlık Tahsis Et" : "Allocate Asset"}</Text>
              <TouchableOpacity onPress={() => { setShowAllocateModal(false); setAllocateAmount(''); }}>
                <Feather name="x" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Varlık Seçimi */}
            <Text style={styles.tradeInputLabel}>{language === "tr" ? "Varlık Seç" : "Select Asset"}</Text>
            <View style={styles.allocateAssetRow}>
              {['AUXG', 'AUXS', 'AUXPT', 'AUXPD'].map((symbol) => (
                <TouchableOpacity 
                  key={symbol}
                  style={[
                    styles.allocateAssetBtn, 
                    allocateAsset === symbol && styles.allocateAssetBtnActive
                  ]}
                  onPress={() => setAllocateAsset(symbol)}
                >
                  <Text style={[
                    styles.allocateAssetText,
                    { color: METALS[symbol]?.color || Colors.textPrimary },
                    allocateAsset === symbol && styles.allocateAssetTextActive
                  ]}>
                    {symbol}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Tahsis Tipi */}
            <View style={styles.tradeToggleRow}>
              <TouchableOpacity 
                style={[styles.tradeToggleBtn, allocateType === 'stake' && styles.tradeToggleBtnBuyActive]}
                onPress={() => setAllocateType('stake')}
              >
                <Text style={[styles.tradeToggleText, allocateType === 'stake' && styles.tradeToggleTextActive]}>
                  {language === 'tr' ? 'Tahsis Et' : 'Stake'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tradeToggleBtn, allocateType === 'unstake' && styles.tradeToggleBtnSellActive]}
                onPress={() => setAllocateType('unstake')}
              >
                <Text style={[styles.tradeToggleText, allocateType === 'unstake' && styles.tradeToggleTextActive]}>
                  {language === 'tr' ? 'Geri Çek' : 'Unstake'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
              {/* Miktar Input */}
              <View style={styles.tradeInputGroup}>
                <Text style={styles.tradeInputLabel}>{language === 'tr' ? 'Miktar (g)' : 'Amount (g)'}</Text>
                <View style={styles.tradeInputRow}>
                  <TouchableOpacity 
                    style={styles.tradeInputBtn}
                    onPress={() => setAllocateAmount((prev) => (Math.max(0, parseFloat(prev || 0) - 100)).toString())}
                  >
                    <Text style={styles.tradeInputBtnText}>−</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={styles.tradeInputField}
                    value={allocateAmount}
                    onChangeText={setAllocateAmount}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor={Colors.textMuted}
                  />
                  <TouchableOpacity 
                    style={styles.tradeInputBtn}
                    onPress={() => setAllocateAmount((prev) => (parseFloat(prev || 0) + 100).toString())}
                  >
                    <Text style={styles.tradeInputBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Yüzde Butonları */}
              <View style={styles.tradePercentRow}>
                {['25%', '50%', '75%', '100%'].map((pct) => (
                  <TouchableOpacity 
                    key={pct} 
                    style={styles.tradePercentBtn}
                    onPress={() => {
                      const balance = PORTFOLIO.find(p => p.symbol === allocateAsset)?.balance || 0;
                      const percent = parseInt(pct) / 100;
                      setAllocateAmount((balance * percent).toFixed(2));
                    }}
                  >
                    <Text style={styles.tradePercentText}>{pct}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Bilgiler */}
              <View style={styles.tradeTotalRow}>
                <Text style={styles.tradeTotalLabel}>{language === 'tr' ? 'Tahmini APY' : 'Estimated APY'}</Text>
                <Text style={[styles.tradeTotalValue, { color: Colors.up }]}>
                  {allocateAsset === 'AUXG' ? '5.2%' : allocateAsset === 'AUXS' ? '4.8%' : allocateAsset === 'AUXPT' ? '6.1%' : '5.5%'}
                </Text>
              </View>

              <View style={styles.tradeAvailableRow}>
                <Text style={styles.tradeAvailableLabel}>{language === 'tr' ? 'Kullanılabilir' : 'Available'}</Text>
                <Text style={styles.tradeAvailableValue}>
                  {(PORTFOLIO.find(p => p.symbol === allocateAsset)?.balance || 0).toLocaleString('tr-TR')}g {allocateAsset}
                </Text>
              </View>

              <View style={styles.tradeAvailableRow}>
                <Text style={styles.tradeAvailableLabel}>{language === 'tr' ? 'Mevcut Tahsisli' : 'Currently Staked'}</Text>
                <Text style={styles.tradeAvailableValue}>
                  {allocateAsset === 'AUXG' ? '50,000g' : allocateAsset === 'AUXS' ? '100,000g' : allocateAsset === 'AUXPT' ? '10,000g' : '5,000g'}
                </Text>
              </View>
            </ScrollView>

            {/* İşlem Butonu */}
            <TouchableOpacity 
              style={[styles.tradeSubmitBtn, { backgroundColor: allocateType === 'stake' ? Colors.up : Colors.down }]}
              onPress={() => {
                if (!allocateAmount || parseFloat(allocateAmount) <= 0) {
                  Alert.alert(language === 'tr' ? 'Hata' : 'Error', language === 'tr' ? 'Lütfen geçerli bir miktar girin' : 'Please enter a valid amount');
                  return;
                }
                Alert.alert(
                  language === 'tr' ? 'İşlem Onayı' : 'Confirm Transaction',
                  `${allocateAmount}g ${allocateAsset} ${allocateType === 'stake' ? (language === 'tr' ? 'tahsis edilecek' : 'will be staked') : (language === 'tr' ? 'geri çekilecek' : 'will be unstaked')}`,
                  [
                    { text: language === 'tr' ? 'İptal' : 'Cancel', style: 'cancel' },
                    { 
                      text: language === 'tr' ? 'Onayla' : 'Confirm', 
                      onPress: () => {
                        Alert.alert(language === 'tr' ? 'Başarılı' : 'Success', language === 'tr' ? 'İşlem tamamlandı!' : 'Transaction complete!');
                        setShowAllocateModal(false);
                        setAllocateAmount('');
                      }
                    }
                  ]
                );
              }}
            >
              <Text style={styles.tradeSubmitText}>
                {allocateType === 'stake' ? (language === 'tr' ? 'Tahsis Et' : 'Stake') : (language === 'tr' ? 'Geri Çek' : 'Unstake')} {allocateAsset}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Staked Assets Modal */}
      <Modal visible={showStakedAssets} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{language === "tr" ? "Tahsisli Varlıklar" : "Staked Assets"}</Text>
              <TouchableOpacity onPress={() => setShowStakedAssets(false)}>
                <Feather name="x" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              {/* AUXG Staked */}
              <View style={styles.stakedAssetItem}>
                <View style={styles.stakedAssetHeader}>
                  <View style={styles.stakedAssetInfo}>
                    <View style={[styles.stakedAssetIcon, { backgroundColor: Colors.gold + '20' }]}>
                      <Text style={{ color: Colors.gold, fontWeight: '700' }}>Au</Text>
                    </View>
                    <View>
                      <Text style={styles.stakedAssetSymbol}>AUXG</Text>
                      <Text style={styles.stakedAssetName}>{language === "tr" ? "Altın" : "Gold"}</Text>
                    </View>
                  </View>
                  <View style={styles.stakedAssetValues}>
                    <Text style={styles.stakedAssetAmount}>50,000</Text>
                    <Text style={styles.stakedAssetApy}>APY: 5.2%</Text>
                  </View>
                </View>
                <View style={styles.stakedAssetReward}>
                  <Text style={styles.stakedRewardLabel}>{language === "tr" ? "Kazanılan Ödül:" : "Earned Reward:"}</Text>
                  <Text style={styles.stakedRewardValue}>+2,150 AUXG</Text>
                </View>
              </View>

              {/* AUXS Staked */}
              <View style={styles.stakedAssetItem}>
                <View style={styles.stakedAssetHeader}>
                  <View style={styles.stakedAssetInfo}>
                    <View style={[styles.stakedAssetIcon, { backgroundColor: Colors.silver + '20' }]}>
                      <Text style={{ color: Colors.silver, fontWeight: '700' }}>Ag</Text>
                    </View>
                    <View>
                      <Text style={styles.stakedAssetSymbol}>AUXS</Text>
                      <Text style={styles.stakedAssetName}>{language === "tr" ? "Gümüş" : "Silver"}</Text>
                    </View>
                  </View>
                  <View style={styles.stakedAssetValues}>
                    <Text style={styles.stakedAssetAmount}>100,000</Text>
                    <Text style={styles.stakedAssetApy}>APY: 4.8%</Text>
                  </View>
                </View>
                <View style={styles.stakedAssetReward}>
                  <Text style={styles.stakedRewardLabel}>{language === "tr" ? "Kazanılan Ödül:" : "Earned Reward:"}</Text>
                  <Text style={styles.stakedRewardValue}>+4,000 AUXS</Text>
                </View>
              </View>

              {/* AUXPT Staked */}
              <View style={styles.stakedAssetItem}>
                <View style={styles.stakedAssetHeader}>
                  <View style={styles.stakedAssetInfo}>
                    <View style={[styles.stakedAssetIcon, { backgroundColor: Colors.platinum + '20' }]}>
                      <Text style={{ color: Colors.platinum, fontWeight: '700' }}>Pt</Text>
                    </View>
                    <View>
                      <Text style={styles.stakedAssetSymbol}>AUXPT</Text>
                      <Text style={styles.stakedAssetName}>{language === "tr" ? "Platin" : "Platinum"}</Text>
                    </View>
                  </View>
                  <View style={styles.stakedAssetValues}>
                    <Text style={styles.stakedAssetAmount}>10,000</Text>
                    <Text style={styles.stakedAssetApy}>APY: 6.1%</Text>
                  </View>
                </View>
                <View style={styles.stakedAssetReward}>
                  <Text style={styles.stakedRewardLabel}>{language === "tr" ? "Kazanılan Ödül:" : "Earned Reward:"}</Text>
                  <Text style={styles.stakedRewardValue}>+510 AUXPT</Text>
                </View>
              </View>

              {/* AUXPD Staked */}
              <View style={styles.stakedAssetItem}>
                <View style={styles.stakedAssetHeader}>
                  <View style={styles.stakedAssetInfo}>
                    <View style={[styles.stakedAssetIcon, { backgroundColor: Colors.palladium + '20' }]}>
                      <Text style={{ color: Colors.palladium, fontWeight: '700' }}>Pd</Text>
                    </View>
                    <View>
                      <Text style={styles.stakedAssetSymbol}>AUXPD</Text>
                      <Text style={styles.stakedAssetName}>{language === "tr" ? "Paladyum" : "Palladium"}</Text>
                    </View>
                  </View>
                  <View style={styles.stakedAssetValues}>
                    <Text style={styles.stakedAssetAmount}>5,000</Text>
                    <Text style={styles.stakedAssetApy}>APY: 5.5%</Text>
                  </View>
                </View>
                <View style={styles.stakedAssetReward}>
                  <Text style={styles.stakedRewardLabel}>{language === "tr" ? "Kazanılan Ödül:" : "Earned Reward:"}</Text>
                  <Text style={styles.stakedRewardValue}>+229 AUXPD</Text>
                </View>
              </View>

              {/* Total Summary */}
              <View style={styles.stakedTotalCard}>
                <Text style={styles.stakedTotalLabel}>{language === "tr" ? "Toplam Tahsisli Değer" : "Total Staked Value"}</Text>
                <Text style={styles.stakedTotalValue}>$12,847,500</Text>
                <Text style={styles.stakedTotalReward}>{language === "tr" ? "Toplam Kazanç: +$287,450" : "Total Earnings: +$287,450"}</Text>
              </View>
            </ScrollView>
            <TouchableOpacity style={styles.modalButton} onPress={() => setShowStakedAssets(false)}>
              <Text style={styles.modalButtonText}>{language === "tr" ? "Kapat" : "Close"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Assets Modal */}
      <Modal visible={showAssetsModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{language === "tr" ? "Varlıklarım" : "My Assets"}</Text>
              <TouchableOpacity onPress={() => setShowAssetsModal(false)}>
                <Feather name="x" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              {PORTFOLIO.map((item) => {
                const price = prices?.prices?.[item.symbol] || 0;
                const value = item.balance * price;
                const metal = METALS[item.symbol];
                return (
                  <View key={item.symbol} style={styles.stakedAssetItem}>
                    <View style={styles.stakedAssetHeader}>
                      <View style={styles.stakedAssetInfo}>
                        <View style={[styles.stakedAssetIcon, { backgroundColor: metal.color + '20' }]}>
                          <Text style={{ color: metal.color, fontWeight: '700', fontSize: 12 }}>{metal.symbol}</Text>
                        </View>
                        <View>
                          <Text style={styles.stakedAssetSymbol}>{item.symbol}</Text>
                          <Text style={styles.stakedAssetName}>{metal.name}</Text>
                        </View>
                      </View>
                      <View style={styles.stakedAssetValues}>
                        <Text style={styles.stakedAssetAmount}>{item.balance >= 1000000 ? (item.balance/1000000).toFixed(2) + 'M' : item.balance >= 1000 ? (item.balance/1000).toFixed(2) + 'K' : item.balance.toFixed(2)}g</Text>
                        <Text style={[styles.stakedAssetApy, { color: Colors.up }]}>${value >= 1000000 ? (value/1000000).toFixed(2) + 'M' : value >= 1000 ? (value/1000).toFixed(2) + 'K' : value.toFixed(2)}</Text>
                      </View>
                    </View>
                    <View style={styles.stakedAssetReward}>
                      <Text style={styles.stakedRewardLabel}>{language === "tr" ? "Güncel Fiyat:" : "Current Price:"}</Text>
                      <Text style={styles.stakedRewardValue}>${price.toFixed(2)}/g</Text>
                    </View>
                  </View>
                );
              })}

              {/* Toplam */}
              <View style={styles.stakedTotalCard}>
                <Text style={styles.stakedTotalLabel}>{language === "tr" ? "Toplam Varlık Değeri" : "Total Asset Value"}</Text>
                <Text style={styles.stakedTotalValue}>${totalValue >= 1000000 ? (totalValue/1000000).toFixed(2) + 'M' : totalValue >= 1000 ? (totalValue/1000).toFixed(2) + 'K' : totalValue.toFixed(2)}</Text>
              </View>
            </ScrollView>
            <TouchableOpacity style={styles.modalButton} onPress={() => setShowAssetsModal(false)}>
              <Text style={styles.modalButtonText}>{language === "tr" ? "Kapat" : "Close"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Locations Modal */}
      <Modal visible={showLocationsModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{language === "tr" ? "Saklama Lokasyonları" : "Storage Locations"}</Text>
              <TouchableOpacity onPress={() => setShowLocationsModal(false)}>
                <Feather name="x" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              {/* Istanbul */}
              <View style={styles.locationItem}>
                <View style={styles.locationHeader}>
                  <View style={styles.locationIconContainer}>
                    <Feather name="map-pin" size={20} color={Colors.primary} />
                  </View>
                  <View style={styles.locationInfo}>
                    <Text style={styles.locationName}>Istanbul, Türkiye</Text>
                    <Text style={styles.locationAddress}>Maslak Kasa Merkezi</Text>
                  </View>
                  <View style={[styles.locationStatus, { backgroundColor: Colors.up + '20' }]}>
                    <Text style={[styles.locationStatusText, { color: Colors.up }]}>{language === "tr" ? "Aktif" : "Active"}</Text>
                  </View>
                </View>
                <View style={styles.locationAssets}>
                  <Text style={styles.locationAssetsLabel}>{language === "tr" ? "Saklanan Varlıklar:" : "Stored Assets:"}</Text>
                  <Text style={styles.locationAssetsValue}>2.5g AUXG, 15g AUXS</Text>
                </View>
              </View>

              {/* Zurich */}
              <View style={styles.locationItem}>
                <View style={styles.locationHeader}>
                  <View style={styles.locationIconContainer}>
                    <Feather name="map-pin" size={20} color={Colors.primary} />
                  </View>
                  <View style={styles.locationInfo}>
                    <Text style={styles.locationName}>Zurich, İsviçre</Text>
                    <Text style={styles.locationAddress}>Swiss Vault AG</Text>
                  </View>
                  <View style={[styles.locationStatus, { backgroundColor: Colors.up + '20' }]}>
                    <Text style={[styles.locationStatusText, { color: Colors.up }]}>{language === "tr" ? "Aktif" : "Active"}</Text>
                  </View>
                </View>
                <View style={styles.locationAssets}>
                  <Text style={styles.locationAssetsLabel}>{language === "tr" ? "Saklanan Varlıklar:" : "Stored Assets:"}</Text>
                  <Text style={styles.locationAssetsValue}>10g AUXG, 50g AUXPT</Text>
                </View>
              </View>

              {/* London */}
              <View style={styles.locationItem}>
                <View style={styles.locationHeader}>
                  <View style={styles.locationIconContainer}>
                    <Feather name="map-pin" size={20} color={Colors.primary} />
                  </View>
                  <View style={styles.locationInfo}>
                    <Text style={styles.locationName}>London, İngiltere</Text>
                    <Text style={styles.locationAddress}>LBMA Certified Vault</Text>
                  </View>
                  <View style={[styles.locationStatus, { backgroundColor: Colors.up + '20' }]}>
                    <Text style={[styles.locationStatusText, { color: Colors.up }]}>{language === "tr" ? "Aktif" : "Active"}</Text>
                  </View>
                </View>
                <View style={styles.locationAssets}>
                  <Text style={styles.locationAssetsLabel}>{language === "tr" ? "Saklanan Varlıklar:" : "Stored Assets:"}</Text>
                  <Text style={styles.locationAssetsValue}>5g AUXPD, 25g AUXS</Text>
                </View>
              </View>

              {/* Singapore */}
              <View style={styles.locationItem}>
                <View style={styles.locationHeader}>
                  <View style={styles.locationIconContainer}>
                    <Feather name="map-pin" size={20} color={Colors.primary} />
                  </View>
                  <View style={styles.locationInfo}>
                    <Text style={styles.locationName}>Singapore</Text>
                    <Text style={styles.locationAddress}>Freeport Singapore</Text>
                  </View>
                  <View style={[styles.locationStatus, { backgroundColor: Colors.up + '20' }]}>
                    <Text style={[styles.locationStatusText, { color: Colors.up }]}>{language === "tr" ? "Aktif" : "Active"}</Text>
                  </View>
                </View>
                <View style={styles.locationAssets}>
                  <Text style={styles.locationAssetsLabel}>{language === "tr" ? "Saklanan Varlıklar:" : "Stored Assets:"}</Text>
                  <Text style={styles.locationAssetsValue}>8g AUXG, 100g AUXS</Text>
                </View>
              </View>

              {/* Dubai */}
              <View style={styles.locationItem}>
                <View style={styles.locationHeader}>
                  <View style={styles.locationIconContainer}>
                    <Feather name="map-pin" size={20} color={Colors.primary} />
                  </View>
                  <View style={styles.locationInfo}>
                    <Text style={styles.locationName}>Dubai, BAE</Text>
                    <Text style={styles.locationAddress}>DMCC Gold Vault</Text>
                  </View>
                  <View style={[styles.locationStatus, { backgroundColor: Colors.up + '20' }]}>
                    <Text style={[styles.locationStatusText, { color: Colors.up }]}>{language === "tr" ? "Aktif" : "Active"}</Text>
                  </View>
                </View>
                <View style={styles.locationAssets}>
                  <Text style={styles.locationAssetsLabel}>{language === "tr" ? "Saklanan Varlıklar:" : "Stored Assets:"}</Text>
                  <Text style={styles.locationAssetsValue}>15g AUXG, 5g AUXPT</Text>
                </View>
              </View>
            </ScrollView>
            <TouchableOpacity style={styles.modalButton} onPress={() => setShowLocationsModal(false)}>
              <Text style={styles.modalButtonText}>{language === "tr" ? "Kapat" : "Close"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// ============================================
// TAHSİS ET EKRANI
// ============================================
function AllocateScreen({ prices, isLive }) {
  const [selectedMetal, setSelectedMetal] = useState('AUXG');
  const [allocationType, setAllocationType] = useState('stake'); // stake, unstake
  const [amount, setAmount] = useState('');

  const portfolioItem = PORTFOLIO.find(p => p.symbol === selectedMetal);
  const balance = portfolioItem?.balance || 0;
  const price = prices?.prices?.[selectedMetal] || 0;
  const amountNum = parseFloat(amount) || 0;
  const totalValue = amountNum * price;

  // Mock staked data
  const stakedData = {
    AUXG: { staked: 50000, apy: 5.2, rewards: 2150 },
    AUXS: { staked: 100000, apy: 4.8, rewards: 4000 },
    AUXPT: { staked: 10000, apy: 6.1, rewards: 510 },
    AUXPD: { staked: 5000, apy: 5.5, rewards: 229 },
  };

  const currentStaked = stakedData[selectedMetal];

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Tahsis Et</Text>
        <View style={[styles.liveIndicator, !isLive && styles.demoIndicator]}>
          <View style={[styles.liveDot, !isLive && styles.demoDot]} />
          <Text style={[styles.liveText, !isLive && styles.demoText]}>
            {isLive ? 'Canlı' : 'Demo'}
          </Text>
        </View>
      </View>

      {/* Metal Seçimi */}
      <View style={styles.allocateMetalSelector}>
        {METAL_ORDER.map(symbol => {
          const metal = METALS[symbol];
          return (
            <TouchableOpacity
              key={symbol}
              style={[styles.allocateMetalBtn, selectedMetal === symbol && styles.allocateMetalBtnActive]}
              onPress={() => setSelectedMetal(symbol)}
            >
              <MetalIcon symbol={symbol} size={24} />
              <Text style={[styles.allocateMetalText, selectedMetal === symbol && { color: metal.color }]}>
                {symbol}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Staking Bilgileri */}
      <View style={styles.allocateInfoCard}>
        <View style={styles.allocateInfoRow}>
          <Text style={styles.allocateInfoLabel}>Toplam Tahsis</Text>
          <Text style={styles.allocateInfoValue}>{formatBalance(currentStaked.staked)}g</Text>
        </View>
        <View style={styles.allocateInfoRow}>
          <Text style={styles.allocateInfoLabel}>APY</Text>
          <Text style={[styles.allocateInfoValue, { color: Colors.up }]}>{currentStaked.apy}%</Text>
        </View>
        <View style={styles.allocateInfoRow}>
          <Text style={styles.allocateInfoLabel}>Kazanılan Ödül</Text>
          <Text style={[styles.allocateInfoValue, { color: Colors.gold }]}>{currentStaked.rewards}g</Text>
        </View>
      </View>

      {/* Tip Seçimi */}
      <View style={styles.allocateTypeSelector}>
        <TouchableOpacity
          style={[styles.allocateTypeBtn, allocationType === 'stake' && styles.allocateTypeBtnActive]}
          onPress={() => setAllocationType('stake')}
        >
          <Text style={[styles.allocateTypeText, allocationType === 'stake' && styles.allocateTypeTextActive]}>
            Tahsis Et
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.allocateTypeBtn, allocationType === 'unstake' && styles.allocateTypeBtnActive]}
          onPress={() => setAllocationType('unstake')}
        >
          <Text style={[styles.allocateTypeText, allocationType === 'unstake' && styles.allocateTypeTextActive]}>
            Geri Çek
          </Text>
        </TouchableOpacity>
      </View>

      {/* Miktar Girişi */}
      <View style={styles.allocateInputCard}>
        <View style={styles.allocateInputHeader}>
          <Text style={styles.allocateInputLabel}>
            {allocationType === 'stake' ? 'Tahsis Miktarı' : 'Çekilecek Miktar'}
          </Text>
          <Text style={styles.allocateBalanceText}>
            Bakiye: {formatBalance(allocationType === 'stake' ? balance : currentStaked.staked)}g
          </Text>
        </View>
        <View style={styles.allocateInputRow}>
          <TextInput
            style={styles.allocateInput}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor={Colors.textMuted}
            keyboardType="decimal-pad"
          />
          <TouchableOpacity 
            style={styles.allocateMaxBtn}
            onPress={() => setAmount(String(allocationType === 'stake' ? balance : currentStaked.staked))}
          >
            <Text style={styles.allocateMaxText}>MAX</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.allocateUsdValue}>≈ ${totalValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}</Text>
      </View>

      {/* Quick Amounts */}
      <View style={styles.allocateQuickAmounts}>
        {['25%', '50%', '75%', '100%'].map(pct => {
          const maxAmount = allocationType === 'stake' ? balance : currentStaked.staked;
          return (
            <TouchableOpacity
              key={pct}
              style={styles.allocateQuickBtn}
              onPress={() => setAmount(String(maxAmount * parseInt(pct) / 100))}
            >
              <Text style={styles.allocateQuickText}>{pct}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Confirm Button */}
      <TouchableOpacity 
        style={[styles.allocateConfirmBtn, amountNum <= 0 && styles.allocateConfirmBtnDisabled]}
        onPress={() => {
          if (amountNum <= 0) return;
          Alert.alert(
            'İşlem Onayı',
            `${amountNum.toFixed(2)}g ${selectedMetal} ${allocationType === 'stake' ? 'tahsis edilecek' : 'geri çekilecek'}.\n\nBu işlemi onaylıyor musunuz?`,
            [
              { text: 'İptal', style: 'cancel' },
              { text: 'Onayla', onPress: () => Alert.alert('Başarılı', 'İşlem tamamlandı!') }
            ]
          );
        }}
      >
        <Text style={styles.allocateConfirmText}>
          {allocationType === 'stake' ? 'Tahsis Et' : 'Geri Çek'}
        </Text>
      </TouchableOpacity>

      {/* Nasıl Çalışır & Özellikler Kartları */}
      <View style={styles.allocateInfoSection}>
        {/* Nasıl Çalışır */}
        <View style={styles.allocateInfoCard}>
          <Text style={styles.allocateInfoTitle}>Nasıl Çalışır?</Text>
          <View style={styles.allocateInfoList}>
            <View style={styles.allocateInfoItem}>
              <View style={styles.allocateInfoBullet} />
              <Text style={styles.allocateInfoText}>Metal tokenlerinizi seçin ve tahsis edin</Text>
            </View>
            <View style={styles.allocateInfoItem}>
              <View style={styles.allocateInfoBullet} />
              <Text style={styles.allocateInfoText}>3, 6 veya 12 ay kilitleme süresi seçin</Text>
            </View>
            <View style={styles.allocateInfoItem}>
              <View style={styles.allocateInfoBullet} />
              <Text style={styles.allocateInfoText}>APY bazında getiri kazanın</Text>
            </View>
            <View style={styles.allocateInfoItem}>
              <View style={styles.allocateInfoBullet} />
              <Text style={styles.allocateInfoText}>Kilitleme süresi dolunca çekin</Text>
            </View>
          </View>
        </View>

        {/* Özellikler */}
        <View style={styles.allocateInfoCard}>
          <Text style={styles.allocateInfoTitle}>Özellikler</Text>
          <View style={styles.allocateFeaturesGrid}>
            <View style={styles.allocateFeatureItem}>
              <Text style={styles.allocateFeatureIcon}>🔒</Text>
              <Text style={styles.allocateFeatureText}>Sigortalı Saklama</Text>
            </View>
            <View style={styles.allocateFeatureItem}>
              <Text style={styles.allocateFeatureIcon}>💰</Text>
              <Text style={styles.allocateFeatureText}>Tam Tahsisli</Text>
            </View>
            <View style={styles.allocateFeatureItem}>
              <Text style={styles.allocateFeatureIcon}>🏢</Text>
              <Text style={styles.allocateFeatureText}>Kurumsal Ortaklıklar</Text>
            </View>
            <View style={styles.allocateFeatureItem}>
              <Text style={styles.allocateFeatureIcon}>💵</Text>
              <Text style={styles.allocateFeatureText}>Metal Cinsinden Getiri</Text>
            </View>
            <View style={styles.allocateFeatureItem}>
              <Text style={styles.allocateFeatureIcon}>📊</Text>
              <Text style={styles.allocateFeatureText}>Şeffaf Raporlama</Text>
            </View>
            <View style={styles.allocateFeatureItem}>
              <Text style={styles.allocateFeatureIcon}>⛓️</Text>
              <Text style={styles.allocateFeatureText}>Blokzinciri Kaydı</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

// ============================================
// ANA UYGULAMA
// ============================================
export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [prices, setPrices] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [language, setLanguage] = useState('tr');
  const [cryptoPrices, setCryptoPrices] = useState({ BTC: { price: 95000, change: 0 }, ETH: { price: 3400, change: 0 }, USDT: { price: 1, change: 0 }, TRY: { price: 34.5, change: 0 } });
  
  // Wallet State
  const [walletStep, setWalletStep] = useState('checking'); // checking, onboarding, create, verify, pin, confirm-pin, import, unlock, ready
  const [walletAddress, setWalletAddress] = useState(null);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletConnecting, setWalletConnecting] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletType, setWalletType] = useState(null);
  const [showGlobalSendModal, setShowGlobalSendModal] = useState(false);
  
  // Onboarding State
  const [seedPhrase, setSeedPhrase] = useState([]);
  const [firstPin, setFirstPin] = useState('');
  const [storedPinHash, setStoredPinHash] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [verifyStep, setVerifyStep] = useState(0);
  const [verifyIndices, setVerifyIndices] = useState([]);
  const [seedRevealed, setSeedRevealed] = useState(false);
  const [importSeedInput, setImportSeedInput] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);
  
  const pinInputRef = useRef(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  // Çeviri fonksiyonu
  const t = (key) => {
    return translations[language][key] || key;
  };

  // QR kod tarama
  const handleQRScan = ({ data }) => {
    if (data) {
      // QR'dan gelen veriyi seed input'a aktar
      setImportSeedInput(data);
      setShowQRScanner(false);
    }
  };

  const openQRScanner = async () => {
    if (!cameraPermission?.granted) {
      const permission = await requestCameraPermission();
      if (!permission.granted) {
        Alert.alert(
          language === 'tr' ? 'İzin Gerekli' : 'Permission Required',
          language === 'tr' ? 'QR kod taramak için kamera izni gerekli' : 'Camera permission is required to scan QR codes'
        );
        return;
      }
    }
    setShowQRScanner(true);
  };

  // Check wallet on mount
  useEffect(() => {
    checkWalletExists();
  }, []);

  const checkWalletExists = async () => {
    try {
      const hasWallet = await SecureStore.getItemAsync(STORAGE_KEYS.HAS_WALLET);
      const pinHash = await SecureStore.getItemAsync(STORAGE_KEYS.PIN_HASH);
      const address = await SecureStore.getItemAsync(STORAGE_KEYS.WALLET_ADDRESS);
      
      if (hasWallet === 'true' && pinHash) {
        setStoredPinHash(pinHash);
        setWalletAddress(address);
        setWalletStep('unlock');
      } else {
        setWalletStep('onboarding');
      }
    } catch (error) {
      console.error('Check wallet error:', error);
      setWalletStep('onboarding');
    }
  };

  // Create new wallet
  const handleCreateWallet = () => {
    const newSeed = generateSeedPhrase();
    setSeedPhrase(newSeed);
    setSeedRevealed(false);
    setWalletStep('create');
  };

  // Generate random verify indices
  const generateVerifyIndices = () => {
    const indices = [];
    while (indices.length < 3) {
      const idx = Math.floor(Math.random() * 12);
      if (!indices.includes(idx)) {
        indices.push(idx);
      }
    }
    return indices.sort((a, b) => a - b);
  };

  // After showing seed
  const handleSeedContinue = () => {
    setVerifyIndices(generateVerifyIndices());
    setVerifyStep(0);
    setWalletStep('verify');
  };

  // Verify word selection
  const handleVerifyWord = (word, correctWord) => {
    if (word === correctWord) {
      if (verifyStep < 2) {
        setVerifyStep(verifyStep + 1);
      } else {
        setPinInput('');
        setWalletStep('pin');
      }
      return true;
    }
    return false;
  };

  // Set first PIN
  const handleFirstPin = (pin) => {
    setFirstPin(pin);
    setPinInput('');
    setWalletStep('confirm-pin');
  };

  // Confirm PIN and save wallet
  const handleConfirmPin = async (pin) => {
    if (pin !== firstPin) {
      setPinError(true);
      setPinInput('');
      setTimeout(() => setPinError(false), 1500);
      return;
    }

    try {
      const pinHash = await hashPin(pin);
      const encryptedSeed = await encryptSeed(seedPhrase, pin);
      const address = await deriveAddressFromSeed(seedPhrase);
      
      await SecureStore.setItemAsync(STORAGE_KEYS.HAS_WALLET, 'true');
      await SecureStore.setItemAsync(STORAGE_KEYS.PIN_HASH, pinHash);
      await SecureStore.setItemAsync(STORAGE_KEYS.ENCRYPTED_SEED, encryptedSeed);
      await SecureStore.setItemAsync(STORAGE_KEYS.WALLET_ADDRESS, address);
      
      setWalletAddress(address);
      setIsWalletConnected(true);
      setWalletStep('ready');
    } catch (error) {
      console.error('Save wallet error:', error);
      Alert.alert('Error', 'Failed to save wallet');
    }
  };

  // Import wallet
  const handleImportWallet = () => {
    setImportSeedInput('');
    setWalletStep('import');
  };

  const handleImportSubmit = () => {
    const words = importSeedInput.trim().toLowerCase().split(/\s+/);
    
    if (words.length !== 12 && words.length !== 24) {
      Alert.alert(
        language === 'tr' ? 'Hata' : 'Error',
        language === 'tr' ? 'Geçersiz kurtarma ifadesi' : 'Invalid recovery phrase'
      );
      return;
    }

    const validWords = words.every(word => BIP39_WORDLIST.includes(word));
    if (!validWords) {
      Alert.alert(
        language === 'tr' ? 'Hata' : 'Error',
        language === 'tr' ? 'Geçersiz kelimeler' : 'Invalid words'
      );
      return;
    }

    setSeedPhrase(words);
    setPinInput('');
    setWalletStep('pin');
  };

  // Unlock wallet with PIN
  const handleUnlock = async (pin) => {
    const enteredHash = await hashPin(pin);
    
    if (enteredHash === storedPinHash) {
      setIsWalletConnected(true);
      setWalletStep('ready');
    } else {
      setPinError(true);
      setPinInput('');
      setTimeout(() => setPinError(false), 1500);
    }
  };

  // Forgot PIN
  const handleForgotPin = () => {
    Alert.alert(
      language === 'tr' ? 'PIN\'i Sıfırla' : 'Reset PIN',
      language === 'tr' 
        ? 'Cüzdanınızı kurtarmak için seed phrase ile yeniden içe aktarın.'
        : 'Re-import with your seed phrase to recover.',
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: language === 'tr' ? 'İçe Aktar' : 'Import', 
          onPress: async () => {
            await SecureStore.deleteItemAsync(STORAGE_KEYS.HAS_WALLET);
            await SecureStore.deleteItemAsync(STORAGE_KEYS.PIN_HASH);
            await SecureStore.deleteItemAsync(STORAGE_KEYS.ENCRYPTED_SEED);
            await SecureStore.deleteItemAsync(STORAGE_KEYS.WALLET_ADDRESS);
            setWalletStep('import');
          }
        },
      ]
    );
  };

  // Wallet Connect fonksiyonları (harici cüzdan için)
  const connectWallet = async (type) => {
    setWalletConnecting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const demoAddress = '0xD24B...E944';
      
      setWalletAddress(demoAddress);
      setIsWalletConnected(true);
      setWalletType(type);
      setShowWalletModal(false);
      setIsLive(true);
      
      Alert.alert(
        language === 'tr' ? 'Başarılı' : 'Success',
        language === 'tr' ? 'Cüzdan bağlandı!' : 'Wallet connected!'
      );
    } catch (error) {
      console.error('Wallet connection error:', error);
      Alert.alert(
        language === 'tr' ? 'Hata' : 'Error',
        language === 'tr' ? 'Cüzdan bağlantısı başarısız' : 'Wallet connection failed'
      );
    } finally {
      setWalletConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    setIsWalletConnected(false);
    setWalletType(null);
    setIsLive(false);
  };

  // Load prices
  const loadPrices = useCallback(async function() {
    // Crypto fiyatlarını çek
    const cryptoData = await fetchCryptoPrices();
    if (cryptoData) setCryptoPrices(cryptoData);
    const data = await fetchPrices();
    setPrices(data);
    setIsLive(data.isLive === true);
    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(function() {
    if (walletStep === 'ready') {
      loadPrices();
      const interval = setInterval(loadPrices, 10000);
      return function() { clearInterval(interval); };
    }
  }, [loadPrices, walletStep]);

  const onRefresh = async function() {
    setRefreshing(true);
    await loadPrices();
    setRefreshing(false);
  };

  // ============================================
  // ONBOARDING SCREENS
  // ============================================

  // Checking Screen
  if (walletStep === 'checking') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
        <View style={styles.authContainer}>
          <View style={onboardStyles.logoCircle}>
            <Ionicons name="wallet" size={48} color={Colors.primary} />
          </View>
          <Text style={styles.authTitle}>Auxite Wallet</Text>
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 20 }} />
        </View>
      </SafeAreaView>
    );
  }

  // Onboarding Screen
  if (walletStep === 'onboarding') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
        <View style={onboardStyles.content}>
          <View style={onboardStyles.logoCircle}>
            <Ionicons name="wallet" size={48} color={Colors.primary} />
          </View>
          
          <Text style={onboardStyles.title}>{t('welcomeTitle')}</Text>
          <Text style={onboardStyles.subtitle}>{t('welcomeSubtitle')}</Text>
          
          <View style={onboardStyles.features}>
            <View style={onboardStyles.featureItem}>
              <Feather name="shield" size={20} color={Colors.primary} />
              <Text style={onboardStyles.featureText}>Non-custodial</Text>
            </View>
            <View style={onboardStyles.featureItem}>
              <Feather name="key" size={20} color={Colors.primary} />
              <Text style={onboardStyles.featureText}>Your Keys</Text>
            </View>
            <View style={onboardStyles.featureItem}>
              <Feather name="lock" size={20} color={Colors.primary} />
              <Text style={onboardStyles.featureText}>Secure</Text>
            </View>
          </View>
          
          <View style={onboardStyles.buttonContainer}>
            <TouchableOpacity style={onboardStyles.primaryBtn} onPress={handleCreateWallet}>
              <Feather name="plus-circle" size={20} color="#fff" style={{ marginRight: 10 }} />
              <Text style={onboardStyles.primaryBtnText}>{t('createNewWallet')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={onboardStyles.secondaryBtn} onPress={handleImportWallet}>
              <Feather name="download" size={20} color={Colors.primary} style={{ marginRight: 10 }} />
              <Text style={onboardStyles.secondaryBtnText}>{t('importWallet')}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={onboardStyles.securityNote}>
            <Feather name="info" size={14} color={Colors.textMuted} />
            <Text style={onboardStyles.securityNoteText}>{t('keysOnDevice')}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Seed Phrase Screen
  if (walletStep === 'create') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
        <ScrollView contentContainerStyle={onboardStyles.scrollContent}>
          <TouchableOpacity style={onboardStyles.backBtn} onPress={() => setWalletStep('onboarding')}>
            <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          
          <Text style={onboardStyles.title}>{t('seedPhraseTitle')}</Text>
          
          <View style={onboardStyles.warningBox}>
            <Text style={onboardStyles.warningText}>{t('seedPhraseWarning')}</Text>
          </View>
          
          <View style={onboardStyles.seedGrid}>
            {seedPhrase.map((word, index) => (
              <View key={index} style={onboardStyles.seedWord}>
                <Text style={onboardStyles.seedNumber}>{index + 1}</Text>
                <Text style={[onboardStyles.seedText, !seedRevealed && onboardStyles.seedBlur]}>
                  {seedRevealed ? word : '••••••'}
                </Text>
              </View>
            ))}
          </View>
          
          {!seedRevealed && (
            <TouchableOpacity style={onboardStyles.revealBtn} onPress={() => setSeedRevealed(true)}>
              <Feather name="eye" size={18} color={Colors.primary} />
              <Text style={onboardStyles.revealText}>
                {language === 'tr' ? 'Kelimeleri Göster' : 'Reveal Words'}
              </Text>
            </TouchableOpacity>
          )}
          
          <View style={onboardStyles.tips}>
            <Text style={onboardStyles.tipsTitle}>{t('securityTip')}</Text>
            <View style={onboardStyles.tipItem}>
              <Feather name="x-circle" size={16} color={Colors.error} />
              <Text style={onboardStyles.tipText}>{t('neverShare')}</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={[onboardStyles.primaryBtn, !seedRevealed && onboardStyles.btnDisabled]} 
            onPress={handleSeedContinue}
            disabled={!seedRevealed}
          >
            <Text style={onboardStyles.primaryBtnText}>{t('iWroteItDown')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Verify Seed Screen
  if (walletStep === 'verify') {
    const currentIndex = verifyIndices[verifyStep];
    const correctWord = seedPhrase[currentIndex];
    
    const getOptions = () => {
      const options = [correctWord];
      while (options.length < 4) {
        const randomWord = BIP39_WORDLIST[Math.floor(Math.random() * BIP39_WORDLIST.length)];
        if (!options.includes(randomWord)) {
          options.push(randomWord);
        }
      }
      return options.sort(() => Math.random() - 0.5);
    };
    
    const [options] = useState(getOptions);
    
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
        <View style={onboardStyles.content}>
          <TouchableOpacity style={onboardStyles.backBtn} onPress={() => setWalletStep('create')}>
            <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          
          <Text style={onboardStyles.title}>{t('verifyTitle')}</Text>
          
          <View style={onboardStyles.progress}>
            {[0, 1, 2].map((step) => (
              <View key={step} style={[onboardStyles.progressDot, step <= verifyStep && onboardStyles.progressActive]} />
            ))}
          </View>
          
          <View style={onboardStyles.verifyPrompt}>
            <Text style={onboardStyles.verifyText}>{t('selectWord')}{currentIndex + 1}</Text>
          </View>
          
          <View style={onboardStyles.optionsGrid}>
            {options.map((word, index) => (
              <TouchableOpacity
                key={index}
                style={onboardStyles.optionBtn}
                onPress={() => {
                  const success = handleVerifyWord(word, correctWord);
                  if (!success) {
                    Alert.alert(t('verifyError'));
                  }
                }}
              >
                <Text style={onboardStyles.optionText}>{word}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // PIN Setup Screen
  if (walletStep === 'pin' || walletStep === 'confirm-pin') {
    const isConfirm = walletStep === 'confirm-pin';
    
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
        <View style={onboardStyles.content}>
          <TouchableOpacity style={onboardStyles.backBtn} onPress={() => setWalletStep(isConfirm ? 'pin' : 'verify')}>
            <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          
          <View style={onboardStyles.pinIcon}>
            <Feather name="lock" size={40} color={Colors.primary} />
          </View>
          
          <Text style={onboardStyles.title}>{isConfirm ? t('confirmPinTitle') : t('setPinTitle')}</Text>
          <Text style={onboardStyles.subtitle}>{t('setPinSubtitle')}</Text>
          
          <View style={onboardStyles.pinDots}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <View key={i} style={[
                onboardStyles.pinDot, 
                i < pinInput.length && onboardStyles.pinDotFilled,
                pinError && onboardStyles.pinDotError
              ]} />
            ))}
          </View>
          
          <TextInput
            ref={pinInputRef}
            style={onboardStyles.hiddenInput}
            value={pinInput}
            onChangeText={(text) => {
              const clean = text.replace(/[^0-9]/g, '').substring(0, 6);
              setPinInput(clean);
              setPinError(false);
              
              if (clean.length === 6) {
                if (isConfirm) {
                  handleConfirmPin(clean);
                } else {
                  handleFirstPin(clean);
                }
              }
            }}
            keyboardType="numeric"
            maxLength={6}
            secureTextEntry
            autoFocus
          />
          
          {pinError && (
            <View style={onboardStyles.errorBox}>
              <Feather name="x-circle" size={16} color={Colors.error} />
              <Text style={onboardStyles.errorText}>{t('pinMismatch')}</Text>
            </View>
          )}
          
          <TouchableOpacity onPress={() => pinInputRef.current?.focus()} style={onboardStyles.keypadHint}>
            <Text style={onboardStyles.keypadHintText}>
              {language === 'tr' ? 'Klavyeyi kullanın' : 'Use keyboard'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Import Wallet Screen
  if (walletStep === 'import') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
        
        {/* QR Scanner Modal */}
        <Modal visible={showQRScanner} animationType="slide">
          <SafeAreaView style={qrStyles.container}>
            <View style={qrStyles.header}>
              <TouchableOpacity onPress={() => setShowQRScanner(false)} style={qrStyles.closeBtn}>
                <Feather name="x" size={28} color={Colors.textPrimary} />
              </TouchableOpacity>
              <Text style={qrStyles.title}>
                {language === 'tr' ? 'QR Kod Tara' : 'Scan QR Code'}
              </Text>
              <View style={{ width: 40 }} />
            </View>
            
            <View style={qrStyles.cameraContainer}>
              <CameraView
                style={qrStyles.camera}
                facing="back"
                barcodeScannerSettings={{
                  barcodeTypes: ['qr'],
                }}
                onBarcodeScanned={handleQRScan}
              />
              <View style={qrStyles.overlay}>
                <View style={qrStyles.scanFrame}>
                  <View style={[qrStyles.corner, qrStyles.topLeft]} />
                  <View style={[qrStyles.corner, qrStyles.topRight]} />
                  <View style={[qrStyles.corner, qrStyles.bottomLeft]} />
                  <View style={[qrStyles.corner, qrStyles.bottomRight]} />
                </View>
              </View>
            </View>
            
            <Text style={qrStyles.hint}>
              {language === 'tr' ? 'Kurtarma ifadesi içeren QR kodu tarayın' : 'Scan QR code containing recovery phrase'}
            </Text>
          </SafeAreaView>
        </Modal>
        
        <ScrollView contentContainerStyle={onboardStyles.scrollContent}>
          <TouchableOpacity style={onboardStyles.backBtn} onPress={() => setWalletStep('onboarding')}>
            <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          
          <Text style={onboardStyles.title}>{t('importWallet')}</Text>
          <Text style={onboardStyles.subtitle}>
            {language === 'tr' ? '12 veya 24 kelimelik kurtarma ifadenizi girin' : 'Enter your 12 or 24 word recovery phrase'}
          </Text>
          
          {/* QR Scan Button */}
          <TouchableOpacity style={qrStyles.scanButton} onPress={openQRScanner}>
            <Feather name="camera" size={24} color={Colors.primary} />
            <Text style={qrStyles.scanButtonText}>
              {language === 'tr' ? 'QR Kod ile Tara' : 'Scan QR Code'}
            </Text>
          </TouchableOpacity>
          
          <View style={qrStyles.divider}>
            <View style={qrStyles.dividerLine} />
            <Text style={qrStyles.dividerText}>
              {language === 'tr' ? 'veya manuel girin' : 'or enter manually'}
            </Text>
            <View style={qrStyles.dividerLine} />
          </View>
          
          <View style={onboardStyles.importContainer}>
            <TextInput
              style={onboardStyles.importInput}
              value={importSeedInput}
              onChangeText={setImportSeedInput}
              placeholder={language === 'tr' ? 'Kurtarma ifadesini girin...' : 'Enter recovery phrase...'}
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={4}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          
          <TouchableOpacity 
            style={[onboardStyles.primaryBtn, !importSeedInput.trim() && onboardStyles.btnDisabled]} 
            onPress={handleImportSubmit}
            disabled={!importSeedInput.trim()}
          >
            <Feather name="download" size={20} color="#fff" style={{ marginRight: 10 }} />
            <Text style={onboardStyles.primaryBtnText}>{language === 'tr' ? 'İçe Aktar' : 'Import'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Unlock Screen (PIN Entry)
  if (walletStep === 'unlock') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
        <View style={onboardStyles.content}>
          <View style={onboardStyles.pinIcon}>
            <Feather name="lock" size={48} color={Colors.primary} />
          </View>
          
          <Text style={onboardStyles.title}>{t('enterPinTitle')}</Text>
          <Text style={onboardStyles.subtitle}>
            {language === 'tr' ? 'Cüzdanınıza erişmek için PIN girin' : 'Enter PIN to access your wallet'}
          </Text>
          
          <View style={onboardStyles.pinDots}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <View key={i} style={[
                onboardStyles.pinDot, 
                i < pinInput.length && onboardStyles.pinDotFilled,
                pinError && onboardStyles.pinDotError
              ]} />
            ))}
          </View>
          
          <TextInput
            ref={pinInputRef}
            style={onboardStyles.hiddenInput}
            value={pinInput}
            onChangeText={(text) => {
              const clean = text.replace(/[^0-9]/g, '').substring(0, 6);
              setPinInput(clean);
              setPinError(false);
              
              if (clean.length === 6) {
                handleUnlock(clean);
              }
            }}
            keyboardType="numeric"
            maxLength={6}
            secureTextEntry
            autoFocus
          />
          
          {pinError && (
            <View style={onboardStyles.errorBox}>
              <Feather name="x-circle" size={16} color={Colors.error} />
              <Text style={onboardStyles.errorText}>{t('wrongPin')}</Text>
            </View>
          )}
          
          <TouchableOpacity style={onboardStyles.forgotBtn} onPress={handleForgotPin}>
            <Text style={onboardStyles.forgotText}>{t('forgotPin')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => pinInputRef.current?.focus()} style={onboardStyles.keypadHint}>
            <Text style={onboardStyles.keypadHintText}>
              {language === 'tr' ? 'Klavyeyi kullanın' : 'Use keyboard'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderScreen = function() {
    switch (activeTab) {
      case 'home':
        return (
          <NewHomeScreen 
            cryptoPrices={cryptoPrices}
            
            prices={prices} 
            isLive={isLive} 
            onRefresh={onRefresh} 
            refreshing={refreshing}
            lastUpdated={lastUpdated}
            onNavigateToSwap={function() { setActiveTab('swap'); }}
            onNavigateToAllocate={function() { setActiveTab('allocate'); }}
            onNavigateToSend={function() { setShowGlobalSendModal(true); }}
            language={language}
            t={t}
            onToggleLanguage={function() { setLanguage(language === 'tr' ? 'en' : 'tr'); }}
          />
        );
      case 'markets':
        return (
          <MarketsScreen 
            cryptoPrices={cryptoPrices}
            
            prices={prices} 
            isLive={isLive} 
            onRefresh={onRefresh} 
            refreshing={refreshing}
            language={language}
            t={t}
          />
        );
      case 'swap':
        return <SwapScreen prices={prices} isLive={isLive} language={language} t={t} />;
      case 'allocate':
        return <AllocateScreen prices={prices} isLive={isLive} language={language} t={t} />;
      case 'wallet':
        return <WalletScreen 
          prices={prices} 
          isLive={isLive} 
          language={language} 
          t={t} 
          setLanguage={setLanguage}
          walletAddress={walletAddress}
          isWalletConnected={isWalletConnected}
          onConnectWallet={() => setShowWalletModal(true)}
          onDisconnectWallet={disconnectWallet}
        />;
      default:
        return null;
    }
  };

  const tabs = [
    { key: 'home', icon: 'home', label: t('home') },
    { key: 'markets', icon: 'bar-chart-2', label: t('markets') },
    { key: 'swap', icon: 'repeat', label: t('swap') },
    { key: 'allocate', icon: 'pie-chart', label: t('allocate') },
    { key: 'wallet', icon: 'credit-card', label: t('wallet') },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      
      {/* Screen Content */}
      <View style={styles.screenContainer}>
        {renderScreen()}
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {tabs.map(function(tab) {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity 
              key={tab.key}
              style={styles.tabItem}
              onPress={function() { setActiveTab(tab.key); }}
            >
              <Feather 
                name={tab.icon} 
                size={20} 
                color={isActive ? Colors.primary : Colors.textMuted} 
              />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Wallet Connect Modal */}
      <WalletConnectModal
        visible={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onConnect={connectWallet}
        connecting={walletConnecting}
        language={language}
        t={t}
      />

      {/* Global Send Modal */}
      <Modal visible={showGlobalSendModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{language === "tr" ? "Gönder" : "Send"}</Text>
              <TouchableOpacity onPress={() => setShowGlobalSendModal(false)}>
                <Feather name="x" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalText}>{language === "tr" ? "Alıcı Adresi" : "Recipient Address"}</Text>
              <TextInput style={styles.modalInput} placeholder="0x..." placeholderTextColor={Colors.textMuted} />
              <Text style={styles.modalText}>{language === "tr" ? "Miktar" : "Amount"}</Text>
              <TextInput style={styles.modalInput} placeholder="0.00" keyboardType="numeric" placeholderTextColor={Colors.textMuted} />
            </View>
            <TouchableOpacity style={styles.modalButton} onPress={() => { Alert.alert(language === "tr" ? "Gönderildi" : "Sent"); setShowGlobalSendModal(false); }}>
              <Text style={styles.modalButtonText}>{language === "tr" ? "Gönder" : "Send"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ============================================
// ONBOARDING STİLLERİ
// ============================================
// ============================================
// QR SCANNER STİLLERİ
// ============================================
const qrStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeBtn: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: Colors.primary,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  hint: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    padding: 20,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '15',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: Colors.primary + '40',
    borderStyle: 'dashed',
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 10,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginHorizontal: 12,
  },
});

// ============================================
// ONBOARDING STİLLERİ
// ============================================
const onboardStyles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary + '40',
    marginBottom: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 48,
  },
  featureItem: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  featureText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 8,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 'auto',
    paddingBottom: 20,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryBtn: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  backBtn: {
    position: 'absolute',
    top: 50,
    left: 20,
    padding: 8,
    zIndex: 10,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    paddingVertical: 12,
  },
  securityNoteText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginLeft: 8,
  },
  warningBox: {
    backgroundColor: Colors.warning + '15',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.warning + '30',
    width: '100%',
  },
  warningText: {
    fontSize: 14,
    color: Colors.warning,
    lineHeight: 20,
    textAlign: 'center',
  },
  seedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
    width: '100%',
  },
  seedWord: {
    width: '31%',
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  seedNumber: {
    fontSize: 11,
    color: Colors.textMuted,
    marginRight: 8,
    minWidth: 18,
  },
  seedText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  seedBlur: {
    color: Colors.textMuted,
  },
  revealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 24,
  },
  revealText: {
    fontSize: 14,
    color: Colors.primary,
    marginLeft: 8,
    fontWeight: '500',
  },
  tips: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: '100%',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    color: Colors.textMuted,
    marginLeft: 10,
    flex: 1,
  },
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.border,
    marginHorizontal: 6,
  },
  progressActive: {
    backgroundColor: Colors.primary,
  },
  verifyPrompt: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
    width: '100%',
  },
  verifyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  optionBtn: {
    width: '48%',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  pinIcon: {
    marginBottom: 24,
  },
  pinDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  pinDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.card,
    marginHorizontal: 10,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  pinDotFilled: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pinDotError: {
    borderColor: Colors.error,
    backgroundColor: Colors.error + '30',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
  },
  keypadHint: {
    alignItems: 'center',
    marginTop: 24,
  },
  keypadHintText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error + '15',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
    marginLeft: 8,
  },
  forgotBtn: {
    alignItems: 'center',
    marginTop: 32,
  },
  forgotText: {
    fontSize: 14,
    color: Colors.primary,
  },
  importContainer: {
    width: '100%',
    marginBottom: 24,
  },
  importInput: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    color: Colors.textPrimary,
    fontSize: 15,
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: Colors.border,
  },
});

// ============================================
// STİLLER
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 35 : 0,
  },
  screenContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: Colors.textMuted,
    fontSize: 15,
    fontWeight: '500',
  },

  // Header - Robinhood Style
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginLeft: 10,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 4,
    fontWeight: '400',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 208, 156, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginRight: 6,
  },
  liveDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.up,
    shadowColor: Colors.up,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  liveIndicatorSmall: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveTextSmall: {
    fontSize: 9,
    color: Colors.up,
    marginLeft: 4,
    fontWeight: '600',
  },
  metricsLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  riskVolatility: {
    fontSize: 8,
    color: Colors.textMuted,
    marginTop: 2,
  },
  liveText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  demoIndicator: {
    backgroundColor: 'rgba(255, 193, 7, 0.12)',
  },
  demoDot: {
    backgroundColor: Colors.gold,
  },
  demoText: {
    color: Colors.gold,
  },

  // Portfolio Card - Compact
  portfolioCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  portfolioLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 6,
    fontWeight: '500',
  },
  portfolioValue: {
    fontSize: 28,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  portfolioCurrency: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
    fontWeight: '500',
  },

  // Actions - Compact
  actions: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
  actionButtonOutline: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
  actionIconStyle: {
    marginRight: 8,
  },
  actionText: {
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },

  // Section - Compact
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },

  // Card - Compact Asset Card
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  metalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metalTextContainer: {
    marginLeft: 10,
  },
  metalSymbol: {
    fontSize: 15,
    fontWeight: '600',
  },
  metalName: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  unit: {
    fontSize: 12,
    color: Colors.textMuted,
    marginLeft: 3,
  },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  balanceLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  balance: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  lastUpdatedContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
  },
  lastUpdated: {
    color: Colors.textMuted,
    fontSize: 11,
  },

  // Table (Markets)
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 6,
  },
  tableHeaderText: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 8,
  },
  tableCell: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tableCellSymbol: {
    fontSize: 13,
    fontWeight: '600',
  },
  tableCellName: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },
  tableCellPrice: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  tableChangeBadge: {
    flex: 0.8,
    alignItems: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  tableChangeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  
  // How It Works Card
  howItWorksCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
  },
  howItWorksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  howItWorksTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  howItWorksList: {
    gap: 12,
  },
  howItWorksItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  howItWorksBullet: {
    fontSize: 14,
    color: Colors.primary,
    marginRight: 10,
    fontWeight: '700',
  },
  howItWorksText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  
  // Legacy styles (keep for compatibility)
  infoBox: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  spreadCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  spreadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  spreadTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  spreadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  spreadMetalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spreadMetal: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  spreadValue: {
    fontSize: 14,
    color: Colors.textSecondary,
  },

  // Swap
  swapCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  swapCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  swapLabel: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  swapBalanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  swapBalance: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  swapInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  swapInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    padding: 0,
  },
  swapOutputAmount: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  swapMetalSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardHover,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  swapMetalText: {
    fontSize: 16,
    fontWeight: '700',
    marginHorizontal: 8,
  },
  swapValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  swapValue: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  maxButton: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  swapMax: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  swapArrowButton: {
    alignSelf: 'center',
    backgroundColor: Colors.card,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: -10,
    zIndex: 10,
    borderWidth: 3,
    borderColor: Colors.background,
  },
  rateInfo: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    alignItems: 'center',
  },
  rateLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  rateValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  swapButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  swapButtonDisabled: {
    backgroundColor: Colors.border,
  },
  swapButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalOptionText: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
    flex: 1,
  },
  modalOptionName: {
    fontSize: 14,
    color: Colors.textMuted,
    marginRight: 8,
  },
  modalCancel: {
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  modalCancelText: {
    fontSize: 16,
    color: Colors.error,
    fontWeight: '600',
  },

  // Profile
  walletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    marginBottom: 16,
  },
  walletIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  walletInfo: {
    flex: 1,
  },
  walletLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  walletAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  copyButton: {
    padding: 8,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginRight: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  menuSection: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  menuSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error + '15',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
  },
  // Wallet Connection Styles
  connectWalletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '15',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: Colors.primary + '40',
    borderStyle: 'dashed',
  },
  connectWalletIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectWalletInfo: {
    flex: 1,
    marginLeft: 16,
  },
  connectWalletTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  connectWalletSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
  },
  disconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error + '15',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
  disconnectText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '15',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 24,
  },
  footerText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  footerSubtext: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderTopWidth: 0,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    marginTop: 4,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: Colors.primary,
    fontWeight: '600',
  },

  // Auth Styles - Robinhood
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  authLogo: {
    width: 120,
    height: 120,
    marginBottom: 32,
  },
  authTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  authSubtitle: {
    fontSize: 16,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 48,
    fontWeight: '500',
    lineHeight: 24,
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 16,
  },
  authButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },

  // Chart Modal Styles
  chartModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  chartModalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  chartModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartModalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartModalSymbol: {
    fontSize: 20,
    fontWeight: '700',
  },
  chartModalName: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 2,
  },
  chartCloseButton: {
    padding: 8,
  },
  chartPriceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartCurrentPrice: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginRight: 12,
  },
  chartChangeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  chartChangeText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  periodButtonActive: {
    backgroundColor: Colors.primary,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  periodButtonTextActive: {
    color: Colors.textPrimary,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  chartStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chartStatItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  chartStatLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  chartStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },

  // Trade/Chart Screen Styles
  tradeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tradeBackBtn: {
    padding: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
  },
  tradeHeaderCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tradeHeaderSymbol: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  tradeStarBtn: {
    padding: 6,
  },
  tradePriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  tradePriceLeft: {
    flexDirection: 'column',
  },
  tradeCurrentPrice: {
    fontSize: 24,
    fontWeight: '700',
  },
  tradePriceChange: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '600',
  },
  tradeStats: {
    flexDirection: 'row',
  },
  tradeStatItem: {
    marginLeft: 14,
    alignItems: 'center',
  },
  tradeStatLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    fontWeight: '500',
    textAlign: 'center',
  },
  tradeStatValue: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 2,
    textAlign: 'center',
  },
  tradeTabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  tradeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  tradeTabActive: {
    backgroundColor: Colors.card,
  },
  tradeTabText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  tradeTabTextActive: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  tradeTabAllocate: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  tradeTabAllocateActive: {
    backgroundColor: Colors.primaryDark,
  },
  tradeTabAllocateText: {
    fontSize: 11,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  tradePeriodRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
  },
  tradePeriodBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginHorizontal: 2,
    borderRadius: 14,
  },
  tradePeriodBtnActive: {
    backgroundColor: 'rgba(0, 208, 156, 0.2)',
  },
  tradePeriodText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  tradePeriodTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  tradeChartSection: {
    paddingHorizontal: 4,
    marginTop: 4,
  },
  tradeVolumeSection: {
    paddingHorizontal: 4,
    marginTop: 4,
  },
  tradeIndicatorLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginBottom: 2,
    marginLeft: 10,
    fontWeight: '600',
  },
  tradeRSISection: {
    paddingHorizontal: 4,
    marginTop: 4,
  },
  
  // Indicator Selector - Tek satır
  indicatorSelectorRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: 'space-between',
  },
  indicatorBtnCompact: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  indicatorBtnCompactActive: {
    backgroundColor: Colors.primary,
  },
  indicatorBtnTextCompact: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  indicatorBtnTextCompactActive: {
    color: Colors.textPrimary,
  },
  
  tradePerfRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 8,
    marginHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
  },
  tradePerfItem: {
    flex: 1,
    alignItems: 'center',
  },
  tradePerfLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  tradePerfValue: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 4,
  },
  tradeBottomBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    backgroundColor: Colors.card,
    gap: 10,
  },
  tradeBuyBtn: {
    flex: 1,
    backgroundColor: Colors.up,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  tradeSellBtn: {
    flex: 1,
    backgroundColor: Colors.down,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  tradeBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  
  // Info Card Styles - Robinhood
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  infoCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 14,
  },
  infoCardText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 24,
    fontWeight: '400',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  tradeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tradePrice: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  tradeAmount: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
    textAlign: 'center',
  },
  tradeTime: {
    fontSize: 12,
    color: Colors.textMuted,
    flex: 1,
    textAlign: 'right',
  },
  
  // Allocate Styles - Robinhood
  allocateBalance: {
    fontSize: 40,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 12,
    letterSpacing: -1,
  },
  allocateValue: {
    fontSize: 16,
    color: Colors.textMuted,
    marginTop: 6,
    fontWeight: '500',
  },
  allocateButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 8,
  },
  allocateBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  allocateBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  // Overlay Indicator Styles - Robinhood
  overlayIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  overlayIndicatorBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  overlayIndicatorBtnActive: {
    backgroundColor: 'rgba(0, 208, 156, 0.15)',
  },
  overlayIndicatorText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
  },

  // Indicator Selector Styles - Robinhood
  indicatorSelector: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  indicatorBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  indicatorBtnActive: {
    backgroundColor: Colors.primary,
  },
  indicatorBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  indicatorBtnTextActive: {
    color: Colors.textPrimary,
  },
  tradeIndicatorSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  indicatorInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 16,
    borderRadius: 14,
    marginTop: 8,
    marginHorizontal: 16,
  },
  indicatorInfoText: {
    fontSize: 13,
    color: Colors.textMuted,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
    fontWeight: '500',
  },
  indicatorStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginTop: 6,
    marginHorizontal: 12,
  },
  indicatorStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  indicatorStatusText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },

  // Chart Loading & Live Indicator - Robinhood
  chartLoadingContainer: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartLoadingText: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 12,
    fontWeight: '500',
  },
  chartLiveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 208, 156, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    marginLeft: 'auto',
  },
  chartDemoIndicator: {
    backgroundColor: 'rgba(255, 193, 7, 0.12)',
  },
  chartLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginRight: 6,
  },
  chartDemoDot: {
    backgroundColor: Colors.gold,
  },
  chartLiveText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  chartDemoText: {
    color: Colors.gold,
  },
  
  // ============================================
  // YENİ BİNANCE TARZI STİLLER
  // ============================================
  
  // Top Bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuBtn: {
    padding: 8,
  },
  topBarCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  auxiteLogo: {
    width: 32,
    height: 32,
  },
  topBarBrandText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.silver,
    marginLeft: 8,
    letterSpacing: 1,
  },
  topBarTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginLeft: 8,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topBarIconBtn: {
    padding: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  
  // PNL Banner
  pnlBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pnlLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginRight: 8,
  },
  pnlValue: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  
  // Feature Cards
  featureCardsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 8,
  },
  featureCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
  },
  featureCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureCardTitle: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  
  // Risk Gauge
  riskGaugeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riskGauge: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 12,
  },
  riskGaugeFill: {
    height: '100%',
    backgroundColor: Colors.up,
    borderRadius: 3,
  },
  riskValueContainer: {
    alignItems: 'center',
  },
  riskValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.up,
  },
  riskLabel: {
    fontSize: 9,
    color: Colors.textMuted,
  },
  
  // Correlation
  correlationList: {
    gap: 6,
  },
  correlationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  correlationPair: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  correlationValue: {
    fontSize: 11,
    fontWeight: '600',
  },
  
  // Quick Actions
  quickActionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 20,
    gap: 12,
  },
  quickActionBtn: {
    flex: 1,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  quickActionText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  
  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTabs: {
    flexDirection: 'row',
    gap: 12,
  },
  sectionTab: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  sectionTabActive: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  
  // Asset Table
  assetTableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  assetTableHeaderText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  assetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  assetInfo: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  assetTextContainer: {
    marginLeft: 10,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  assetSymbol: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  assetName: {
    fontSize: 11,
    color: Colors.textMuted,
    marginLeft: 2,
  },
  assetPrice: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  assetChangeBadge: {
    flex: 1,
    alignItems: 'flex-end',
  },
  assetChangeText: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  
  // Crypto Icon (BTC, ETH, USDT, TRY)
  cryptoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cryptoIconText: {
    fontSize: 14,
    fontWeight: '700',
  },
  
  // View More
  viewMoreBtn: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  viewMoreText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  
  // Menu Dropdown
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  menuDropdown: {
    backgroundColor: Colors.card,
    marginTop: 60,
    marginLeft: 16,
    marginRight: 80,
    borderRadius: 12,
    padding: 16,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,208,156,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  menuWallet: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  menuDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  menuDropdownTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  menuDropdownTitle: {
    fontSize: 13,
    color: Colors.textPrimary,
  },
  menuDropdownSubtitle: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  menuLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  menuLogoutText: {
    fontSize: 13,
    color: Colors.error,
    marginLeft: 12,
  },
  
  // ============================================
  // TAHSİS ET EKRANI STİLLERİ
  // ============================================
  allocateMetalSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  allocateMetalBtn: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
  },
  allocateMetalBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  allocateMetalText: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 4,
    fontWeight: '600',
  },
  allocateInfoCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  allocateInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  allocateInfoLabel: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  allocateInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  allocateTypeSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  allocateTypeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  allocateTypeBtnActive: {
    backgroundColor: Colors.primary,
  },
  allocateTypeText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  allocateTypeTextActive: {
    color: Colors.textPrimary,
  },
  allocateInputCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  allocateInputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  allocateInputLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  allocateBalanceText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  allocateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  allocateInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  allocateMaxBtn: {
    backgroundColor: 'rgba(0,208,156,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  allocateMaxText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '700',
  },
  allocateUsdValue: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 8,
  },
  allocateQuickAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  allocateQuickBtn: {
    flex: 1,
    backgroundColor: Colors.card,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  allocateQuickText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  allocateConfirmBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  allocateConfirmBtnDisabled: {
    backgroundColor: 'rgba(0,208,156,0.3)',
  },
  allocateConfirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  allocateNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 12,
    borderRadius: 8,
  },
  allocateNoteText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },

  // Haberler Stilleri
  newsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  newsImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: Colors.gold + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  newsContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  newsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  newsDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 6,
    lineHeight: 16,
  },
  newsMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newsSource: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '500',
  },
  newsTime: {
    fontSize: 11,
    color: Colors.textMuted,
    marginLeft: 8,
  },
  newsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  newsLoadingText: {
    fontSize: 13,
    color: Colors.textMuted,
    marginLeft: 10,
  },
  newsEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  newsEmptyText: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 10,
  },
  moreNewsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 4,
    backgroundColor: Colors.primary + '15',
    borderRadius: 10,
  },
  moreNewsText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: 6,
  },
  viewAllNewsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  viewAllNewsText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
    marginRight: 4,
  },
  languageBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 10,
  },
  languageBtnText: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  langSwitchBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: Colors.primary + '20',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    marginRight: 8,
  },
  langSwitchText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '700',
  },
  viewAllAssetsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: 'transparent',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  allocatedSection: {
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  allocTableHeader: {
    flexDirection: "row",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  allocTableHeaderText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  allocTableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + "50",
  },
  allocTableCell: {
    fontSize: 13,
    color: Colors.textPrimary,
  },
  allocAssetText: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: "500",
    marginLeft: 8,
  },
  viewAllAssetsText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
    marginRight: 4,
  },
  actionButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    marginTop: 16,
    marginBottom: 8,
  },
  actionButton: {
    alignItems: "center",
    flex: 1,
  },
  actionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  actionButtonText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: "500",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalBody: {
    marginBottom: 20,
  },
  modalText: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  modalAddress: {
    fontSize: 12,
    color: Colors.primary,
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 8,
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  modalNote: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  depositMethodCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    marginHorizontal: 0,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'transparent',
  },
  depositMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  depositMethodTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  depositMethodDesc: {
    color: Colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  tradeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'flex-end',
  },
  tradeModalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '80%',
  },
  tradeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tradeModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  tradeToggleRow: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  tradeToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  tradeToggleBtnBuyActive: {
    backgroundColor: Colors.up,
  },
  tradeToggleBtnSellActive: {
    backgroundColor: Colors.down,
  },
  tradeToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  tradeToggleTextActive: {
    color: '#fff',
  },
  tradeOrderTypeRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  tradeOrderTypeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  tradeOrderTypeText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  tradeOrderTypeTextActive: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  tradeInputGroup: {
    marginBottom: 12,
  },
  tradeInputLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 6,
  },
  tradeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tradeInputBtn: {
    width: 40,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tradeInputBtnText: {
    fontSize: 20,
    color: Colors.textMuted,
  },
  tradeInputField: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  tradePercentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  tradePercentBtn: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: Colors.background,
    borderRadius: 6,
    alignItems: 'center',
  },
  tradePercentText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  tradeTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tradeTotalLabel: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  tradeTotalValue: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  tradeAvailableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  tradeAvailableLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  tradeAvailableValue: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  tradeSubmitBtn: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  tradeSubmitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  tradeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'flex-end',
  },
  tradeModalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '80%',
  },
  tradeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tradeModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  tradeToggleRow: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  tradeToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  tradeToggleBtnBuyActive: {
    backgroundColor: Colors.up,
  },
  tradeToggleBtnSellActive: {
    backgroundColor: Colors.down,
  },
  tradeToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  tradeToggleTextActive: {
    color: '#fff',
  },
  tradeOrderTypeRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  tradeOrderTypeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  tradeOrderTypeText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  tradeOrderTypeTextActive: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  tradeInputGroup: {
    marginBottom: 12,
  },
  tradeInputLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 6,
  },
  tradeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tradeInputBtn: {
    width: 40,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tradeInputBtnText: {
    fontSize: 20,
    color: Colors.textMuted,
  },
  tradeInputField: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  tradePercentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  tradePercentBtn: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: Colors.background,
    borderRadius: 6,
    alignItems: 'center',
  },
  tradePercentText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  tradeTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tradeTotalLabel: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  tradeTotalValue: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  tradeAvailableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  tradeAvailableLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  tradeAvailableValue: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  tradeSubmitBtn: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  tradeSubmitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  // Staked Assets Modal Styles
  stakedAssetItem: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stakedAssetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stakedAssetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stakedAssetIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stakedAssetSymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  stakedAssetName: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  stakedAssetValues: {
    alignItems: 'flex-end',
  },
  stakedAssetAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  stakedAssetApy: {
    fontSize: 12,
    color: Colors.up,
    fontWeight: '500',
  },
  stakedAssetReward: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  stakedRewardLabel: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  stakedRewardValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.up,
  },
  stakedTotalCard: {
    backgroundColor: Colors.primary + '15',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  stakedTotalLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  stakedTotalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  stakedTotalReward: {
    fontSize: 14,
    color: Colors.up,
    fontWeight: '500',
  },
  // Crypto Trade Modal Styles
  tradeModalBody: {
    paddingVertical: 8,
  },
  tradeModalPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tradeModalLabel: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  tradeModalPrice: {
    fontSize: 20,
    fontWeight: '700',
  },
  tradeModalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  tradeModalInput: {
    flex: 1,
    fontSize: 18,
    color: Colors.textPrimary,
    paddingVertical: 12,
  },
  tradeModalInputSuffix: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  tradeModalQuickSelect: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  tradeModalQuickBtn: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: Colors.background,
    borderRadius: 6,
    alignItems: 'center',
  },
  tradeModalQuickText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  tradeModalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  tradeModalTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  tradeModalSubmitBtn: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  tradeModalSubmitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  // Allocate Modal Styles
  allocateAssetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  allocateAssetBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: Colors.background,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  allocateAssetBtnActive: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary,
  },
  allocateAssetText: {
    fontSize: 14,
    fontWeight: '600',
  },
  allocateAssetTextActive: {
    fontWeight: '700',
  },
  // AllocateScreen Info Cards
  allocateInfoSection: {
    marginTop: 24,
    gap: 16,
  },
  allocateInfoCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  allocateInfoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  allocateInfoList: {
    gap: 8,
  },
  allocateInfoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  allocateInfoBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.textMuted,
    marginTop: 6,
  },
  allocateInfoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  allocateFeaturesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  allocateFeatureItem: {
    width: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  allocateFeatureIcon: {
    fontSize: 18,
  },
  allocateFeatureText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  // Location Modal Styles
  locationItem: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  locationAddress: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  locationStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  locationStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  locationAssets: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  locationAssetsLabel: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  locationAssetsValue: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
});
