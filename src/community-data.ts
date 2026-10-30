import {useCallback,useEffect,useRef,useState} from 'react';
import {requireClient,errorMessage} from './supabase';
export const normalize=(v:string)=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
export const productKey=(p:any)=>normalize(p.brewery)+'|'+normalize(p.beer);
export const placeKey=(p:any)=>normalize(p.name||p.place_name)+'|'+normalize(p.city||p.place_city);
export const niceDate=(d:string)=>new Date(d+'T12:00:00').toLocaleDateString('cs-CZ');
const empty={library:[] as any[],feed:[] as any[],venues:[] as any[],places:[] as any[],wishlist:[] as string[]};
async function allRows(table:string,order:string){const c=requireClient(),rows:any[]=[];for(let start=0;;start+=1000){const {data,error}=await c.from(table).select('*').order(order).order(table==='beer_library'?'id':'name_key').range(start,start+999);if(error)throw error;rows.push(...(data||[]));if(!data||data.length<1000)return rows;}}
export function useCommunity(userId:string|null){
 const [data,setData]=useState(empty),[error,setError]=useState(''),[loading,setLoading]=useState(true),[more,setMore]=useState(false),[paging,setPaging]=useState(false);
 const generation=useRef(0),post=new URLSearchParams(window.location.search).get('post');
 const reload=useCallback(async()=>{const gen=++generation.current;setLoading(true);setError('');try{
  const c=requireClient();let feedQuery=c.from('beer_feed').select('*').order('created_at',{ascending:false}).order('id',{ascending:false}).range(0,49);if(post)feedQuery=feedQuery.eq('id',post);
  const [library,feed,venues,places,wishlist]=await Promise.all([allRows('beer_library','beer'),feedQuery,allRows('beer_venues','name'),userId?c.from('beer_places').select('*').eq('user_id',userId).order('created_at',{ascending:false}):Promise.resolve({data:[],error:null}),userId?c.from('beer_wishlist').select('catalog_id').eq('user_id',userId):Promise.resolve({data:[],error:null})]);
  if(gen!==generation.current)return;
  if(feed.error||places.error||wishlist.error)throw feed.error||places.error||wishlist.error;
  setData({library,feed:feed.data||[],venues,places:places.data||[],wishlist:(wishlist.data||[]).map(p=>p.catalog_id)});setMore(!post&&feed.data?.length===50);
 }catch(e){if(gen===generation.current)setError(errorMessage(e))}finally{if(gen===generation.current)setLoading(false)}},[userId,post]);
 useEffect(()=>{setData(empty);void reload();return()=>{generation.current++}},[reload]);
 async function loadMore(){if(paging)return;setPaging(true);const gen=generation.current;try{const {data:rows,error}=await requireClient().from('beer_feed').select('*').order('created_at',{ascending:false}).order('id',{ascending:false}).range(data.feed.length,data.feed.length+49);if(error)throw error;if(gen!==generation.current)return;setData(prev=>({...prev,feed:[...new Map([...prev.feed,...(rows||[])].map(p=>[p.id,p])).values()]}));setMore(rows?.length===50)}catch(e){if(gen===generation.current)setError(errorMessage(e))}finally{setPaging(false)}}
 return {...data,error,loading,reload,loadMore,more,paging,post};
}
export async function toggleCheer(id:string,cheered:boolean){const c=requireClient();const result=cheered?await c.from('beer_cheers').delete().eq('entry_id',id).eq('user_id',(await c.auth.getUser()).data.user?.id):await c.from('beer_cheers').insert({entry_id:id});if(result.error&&result.error.code!=='23505')throw result.error;}
export async function toggleWishlist(id:string,saved:boolean){const c=requireClient();const result=saved?await c.from('beer_wishlist').delete().eq('catalog_id',id).eq('user_id',(await c.auth.getUser()).data.user?.id):await c.from('beer_wishlist').insert({catalog_id:id});if(result.error&&result.error.code!=='23505')throw result.error;}
export async function savePlace(name:string,city:string,shared:boolean){const {error}=await requireClient().from('beer_places').insert({name:name.trim(),city:city.trim(),is_public:shared});if(error)throw error;}
export async function removePlace(id:string){const {error}=await requireClient().from('beer_places').delete().eq('id',id);if(error)throw error;}
export async function changeVisibility(id:string,is_public:boolean){const {error}=await requireClient().from('beer_entries').update({is_public}).eq('id',id);if(error)throw error;}
export async function sharePost(entry:any){const url=window.location.origin+'/?post='+encodeURIComponent(entry.id);if(navigator.share)await navigator.share({title:'Popijeme · '+entry.beer,text:entry.nickname+' ochutnává '+entry.beer+' od '+entry.brewery,url});else await navigator.clipboard.writeText(url);}
