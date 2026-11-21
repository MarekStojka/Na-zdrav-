import {useState} from 'react';
import {Beer} from 'lucide-react';
import {requireClient,errorMessage} from './supabase';

// Popijeme is a social network about beer, so it is for adults only. After the first sign-in every account confirms
// once that it is 18 or older. The answer is stored with the account (Supabase Auth user_metadata.adult_confirmed_at,
// no database migration) so we can show that we ask for it. "Not 18" signs the account out.
// Accounts that already exist see the question on their next visit, also exactly once.
export function isAdultConfirmed(user:any){return !!user?.user_metadata?.adult_confirmed_at}

// `refused` lives in App: signing out unmounts the gate (it is shown only to signed-in accounts), so App keeps it
// open to show the goodbye.
export default function AgeGate({onConfirmed,refused,onRefused}:{onConfirmed:()=>void,refused:boolean,onRefused:(value:boolean)=>void}){
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');

  async function confirm(){
    setBusy(true);setError('');
    try{
      const {error}=await requireClient().auth.updateUser({data:{adult_confirmed_at:new Date().toISOString()}});
      if(error)throw error;
      onConfirmed();
    }catch(e){setError(errorMessage(e))}finally{setBusy(false)}
  }

  async function refuse(){
    setBusy(true);setError('');onRefused(true);
    const {error}=await requireClient().auth.signOut();
    setBusy(false);
    if(error){onRefused(false);setError(errorMessage(error))}
  }

  return <div className="overlay age-gate">
    <section className="modal small" role="dialog" aria-modal="true" aria-labelledby="age-gate-title">
      <span className="age-gate-icon"><Beer size={28}/></span>
      {refused?<>
        <h2 id="age-gate-title">Tak zase za pár let</h2>
        <p>Popijeme je jen pro dospělé, proto jsme tě odhlásili. Budeme se těšit, až ti bude 18.</p>
        <button className="secondary full" onClick={()=>window.location.assign('/')}>Rozumím</button>
      </>:<>
        <h2 id="age-gate-title">Je ti 18 let?</h2>
        <p>Popijeme je síť o pivu, a proto jen pro dospělé. Potvrď prosím, že ti je 18 let nebo víc. Zeptáme se jen jednou.</p>
        <p className="age-gate-legal">Potvrzením souhlasíš s <a href="/podminky.html" target="_blank">podmínkami užívání</a>. Jak s údaji zacházíme, popisují <a href="/soukromi.html" target="_blank">zásady ochrany soukromí</a>.</p>
        {error&&<p className="auth-error" role="alert">{error}</p>}
        <button className="primary full" disabled={busy} onClick={confirm}>Ano, je mi 18 let</button>
        <button className="secondary full" disabled={busy} onClick={refuse}>Ještě mi 18 není</button>
      </>}
    </section>
  </div>;
}
