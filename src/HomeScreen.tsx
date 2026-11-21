import {useEffect,useState} from 'react';
import {Smartphone,X} from 'lucide-react';
// "Přidat na plochu": puts Popijeme on the phone's home screen as an icon that opens full screen, without the browser bars.
// It stays a website; we never call it an app. Android Chrome offers its own one-tap dialog (beforeinstallprompt),
// iPhone Safari has no such API, so there we show where to tap. Hidden once Popijeme already runs from the home screen.
let deferred:any=null;
const HELP_EVENT='popijeme:home-help';
/** Call once at startup: the browser fires beforeinstallprompt early, before React renders the menu. */
export function installHomeScreen(){
 window.addEventListener('beforeinstallprompt',(event:Event)=>{event.preventDefault();deferred=event});
 window.addEventListener('appinstalled',()=>{deferred=null});
}
const standalone=()=>window.matchMedia('(display-mode: standalone)').matches||(navigator as any).standalone===true;
const isIos=()=>/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
/** Item for the Více menu. `onPick` closes the menu. */
export function HomeScreenItem({onPick}:{onPick:()=>void}){
 if(standalone())return null;
 return <button className="home-screen-item" onClick={async()=>{onPick();
  if(deferred){const prompt=deferred;deferred=null;try{await prompt.prompt();await prompt.userChoice}catch{}return}
  window.dispatchEvent(new Event(HELP_EVENT));
 }}><Smartphone size={18}/>Přidat na plochu</button>;
}
/** Short how-to for browsers without the one-tap dialog (iPhone, Firefox, in-app browsers). Render once at the app root. */
export function HomeScreenHelp(){
 const [open,setOpen]=useState(false);
 useEffect(()=>{const show=()=>setOpen(true);window.addEventListener(HELP_EVENT,show);return()=>window.removeEventListener(HELP_EVENT,show)},[]);
 if(!open)return null;
 const ios=isIos();
 return <div className="overlay" onClick={e=>e.target===e.currentTarget&&setOpen(false)}><section className="modal small home-screen-help" role="dialog" aria-modal="true" aria-label="Přidat na plochu"><button className="close" aria-label="Zavřít" onClick={()=>setOpen(false)}><X/></button>
  <h2>Popijeme na ploše</h2>
  <p>Budeš ho mít po ruce jako ikonku vedle ostatních. Otevře se přes celou obrazovku, bez prohlížeče. Nic se nestahuje.</p>
  {ios?<ol><li>Klepni na <b>Sdílet</b> <span className="share-glyph" aria-hidden="true">⬆︎</span> (čtvereček se šipkou nahoru; když ho nevidíš, je pod <b>⋯</b>).</li><li>Vyber <b>Přidat na plochu</b>.</li><li>Potvrď <b>Přidat</b>.</li></ol>
  :<ol><li>Otevři menu prohlížeče (<b>⋮</b> nebo <b>⋯</b>).</li><li>Vyber <b>Přidat na plochu</b> nebo <b>Instalovat</b>.</li></ol>}
  <button className="primary" onClick={()=>setOpen(false)}>Rozumím</button>
 </section></div>;
}
