import {useEffect,useState} from 'react';
import {Smartphone,X,Share,EllipsisVertical,Ellipsis,Plus,Copy,Bookmark,ChevronLeft,ChevronRight,Beer} from 'lucide-react';
// "Přidat na plochu": puts Popijeme on the phone's home screen as an icon that opens full screen, without the browser bars.
// It stays a website; we never call it an app. Android Chrome offers its own one-tap dialog (beforeinstallprompt),
// iPhone has no such API (a website cannot add itself), so there we show an animated step-by-step picture of what to tap.
let deferred:any=null;
const HELP_EVENT='popijeme:home-help';
/** Call once at startup: the browser fires beforeinstallprompt early, before React renders the menu. */
export function installHomeScreen(){
 window.addEventListener('beforeinstallprompt',(event:Event)=>{event.preventDefault();deferred=event});
 window.addEventListener('appinstalled',()=>{deferred=null});
}
const standalone=()=>window.matchMedia('(display-mode: standalone)').matches||(navigator as any).standalone===true;
type Platform='safari'|'chrome-ios'|'android';
const detect=():Platform=>{const ua=navigator.userAgent;const ios=/iPhone|iPad|iPod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);return ios?(/CriOS/.test(ua)?'chrome-ios':'safari'):'android'};
/** Item for the Více menu. `onPick` closes the menu. */
export function HomeScreenItem({onPick}:{onPick:()=>void}){
 if(standalone())return null;
 return <button className="home-screen-item" onClick={async()=>{onPick();
  if(deferred){const prompt=deferred;deferred=null;try{await prompt.prompt();await prompt.userChoice}catch{}return}
  window.dispatchEvent(new Event(HELP_EVENT));
 }}><Smartphone size={18}/>Přidat na plochu</button>;
}

// ---- Step pictures: a simplified phone, the place to tap pulses. Drawn in CSS, not screenshots, so they stay light
// and do not go stale with every iOS redesign; labels are the Czech ones the phone shows.
const Tap=()=><span className="hs-tap" aria-hidden="true"/>;
const Page=()=><div className="hs-page"><div className="hs-page-head"><Beer size={13}/>Popijeme</div><i/><i/><i className="short"/></div>;
function SafariShare(){return <><Page/><div className="hs-bar bottom"><ChevronLeft size={14}/><div className="hs-url">popijeme.cz<span className="hs-target"><Share size={13}/><Tap/></span></div><Ellipsis size={14}/></div></>}
function ChromeIosShare(){return <><div className="hs-bar top"><div className="hs-url">popijeme.cz<span className="hs-target"><Share size={13}/><Tap/></span></div></div><Page/><div className="hs-bar bottom spread"><ChevronLeft size={14}/><ChevronRight size={14}/><Plus size={14}/><Ellipsis size={14}/></div></>}
function AndroidMenu(){return <><div className="hs-bar top"><div className="hs-url">popijeme.cz</div><span className="hs-target"><EllipsisVertical size={15}/><Tap/></span></div><Page/></>}
function ShareSheet(){return <><Page/><div className="hs-sheet"><div className="hs-sheet-app"><span className="hs-icon small"><Beer size={11}/></span>Popijeme</div><div className="hs-row">Kopírovat<Copy size={12}/></div><div className="hs-row">Přidat do záložek<Bookmark size={12}/></div><div className="hs-row hs-target">Přidat na plochu<Plus size={12}/><Tap/></div></div></>}
function AndroidList(){return <><div className="hs-bar top"><div className="hs-url">popijeme.cz</div><EllipsisVertical size={15}/></div><div className="hs-menu"><div className="hs-row">Nová karta</div><div className="hs-row">Záložky</div><div className="hs-row hs-target">Přidat na plochu<Tap/></div><div className="hs-row">Nastavení</div></div><Page/></>}
function Confirm({android}:{android?:boolean}){return android?<><Page/><div className="hs-dialog"><b>Přidat na plochu</b><div className="hs-sheet-app"><span className="hs-icon small"><Beer size={11}/></span>Popijeme</div><div className="hs-dialog-actions"><span>Zrušit</span><span className="hs-target strong">Přidat<Tap/></span></div></div></>
 :<><div className="hs-confirm-head"><span>Zrušit</span><span className="hs-target strong">Přidat<Tap/></span></div><div className="hs-confirm-body"><span className="hs-icon"><Beer size={18}/></span><div><b>Popijeme</b><small>popijeme.cz</small></div></div></>}
function Home(){return <div className="hs-home">{Array.from({length:11},(_,i)=><span key={i} className="hs-app"/>)}<span className="hs-target"><span className="hs-icon"><Beer size={18}/></span><small>Popijeme</small></span></div>}
const STEPS:Record<Platform,{text:any,pic:any}[]>={
 safari:[
  {text:<>Dole v adresním řádku klepni na <b>Sdílet</b>. Nevidíš ho? Klepni na <b>⋯</b> a pak na Sdílet.</>,pic:<SafariShare/>},
  {text:<>Sjeď v nabídce dolů a klepni na <b>Přidat na plochu</b>.</>,pic:<ShareSheet/>},
  {text:<>Vpravo nahoře klepni na <b>Přidat</b>.</>,pic:<Confirm/>},
  {text:<>Hotovo. Popijeme máš na ploše jako ikonku.</>,pic:<Home/>}],
 'chrome-ios':[
  {text:<>Nahoře v adresním řádku klepni na <b>Sdílet</b>.</>,pic:<ChromeIosShare/>},
  {text:<>Sjeď v nabídce dolů a klepni na <b>Přidat na plochu</b>.</>,pic:<ShareSheet/>},
  {text:<>Vpravo nahoře klepni na <b>Přidat</b>.</>,pic:<Confirm/>},
  {text:<>Hotovo. Popijeme máš na ploše jako ikonku.</>,pic:<Home/>}],
 android:[
  {text:<>Vpravo nahoře klepni na <b>⋮</b>.</>,pic:<AndroidMenu/>},
  {text:<>Klepni na <b>Přidat na plochu</b> (někde se to jmenuje <b>Instalovat</b>).</>,pic:<AndroidList/>},
  {text:<>Potvrď <b>Přidat</b>.</>,pic:<Confirm android/>},
  {text:<>Hotovo. Popijeme máš na ploše jako ikonku.</>,pic:<Home/>}]
};
const TABS:[Platform,string][]=[['safari','iPhone · Safari'],['chrome-ios','iPhone · Chrome'],['android','Android']];

/** Animated how-to for browsers without the one-tap dialog. Render once at the app root. */
export function HomeScreenHelp(){
 const [open,setOpen]=useState(false),[platform,setPlatform]=useState<Platform>('safari'),[step,setStep]=useState(0),[auto,setAuto]=useState(true);
 useEffect(()=>{const show=()=>{setPlatform(detect());setStep(0);setAuto(true);setOpen(true)};window.addEventListener(HELP_EVENT,show);return()=>window.removeEventListener(HELP_EVENT,show)},[]);
 // Plays the steps on a loop until someone taps a step themselves.
 useEffect(()=>{if(!open||!auto)return;const t=window.setInterval(()=>setStep(s=>(s+1)%4),2800);return()=>window.clearInterval(t)},[open,auto]);
 if(!open)return null;
 const steps=STEPS[platform],current=steps[step];
 const pick=(i:number)=>{setAuto(false);setStep(i)};
 return <div className="overlay" onClick={e=>e.target===e.currentTarget&&setOpen(false)}><section className="modal small home-screen-help" role="dialog" aria-modal="true" aria-label="Přidat na plochu"><button className="close" aria-label="Zavřít" onClick={()=>setOpen(false)}><X/></button>
  <h2>Popijeme na ploše</h2>
  <p className="hs-lead">Ikonka na ploše, otevře se přes celou obrazovku. Nic se nestahuje.</p>
  <div className="hs-tabs" role="tablist">{TABS.map(([id,label])=><button key={id} role="tab" aria-selected={platform===id} className={platform===id?'active':''} onClick={()=>{setPlatform(id);setStep(0);setAuto(true)}}>{label}</button>)}</div>
  <div className="hs-stage"><div className="hs-phone" key={platform+step} aria-hidden="true">{current.pic}</div>
   <div className="hs-caption"><span className="hs-step-no">{step+1}</span><p>{current.text}</p></div></div>
  <div className="hs-dots">{steps.map((_,i)=><button key={i} aria-label={'Krok '+(i+1)} className={i===step?'active':''} onClick={()=>pick(i)}/>)}</div>
  <button className="primary" onClick={()=>setOpen(false)}>Rozumím</button>
 </section></div>;
}
