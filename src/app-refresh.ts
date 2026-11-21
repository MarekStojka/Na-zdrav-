// Popijeme opened from the home-screen icon has no browser around it: no pull-to-refresh and no reload button, and iOS
// keeps the page alive for days, so a new deploy never shows up until the app is force-quit. Two fixes:
// 1. Pull down at the top of the page to reload (only from the home screen; the browser has its own).
// 2. New version check: when Popijeme comes back to the screen (and every 10 minutes) we fetch index.html and compare
//    the main script name. If it changed while coming back to the screen and nothing is open, reload right away;
//    otherwise (someone is in the middle of something) offer a "Načíst" bar instead of yanking the page.
const standalone=()=>window.matchMedia('(display-mode: standalone)').matches||(navigator as any).standalone===true;
const busy=()=>!!document.querySelector('.overlay,.more-navigation,.quick-add-menu')||document.documentElement.classList.contains('keyboard-open');
const scriptOf=(html:string)=>html.match(/\/assets\/index-[\w-]+\.js/)?.[0]||'';

export function installAppRefresh(){
 if(import.meta.env.DEV)return;
 const current=scriptOf(document.documentElement.innerHTML);
 if(current)installUpdateCheck(current);
 if(standalone())installPullToRefresh();
}

function installUpdateCheck(current:string){
 let last=0,offered=false;
 const check=async(force=false,mayReload=true)=>{
  if(offered||(!force&&Date.now()-last<60_000))return;last=Date.now();
  try{
   const res=await fetch('/?v='+Date.now(),{cache:'no-store'});if(!res.ok)return;
   const latest=scriptOf(await res.text());if(!latest||latest===current)return;
   if(mayReload&&!busy()){location.reload();return}
   offered=true;showUpdateBar();
  }catch{/* offline: try again next time */}
 };
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')check()});
 window.addEventListener('pageshow',e=>{if((e as PageTransitionEvent).persisted)check(true)});
 window.setInterval(()=>{if(document.visibilityState==='visible')check(true,false)},10*60_000);
}

function showUpdateBar(){
 const bar=document.createElement('div');bar.className='update-bar';bar.setAttribute('role','status');
 bar.innerHTML='<span>Je tu nová verze Popijeme.</span><button type="button">Načíst</button>';
 bar.querySelector('button')!.addEventListener('click',()=>location.reload());
 document.body.appendChild(bar);
}

function installPullToRefresh(){
 const indicator=document.createElement('div');indicator.className='pull-refresh';indicator.setAttribute('aria-hidden','true');
 indicator.innerHTML='<span class="pull-refresh-arrow">↓</span><span class="pull-refresh-text">Táhni pro obnovení</span>';
 document.body.appendChild(indicator);
 const text=indicator.querySelector('.pull-refresh-text')!;
 const THRESHOLD=80;
 let startY=0,pull=0,active=false;
 const reset=()=>{active=false;pull=0;indicator.style.transform='';indicator.classList.remove('ready','visible')};
 window.addEventListener('touchstart',e=>{
  if(window.scrollY>0||busy()||e.touches.length!==1){active=false;return}
  // A drag that starts inside something scrollable (a list, the map) belongs to it.
  const scroller=(e.target as HTMLElement).closest('[data-no-pull],.leaflet-container,.picker-results,.recent-beers');
  if(scroller){active=false;return}
  startY=e.touches[0].clientY;active=true;pull=0;
 },{passive:true});
 window.addEventListener('touchmove',e=>{
  if(!active)return;
  const dy=e.touches[0].clientY-startY;
  if(dy<=0||window.scrollY>0){reset();return}
  pull=Math.min(dy*.5,THRESHOLD*1.4);
  indicator.classList.add('visible');
  indicator.style.transform=`translate(-50%,${pull}px)`;
  const ready=pull>=THRESHOLD;indicator.classList.toggle('ready',ready);text.textContent=ready?'Pusť a obnoví se':'Táhni pro obnovení';
 },{passive:true});
 window.addEventListener('touchend',()=>{
  if(!active)return;
  if(pull>=THRESHOLD){indicator.classList.add('loading');text.textContent='Načítám…';location.reload();return}
  reset();
 });
 window.addEventListener('touchcancel',reset);
}
