import {createClient} from '@supabase/supabase-js';
const config=import.meta.env;
const url=config.VITE_SUPABASE_URL;
const key=config.VITE_SUPABASE_PUBLISHABLE_KEY;
export const supabase=url&&key?createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
export function requireClient(){if(!supabase)throw new Error('Aplikace čeká na připojení databáze.');return supabase}
export function errorMessage(e:any):string{const m=String(e?.message||e||'');if(e?.code==='23505')return 'Tuto přezdívku už někdo používá. Zvol prosím jinou.';if(m.includes('Invalid login credentials'))return 'Nesprávný e-mail nebo heslo.';if(m.includes('Email not confirmed'))return 'Nejprve potvrď e-mail odkazem ve své schránce.';if(m.includes('rate limit')||e?.status===429)return 'Příliš mnoho pokusů. Zkus to prosím později.';if(m.includes('Failed to fetch')||m.includes('NetworkError'))return 'Nepodařilo se připojit. Zkontroluj internet.';if(m.includes('not configured')||m.includes('čeká na'))return m;return 'Akci se nepodařilo dokončit. Zkus to znovu.'}
async function ownEntries(userId:string){const rows:any[]=[];for(let start=0;;start+=1000){const {data,error}=await requireClient().from('beer_entries').select('*').eq('user_id',userId).order('date',{ascending:false}).order('created_at',{ascending:false}).order('id').range(start,start+999);if(error)throw error;rows.push(...(data||[]));if(!data||data.length<1000)return {data:rows,error:null};}}
export async function getData(){
 const c=requireClient();const {data:{user},error:authError}=await c.auth.getUser();if(authError||!user)throw new Error('Nejprve se přihlas.');
 const [a,b,d,preferences,achievements]=await Promise.all([ownEntries(user.id),c.from('beer_profiles').select('*').eq('user_id',user.id).maybeSingle(),c.rpc('beer_leaderboard'),c.from('beer_preferences').select('home_city').eq('user_id',user.id).maybeSingle(),c.rpc('sync_beer_achievements')]);
 if(a.error||b.error||d.error||preferences.error||achievements.error)throw a.error||b.error||d.error||preferences.error||achievements.error;
 return {userId:user.id,entries:(a.data||[]).map(e=>({...e,volume:Number(e.volume)})),profile:b.data?{...b.data,home_city:preferences.data?.home_city||''}:null,board:d.data||[],achievements:achievements.data};
}
export async function saveData(d:any){
 const c=requireClient();const {data:{user},error}=await c.auth.getUser();if(error||!user)throw new Error('Nejprve se přihlas.');let result;
 if(d.action==='delete'){
  result=await c.from('beer_entries').delete().eq('id',d.id).eq('user_id',user.id).select('photo_path');
  if(result.error)throw result.error;
  const path=result.data?.[0]?.photo_path;if(path){const {error:cleanup}=await c.storage.from('beer-photos').remove([path]);if(cleanup)console.warn('Photo cleanup will need retry');}return;
 }else if(d.action==='profile'){
  result=await c.from('beer_profiles').upsert({user_id:user.id,nickname:String(d.nickname).trim(),listed:!!d.listed,selected_tag:d.selected_tag||null});if(result.error)throw result.error;
  result=await c.from('beer_preferences').upsert({user_id:user.id,home_city:String(d.home_city||'').trim()});
 }else{
  const {beer,brewery,style,volume,count,date,rating,note,place_name,place_city,is_public,photo_path}=d;
  result=await c.from('beer_entries').insert({...(d.id?{id:d.id}:{}),user_id:user.id,beer:String(beer).trim(),brewery:String(brewery).trim(),style,volume,count,date,rating,note:note||'',place_name:String(place_name||'').trim(),place_city:String(place_city||'').trim(),is_public:!!is_public,photo_path:photo_path||null});
 }
 if(result.error)throw result.error;
}
