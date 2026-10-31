import {useEffect,useId,useRef,useState} from 'react';
import type {TextareaHTMLAttributes} from 'react';
import {requireClient} from './supabase';
import {must} from './club-data';
type Person={user_id:string,nickname:string};
export function MentionInput({value,onValueChange,defaultValue,...props}:Omit<TextareaHTMLAttributes<HTMLTextAreaElement>,'value'|'onChange'|'defaultValue'> & {value?:string,defaultValue?:string,onValueChange?:(v:string)=>void}){
 const [local,setLocal]=useState(defaultValue||''),[search,setSearch]=useState<{start:number,end:number,query:string}|null>(null),[people,setPeople]=useState<Person[]>([]),[active,setActive]=useState(0);
 const ref=useRef<HTMLTextAreaElement>(null),id=useId(),text=value??local;
 const change=(v:string)=>{setLocal(v);onValueChange?.(v)};
 function locate(input:HTMLTextAreaElement){const end=input.selectionStart,left=input.value.slice(0,end),match=left.match(/(?:^|\s)@([^@\n]{0,30})$/);setSearch(match?{start:end-match[1].length-1,end,query:match[1]}:null);setActive(0)}
 useEffect(()=>{const form=ref.current?.form;if(!form)return;const reset=()=>{change('');setSearch(null)};form.addEventListener('reset',reset);return()=>form.removeEventListener('reset',reset)},[]);
 useEffect(()=>{if(!search){setPeople([]);return}let live=true;const timer=setTimeout(()=>{let q=requireClient().from('beer_profiles').select('user_id,nickname').order('nickname').limit(6);if(search.query)q=q.ilike('nickname','%'+search.query.replace(/[\\%_]/g,'\\$&')+'%');must(q).then(rows=>{if(live){setPeople(rows);setActive(0)}}).catch(()=>{if(live)setPeople([])})},150);return()=>{live=false;clearTimeout(timer)}},[search?.query]);
 function choose(person:Person){if(!search)return;const insertion='@'+person.nickname+' ',next=text.slice(0,search.start)+insertion+text.slice(search.end),caret=search.start+insertion.length;if(props.maxLength&&next.length>props.maxLength)return;change(next);setSearch(null);setPeople([]);requestAnimationFrame(()=>{ref.current?.focus();ref.current?.setSelectionRange(caret,caret)})}
 return <div className="mention-field"><textarea {...props} ref={ref} value={text} onChange={e=>{change(e.target.value);locate(e.target)}} onClick={e=>locate(e.currentTarget)} onKeyUp={e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight')locate(e.currentTarget)}} role="combobox" aria-autocomplete="list" aria-expanded={!!search&&people.length>0} aria-controls={search&&people.length?id:undefined} aria-activedescendant={search&&people.length?id+'-'+active:undefined} onKeyDown={e=>{if(!search||!people.length)return;if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();setActive(n=>(n+(e.key==='ArrowDown'?1:people.length-1))%people.length)}else if(e.key==='Enter'){e.preventDefault();choose(people[active]||people[0])}else if(e.key==='Escape'){e.preventDefault();e.stopPropagation();setSearch(null)}}}/>{search&&people.length>0&&<div className="mention-options" id={id} role="listbox" aria-label="Označit uživatele">{people.map((p,i)=><button type="button" role="option" aria-selected={active===i} id={id+'-'+i} className={active===i?'active':''} key={p.user_id} onMouseDown={e=>e.preventDefault()} onClick={()=>choose(p)}><span className="social-avatar">{p.nickname[0].toUpperCase()}</span><b>{p.nickname}</b><small>Označit</small></button>)}</div>}</div>;
}
export function MentionText({text}:{text:string}){
 const [people,setPeople]=useState<Person[]>([]);
 useEffect(()=>{let live=true;setPeople([]);if(!text.includes('@'))return;must(requireClient().rpc('beer_resolve_mentions',{body:text})).then(rows=>{if(live)setPeople(rows)}).catch(()=>{});return()=>{live=false}},[text]);
 if(!people.length)return <>{text}</>;
 const pattern=new RegExp('@('+people.map(p=>p.nickname.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')(?=$|[^\\p{L}\\p{N}_])','giu');
 const parts:any[]=[];let from=0;for(const match of text.matchAll(pattern)){const start=match.index!;parts.push(text.slice(from,start));const p=people.find(p=>p.nickname.toLocaleLowerCase()===match[1].toLocaleLowerCase());parts.push(<a className="user-mention" href={'/?profile='+p!.user_id} key={start}>{match[0]}</a>);from=start+match[0].length;}parts.push(text.slice(from));return <>{parts}</>;
}
