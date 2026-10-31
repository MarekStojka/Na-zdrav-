import {useEffect,useState} from 'react';
import {Clock3} from 'lucide-react';

export default function EventCountdown({startsAt}:{startsAt:string}){
 const target=Date.parse(startsAt);
 const [now,setNow]=useState(Date.now);
 useEffect(()=>{
  const update=()=>setNow(Date.now());
  update();
  if(!Number.isFinite(target)||target<=Date.now())return;
  const timer=window.setInterval(()=>{
   const current=Date.now();setNow(current);
   if(current>=target)window.clearInterval(timer);
  },1000);
  document.addEventListener('visibilitychange',update);
  return()=>{window.clearInterval(timer);document.removeEventListener('visibilitychange',update)};
 },[target]);
 if(!Number.isFinite(target))return null;
 const seconds=Math.max(0,Math.ceil((target-now)/1000));
 const parts=[Math.floor(seconds/86400),Math.floor(seconds/3600)%24,Math.floor(seconds/60)%60,seconds%60];
 return <div className="event-countdown"><span className="countdown-caption"><Clock3 size={16}/>{seconds>0?'MÁŠ POTVRZENO · DO SETKÁNÍ ZBÝVÁ':'ODPOČET SKONČIL'}</span>{seconds>0?<div className="countdown-digits" role="timer" aria-label="Čas do začátku události" aria-live="off">{parts.map((value,i)=><span key={i}><b>{String(value).padStart(2,'0')}</b><small>{['dní','hodin','minut','vteřin'][i]}</small></span>)}</div>:<p>Událost už začala. Stůl čeká!</p>}</div>;
}
