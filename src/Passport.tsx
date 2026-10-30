import {BadgeLibrary,badgeDefinitions} from './Achievements';
import {useState} from 'react';
import {Award,Beer,BookOpen,Compass,MapPin,Share2,Star,Lock} from 'lucide-react';
import {productKey,placeKey} from './community-data';
function passportFacts(entries:any[]){return {beers:new Set(entries.map(productKey)).size,breweries:new Set(entries.map(e=>e.brewery.toLowerCase().trim())).size,styles:new Set(entries.map(e=>e.style)).size,places:new Set(entries.filter(e=>e.place_name).map(placeKey)).size,rated:new Set(entries.filter(e=>e.rating>0).map(productKey)).size};}
export default function Passport({entries,nickname,onLogin,authenticated,onToast,achievements}:{entries:any[],nickname?:string,onLogin:()=>void,authenticated:boolean,onToast:(m:string)=>void,achievements?:any}){
 const [busy,setBusy]=useState(false),facts=achievements?.facts||passportFacts(entries);
 const badges=badgeDefinitions.map(b=>({...b,count:Number(facts[b.metric]||0),earned:(achievements?.awards||[]).some((a:any)=>a.badge_id===b.id)}));
 async function share(){setBusy(true);try{
  await document.fonts.ready;
  const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1350;const ctx=canvas.getContext('2d');if(!ctx)throw Error();
  ctx.fillStyle='#f2e9d3';ctx.fillRect(0,0,1080,1350);ctx.strokeStyle='#252b28';ctx.lineWidth=6;ctx.strokeRect(36,36,1008,1278);ctx.lineWidth=2;ctx.strokeRect(48,48,984,1254);
  ctx.fillStyle='#b74030';ctx.fillRect(62,62,956,165);ctx.textAlign='center';ctx.fillStyle='#f2e9d3';ctx.font='700 76px "Bitter",serif';ctx.fillText('Popijeme',540,165);
  ctx.fillStyle='#252b28';ctx.font='700 30px "Barlow Condensed",sans-serif';ctx.fillText('OSOBNÍ PAS DOBRÝCH CHUTÍ',540,295);
  ctx.font='700 43px "Bitter",serif';const name=nickname||'Pivní objevitel';const text=ctx.measureText(name).width>850?name.slice(0,22)+'…':name;ctx.fillText(text,540,380);
  ctx.fillStyle='#b74030';ctx.font='800 200px "Barlow Condensed",sans-serif';ctx.fillText(String(facts.beers),540,600);ctx.fillStyle='#252b28';ctx.font='700 40px "Barlow Condensed",sans-serif';ctx.fillText('RŮZNÝCH PIV V ZÁPISNÍKU',540,660);
  ctx.strokeStyle='#a89e81';ctx.beginPath();ctx.moveTo(135,713);ctx.lineTo(945,713);ctx.stroke();
  ctx.fillStyle='#315e5a';ctx.font='700 65px "Barlow Condensed",sans-serif';ctx.fillText(facts.breweries+' PIVOVARŮ  ·  '+facts.styles+' STYLŮ',540,805);
  const unlocked=badges.filter(b=>b.earned);ctx.fillStyle='#252b28';ctx.font='600 28px "Bitter",serif';ctx.fillText('MÁM DOBROU PAMĚŤ.',540,920);ctx.font='600 28px "Bitter",serif';ctx.fillText('A PRO JISTOTU I ZÁPISNÍK.',540,964);
  ctx.fillStyle='#e6b343';ctx.fillRect(135,1030,810,92);ctx.fillStyle='#252b28';ctx.font='700 34px "Barlow Condensed",sans-serif';ctx.fillText(unlocked.length+' Z '+badges.length+' OBJEVITELSKÝCH RAZÍTEK',540,1089);
  ctx.fillStyle='#315e5a';ctx.font='700 31px "Barlow Condensed",sans-serif';ctx.fillText(window.location.host,540,1210);ctx.fillStyle='#5b6557';ctx.font='500 22px "DM Sans",sans-serif';ctx.fillText('Dobré chutě. Dobré vzpomínky. 18+',540,1256);
  const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error()),'image/png'));const file=new File([blob],'muj-popijeme.png',{type:'image/png'});
  if(navigator.canShare?.({files:[file]})){try{await navigator.share({files:[file],title:'Můj pivní pas · Popijeme'});return}catch(e:any){if(e?.name==='AbortError')return;}}
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);onToast('Kartička je stažená. Můžeš ji poslat dál.');
 }catch{onToast('Kartičku se nepodařilo vytvořit. Zkus to znovu.')}finally{setBusy(false)}}
 return <section className="passport"><div className="section-heading"><div><span className="eyebrow">SBÍRKA RAZÍTEK A DOBRÝCH VZPOMÍNEK</span><h2>Můj pivní pas</h2></div><span className="passport-count">{badges.filter(b=>b.earned).length} / {badges.length}</span></div><p className="section-intro">167 starých plechových cedulí za objevování, vzpomínky a dobrou partu. Každá má svůj příběh. Vypité množství nerozhoduje.</p><BadgeLibrary achievements={achievements} authenticated={authenticated} onLogin={onLogin}/><div className="passport-share"><div><h3>Dobrá paměť se může pochlubit.</h3><p>Kartička obsahuje přezdívku, počet různých piv, pivovarů, stylů a odznaků. Bez míst, dat a soukromých poznámek.</p></div><button className="primary" disabled={busy||!entries.length} onClick={share}><Share2 size={18}/>{busy?'Tisknu razítka…':'Sdílet můj pas'}</button></div></section>;
}
