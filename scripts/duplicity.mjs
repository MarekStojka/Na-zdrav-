// Lists beers in the shared library that look like duplicates of the official presets
// (src/beer-catalog.json) and prints ready-to-run SQL for the Supabase SQL editor.
// Usage: npm run duplicity        (reads the public library of production; only the publishable key is used)
// Override with VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY, or pass a JSON file: npm run duplicity -- catalog.json
// Nothing is changed here: review the suggestions, then run the SQL (private.merge_beer / private.merge_brewery).
import fs from 'node:fs';
const presets=JSON.parse(fs.readFileSync(new URL('../src/beer-catalog.json',import.meta.url),'utf8'));
const norm=v=>String(v||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[°'"’.,!()-]/g,' ').replace(/\s+/g,' ').trim();
const NOISE=new Set(['pivovar','brewery','craft','pivo','beer','a','s','sro','as','spol','plzen','plzensky','svetly','lezak','vycepni']);
const words=v=>norm(v).split(' ').filter(w=>w&&!NOISE.has(w));
const nums=v=>(norm(v).match(/\d+/g)||[]).join(' ');
const q=s=>"'"+String(s).replace(/'/g,"''")+"'";
async function load(){
 const file=process.argv[2];if(file)return JSON.parse(fs.readFileSync(file,'utf8'));
 let url=process.env.VITE_SUPABASE_URL,key=process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key){const html=await (await fetch('https://na-zdravi.vercel.app/')).text();const js=await (await fetch('https://na-zdravi.vercel.app/'+html.match(/assets\/[^"]+\.js/)[0])).text();
  url=js.match(/https:\/\/[a-z]+\.supabase\.co/)[0];key=js.match(/sb_publishable_[A-Za-z0-9_-]+/)[0]}
 const r=await fetch(url+'/rest/v1/beer_catalog?select=beer,brewery,style&limit=10000',{headers:{apikey:key,Authorization:'Bearer '+key}});
 if(!r.ok)throw new Error('Knihovnu se nepodařilo načíst: '+r.status);return r.json();
}
const library=await load();
const official=new Set(presets.map(p=>norm(p.brewery)+'|'+norm(p.beer)));
const breweries=[...new Set(presets.map(p=>p.brewery))];
// A typed brewery matches an official one when one name contains the other ("Budvar" ~ "Budějovický Budvar" is a known brand alias).
const BRANDS={budvar:'Budějovický Budvar',budweiser:'Budějovický Budvar','pilsner urquell':'Plzeňský Prazdroj',prazdroj:'Plzeňský Prazdroj',kozel:'Velkopopovický Kozel',velkopopovicky:'Velkopopovický Kozel',kozlovna:'Velkopopovický Kozel'};
function breweryFor(item){
 const b=norm(item.brewery),beer=norm(item.beer);
 const exact=breweries.find(x=>norm(x)===b);if(exact)return exact;
 for(const [k,v] of Object.entries(BRANDS))if(b.includes(k))return v;
 const contained=breweries.find(x=>{const n=norm(x);return n.length>3&&(b.includes(n)||n.includes(b))});if(contained)return contained;
 // Brewery typed as the parent company: the beer name starts with an official brand ("Radegast 12" under "Plzeň Prazdroj").
 return breweries.find(x=>beer.startsWith(norm(x)+' '))||null;
}
function score(item,p){
 if(nums(item.beer)!==nums(p.beer))return 0;
 const a=new Set(words(item.beer).filter(w=>!words(p.brewery).includes(w))),b=new Set(words(p.beer).filter(w=>!words(p.brewery).includes(w)));
 if(!a.size&&!b.size)return 1;const shared=[...a].filter(w=>[...b].some(x=>x===w||x.startsWith(w)||w.startsWith(x))).length;
 return shared/Math.max(a.size,b.size,1);
}
const sure=[],unsure=[],breweryOnly=new Map();
for(const item of library){
 if(official.has(norm(item.brewery)+'|'+norm(item.beer)))continue;
 const brewery=breweryFor(item);if(!brewery)continue;
 const ranked=presets.filter(p=>p.brewery===brewery||norm(item.beer).startsWith(norm(p.brewery))).map(p=>({p,s:score(item,p)})).filter(x=>x.s>0).sort((a,b)=>b.s-a.s);
 if(ranked.length&&ranked[0].s>=.5&&(ranked.length===1||ranked[0].s>ranked[1].s))sure.push({item,p:ranked[0].p});
 else if(ranked.length)unsure.push({item,options:ranked.slice(0,3).map(x=>x.p)});
 else if(norm(brewery)!==norm(item.brewery))breweryOnly.set(item.brewery,brewery);
}
const line=(i,p)=>`select private.merge_beer(${q(i.beer)},${q(i.brewery)},${q(p.beer)},${q(p.brewery)},${q(p.style)},${q(p.source||'')});  -- ${i.brewery} · ${i.beer} → ${p.brewery} · ${p.beer}`;
console.log(`Knihovna: ${library.length} piv, z toho mimo oficiální předvolby ${library.filter(i=>!official.has(norm(i.brewery)+'|'+norm(i.beer))).length}.\n`);
console.log('-- Jisté duplicity');for(const {item,p} of sure)console.log(line(item,p));
console.log('\n-- Nejisté (vyber jednu možnost, nebo nech být)');for(const {item,options} of unsure){console.log(`-- ${item.brewery} · ${item.beer}:`);for(const p of options)console.log('--   '+line(item,p))}
console.log('\n-- Jen pivovar pod jiným jménem (pivo v předvolbách není)');for(const [from,to] of breweryOnly)console.log(`select private.merge_brewery(${q(from)},${q(to)});`);
