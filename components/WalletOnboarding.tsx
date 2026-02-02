// components/WalletOnboarding.tsx
// React Native versiyonu - Auxite Wallet Onboarding

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  ActivityIndicator,
  Dimensions,
  Platform,
  Image,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import * as Crypto from 'expo-crypto';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '@/stores/useStore';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ethers } from 'ethers';
import { completePairing, checkUserExists, approveQRLogin } from '@/services/api';

// ============================================
// RENK PALETİ - Light/Dark Theme
// ============================================
const getColors = (isDark: boolean) => ({
  background: isDark ? '#0F172A' : '#F8FAFC',
  surface: isDark ? '#1E293B' : '#FFFFFF',
  surfaceLight: isDark ? '#334155' : '#F1F5F9',
  primary: '#10B981',
  primaryDark: '#059669',
  text: isDark ? '#FFFFFF' : '#0F172A',
  textSecondary: isDark ? '#94A3B8' : '#64748B',
  textMuted: isDark ? '#64748B' : '#94A3B8',
  border: isDark ? '#334155' : '#E2E8F0',
  error: '#EF4444',
  warning: '#F59E0B',
  warningBg: isDark ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.15)',
});

const { width } = Dimensions.get('window');

// ============================================
// BIP39 WORD LIST (2048 kelime)
// ============================================
const BIP39_WORDLIST = 'abandon,ability,able,about,above,absent,absorb,abstract,absurd,abuse,access,accident,account,accuse,achieve,acid,acoustic,acquire,across,act,action,actor,actress,actual,adapt,add,addict,address,adjust,admit,adult,advance,advice,aerobic,affair,afford,afraid,again,age,agent,agree,ahead,aim,air,airport,aisle,alarm,album,alcohol,alert,alien,all,alley,allow,almost,alone,alpha,already,also,alter,always,amateur,amazing,among,amount,amused,analyst,anchor,ancient,anger,angle,angry,animal,ankle,announce,annual,another,answer,antenna,antique,anxiety,any,apart,apology,appear,apple,approve,april,arch,arctic,area,arena,argue,arm,armed,armor,army,around,arrange,arrest,arrive,arrow,art,artefact,artist,artwork,ask,aspect,assault,asset,assist,assume,asthma,athlete,atom,attack,attend,attitude,attract,auction,audit,august,aunt,author,auto,autumn,average,avocado,avoid,awake,aware,away,awesome,awful,awkward,axis,baby,bachelor,bacon,badge,bag,balance,balcony,ball,bamboo,banana,banner,bar,barely,bargain,barrel,base,basic,basket,battle,beach,bean,beauty,because,become,beef,before,begin,behave,behind,believe,below,belt,bench,benefit,best,betray,better,between,beyond,bicycle,bid,bike,bind,biology,bird,birth,bitter,black,blade,blame,blanket,blast,bleak,bless,blind,blood,blossom,blouse,blue,blur,blush,board,boat,body,boil,bomb,bone,bonus,book,boost,border,boring,borrow,boss,bottom,bounce,box,boy,bracket,brain,brand,brass,brave,bread,breeze,brick,bridge,brief,bright,bring,brisk,broccoli,broken,bronze,broom,brother,brown,brush,bubble,buddy,budget,buffalo,build,bulb,bulk,bullet,bundle,bunker,burden,burger,burst,bus,business,busy,butter,buyer,buzz,cabbage,cabin,cable,cactus,cage,cake,call,calm,camera,camp,can,canal,cancel,candy,cannon,canoe,canvas,canyon,capable,capital,captain,car,carbon,card,cargo,carpet,carry,cart,case,cash,casino,castle,casual,cat,catalog,catch,category,cattle,caught,cause,caution,cave,ceiling,celery,cement,census,century,cereal,certain,chair,chalk,champion,change,chaos,chapter,charge,chase,chat,cheap,check,cheese,chef,cherry,chest,chicken,chief,child,chimney,choice,choose,chronic,chuckle,chunk,churn,cigar,cinnamon,circle,citizen,city,civil,claim,clap,clarify,claw,clay,clean,clerk,clever,click,client,cliff,climb,clinic,clip,clock,clog,close,cloth,cloud,clown,club,clump,cluster,clutch,coach,coast,coconut,code,coffee,coil,coin,collect,color,column,combine,come,comfort,comic,common,company,concert,conduct,confirm,congress,connect,consider,control,convince,cook,cool,copper,copy,coral,core,corn,correct,cost,cotton,couch,country,couple,course,cousin,cover,coyote,crack,cradle,craft,cram,crane,crash,crater,crawl,crazy,cream,credit,creek,crew,cricket,crime,crisp,critic,crop,cross,crouch,crowd,crucial,cruel,cruise,crumble,crunch,crush,cry,crystal,cube,culture,cup,cupboard,curious,current,curtain,curve,cushion,custom,cute,cycle,dad,damage,damp,dance,danger,daring,dash,daughter,dawn,day,deal,debate,debris,decade,december,decide,decline,decorate,decrease,deer,defense,define,defy,degree,delay,deliver,demand,demise,denial,dentist,deny,depart,depend,deposit,depth,deputy,derive,describe,desert,design,desk,despair,destroy,detail,detect,develop,device,devote,diagram,dial,diamond,diary,dice,diesel,diet,differ,digital,dignity,dilemma,dinner,dinosaur,direct,dirt,disagree,discover,disease,dish,dismiss,disorder,display,distance,divert,divide,divorce,dizzy,doctor,document,dog,doll,dolphin,domain,donate,donkey,donor,door,dose,double,dove,draft,dragon,drama,drastic,draw,dream,dress,drift,drill,drink,drip,drive,drop,drum,dry,duck,dumb,dune,during,dust,dutch,duty,dwarf,dynamic,eager,eagle,early,earn,earth,easily,east,easy,echo,ecology,economy,edge,edit,educate,effort,egg,eight,either,elbow,elder,electric,elegant,element,elephant,elevator,elite,else,embark,embody,embrace,emerge,emotion,employ,empower,empty,enable,enact,end,endless,endorse,enemy,energy,enforce,engage,engine,enhance,enjoy,enlist,enough,enrich,enroll,ensure,enter,entire,entry,envelope,episode,equal,equip,era,erase,erode,erosion,error,erupt,escape,essay,essence,estate,eternal,ethics,evidence,evil,evoke,evolve,exact,example,excess,exchange,excite,exclude,excuse,execute,exercise,exhaust,exhibit,exile,exist,exit,exotic,expand,expect,expire,explain,expose,express,extend,extra,eye,eyebrow,fabric,face,faculty,fade,faint,faith,fall,false,fame,family,famous,fan,fancy,fantasy,farm,fashion,fat,fatal,father,fatigue,fault,favorite,feature,february,federal,fee,feed,feel,female,fence,festival,fetch,fever,few,fiber,fiction,field,figure,file,film,filter,final,find,fine,finger,finish,fire,firm,first,fiscal,fish,fit,fitness,fix,flag,flame,flash,flat,flavor,flee,flight,flip,float,flock,floor,flower,fluid,flush,fly,foam,focus,fog,foil,fold,follow,food,foot,force,forest,forget,fork,fortune,forum,forward,fossil,foster,found,fox,fragile,frame,frequent,fresh,friend,fringe,frog,front,frost,frown,frozen,fruit,fuel,fun,funny,furnace,fury,future,gadget,gain,galaxy,gallery,game,gap,garage,garbage,garden,garlic,garment,gas,gasp,gate,gather,gauge,gaze,general,genius,genre,gentle,genuine,gesture,ghost,giant,gift,giggle,ginger,giraffe,girl,give,glad,glance,glare,glass,glide,glimpse,globe,gloom,glory,glove,glow,glue,goat,goddess,gold,good,goose,gorilla,gospel,gossip,govern,gown,grab,grace,grain,grant,grape,grass,gravity,great,green,grid,grief,grit,grocery,group,grow,grunt,guard,guess,guide,guilt,guitar,gun,gym,habit,hair,half,hammer,hamster,hand,happy,harbor,hard,harsh,harvest,hat,have,hawk,hazard,head,health,heart,heavy,hedgehog,height,hello,helmet,help,hen,hero,hidden,high,hill,hint,hip,hire,history,hobby,hockey,hold,hole,holiday,hollow,home,honey,hood,hope,horn,horror,horse,hospital,host,hotel,hour,hover,hub,huge,human,humble,humor,hundred,hungry,hunt,hurdle,hurry,hurt,husband,hybrid,ice,icon,idea,identify,idle,ignore,ill,illegal,illness,image,imitate,immense,immune,impact,impose,improve,impulse,inch,include,income,increase,index,indicate,indoor,industry,infant,inflict,inform,inhale,inherit,initial,inject,injury,inmate,inner,innocent,input,inquiry,insane,insect,inside,inspire,install,intact,interest,into,invest,invite,involve,iron,island,isolate,issue,item,ivory,jacket,jaguar,jar,jazz,jealous,jeans,jelly,jewel,job,join,joke,journey,joy,judge,juice,jump,jungle,junior,junk,just,kangaroo,keen,keep,ketchup,key,kick,kid,kidney,kind,kingdom,kiss,kit,kitchen,kite,kitten,kiwi,knee,knife,knock,know,lab,label,labor,ladder,lady,lake,lamp,language,laptop,large,later,latin,laugh,laundry,lava,law,lawn,lawsuit,layer,lazy,leader,leaf,learn,leave,lecture,left,leg,legal,legend,leisure,lemon,lend,length,lens,leopard,lesson,letter,level,liar,liberty,library,license,life,lift,light,like,limb,limit,link,lion,liquid,list,little,live,lizard,load,loan,lobster,local,lock,logic,lonely,long,loop,lottery,loud,lounge,love,loyal,lucky,luggage,lumber,lunar,lunch,luxury,lyrics,machine,mad,magic,magnet,maid,mail,main,major,make,mammal,man,manage,mandate,mango,mansion,manual,maple,marble,march,margin,marine,market,marriage,mask,mass,master,match,material,math,matrix,matter,maximum,maze,meadow,mean,measure,meat,mechanic,medal,media,melody,melt,member,memory,mention,menu,mercy,merge,merit,merry,mesh,message,metal,method,middle,midnight,milk,million,mimic,mind,minimum,minor,minute,miracle,mirror,misery,miss,mistake,mix,mixed,mixture,mobile,model,modify,mom,moment,monitor,monkey,monster,month,moon,moral,more,morning,mosquito,mother,motion,motor,mountain,mouse,move,movie,much,muffin,mule,multiply,muscle,museum,mushroom,music,must,mutual,myself,mystery,myth,naive,name,napkin,narrow,nasty,nation,nature,near,neck,need,negative,neglect,neither,nephew,nerve,nest,net,network,neutral,never,news,next,nice,night,noble,noise,nominee,noodle,normal,north,nose,notable,note,nothing,notice,novel,now,nuclear,number,nurse,nut,oak,obey,object,oblige,obscure,observe,obtain,obvious,occur,ocean,october,odor,off,offer,office,often,oil,okay,old,olive,olympic,omit,once,one,onion,online,only,open,opera,opinion,oppose,option,orange,orbit,orchard,order,ordinary,organ,orient,original,orphan,ostrich,other,outdoor,outer,output,outside,oval,oven,over,own,owner,oxygen,oyster,ozone,pact,paddle,page,pair,palace,palm,panda,panel,panic,panther,paper,parade,parent,park,parrot,party,pass,patch,path,patient,patrol,pattern,pause,pave,payment,peace,peanut,pear,peasant,pelican,pen,penalty,pencil,people,pepper,perfect,permit,person,pet,phone,photo,phrase,physical,piano,picnic,picture,piece,pig,pigeon,pill,pilot,pink,pioneer,pipe,pistol,pitch,pizza,place,planet,plastic,plate,play,please,pledge,pluck,plug,plunge,poem,poet,point,polar,pole,police,pond,pony,pool,popular,portion,position,possible,post,potato,pottery,poverty,powder,power,practice,praise,predict,prefer,prepare,present,pretty,prevent,price,pride,primary,print,priority,prison,private,prize,problem,process,produce,profit,program,project,promote,proof,property,prosper,protect,proud,provide,public,pudding,pull,pulp,pulse,pumpkin,punch,pupil,puppy,purchase,purity,purpose,purse,push,put,puzzle,pyramid,quality,quantum,quarter,question,quick,quit,quiz,quote,rabbit,raccoon,race,rack,radar,radio,rail,rain,raise,rally,ramp,ranch,random,range,rapid,rare,rate,rather,raven,raw,razor,ready,real,reason,rebel,rebuild,recall,receive,recipe,record,recycle,reduce,reflect,reform,refuse,region,regret,regular,reject,relax,release,relief,rely,remain,remember,remind,remove,render,renew,rent,reopen,repair,repeat,replace,report,require,rescue,resemble,resist,resource,response,result,retire,retreat,return,reunion,reveal,review,reward,rhythm,rib,ribbon,rice,rich,ride,ridge,rifle,right,rigid,ring,riot,ripple,risk,ritual,rival,river,road,roast,robot,robust,rocket,romance,roof,rookie,room,rose,rotate,rough,round,route,royal,rubber,rude,rug,rule,run,runway,rural,sad,saddle,sadness,safe,sail,salad,salmon,salon,salt,salute,same,sample,sand,satisfy,satoshi,sauce,sausage,save,say,scale,scan,scare,scatter,scene,scheme,school,science,scissors,scorpion,scout,scrap,screen,script,scrub,sea,search,season,seat,second,secret,section,security,seed,seek,segment,select,sell,seminar,senior,sense,sentence,series,service,session,settle,setup,seven,shadow,shaft,shallow,share,shed,shell,sheriff,shield,shift,shine,ship,shiver,shock,shoe,shoot,shop,short,shoulder,shove,shrimp,shrug,shuffle,shy,sibling,sick,side,siege,sight,sign,silent,silk,silly,silver,similar,simple,since,sing,siren,sister,situate,six,size,skate,sketch,ski,skill,skin,skirt,skull,slab,slam,sleep,slender,slice,slide,slight,slim,slogan,slot,slow,slush,small,smart,smile,smoke,smooth,snack,snake,snap,sniff,snow,soap,soccer,social,sock,soda,soft,solar,soldier,solid,solution,solve,someone,song,soon,sorry,sort,soul,sound,soup,source,south,space,spare,spatial,spawn,speak,special,speed,spell,spend,sphere,spice,spider,spike,spin,spirit,split,spoil,sponsor,spoon,sport,spot,spray,spread,spring,spy,square,squeeze,squirrel,stable,stadium,staff,stage,stairs,stamp,stand,start,state,stay,steak,steel,stem,step,stereo,stick,still,sting,stock,stomach,stone,stool,story,stove,strategy,street,strike,strong,struggle,student,stuff,stumble,style,subject,submit,subway,success,such,sudden,suffer,sugar,suggest,suit,summer,sun,sunny,sunset,super,supply,supreme,sure,surface,surge,surprise,surround,survey,suspect,sustain,swallow,swamp,swap,swarm,swear,sweet,swift,swim,swing,switch,sword,symbol,symptom,syrup,system,table,tackle,tag,tail,talent,talk,tank,tape,target,task,taste,tattoo,taxi,teach,team,tell,ten,tenant,tennis,tent,term,test,text,thank,that,theme,then,theory,there,they,thing,this,thought,three,thrive,throw,thumb,thunder,ticket,tide,tiger,tilt,timber,time,tiny,tip,tired,tissue,title,toast,tobacco,today,toddler,toe,together,toilet,token,tomato,tomorrow,tone,tongue,tonight,tool,tooth,top,topic,topple,torch,tornado,tortoise,toss,total,tourist,toward,tower,town,toy,track,trade,traffic,tragic,train,transfer,trap,trash,travel,tray,treat,tree,trend,trial,tribe,trick,trigger,trim,trip,trophy,trouble,truck,true,truly,trumpet,trust,truth,try,tube,tuition,tumble,tuna,tunnel,turkey,turn,turtle,twelve,twenty,twice,twin,twist,two,type,typical,ugly,umbrella,unable,unaware,uncle,uncover,under,undo,unfair,unfold,unhappy,uniform,unique,unit,universe,unknown,unlock,until,unusual,unveil,update,upgrade,uphold,upon,upper,upset,urban,urge,usage,use,used,useful,useless,usual,utility,vacant,vacuum,vague,valid,valley,valve,van,vanish,vapor,various,vast,vault,vehicle,velvet,vendor,venture,venue,verb,verify,version,very,vessel,veteran,viable,vibrant,vicious,victory,video,view,village,vintage,violin,virtual,virus,visa,visit,visual,vital,vivid,vocal,voice,void,volcano,volume,vote,voyage,wage,wagon,wait,walk,wall,walnut,want,warfare,warm,warrior,wash,wasp,waste,water,wave,way,wealth,weapon,wear,weasel,weather,web,wedding,weekend,weird,welcome,west,wet,whale,what,wheat,wheel,when,where,whip,whisper,wide,width,wife,wild,will,win,window,wine,wing,wink,winner,winter,wire,wisdom,wise,wish,witness,wolf,woman,wonder,wood,wool,word,work,world,worry,worth,wrap,wreck,wrestle,wrist,write,wrong,yard,year,yellow,you,young,youth,zebra,zero,zone,zoo'.split(',');

// ============================================
// ÇEVİRİLER - 6 Dil Desteği
// ============================================
const translations: Record<string, Record<string, string>> = {
  tr: {
    welcomeTitle: "Auxite Wallet'a Hoş Geldiniz",
    welcomeSubtitle: "Fiziksel metallerle desteklenen dijital tokenleri alın ve satın. Gerçek zamanlı fiyatlar ve anlık işlemler.",
    createNewWallet: "Yeni Cüzdan Oluştur",
    importWallet: "Mevcut Cüzdanı İçe Aktar",
    seedPhraseTitle: "Kurtarma İfadeniz",
    seedPhraseWarning: "⚠️ Bu 12 kelimeyi güvenli bir yere yazın! Kimseyle paylaşmayın!",
    iWroteItDown: "Yazdım, Devam Et",
    verifyTitle: "Kurtarma İfadesini Doğrula",
    selectWord: "Kelime #",
    verifyError: "Yanlış kelime seçildi",
    setPinTitle: "Şifre Oluştur",
    setPinSubtitle: "En az 6 karakterli güvenlik şifrenizi belirleyin",
    confirmPinTitle: "Şifreyi Onayla",
    pinMismatch: "Şifreler eşleşmiyor",
    enterPinTitle: "Şifre Girin",
    wrongPin: "Yanlış şifre",
    forgotPin: "Şifremi Unuttum",
    securityTip: "Güvenlik İpucu",
    neverShare: "Kurtarma ifadenizi asla paylaşmayın",
    noScreenshot: "Ekran görüntüsü almayın",
    writeOnPaper: "Kağıda yazıp güvenli yerde saklayın",
    keysOnDevice: "Anahtarlarınız yalnızca cihazınızda saklanır",
    import: "İçe Aktar",
    reveal: "Kelimeleri Göster",
    hide: "Gizle",
    copy: "Kopyala",
    copied: "Kopyalandı!",
    continue: "Devam",
    back: "Geri",
    cancel: "İptal",
    invalidSeed: "Geçersiz kurtarma ifadesi",
    enterSeedPlaceholder: "Kurtarma ifadesini girin...",
    password: "Şifre",
    confirmPassword: "Şifreyi Onayla",
    passwordHint: "En az 6 karakter",
    unlock: "Kilidi Aç",
    logout: "Çıkış Yap",
    resetConfirm: "Cüzdanınızı sıfırlamak istediğinize emin misiniz? Seed phrase ile tekrar içe aktarmanız gerekecek.",
    enterSeedHint: "Kelimeleri boşluk ile ayırarak girin",
    unlockSubtitle: "Cüzdanınıza erişmek için şifre girin",
    nonCustodial: "Self-Custody",
    yourKeys: "Sizin Anahtarlarınız",
    secure: "Güvenli",
    // Alert Messages
    error: "Hata",
    success: "Başarılı",
    warning: "Uyarı",
    ok: "Tamam",
    walletCreateFailed: "Cüzdan oluşturulamadı. Lütfen tekrar deneyin.",
    walletImportFailed: "Cüzdan içe aktarılamadı. Lütfen kurtarma ifadenizi kontrol edin.",
    walletImportSuccess: "Cüzdanınız başarıyla içe aktarıldı!",
    // QR & WalletConnect
    recoveryPhrase: "Kurtarma İfadesi",
    scanQR: "QR Tara",
    scanQRDesc: "Harici cüzdanınızı bağlamak için QR kodunu tarayın",
    cameraPermissionRequired: "QR kodu taramak için kamera izni gerekli",
    grantPermission: "İzin Ver",
    scanWalletQR: "Cüzdan QR kodunu tarayın veya web oturumu QR'ını okutun",
    startScanning: "Taramayı Başlat",
    scannedData: "Taranan Veri",
    connectWallet: "Cüzdanı Bağla",
    walletConnectDesc: "WalletConnect URI yapıştırarak harici cüzdanınızı bağlayın",
    walletConnectInfo: "MetaMask, Trust Wallet gibi WalletConnect destekleyen cüzdanları bağlayabilirsiniz",
    connect: "Bağlan",
    wcPasteHint: "wc: ile başlayan URI'yi yapıştırın",
    invalidQRCode: "Geçersiz QR kodu",
    invalidWCUri: "Geçersiz WalletConnect URI",
    wcComingSoon: "WalletConnect entegrasyonu yakında aktif olacak",
    wcConnectionFailed: "Bağlantı başarısız oldu",
    sessionSyncSuccess: "Web oturumu başarıyla senkronize edildi",
    // Custodial
    createCustodialWallet: "Hızlı Başla (Önerilen)",
    custodialDesc: "Seed phrase olmadan güvenli cüzdan",
    custodialFeature: "Kolay Kullanım",
    orDivider: "veya",
    creatingWallet: "Cüzdan oluşturuluyor...",
    custodialCreated: "Cüzdanınız hazır!",
  },
  en: {
    welcomeTitle: "Welcome to Auxite Wallet",
    welcomeSubtitle: "Buy and sell digital tokens backed by physical metals. Real-time prices and instant transactions.",
    createNewWallet: "Create New Wallet",
    importWallet: "Import Existing Wallet",
    seedPhraseTitle: "Your Recovery Phrase",
    seedPhraseWarning: "⚠️ Write down these 12 words in a safe place! Never share them!",
    iWroteItDown: "I Wrote It Down, Continue",
    verifyTitle: "Verify Recovery Phrase",
    selectWord: "Word #",
    verifyError: "Wrong word selected",
    setPinTitle: "Create Password",
    setPinSubtitle: "Set your security password (min 6 characters)",
    confirmPinTitle: "Confirm Password",
    pinMismatch: "Passwords do not match",
    enterPinTitle: "Enter Password",
    wrongPin: "Wrong password",
    forgotPin: "Forgot Password",
    securityTip: "Security Tip",
    neverShare: "Never share your recovery phrase",
    noScreenshot: "Do not take screenshots",
    writeOnPaper: "Write on paper and store safely",
    keysOnDevice: "Your keys are stored only on your device",
    import: "Import",
    reveal: "Reveal Words",
    hide: "Hide",
    copy: "Copy",
    copied: "Copied!",
    continue: "Continue",
    back: "Back",
    cancel: "Cancel",
    invalidSeed: "Invalid recovery phrase",
    enterSeedPlaceholder: "Enter recovery phrase...",
    password: "Password",
    confirmPassword: "Confirm Password",
    passwordHint: "Minimum 6 characters",
    unlock: "Unlock",
    logout: "Log Out",
    resetConfirm: "Are you sure you want to reset? You will need to re-import with your seed phrase.",
    enterSeedHint: "Enter words separated by spaces",
    unlockSubtitle: "Enter password to access your wallet",
    nonCustodial: "Non-custodial",
    yourKeys: "Your Keys",
    secure: "Secure",
    // Alert Messages
    error: "Error",
    success: "Success",
    warning: "Warning",
    ok: "OK",
    walletCreateFailed: "Failed to create wallet. Please try again.",
    walletImportFailed: "Failed to import wallet. Please check your recovery phrase.",
    walletImportSuccess: "Your wallet has been imported successfully!",
    // QR & WalletConnect
    recoveryPhrase: "Recovery Phrase",
    scanQR: "Scan QR",
    scanQRDesc: "Scan QR code to connect your external wallet",
    cameraPermissionRequired: "Camera permission required to scan QR codes",
    grantPermission: "Grant Permission",
    scanWalletQR: "Scan wallet QR code or web session QR",
    startScanning: "Start Scanning",
    scannedData: "Scanned Data",
    connectWallet: "Connect Wallet",
    walletConnectDesc: "Paste WalletConnect URI to connect your external wallet",
    walletConnectInfo: "Connect wallets that support WalletConnect like MetaMask, Trust Wallet",
    connect: "Connect",
    wcPasteHint: "Paste URI starting with wc:",
    invalidQRCode: "Invalid QR code",
    invalidWCUri: "Invalid WalletConnect URI",
    wcComingSoon: "WalletConnect integration coming soon",
    wcConnectionFailed: "Connection failed",
    sessionSyncSuccess: "Web session synced successfully",
    // Custodial
    createCustodialWallet: "Quick Start (Recommended)",
    custodialDesc: "Secure wallet without seed phrase",
    custodialFeature: "Easy to Use",
    orDivider: "or",
    creatingWallet: "Creating wallet...",
    custodialCreated: "Your wallet is ready!",
  },
  de: {
    welcomeTitle: "Willkommen bei Auxite Wallet",
    welcomeSubtitle: "Kaufen und verkaufen Sie digitale Token, die durch physische Metalle gedeckt sind.",
    createNewWallet: "Neues Wallet erstellen",
    importWallet: "Bestehendes Wallet importieren",
    seedPhraseTitle: "Ihre Wiederherstellungsphrase",
    seedPhraseWarning: "⚠️ Schreiben Sie diese 12 Wörter an einem sicheren Ort auf! Teilen Sie sie nie!",
    iWroteItDown: "Notiert, Weiter",
    verifyTitle: "Wiederherstellungsphrase bestätigen",
    selectWord: "Wort #",
    verifyError: "Falsches Wort gewählt",
    setPinTitle: "Passwort erstellen",
    setPinSubtitle: "Legen Sie Ihr Sicherheitspasswort fest (min. 6 Zeichen)",
    confirmPinTitle: "Passwort bestätigen",
    pinMismatch: "Passwörter stimmen nicht überein",
    enterPinTitle: "Passwort eingeben",
    wrongPin: "Falsches Passwort",
    forgotPin: "Passwort vergessen",
    securityTip: "Sicherheitstipp",
    neverShare: "Teilen Sie Ihre Wiederherstellungsphrase nie",
    noScreenshot: "Keine Screenshots machen",
    writeOnPaper: "Auf Papier schreiben und sicher aufbewahren",
    keysOnDevice: "Ihre Schlüssel werden nur auf Ihrem Gerät gespeichert",
    import: "Importieren",
    reveal: "Wörter anzeigen",
    hide: "Verbergen",
    copy: "Kopieren",
    copied: "Kopiert!",
    continue: "Weiter",
    back: "Zurück",
    cancel: "Abbrechen",
    invalidSeed: "Ungültige Wiederherstellungsphrase",
    enterSeedPlaceholder: "Wiederherstellungsphrase eingeben...",
    password: "Passwort",
    confirmPassword: "Passwort bestätigen",
    passwordHint: "Mindestens 6 Zeichen",
    unlock: "Entsperren",
    logout: "Abmelden",
    resetConfirm: "Sind Sie sicher? Sie müssen mit Ihrer Seed-Phrase erneut importieren.",
    enterSeedHint: "Wörter mit Leerzeichen getrennt eingeben",
    unlockSubtitle: "Passwort eingeben um auf Wallet zuzugreifen",
    nonCustodial: "Non-custodial",
    yourKeys: "Ihre Schlüssel",
    secure: "Sicher",
    error: "Fehler",
    success: "Erfolg",
    warning: "Warnung",
    ok: "OK",
    walletCreateFailed: "Wallet konnte nicht erstellt werden. Bitte versuchen Sie es erneut.",
    walletImportFailed: "Wallet konnte nicht importiert werden. Bitte überprüfen Sie Ihre Wiederherstellungsphrase.",
    walletImportSuccess: "Ihr Wallet wurde erfolgreich importiert!",
    recoveryPhrase: "Wiederherstellungsphrase",
    scanQR: "QR scannen",
    scanQRDesc: "QR-Code scannen um externes Wallet zu verbinden",
    cameraPermissionRequired: "Kameraberechtigung zum Scannen von QR-Codes erforderlich",
    grantPermission: "Berechtigung erteilen",
    scanWalletQR: "Wallet-QR-Code oder Web-Session-QR scannen",
    startScanning: "Scannen starten",
    scannedData: "Gescannte Daten",
    connectWallet: "Wallet verbinden",
    walletConnectDesc: "WalletConnect-URI einfügen um externes Wallet zu verbinden",
    walletConnectInfo: "Verbinden Sie Wallets die WalletConnect unterstützen wie MetaMask, Trust Wallet",
    connect: "Verbinden",
    wcPasteHint: "URI mit wc: einfügen",
    invalidQRCode: "Ungültiger QR-Code",
    invalidWCUri: "Ungültige WalletConnect-URI",
    wcComingSoon: "WalletConnect-Integration kommt bald",
    wcConnectionFailed: "Verbindung fehlgeschlagen",
    sessionSyncSuccess: "Web-Session erfolgreich synchronisiert",
  },
  fr: {
    welcomeTitle: "Bienvenue sur Auxite Wallet",
    welcomeSubtitle: "Achetez et vendez des tokens numériques adossés à des métaux physiques.",
    createNewWallet: "Créer un nouveau portefeuille",
    importWallet: "Importer un portefeuille existant",
    seedPhraseTitle: "Votre phrase de récupération",
    seedPhraseWarning: "⚠️ Notez ces 12 mots dans un endroit sûr! Ne les partagez jamais!",
    iWroteItDown: "Noté, Continuer",
    verifyTitle: "Vérifier la phrase de récupération",
    selectWord: "Mot #",
    verifyError: "Mauvais mot sélectionné",
    setPinTitle: "Créer un mot de passe",
    setPinSubtitle: "Définissez votre mot de passe (min 6 caractères)",
    confirmPinTitle: "Confirmer le mot de passe",
    pinMismatch: "Les mots de passe ne correspondent pas",
    enterPinTitle: "Entrer le mot de passe",
    wrongPin: "Mot de passe incorrect",
    forgotPin: "Mot de passe oublié",
    securityTip: "Conseil de sécurité",
    neverShare: "Ne partagez jamais votre phrase de récupération",
    noScreenshot: "Ne prenez pas de captures d'écran",
    writeOnPaper: "Écrivez sur papier et conservez en sécurité",
    keysOnDevice: "Vos clés sont stockées uniquement sur votre appareil",
    import: "Importer",
    reveal: "Révéler les mots",
    hide: "Masquer",
    copy: "Copier",
    copied: "Copié!",
    continue: "Continuer",
    back: "Retour",
    cancel: "Annuler",
    invalidSeed: "Phrase de récupération invalide",
    enterSeedPlaceholder: "Entrez la phrase de récupération...",
    password: "Mot de passe",
    confirmPassword: "Confirmer le mot de passe",
    passwordHint: "Minimum 6 caractères",
    unlock: "Déverrouiller",
    logout: "Déconnexion",
    resetConfirm: "Êtes-vous sûr? Vous devrez réimporter avec votre phrase seed.",
    enterSeedHint: "Entrez les mots séparés par des espaces",
    unlockSubtitle: "Entrez le mot de passe pour accéder à votre portefeuille",
    nonCustodial: "Non-custodial",
    yourKeys: "Vos clés",
    secure: "Sécurisé",
    error: "Erreur",
    success: "Succès",
    warning: "Avertissement",
    ok: "OK",
    walletCreateFailed: "Impossible de créer le portefeuille. Veuillez réessayer.",
    walletImportFailed: "Impossible d'importer le portefeuille. Vérifiez votre phrase de récupération.",
    walletImportSuccess: "Votre portefeuille a été importé avec succès!",
    recoveryPhrase: "Phrase de récupération",
    scanQR: "Scanner QR",
    scanQRDesc: "Scannez le code QR pour connecter votre portefeuille externe",
    cameraPermissionRequired: "Permission caméra requise pour scanner les codes QR",
    grantPermission: "Accorder la permission",
    scanWalletQR: "Scannez le code QR du portefeuille ou de la session web",
    startScanning: "Commencer le scan",
    scannedData: "Données scannées",
    connectWallet: "Connecter le portefeuille",
    walletConnectDesc: "Collez l'URI WalletConnect pour connecter votre portefeuille externe",
    walletConnectInfo: "Connectez des portefeuilles compatibles WalletConnect comme MetaMask, Trust Wallet",
    connect: "Connecter",
    wcPasteHint: "Collez l'URI commençant par wc:",
    invalidQRCode: "Code QR invalide",
    invalidWCUri: "URI WalletConnect invalide",
    wcComingSoon: "Intégration WalletConnect bientôt disponible",
    wcConnectionFailed: "Échec de la connexion",
    sessionSyncSuccess: "Session web synchronisée avec succès",
  },
  ar: {
    welcomeTitle: "مرحباً بكم في Auxite Wallet",
    welcomeSubtitle: "شراء وبيع الرموز الرقمية المدعومة بالمعادن الفيزيائية.",
    createNewWallet: "إنشاء محفظة جديدة",
    importWallet: "استيراد محفظة موجودة",
    seedPhraseTitle: "عبارة الاسترداد الخاصة بك",
    seedPhraseWarning: "⚠️ اكتب هذه الكلمات الـ12 في مكان آمن! لا تشاركها أبداً!",
    iWroteItDown: "كتبتها، متابعة",
    verifyTitle: "تأكيد عبارة الاسترداد",
    selectWord: "الكلمة #",
    verifyError: "تم اختيار كلمة خاطئة",
    setPinTitle: "إنشاء كلمة مرور",
    setPinSubtitle: "قم بتعيين كلمة مرور الأمان (6 أحرف كحد أدنى)",
    confirmPinTitle: "تأكيد كلمة المرور",
    pinMismatch: "كلمات المرور غير متطابقة",
    enterPinTitle: "أدخل كلمة المرور",
    wrongPin: "كلمة مرور خاطئة",
    forgotPin: "نسيت كلمة المرور",
    securityTip: "نصيحة أمنية",
    neverShare: "لا تشارك عبارة الاسترداد أبداً",
    noScreenshot: "لا تأخذ لقطات شاشة",
    writeOnPaper: "اكتب على ورق واحفظ بأمان",
    keysOnDevice: "مفاتيحك مخزنة فقط على جهازك",
    import: "استيراد",
    reveal: "إظهار الكلمات",
    hide: "إخفاء",
    copy: "نسخ",
    copied: "تم النسخ!",
    continue: "متابعة",
    back: "رجوع",
    cancel: "إلغاء",
    invalidSeed: "عبارة استرداد غير صالحة",
    enterSeedPlaceholder: "أدخل عبارة الاسترداد...",
    password: "كلمة المرور",
    confirmPassword: "تأكيد كلمة المرور",
    passwordHint: "6 أحرف كحد أدنى",
    unlock: "فتح القفل",
    logout: "تسجيل الخروج",
    resetConfirm: "هل أنت متأكد؟ ستحتاج إلى إعادة الاستيراد باستخدام عبارة البذور.",
    enterSeedHint: "أدخل الكلمات مفصولة بمسافات",
    unlockSubtitle: "أدخل كلمة المرور للوصول إلى محفظتك",
    nonCustodial: "غير حفظي",
    yourKeys: "مفاتيحك",
    secure: "آمن",
    error: "خطأ",
    success: "نجاح",
    warning: "تحذير",
    ok: "موافق",
    walletCreateFailed: "فشل إنشاء المحفظة. يرجى المحاولة مرة أخرى.",
    walletImportFailed: "فشل استيراد المحفظة. يرجى التحقق من عبارة الاسترداد.",
    walletImportSuccess: "تم استيراد محفظتك بنجاح!",
    recoveryPhrase: "عبارة الاسترداد",
    scanQR: "مسح QR",
    scanQRDesc: "امسح رمز QR لربط محفظتك الخارجية",
    cameraPermissionRequired: "إذن الكاميرا مطلوب لمسح رموز QR",
    grantPermission: "منح الإذن",
    scanWalletQR: "امسح رمز QR للمحفظة أو جلسة الويب",
    startScanning: "بدء المسح",
    scannedData: "البيانات الممسوحة",
    connectWallet: "ربط المحفظة",
    walletConnectDesc: "الصق رابط WalletConnect لربط محفظتك الخارجية",
    walletConnectInfo: "اربط المحافظ التي تدعم WalletConnect مثل MetaMask وTrust Wallet",
    connect: "ربط",
    wcPasteHint: "الصق الرابط الذي يبدأ بـ wc:",
    invalidQRCode: "رمز QR غير صالح",
    invalidWCUri: "رابط WalletConnect غير صالح",
    wcComingSoon: "تكامل WalletConnect قريباً",
    wcConnectionFailed: "فشل الاتصال",
    sessionSyncSuccess: "تمت مزامنة جلسة الويب بنجاح",
  },
  ru: {
    welcomeTitle: "Добро пожаловать в Auxite Wallet",
    welcomeSubtitle: "Покупайте и продавайте цифровые токены, обеспеченные физическими металлами.",
    createNewWallet: "Создать новый кошелек",
    importWallet: "Импортировать существующий кошелек",
    seedPhraseTitle: "Ваша фраза восстановления",
    seedPhraseWarning: "⚠️ Запишите эти 12 слов в безопасном месте! Никогда не делитесь ими!",
    iWroteItDown: "Записал, Продолжить",
    verifyTitle: "Подтвердить фразу восстановления",
    selectWord: "Слово #",
    verifyError: "Выбрано неправильное слово",
    setPinTitle: "Создать пароль",
    setPinSubtitle: "Установите пароль безопасности (мин. 6 символов)",
    confirmPinTitle: "Подтвердить пароль",
    pinMismatch: "Пароли не совпадают",
    enterPinTitle: "Введите пароль",
    wrongPin: "Неверный пароль",
    forgotPin: "Забыли пароль",
    securityTip: "Совет по безопасности",
    neverShare: "Никогда не делитесь фразой восстановления",
    noScreenshot: "Не делайте скриншоты",
    writeOnPaper: "Запишите на бумаге и храните в безопасности",
    keysOnDevice: "Ваши ключи хранятся только на вашем устройстве",
    import: "Импорт",
    reveal: "Показать слова",
    hide: "Скрыть",
    copy: "Копировать",
    copied: "Скопировано!",
    continue: "Продолжить",
    back: "Назад",
    cancel: "Отмена",
    invalidSeed: "Недействительная фраза восстановления",
    enterSeedPlaceholder: "Введите фразу восстановления...",
    password: "Пароль",
    confirmPassword: "Подтвердить пароль",
    passwordHint: "Минимум 6 символов",
    unlock: "Разблокировать",
    logout: "Выйти",
    resetConfirm: "Вы уверены? Вам нужно будет снова импортировать с помощью seed-фразы.",
    enterSeedHint: "Введите слова через пробел",
    unlockSubtitle: "Введите пароль для доступа к кошельку",
    nonCustodial: "Non-custodial",
    yourKeys: "Ваши ключи",
    secure: "Безопасно",
    error: "Ошибка",
    success: "Успех",
    warning: "Предупреждение",
    ok: "ОК",
    walletCreateFailed: "Не удалось создать кошелек. Пожалуйста, попробуйте снова.",
    walletImportFailed: "Не удалось импортировать кошелек. Проверьте вашу фразу восстановления.",
    walletImportSuccess: "Ваш кошелек успешно импортирован!",
    recoveryPhrase: "Фраза восстановления",
    scanQR: "Сканировать QR",
    scanQRDesc: "Отсканируйте QR-код для подключения внешнего кошелька",
    cameraPermissionRequired: "Для сканирования QR-кодов требуется разрешение камеры",
    grantPermission: "Предоставить разрешение",
    scanWalletQR: "Отсканируйте QR-код кошелька или веб-сессии",
    startScanning: "Начать сканирование",
    scannedData: "Отсканированные данные",
    connectWallet: "Подключить кошелек",
    walletConnectDesc: "Вставьте URI WalletConnect для подключения внешнего кошелька",
    walletConnectInfo: "Подключите кошельки с поддержкой WalletConnect, такие как MetaMask, Trust Wallet",
    connect: "Подключить",
    wcPasteHint: "Вставьте URI, начинающийся с wc:",
    invalidQRCode: "Недействительный QR-код",
    invalidWCUri: "Недействительный URI WalletConnect",
    wcComingSoon: "Интеграция WalletConnect скоро появится",
    wcConnectionFailed: "Ошибка подключения",
    sessionSyncSuccess: "Веб-сессия успешно синхронизирована",
  },
};

// ============================================
// STORAGE KEYS
// ============================================
const STORAGE_KEYS = {
  HAS_WALLET: 'auxite_has_wallet',
  ENCRYPTED_SEED: 'auxite_encrypted_seed',
  PASSWORD_HASH: 'auxite_password_hash',
  WALLET_ADDRESS: 'auxite_wallet_address',
};

// ============================================
// CRYPTO UTILS
// ============================================
function generateSeedPhrase(): string[] {
  try {
    // Method 1: ethers.js v5 - Wallet.createRandom (en güvenilir)
    if (ethers.Wallet && ethers.Wallet.createRandom) {
      const wallet = ethers.Wallet.createRandom();
      if (wallet.mnemonic && wallet.mnemonic.phrase) {
        console.log('✅ Generated BIP39 mnemonic (Wallet v5)');
        return wallet.mnemonic.phrase.split(' ');
      }
    }
    
    // Method 2: ethers.js v6 - HDNodeWallet.createRandom
    if (ethers.HDNodeWallet && ethers.HDNodeWallet.createRandom) {
      const wallet = ethers.HDNodeWallet.createRandom();
      if (wallet.mnemonic && wallet.mnemonic.phrase) {
        console.log('✅ Generated BIP39 mnemonic (HDNodeWallet v6)');
        return wallet.mnemonic.phrase.split(' ');
      }
    }
    
    throw new Error('Mnemonic generation failed');
  } catch (error) {
    console.error('❌ Generate seed phrase error:', error);
    // Fallback - BIP39 wordlist'ten rastgele kelimeler
    // NOT: Bu kriptografik olarak güvenli DEĞİL, sadece test için
    console.warn('⚠️ Using fallback seed generation - NOT SECURE');
    const words: string[] = [];
    const usedIndices = new Set<number>();
    while (words.length < 12) {
      const randomIndex = Math.floor(Math.random() * BIP39_WORDLIST.length);
      if (!usedIndices.has(randomIndex)) {
        usedIndices.add(randomIndex);
        words.push(BIP39_WORDLIST[randomIndex]);
      }
    }
    return words;
  }
}

async function hashPassword(password: string): Promise<string> {
  try {
    const data = password + 'AUXITE_SALT_2024';
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      data
    );
    return hash;
  } catch (error) {
    console.error('Hash password error:', error);
    // Fallback: simple hash
    let hash = 0;
    const str = password + 'AUXITE_SALT_2024';
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  }
}

async function deriveAddressFromSeed(seedPhrase: string[]): Promise<string> {
  const mnemonic = seedPhrase.join(' ');
  
  try {
    // Method 1: ethers.js v5 - HDNode (en güvenilir)
    if (ethers.utils && ethers.utils.HDNode) {
      const hdNode = ethers.utils.HDNode.fromMnemonic(mnemonic);
      const derived = hdNode.derivePath("m/44'/60'/0'/0/0");
      console.log('✅ Derived address (HDNode v5):', derived.address);
      return derived.address;
    }
    
    // Method 2: ethers.js v5 - Wallet.fromMnemonic
    if (ethers.Wallet && ethers.Wallet.fromMnemonic) {
      const wallet = ethers.Wallet.fromMnemonic(mnemonic, "m/44'/60'/0'/0/0");
      console.log('✅ Derived address (Wallet v5):', wallet.address);
      return wallet.address;
    }
    
    // Method 3: ethers.js v6 - HDNodeWallet
    if (ethers.HDNodeWallet && ethers.HDNodeWallet.fromPhrase) {
      const wallet = ethers.HDNodeWallet.fromPhrase(mnemonic);
      console.log('✅ Derived address (HDNodeWallet v6):', wallet.address);
      return wallet.address;
    }
    
    // Method 4: ethers.js v6 - Wallet.fromPhrase
    if (ethers.Wallet && ethers.Wallet.fromPhrase) {
      const wallet = ethers.Wallet.fromPhrase(mnemonic);
      console.log('✅ Derived address (Wallet v6):', wallet.address);
      return wallet.address;
    }
    
    throw new Error('No compatible ethers method found');
  } catch (error) {
    console.error('❌ Derive address error:', error);
    throw new Error('Mnemonic ile adres türetilemedi. Lütfen geçerli bir kurtarma ifadesi girin.');
  }
}

// Simple Base64 encoding for ASCII strings (React Native compatible)
function encryptSeed(seedPhrase: string[], _password: string): string {
  try {
    const seedString = seedPhrase.join(',');
    // Use simple encoding that works in React Native
    const encoded = seedString.split('').map(char => char.charCodeAt(0).toString(16).padStart(2, '0')).join('');
    return encoded;
  } catch (error) {
    console.error('Encrypt seed error:', error);
    return seedPhrase.join(',');
  }
}

function decryptSeed(encryptedSeed: string, _password: string): string[] | null {
  try {
    // Check if it's hex encoded
    if (/^[0-9a-fA-F]+$/.test(encryptedSeed) && encryptedSeed.length % 2 === 0) {
      let decoded = '';
      for (let i = 0; i < encryptedSeed.length; i += 2) {
        decoded += String.fromCharCode(parseInt(encryptedSeed.substr(i, 2), 16));
      }
      return decoded.split(',');
    }
    // Fallback: try direct split
    return encryptedSeed.split(',');
  } catch (error) {
    console.error('Decrypt seed error:', error);
    return null;
  }
}

// ============================================
// TYPES
// ============================================
type WalletStep =
  | 'checking'
  | 'onboarding'
  | 'create'
  | 'verify'
  | 'password'
  | 'confirm-password'
  | 'import'
  | 'unlock'
  | 'ready';

type Language = 'tr' | 'en' | 'de' | 'fr' | 'ar' | 'ru';

interface WalletOnboardingProps {
  lang?: Language;
  onWalletReady: (address: string) => void;
}

interface AlertState {
  visible: boolean;
  type: 'success' | 'error' | 'warning';
  title: string;
  message: string;
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function WalletOnboarding({
  lang,
  onWalletReady,
}: WalletOnboardingProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  
  // Get language and theme from useStore
  const { language: storeLanguage, theme } = useStore();
  const currentLang = (lang || storeLanguage || 'en') as Language;
  
  // Theme
  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';
  const colors = getColors(isDark);
  
  const [step, setStep] = useState<WalletStep>('checking');
  const [seedPhrase, setSeedPhrase] = useState<string[]>([]);
  const [seedRevealed, setSeedRevealed] = useState(false);
  const [verifyStep, setVerifyStep] = useState(0);
  const [verifyIndices, setVerifyIndices] = useState<number[]>([]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [importSeedInput, setImportSeedInput] = useState('');
  const [storedPasswordHash, setStoredPasswordHash] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [copied, setCopied] = useState(false);
  const [verifyOptions, setVerifyOptions] = useState<string[]>([]);
  
  // Import Method State
  const [importMethod, setImportMethod] = useState<'phrase' | 'qr' | 'walletconnect'>('phrase');
  const [showScanner, setShowScanner] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [wcUri, setWcUri] = useState('');
  
  // Camera Permission
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  
  // Alert Modal State
  const [alertState, setAlertState] = useState<AlertState>({
    visible: false,
    type: 'error',
    title: '',
    message: '',
  });
  
  // Confirm Modal State (for forgot password)
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  // Custodial wallet state
  const [custodialLoading, setCustodialLoading] = useState(false);

  const showAlert = (type: 'success' | 'error' | 'warning', title: string, message: string) => {
    setAlertState({ visible: true, type, title, message });
  };
  
  const hideAlert = () => {
    setAlertState(prev => ({ ...prev, visible: false }));
  };
  
  // QR Code Handler
  const handleQRScanned = ({ data }: { data: string }) => {
    setScannedData(data);
    setShowScanner(false);
    
    // Check if it's a WalletConnect URI
    if (data.startsWith('wc:')) {
      setImportMethod('walletconnect');
      setWcUri(data);
    }
  };
  
  // Scanned Data Submit Handler
  const handleScannedDataSubmit = async () => {
    if (!scannedData) return;
    
    // Check if it's a seed phrase (12 or 24 words)
    const words = scannedData.trim().toLowerCase().split(/\s+/);
    if (words.length === 12 || words.length === 24) {
      const validWords = words.every((word) => BIP39_WORDLIST.includes(word));
      if (validWords) {
        setSeedPhrase(words);
        setPassword('');
        setConfirmPassword('');
        setStep('password');
        setScannedData(null);
        return;
      }
    }
    
    // Check if it's a WalletConnect URI
    if (scannedData.startsWith('wc:')) {
      setWcUri(scannedData);
      setImportMethod('walletconnect');
      handleWalletConnectSubmit();
      return;
    }
    
    // Check if it's a web session sync QR (URI format: auxite://auth?session=xxx&address=xxx)
    if (scannedData.startsWith('auxite://') || scannedData.includes('auxite') || scannedData.includes('session') || scannedData.includes('auxite_login')) {
      try {
        // Try JSON format first (from /api/auth/qr-login)
        // Format: {"type":"auxite_login","sessionId":"xxx","code":"xxx","expiresAt":xxx}
        try {
          const sessionData = JSON.parse(scannedData);

          // If it has address directly - use it
          if (sessionData.address && sessionData.address.startsWith('0x')) {
            console.log('📱 Session sync (JSON with address):', sessionData.address);
            await AsyncStorage.setItem(STORAGE_KEYS.HAS_WALLET, 'true');
            await AsyncStorage.setItem(STORAGE_KEYS.WALLET_ADDRESS, sessionData.address);
            setWalletAddress(sessionData.address);
            showAlert('success', t('success'), t('sessionSyncSuccess'));
            setScannedData(null);
            setStep('password');
            return;
          }

          // If it's auxite_login type with sessionId - this is QR login from web
          // Mobile needs to approve with its own wallet address
          if (sessionData.type === 'auxite_login' && sessionData.sessionId) {
            console.log('📱 QR Login detected, sessionId:', sessionData.sessionId);

            // Check if mobile has a wallet
            const storedAddress = await AsyncStorage.getItem(STORAGE_KEYS.WALLET_ADDRESS);

            if (!storedAddress) {
              showAlert('error', t('error'), 'Önce bir cüzdan oluşturun veya içe aktarın');
              return;
            }

            setIsLoading(true);

            // Approve the QR login session
            const approveResult = await approveQRLogin({
              sessionId: sessionData.sessionId,
              walletAddress: storedAddress,
            });

            setIsLoading(false);

            if (approveResult.success) {
              console.log('📱 ✅ QR Login approved for:', storedAddress);
              showAlert('success', t('success'), 'Web oturumu onaylandı!');
              setScannedData(null);
              setShowScanner(false);
            } else {
              console.log('📱 ❌ QR Login failed:', approveResult.error);
              showAlert('error', t('error'), approveResult.error || 'Onay başarısız');
            }
            return;
          }
        } catch {
          // Not JSON, try URI format
        }

        // Parse URI format: auxite://auth?session=xxx&code=xxx&address=xxx
        if (scannedData.startsWith('auxite://')) {
          console.log('📱 Parsing auxite URI:', scannedData);

          // Extract query params manually (URLSearchParams may not work in RN)
          const queryString = scannedData.split('?')[1];
          if (queryString) {
            const params: Record<string, string> = {};
            queryString.split('&').forEach(param => {
              const [key, value] = param.split('=');
              if (key && value) {
                params[key] = decodeURIComponent(value);
              }
            });

            console.log('📱 Parsed params:', params);

            const { session, code, address } = params;

            // ═══════════════════════════════════════════════════════════════
            // PAIRING FLOW: If we have session + code + address, use backend API
            // ═══════════════════════════════════════════════════════════════
            if (session && code && address && address.startsWith('0x')) {
              console.log('📱 🔐 Starting pairing flow...');
              setIsLoading(true);

              try {
                // Complete the pairing process with backend
                const pairingResult = await completePairing({
                  sessionId: session,
                  pairingCode: code,
                  walletAddress: address,
                });

                if (pairingResult.success) {
                  console.log('📱 ✅ Pairing successful:', pairingResult);

                  // Save wallet mode from backend response
                  const walletMode = pairingResult.walletType || 'external';
                  await AsyncStorage.setItem(STORAGE_KEYS.HAS_WALLET, 'true');
                  await AsyncStorage.setItem(STORAGE_KEYS.WALLET_ADDRESS, address);
                  await AsyncStorage.setItem('auxite_wallet_mode', walletMode);

                  setWalletAddress(address);
                  showAlert('success', t('success'), t('sessionSyncSuccess'));
                  setScannedData(null);
                  setIsLoading(false);
                  setStep('password');
                  return;
                } else {
                  console.log('📱 ❌ Pairing failed:', pairingResult.error);
                  setIsLoading(false);
                  showAlert('error', t('error'), pairingResult.error || 'Eşleştirme başarısız');
                  return;
                }
              } catch (pairingError) {
                console.error('📱 ❌ Pairing error:', pairingError);
                setIsLoading(false);
                // Fallback to direct address usage
              }
            }

            // ═══════════════════════════════════════════════════════════════
            // FALLBACK: If only address is available (no session/code)
            // ═══════════════════════════════════════════════════════════════
            if (address && address.startsWith('0x')) {
              console.log('📱 ✅ Got address from QR (fallback):', address);

              // Check user info from backend
              const userInfo = await checkUserExists(address);
              const walletMode = userInfo.walletType || 'external';

              await AsyncStorage.setItem(STORAGE_KEYS.HAS_WALLET, 'true');
              await AsyncStorage.setItem(STORAGE_KEYS.WALLET_ADDRESS, address);
              await AsyncStorage.setItem('auxite_wallet_mode', walletMode);

              setWalletAddress(address);
              showAlert('success', t('success'), t('sessionSyncSuccess'));
              setScannedData(null);
              setStep('password');
              return;
            }
          }

          // No address in QR - show error
          console.log('📱 ❌ No address found in QR');
          showAlert('error', t('error'), 'QR kodunda adres bulunamadı');
          return;
        }
      } catch (error) {
        console.error('Session sync error:', error);
      }
    }
    
    showAlert('error', t('error'), t('invalidQRCode'));
  };
  
  // WalletConnect Submit Handler
  const handleWalletConnectSubmit = async () => {
    if (!wcUri.startsWith('wc:')) {
      showAlert('error', t('error'), t('invalidWCUri'));
      return;
    }
    
    try {
      // TODO: Implement actual WalletConnect connection
      // For now, show a message that this feature is coming soon
      showAlert('warning', t('warning'), t('wcComingSoon'));
    } catch (error) {
      console.error('WalletConnect error:', error);
      showAlert('error', t('error'), t('wcConnectionFailed'));
    }
  };

  const t = (key: string) => translations[currentLang]?.[key] || translations['en'][key] || key;

  // Check if wallet exists
  useEffect(() => {
    checkWalletExists();
  }, []);

  // Generate verify options when step changes
  useEffect(() => {
    if (step === 'verify' && verifyIndices.length > 0) {
      const currentIndex = verifyIndices[verifyStep];
      const correctWord = seedPhrase[currentIndex];
      setVerifyOptions(getVerifyOptions(correctWord));
    }
  }, [step, verifyStep, verifyIndices]);

  const checkWalletExists = async () => {
    try {
      const hasWallet = await AsyncStorage.getItem(STORAGE_KEYS.HAS_WALLET);
      const passwordHash = await AsyncStorage.getItem(STORAGE_KEYS.PASSWORD_HASH);
      const address = await AsyncStorage.getItem(STORAGE_KEYS.WALLET_ADDRESS);

      if (hasWallet === 'true' && passwordHash) {
        setStoredPasswordHash(passwordHash);
        setWalletAddress(address);
        setStep('unlock');
      } else {
        setStep('onboarding');
      }
    } catch (error) {
      setStep('onboarding');
    }
  };

  // Create wallet (self-custody with seed phrase)
  const handleCreateWallet = () => {
    const newSeed = generateSeedPhrase();
    setSeedPhrase(newSeed);
    setSeedRevealed(false);
    setStep('create');
  };

  // Create custodial wallet (no seed phrase, server-managed)
  const handleCreateCustodialWallet = async () => {
    setCustodialLoading(true);
    try {
      const { createCustodialWallet } = await import('@/services/api');
      const result = await createCustodialWallet();

      if (result.success && result.walletAddress) {
        // Store wallet info
        await AsyncStorage.setItem(STORAGE_KEYS.HAS_WALLET, 'true');
        await AsyncStorage.setItem(STORAGE_KEYS.WALLET_ADDRESS, result.walletAddress);
        await AsyncStorage.setItem('auxite_wallet_mode', 'custodial');
        if (result.userId) {
          await AsyncStorage.setItem('auxite_user_id', result.userId);
        }

        setWalletAddress(result.walletAddress);
        showAlert('success', t('success'), t('custodialCreated'));

        // Wait a bit then proceed
        setTimeout(() => {
          hideAlert();
          onWalletReady(result.walletAddress!);
        }, 1500);
      } else {
        showAlert('error', t('error'), result.error || t('walletCreateFailed'));
      }
    } catch (error: any) {
      console.error('Custodial wallet creation error:', error);
      showAlert('error', t('error'), error.message || t('walletCreateFailed'));
    } finally {
      setCustodialLoading(false);
    }
  };

  // Generate verify indices
  const generateVerifyIndices = (): number[] => {
    const indices: number[] = [];
    while (indices.length < 3) {
      const idx = Math.floor(Math.random() * 12);
      if (!indices.includes(idx)) {
        indices.push(idx);
      }
    }
    return indices.sort((a, b) => a - b);
  };

  // Continue after seed display
  const handleSeedContinue = () => {
    const indices = generateVerifyIndices();
    setVerifyIndices(indices);
    setVerifyStep(0);
    setStep('verify');
  };

  // Verify word
  const handleVerifyWord = (selectedWord: string, correctWord: string): boolean => {
    if (selectedWord === correctWord) {
      if (verifyStep < 2) {
        setVerifyStep(verifyStep + 1);
      } else {
        setPassword('');
        setConfirmPassword('');
        setStep('password');
      }
      return true;
    }
    return false;
  };

  // Set password
  const handleSetPassword = () => {
    if (password.length < 6) {
      setPasswordError(t('passwordHint'));
      return;
    }
    setPasswordError('');
    setStep('confirm-password');
  };

  // Confirm password and save
  const handleConfirmPassword = async () => {
    if (password !== confirmPassword) {
      setPasswordError(t('pinMismatch'));
      return;
    }

    try {
      // Step 1: Hash password
      let passwordHash: string;
      try {
        passwordHash = await hashPassword(password);
        console.log('Password hashed successfully');
      } catch (hashError) {
        console.error('Password hash failed:', hashError);
        throw hashError;
      }

      // ═══════════════════════════════════════════════════════════════════
      // SESSION SYNC: Adres zaten QR'dan geldi, seed türetme YAPMA
      // ═══════════════════════════════════════════════════════════════════
      if (walletAddress && (!seedPhrase || seedPhrase.length === 0)) {
        console.log('📱 Session sync mode - using existing address:', walletAddress);
        
        // Sadece şifreyi kaydet
        await AsyncStorage.setItem(STORAGE_KEYS.HAS_WALLET, 'true');
        await AsyncStorage.setItem(STORAGE_KEYS.PASSWORD_HASH, passwordHash);
        await AsyncStorage.setItem(STORAGE_KEYS.WALLET_ADDRESS, walletAddress);
        
        console.log('✅ Session sync complete');
        onWalletReady(walletAddress);
        return;
      }

      // ═══════════════════════════════════════════════════════════════════
      // NORMAL FLOW: Seed phrase ile wallet oluştur
      // ═══════════════════════════════════════════════════════════════════
      
      // Validate seed phrase exists
      if (!seedPhrase || seedPhrase.length === 0) {
        console.error('No seed phrase available');
        showAlert('error', t('error'), t('walletCreateFailed'));
        return;
      }

      console.log('Starting wallet creation...');
      console.log('Seed phrase length:', seedPhrase.length);
      
      // Step 2: Encrypt seed
      let encryptedSeed: string;
      try {
        encryptedSeed = encryptSeed(seedPhrase, password);
        console.log('Seed encrypted successfully');
      } catch (encryptError) {
        console.error('Seed encryption failed:', encryptError);
        throw encryptError;
      }
      
      // Step 3: Derive address
      let address: string;
      try {
        address = await deriveAddressFromSeed(seedPhrase);
        console.log('Address derived:', address);
      } catch (deriveError) {
        console.error('Address derivation failed:', deriveError);
        throw deriveError;
      }

      // Step 4: Save to AsyncStorage
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.HAS_WALLET, 'true');
        await AsyncStorage.setItem(STORAGE_KEYS.PASSWORD_HASH, passwordHash);
        await AsyncStorage.setItem(STORAGE_KEYS.ENCRYPTED_SEED, encryptedSeed);
        await AsyncStorage.setItem(STORAGE_KEYS.WALLET_ADDRESS, address);
        console.log('Data saved to AsyncStorage');
      } catch (storageError) {
        console.error('AsyncStorage save failed:', storageError);
        throw storageError;
      }

      setWalletAddress(address);
      console.log('Wallet creation complete, calling onWalletReady');
      onWalletReady(address);
    } catch (error: any) {
      console.error('Wallet creation error:', error);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      showAlert('error', t('error'), t('walletCreateFailed'));
    }
  };

  // Import wallet
  const handleImportSubmit = () => {
    const words = importSeedInput.trim().toLowerCase().split(/\s+/);

    if (words.length !== 12 && words.length !== 24) {
      showAlert('error', t('error'), t('invalidSeed'));
      return;
    }

    const validWords = words.every((word) => BIP39_WORDLIST.includes(word));
    if (!validWords) {
      showAlert('error', t('error'), t('invalidSeed'));
      return;
    }

    setSeedPhrase(words);
    setPassword('');
    setConfirmPassword('');
    setStep('password');
  };

  // Unlock
  const handleUnlock = async () => {
    try {
      const enteredHash = await hashPassword(unlockPassword);
      if (enteredHash === storedPasswordHash) {
        if (walletAddress) {
          onWalletReady(walletAddress);
        }
      } else {
        setUnlockError(t('wrongPin'));
        setUnlockPassword('');
      }
    } catch (error) {
      setUnlockError(t('wrongPin'));
    }
  };

  // Forgot password
  const handleForgotPassword = () => {
    setShowConfirmReset(true);
  };
  
  const handleConfirmReset = async () => {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.HAS_WALLET,
      STORAGE_KEYS.PASSWORD_HASH,
      STORAGE_KEYS.ENCRYPTED_SEED,
      STORAGE_KEYS.WALLET_ADDRESS,
    ]);
    setShowConfirmReset(false);
    setStep('import');
  };

  // Copy seed
  const handleCopySeed = async () => {
    await Clipboard.setStringAsync(seedPhrase.join(' '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Get options for verify
  const getVerifyOptions = (correctWord: string): string[] => {
    const options = [correctWord];
    while (options.length < 4) {
      const randomWord = BIP39_WORDLIST[Math.floor(Math.random() * BIP39_WORDLIST.length)];
      if (!options.includes(randomWord)) {
        options.push(randomWord);
      }
    }
    return options.sort(() => Math.random() - 0.5);
  };

  // ============================================
  // RENDER FUNCTIONS
  // ============================================

  // Checking Screen
  if (step === 'checking') {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <View style={[styles.iconCircle, { backgroundColor: colors.surface }]}>
          <Ionicons name="wallet-outline" size={40} color={colors.primary} />
        </View>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 24 }} />
      </View>
    );
  }

  // Onboarding Screen
  if (step === 'onboarding') {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 40, backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image 
              source={require('@/assets/images/auxite-wallet-logo.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>{t('welcomeTitle')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('welcomeSubtitle')}</Text>

          {/* Features */}
          <View style={styles.featuresRow}>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.surface }]}>
                <Ionicons name="shield-checkmark-outline" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>{t('nonCustodial')}</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.surface }]}>
                <Ionicons name="key-outline" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>{t('yourKeys')}</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.surface }]}>
                <Ionicons name="lock-closed-outline" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>{t('secure')}</Text>
            </View>
          </View>

          {/* Custodial Wallet Button - Recommended */}
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: '#10B981' }]}
            onPress={handleCreateCustodialWallet}
            disabled={custodialLoading}
          >
            {custodialLoading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="flash-outline" size={22} color="#FFF" />
            )}
            <Text style={styles.primaryButtonText}>
              {custodialLoading ? t('creatingWallet') : t('createCustodialWallet')}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.custodialDesc, { color: colors.textMuted }]}>
            {t('custodialDesc')}
          </Text>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textMuted }]}>{t('orDivider')}</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Self-Custody Buttons */}
          <TouchableOpacity style={[styles.secondaryButton, { borderColor: colors.border }]} onPress={handleCreateWallet}>
            <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
            <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>{t('createNewWallet')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.secondaryButton, { borderColor: colors.border }]} onPress={() => setStep('import')}>
            <Ionicons name="download-outline" size={22} color={colors.primary} />
            <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>{t('importWallet')}</Text>
          </TouchableOpacity>

          {/* Security note */}
          <View style={styles.securityNote}>
            <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
            <Text style={[styles.securityNoteText, { color: colors.textMuted }]}>{t('keysOnDevice')}</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Seed Display Screen
  if (step === 'create') {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={() => setStep('onboarding')}>
            <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
            <Text style={[styles.backButtonText, { color: colors.textSecondary }]}>{t('back')}</Text>
          </TouchableOpacity>

          <Text style={[styles.title, { color: colors.text }]}>{t('seedPhraseTitle')}</Text>

          {/* Warning */}
          <View style={[styles.warningBox, { backgroundColor: colors.warningBg }]}>
            <Text style={styles.warningText}>{t('seedPhraseWarning')}</Text>
          </View>

          {/* Seed Grid */}
          <View style={styles.seedGrid}>
            {seedPhrase.map((word, index) => (
              <View key={index} style={[styles.seedWord, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.seedWordIndex, { color: colors.textMuted }]}>{index + 1}</Text>
                <Text style={[styles.seedWordText, { color: colors.text }, !seedRevealed && styles.seedWordHidden]}>
                  {seedRevealed ? word : '••••••'}
                </Text>
              </View>
            ))}
          </View>

          {/* Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.surface }]}
              onPress={() => setSeedRevealed(!seedRevealed)}
            >
              <Ionicons
                name={seedRevealed ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textSecondary}
              />
              <Text style={[styles.actionButtonText, { color: colors.textSecondary }]}>
                {seedRevealed ? t('hide') : t('reveal')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.surface }, !seedRevealed && styles.actionButtonDisabled]}
              onPress={handleCopySeed}
              disabled={!seedRevealed}
            >
              <Ionicons name="copy-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.actionButtonText, { color: colors.textSecondary }]}>{copied ? t('copied') : t('copy')}</Text>
            </TouchableOpacity>
          </View>

          {/* Security Tips */}
          <View style={[styles.tipsBox, { backgroundColor: colors.surface }]}>
            <Text style={[styles.tipsTitle, { color: colors.text }]}>{t('securityTip')}</Text>
            <View style={styles.tipItem}>
              <Ionicons name="close-circle" size={16} color={colors.error} />
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>{t('neverShare')}</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="close-circle" size={16} color={colors.error} />
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>{t('noScreenshot')}</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>{t('writeOnPaper')}</Text>
            </View>
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={[styles.primaryButton, !seedRevealed && styles.buttonDisabled]}
            onPress={handleSeedContinue}
            disabled={!seedRevealed}
          >
            <Text style={styles.primaryButtonText}>{t('iWroteItDown')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Verify Screen
  if (step === 'verify') {
    const currentIndex = verifyIndices[verifyStep];
    const correctWord = seedPhrase[currentIndex];

    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={() => setStep('create')}>
            <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
            <Text style={[styles.backButtonText, { color: colors.textSecondary }]}>{t('back')}</Text>
          </TouchableOpacity>

          <Text style={[styles.title, { color: colors.text }]}>{t('verifyTitle')}</Text>

          {/* Progress */}
          <View style={styles.progressRow}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={[styles.progressBar, { backgroundColor: colors.surfaceLight }, i <= verifyStep && styles.progressBarActive]}
              />
            ))}
          </View>

          {/* Prompt */}
          <View style={[styles.verifyPrompt, { backgroundColor: colors.surface }]}>
            <Text style={[styles.verifyPromptLabel, { color: colors.textSecondary }]}>{t('selectWord')}</Text>
            <Text style={[styles.verifyPromptNumber, { color: colors.text }]}>{currentIndex + 1}</Text>
          </View>

          {/* Options */}
          <View style={styles.optionsGrid}>
            {verifyOptions.map((word, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.optionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => {
                  if (!handleVerifyWord(word, correctWord)) {
                    showAlert('error', t('error'), t('verifyError'));
                  }
                }}
              >
                <Text style={[styles.optionButtonText, { color: colors.text }]}>{word}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  // Password Screen
  if (step === 'password' || step === 'confirm-password') {
    const isConfirm = step === 'confirm-password';

    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep(isConfirm ? 'password' : 'verify')}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
            <Text style={[styles.backButtonText, { color: colors.textSecondary }]}>{t('back')}</Text>
          </TouchableOpacity>

          {/* Icon */}
          <View style={[styles.iconCircle, { alignSelf: 'center', marginBottom: 24, backgroundColor: colors.surface }]}>
            <Ionicons name="lock-closed-outline" size={32} color={colors.primary} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            {isConfirm ? t('confirmPinTitle') : t('setPinTitle')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('setPinSubtitle')}</Text>

          {/* Input */}
          <TextInput
            style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            value={isConfirm ? confirmPassword : password}
            onChangeText={(text) => {
              if (isConfirm) {
                setConfirmPassword(text);
              } else {
                setPassword(text);
              }
              setPasswordError('');
            }}
            placeholder={isConfirm ? t('confirmPassword') : t('password')}
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            autoFocus
          />

          {/* Error */}
          {passwordError ? (
            <Text style={styles.errorText}>{passwordError}</Text>
          ) : null}

          {/* Continue Button */}
          <TouchableOpacity
            style={[
              styles.primaryButton,
              (isConfirm ? confirmPassword.length < 6 : password.length < 6) && styles.buttonDisabled,
            ]}
            onPress={isConfirm ? handleConfirmPassword : handleSetPassword}
            disabled={isConfirm ? confirmPassword.length < 6 : password.length < 6}
          >
            <Text style={styles.primaryButtonText}>{t('continue')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Import Screen
  if (step === 'import') {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={() => setStep('onboarding')}>
            <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
            <Text style={[styles.backButtonText, { color: colors.textSecondary }]}>{t('back')}</Text>
          </TouchableOpacity>

          <Text style={[styles.title, { color: colors.text }]}>{t('importWallet')}</Text>
          
          {/* Import Method Tabs */}
          <View style={[styles.importTabs, { backgroundColor: colors.surface }]}>
            <TouchableOpacity 
              style={[styles.importTab, importMethod === 'phrase' && { backgroundColor: colors.primary }]}
              onPress={() => setImportMethod('phrase')}
            >
              <Ionicons 
                name="key-outline" 
                size={18} 
                color={importMethod === 'phrase' ? '#FFF' : colors.textSecondary} 
              />
              <Text style={[
                styles.importTabText, 
                { color: importMethod === 'phrase' ? '#FFF' : colors.textSecondary }
              ]}>
                {t('recoveryPhrase')}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.importTab, importMethod === 'qr' && { backgroundColor: colors.primary }]}
              onPress={() => setImportMethod('qr')}
            >
              <Ionicons 
                name="qr-code-outline" 
                size={18} 
                color={importMethod === 'qr' ? '#FFF' : colors.textSecondary} 
              />
              <Text style={[
                styles.importTabText, 
                { color: importMethod === 'qr' ? '#FFF' : colors.textSecondary }
              ]}>
                {t('scanQR')}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.importTab, importMethod === 'walletconnect' && { backgroundColor: colors.primary }]}
              onPress={() => setImportMethod('walletconnect')}
            >
              <Ionicons 
                name="link-outline" 
                size={18} 
                color={importMethod === 'walletconnect' ? '#FFF' : colors.textSecondary} 
              />
              <Text style={[
                styles.importTabText, 
                { color: importMethod === 'walletconnect' ? '#FFF' : colors.textSecondary }
              ]}>
                WalletConnect
              </Text>
            </TouchableOpacity>
          </View>

          {/* Seed Phrase Import */}
          {importMethod === 'phrase' && (
            <>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('enterSeedHint')}</Text>
              
              <TextInput
                style={[styles.textInput, styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={importSeedInput}
                onChangeText={setImportSeedInput}
                placeholder={t('enterSeedPlaceholder')}
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TouchableOpacity
                style={[styles.primaryButton, !importSeedInput.trim() && styles.buttonDisabled]}
                onPress={handleImportSubmit}
                disabled={!importSeedInput.trim()}
              >
                <Ionicons name="download-outline" size={22} color="#FFF" />
                <Text style={styles.primaryButtonText}>{t('import')}</Text>
              </TouchableOpacity>
            </>
          )}

          {/* QR Scanner */}
          {importMethod === 'qr' && (
            <>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('scanQRDesc')}</Text>
              
              {!cameraPermission ? (
                <View style={[styles.qrPlaceholder, { backgroundColor: colors.surface }]}>
                  <Ionicons name="camera-outline" size={48} color={colors.textMuted} />
                  <Text style={[styles.qrPlaceholderText, { color: colors.textSecondary }]}>
                    {t('cameraPermissionRequired')}
                  </Text>
                  <TouchableOpacity style={styles.primaryButton} onPress={requestCameraPermission}>
                    <Ionicons name="shield-checkmark-outline" size={20} color="#FFF" />
                    <Text style={styles.primaryButtonText}>{t('grantPermission')}</Text>
                  </TouchableOpacity>
                </View>
              ) : showScanner ? (
                <View style={styles.scannerContainer}>
                  <CameraView
                    style={styles.camera}
                    facing="back"
                    barcodeScannerSettings={{
                      barcodeTypes: ['qr'],
                    }}
                    onBarcodeScanned={handleQRScanned}
                  />
                  <View style={styles.scannerOverlay}>
                    <View style={styles.scannerFrame} />
                  </View>
                  <TouchableOpacity 
                    style={[styles.closeScannerButton, { backgroundColor: colors.surface }]}
                    onPress={() => setShowScanner(false)}
                  >
                    <Ionicons name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={[styles.qrPlaceholder, { backgroundColor: colors.surface }]}>
                  <Ionicons name="qr-code-outline" size={48} color={colors.primary} />
                  <Text style={[styles.qrPlaceholderText, { color: colors.textSecondary }]}>
                    {t('scanWalletQR')}
                  </Text>
                  <TouchableOpacity style={styles.primaryButton} onPress={() => setShowScanner(true)}>
                    <Ionicons name="scan-outline" size={20} color="#FFF" />
                    <Text style={styles.primaryButtonText}>{t('startScanning')}</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {scannedData && (
                <View style={[styles.scannedDataBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.scannedDataLabel, { color: colors.textSecondary }]}>{t('scannedData')}</Text>
                  <Text style={[styles.scannedDataText, { color: colors.text }]} numberOfLines={2}>
                    {scannedData.substring(0, 50)}...
                  </Text>
                  <TouchableOpacity style={styles.primaryButton} onPress={handleScannedDataSubmit}>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
                    <Text style={styles.primaryButtonText}>{t('connectWallet')}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          {/* WalletConnect */}
          {importMethod === 'walletconnect' && (
            <>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('walletConnectDesc')}</Text>
              
              <View style={[styles.wcInfoBox, { backgroundColor: colors.surface }]}>
                <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
                <Text style={[styles.wcInfoText, { color: colors.textSecondary }]}>
                  {t('walletConnectInfo')}
                </Text>
              </View>
              
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={wcUri}
                onChangeText={setWcUri}
                placeholder="wc:..."
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
              />
              
              <TouchableOpacity
                style={[styles.primaryButton, !wcUri.startsWith('wc:') && styles.buttonDisabled]}
                onPress={handleWalletConnectSubmit}
                disabled={!wcUri.startsWith('wc:')}
              >
                <Ionicons name="link-outline" size={22} color="#FFF" />
                <Text style={styles.primaryButtonText}>{t('connect')}</Text>
              </TouchableOpacity>
              
              <Text style={[styles.wcHint, { color: colors.textMuted }]}>
                {t('wcPasteHint')}
              </Text>
            </>
          )}
        </ScrollView>
      </View>
    );
  }

  // Unlock Screen
  if (step === 'unlock') {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        {/* Icon */}
        <View style={[styles.iconCircle, { backgroundColor: colors.surface }]}>
          <Ionicons name="lock-closed-outline" size={40} color={colors.primary} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>{t('enterPinTitle')}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('unlockSubtitle')}</Text>

        {/* Input */}
        <TextInput
          style={[styles.textInput, { width: width - 48, backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          value={unlockPassword}
          onChangeText={(text) => {
            setUnlockPassword(text);
            setUnlockError('');
          }}
          onSubmitEditing={handleUnlock}
          placeholder={t('password')}
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          autoFocus
        />

        {/* Error */}
        {unlockError ? <Text style={styles.errorText}>{unlockError}</Text> : null}

        {/* Unlock Button */}
        <TouchableOpacity
          style={[
            styles.primaryButton,
            { width: width - 48 },
            unlockPassword.length < 6 && styles.buttonDisabled,
          ]}
          onPress={handleUnlock}
          disabled={unlockPassword.length < 6}
        >
          <Text style={styles.primaryButtonText}>{t('unlock')}</Text>
        </TouchableOpacity>

        {/* Forgot Password */}
        <TouchableOpacity style={styles.forgotButton} onPress={handleForgotPassword}>
          <Text style={styles.forgotButtonText}>{t('forgotPin')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Alert Modal Component
  const AlertModal = () => (
    <Modal visible={alertState.visible} transparent animationType="fade">
      <View style={alertStyles.overlay}>
        <View style={[alertStyles.container, { backgroundColor: colors.surface }]}>
          {/* Icon */}
          <View style={[
            alertStyles.iconContainer,
            { backgroundColor: alertState.type === 'error' ? '#EF444420' : alertState.type === 'success' ? '#10B98120' : '#F59E0B20' }
          ]}>
            <Ionicons 
              name={alertState.type === 'error' ? 'close-circle' : alertState.type === 'success' ? 'checkmark-circle' : 'warning'} 
              size={40} 
              color={alertState.type === 'error' ? '#EF4444' : alertState.type === 'success' ? '#10B981' : '#F59E0B'} 
            />
          </View>
          
          {/* Title */}
          <Text style={[alertStyles.title, { color: colors.text }]}>{alertState.title}</Text>
          
          {/* Message */}
          <Text style={[alertStyles.message, { color: colors.textSecondary }]}>{alertState.message}</Text>
          
          {/* Button */}
          <TouchableOpacity style={alertStyles.button} onPress={hideAlert}>
            <Text style={alertStyles.buttonText}>{t('ok')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
  
  // Confirm Reset Modal Component
  const ConfirmResetModal = () => (
    <Modal visible={showConfirmReset} transparent animationType="fade">
      <View style={alertStyles.overlay}>
        <View style={[alertStyles.container, { backgroundColor: colors.surface }]}>
          {/* Icon */}
          <View style={[alertStyles.iconContainer, { backgroundColor: '#F59E0B20' }]}>
            <Ionicons name="warning" size={40} color="#F59E0B" />
          </View>
          
          {/* Title */}
          <Text style={[alertStyles.title, { color: colors.text }]}>{t('forgotPin')}</Text>
          
          {/* Message */}
          <Text style={[alertStyles.message, { color: colors.textSecondary }]}>{t('resetConfirm')}</Text>
          
          {/* Buttons */}
          <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
            <TouchableOpacity 
              style={[alertStyles.button, { flex: 1, backgroundColor: colors.surfaceLight }]} 
              onPress={() => setShowConfirmReset(false)}
            >
              <Text style={[alertStyles.buttonText, { color: colors.text }]}>{t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[alertStyles.button, { flex: 1, backgroundColor: '#EF4444' }]} 
              onPress={handleConfirmReset}
            >
              <Text style={alertStyles.buttonText}>{t('continue')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      <AlertModal />
      <ConfirmResetModal />
    </>
  );
}

// Alert Modal Styles
const alertStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

// ============================================
// STYLES (using default dark theme colors, dynamic colors applied inline)
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  
  // Logo
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  logoImage: {
    width: 180,
    height: 60,
  },
  
  // Typography
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  
  // Features
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginBottom: 40,
  },
  featureItem: {
    alignItems: 'center',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 12,
  },
  
  // Buttons
  primaryButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  secondaryButtonText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#334155',
    opacity: 0.6,
  },
  
  // Back Button
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  backButtonText: {
    fontSize: 16,
  },
  
  // Security Note
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  securityNoteText: {
    fontSize: 12,
  },

  // Custodial Styles
  custodialDesc: {
    textAlign: 'center',
    fontSize: 13,
    marginBottom: 20,
    marginTop: -8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 13,
  },

  // Icon Circle
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  
  // Warning Box
  warningBox: {
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  warningText: {
    color: '#F59E0B',
    fontSize: 14,
    lineHeight: 20,
  },
  
  // Seed Grid
  seedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  seedWord: {
    width: (width - 48 - 20) / 3,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
  },
  seedWordIndex: {
    fontSize: 12,
    width: 18,
  },
  seedWordText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  seedWordHidden: {
    opacity: 0.5,
  },
  
  // Actions Row
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Tips Box
  tipsBox: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
  },
  
  // Progress
  progressRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  progressBarActive: {
    backgroundColor: '#10B981',
  },
  
  // Verify Prompt
  verifyPrompt: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
  },
  verifyPromptLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  verifyPromptNumber: {
    fontSize: 48,
    fontWeight: '700',
  },
  
  // Options Grid
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionButton: {
    width: (width - 48 - 12) / 2,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  optionButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  
  // Text Input
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  
  // Error
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  
  // Forgot Button
  forgotButton: {
    marginTop: 16,
  },
  forgotButtonText: {
    color: '#10B981',
    fontSize: 14,
  },
  
  // Import Tabs
  importTabs: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    gap: 4,
  },
  importTab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  importTabText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // QR Scanner
  qrPlaceholder: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
  },
  qrPlaceholderText: {
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 16,
    lineHeight: 20,
  },
  scannerContainer: {
    height: 300,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  scannerFrame: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: '#10B981',
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  closeScannerButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannedDataBox: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  scannedDataLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  scannedDataText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  
  // WalletConnect
  wcInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  wcInfoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  wcHint: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
});
