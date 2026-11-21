import {useState} from 'react';
import {Trash2} from 'lucide-react';
import {requireClient,errorMessage} from './supabase';

// Self-service account deletion (Freelo 34080741). Shown at the bottom of the own profile, also for an account without
// a nickname. Order matters:
// 1. list the account's photos (folder <user id>/ in the private bucket beer-photos) while the account still exists,
// 2. delete the account with the RPC delete_own_account (migration 20261121150000): the database cascades everything,
//    so if the RPC is missing or fails, nothing has been lost yet,
// 3. remove the photos through the Storage API with the still-valid session (Supabase refuses direct deletes from
//    storage tables, so the database cannot do it),
// 4. drop the local session and reload with ?smazano=1, which App turns into a goodbye toast.
const BUCKET='beer-photos';

async function listPhotos(userId:string){
  const storage=requireClient().storage.from(BUCKET);const paths:string[]=[];
  for(let offset=0;;offset+=1000){
    const {data,error}=await storage.list(userId,{limit:1000,offset});
    if(error)throw error;
    paths.push(...(data||[]).filter(f=>f.name).map(f=>userId+'/'+f.name));
    if(!data||data.length<1000)return paths;
  }
}

export default function DeleteAccount({userId}:{userId:string}){
  const [open,setOpen]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');

  async function remove(){
    setBusy(true);setError('');
    const c=requireClient();
    try{
      const photos=await listPhotos(userId);
      const {error:rpcError}=await c.rpc('delete_own_account');
      if(rpcError){
        // PGRST202 / 404: the migration is not in this database yet. Nothing was deleted.
        if(rpcError.code==='PGRST202'||(rpcError as any).status===404){setError('Smazání účtu tu zatím nejde. Napiš nám prosím na admin@popijeme.cz a účet smažeme ručně.');return}
        throw rpcError;
      }
      for(let i=0;i<photos.length;i+=100){
        const {error:photoError}=await c.storage.from(BUCKET).remove(photos.slice(i,i+100));
        if(photoError)console.warn('Some photos of the deleted account were not removed');
      }
      await c.auth.signOut({scope:'local'});
      window.location.replace('/?smazano=1');
    }catch(e){setError(errorMessage(e))}finally{setBusy(false)}
  }

  return <>
    <div className="delete-account"><button className="text-btn delete-account-open" onClick={()=>{setError('');setOpen(true)}}><Trash2 size={15}/>Smazat účet</button></div>
    {open&&<div className="overlay"><section className="modal small delete-account-modal" role="dialog" aria-modal="true" aria-labelledby="delete-account-title">
      <h2 id="delete-account-title">Smazat účet natrvalo?</h2>
      <p>Smažeme tvůj profil, všechny ochutnávky a fotky, komentáře, reakce, přátele, pozvánky, hodnocení podniků, seznamy a odznaky. Vrátit to nepůjde.</p>
      <p className="delete-account-note">Piva a pivovary, které jsi přidal(a) do společného katalogu, zůstanou, ale bez vazby na tebe. Víc v <a href="/soukromi.html" target="_blank">zásadách ochrany soukromí</a>.</p>
      {error&&<p className="auth-error" role="alert">{error}</p>}
      <button className="danger full" disabled={busy} onClick={remove}><Trash2 size={16}/>{busy?'Mažu účet…':'Ano, smazat účet'}</button>
      <button className="secondary full" disabled={busy} onClick={()=>setOpen(false)}>Ponechat účet</button>
    </section></div>}
  </>;
}
