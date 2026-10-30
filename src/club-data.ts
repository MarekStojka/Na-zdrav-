import {useCallback,useEffect,useRef,useState} from 'react';
import {requireClient,errorMessage} from './supabase';
export const must=async(q:any)=>{const r=await q;if(r.error)throw r.error;return r.data;};
const initial={friends:[] as any[],follows:[] as any[],presence:[] as any[],meetups:[] as any[],rsvps:[] as any[],people:{} as Record<string,any>};
export function useClub(userId:string|null){
 const [data,setData]=useState(initial),[error,setError]=useState(''),[loading,setLoading]=useState(false);const generation=useRef(0);
 const reload=useCallback(async()=>{const n=++generation.current;setLoading(true);try{
  const c=requireClient();const [friends,follows,presence,meetups]=await Promise.all([
   userId?must(c.from('beer_friendships').select('*').order('created_at',{ascending:false}).limit(1000)):[],
   userId?must(c.from('beer_follows').select('*').order('created_at',{ascending:false}).limit(1000)):[],
   userId?must(c.from('beer_presence').select('*').gt('expires_at',new Date().toISOString()).limit(1000)):[],
   must(c.from('beer_meetups').select('*').gte('starts_at',new Date(Date.now()-366*86400000).toISOString()).order('starts_at',{ascending:false}).limit(1000))]);
  const rsvps=userId&&meetups.length?await must(c.from('beer_rsvps').select('*').in('meetup_id',meetups.map((m:any)=>m.id)).limit(1000)):[];
  const ids=[...new Set([userId,...friends.flatMap((f:any)=>[f.requester,f.recipient]),...follows.flatMap((f:any)=>[f.user_id,f.target_id]),...presence.map((p:any)=>p.user_id),...meetups.flatMap((m:any)=>[m.host_id,...(m.invited_ids||[m.invited_id])]),...rsvps.map((r:any)=>r.user_id)].filter(Boolean))];
  const profiles=ids.length?await must(c.from('beer_profiles').select('user_id,nickname,friend_code,selected_tag').in('user_id',ids)):[];
  if(n===generation.current){setData({friends,follows,presence,meetups,rsvps,people:Object.fromEntries(profiles.map((p:any)=>[p.user_id,p]))});setError('');}
 }catch(e){if(n===generation.current)setError(errorMessage(e))}finally{if(n===generation.current)setLoading(false)}},[userId]);
 useEffect(()=>{setData(initial);void reload();const timer=setInterval(()=>void reload(),60000);return()=>{generation.current++;clearInterval(timer)}},[reload]);
 return {...data,error,loading,reload};
}
export async function findPeople(query:string){const q=query.trim(),c=requireClient(),fields='user_id,nickname,friend_code,selected_tag';if(q.length<3)return[];if(/^[A-Za-z0-9]{10}$/.test(q)){const exact=await must(c.from('beer_profiles').select(fields).eq('friend_code',q.toUpperCase()).limit(12));if(exact.length)return exact;}return must(c.from('beer_profiles').select(fields).ilike('nickname','%'+q.replace(/[\\%_]/g,'\\$&')+'%').limit(12));}
export async function addFriend(id:string){return must(requireClient().from('beer_friendships').insert({recipient:id}));}
export async function acceptFriend(id:string){return must(requireClient().from('beer_friendships').update({status:'accepted'}).eq('id',id));}
export async function removeFriend(id:string){return must(requireClient().from('beer_friendships').delete().eq('id',id));}
export async function follow(id:string,on:boolean,userId:string){return must(on?requireClient().from('beer_follows').insert({target_id:id}):requireClient().from('beer_follows').delete().eq('target_id',id).eq('user_id',userId));}
export async function setPresence(place:string,city:string){return must(requireClient().from('beer_presence').upsert({user_id:(await requireClient().auth.getUser()).data.user?.id,place_name:place.trim(),place_city:city.trim(),expires_at:new Date(Date.now()+2*3600000).toISOString()}));}
export async function endPresence(userId:string){return must(requireClient().from('beer_presence').delete().eq('user_id',userId));}
export async function rsvp(id:string,going:boolean,userId:string){return must(requireClient().from('beer_rsvps').upsert({meetup_id:id,user_id:userId,status:going?'accepted':'declined'},{onConflict:'meetup_id,user_id'}));}
export async function createMeetup(d:any){return must(requireClient().from('beer_meetups').insert(d));}
export async function removeMeetup(id:string){return must(requireClient().from('beer_meetups').delete().eq('id',id));}
export const meetingTime=(date:string)=>new Date(date).toLocaleString('cs-CZ',{timeZone:'Europe/Prague',dateStyle:'medium',timeStyle:'short'});
