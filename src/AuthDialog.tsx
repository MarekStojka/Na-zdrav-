import {useEffect,useState} from 'react';
import {X,Beer,Copy,ExternalLink,Mail} from 'lucide-react';
import {requireClient,errorMessage} from './supabase';

// Google refuses OAuth inside embedded browsers (Facebook, Messenger, Instagram, WhatsApp on Android…) with "disallowed_useragent".
const inAppBrowser=/FBAN|FBAV|FB_IAB|FBIOS|Instagram|Messenger|WhatsApp|Line\/|MicroMessenger|; wv\)/i.test(navigator.userAgent);
const isAndroid=/Android/i.test(navigator.userAgent);

// Sign-in: Google, or e-mail and password for accounts made before Google sign-in (30 Oct 2026) and for people without
// Google. E-mail sign-in stays on the page (no redirect), so it also works from the home-screen icon on iPhone.
// New accounts by e-mail are not offered yet: they need a confirmation e-mail, and Supabase's built-in mailer only
// reaches project members until a custom SMTP is set up. Password reset uses the same mailer.
type Mode='login'|'reset'|'password';

export default function AuthDialog({onClose,recovery=false}:{onClose:()=>void,recovery?:boolean}) {
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');
  const [mode,setMode]=useState<Mode>(recovery?'password':'login');
  const [copied,setCopied]=useState(false);
  const pageUrl=window.location.href;
  useEffect(()=>{if(recovery)setMode('password')},[recovery]);
  function change(next:Mode){setMode(next);setError('');setMessage('')}
  async function copyLink(){try{await navigator.clipboard.writeText(pageUrl);setCopied(true)}catch{setError('Odkaz zkopíruj z adresního řádku nebo z nabídky ⋯.')}}

  async function signIn() {
    setBusy(true);
    setError('');
    try {
      const query=new URLSearchParams(window.location.search);const remembered={friend:query.get('friend'),post:query.get('post')};if(remembered.friend||remembered.post)sessionStorage.setItem('popijeme-return-intent',JSON.stringify(remembered));
      const {error}=await requireClient().auth.signInWithOAuth({
        provider:'google',
        options:{redirectTo:window.location.origin+'/'},
      });
      if(error)throw error;
    } catch(error) {
      setError(errorMessage(error));
      setBusy(false);
    }
  }

  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();setBusy(true);setError('');setMessage('');
    const form=new FormData(e.currentTarget),email=String(form.get('email')||'').trim(),password=String(form.get('password')||'');
    try{
      const c=requireClient();
      if(mode==='login'){const {error}=await c.auth.signInWithPassword({email,password});if(error)throw error;onClose()}
      else if(mode==='reset'){const {error}=await c.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin+'/'});if(error)throw error;setMessage('Pokud účet s tímhle e-mailem existuje, přijde ti odkaz na nové heslo. Mrkni i do spamu.')}
      else{if(password!==String(form.get('confirm')||'')){setError('Hesla se neshodují.');return}const {error}=await c.auth.updateUser({password});if(error)throw error;history.replaceState(null,'',window.location.pathname);onClose()}
    }catch(e:any){
      if(e?.code==='email_address_not_authorized'||/sending.*email/i.test(String(e?.message)))setError('E-mail se teď nepodařilo odeslat. Zkus to prosím později, nebo se přihlas přes Google.');
      else setError(errorMessage(e));
    }finally{setBusy(false)}
  }

  if(mode==='password')return <div className="overlay"><section className="modal auth-modal" role="dialog" aria-modal="true" aria-label="Nové heslo">
    <button className="close" aria-label="Zavřít" onClick={onClose} disabled={busy}><X/></button>
    <span className="eyebrow"><Beer size={16}/> VÍTEJ ZPÁTKY</span>
    <h2>Nastav si nové heslo.</h2>
    {error&&<div className="auth-error" role="alert">{error}</div>}
    <form className="auth-email" onSubmit={submit}>
      <label>Nové heslo<input name="password" type="password" required minLength={8} autoComplete="new-password" placeholder="Alespoň 8 znaků" autoFocus/></label>
      <label>Heslo znovu<input name="confirm" type="password" required minLength={8} autoComplete="new-password"/></label>
      <button className="primary full" disabled={busy}>{busy?'Ukládám…':'Uložit nové heslo'}</button>
    </form>
  </section></div>;

  return <div className="overlay"><section className="modal auth-modal" role="dialog" aria-modal="true" aria-label="Přihlášení a registrace">
    <button className="close" aria-label="Zavřít" onClick={onClose} disabled={busy}><X/></button>
    <span className="eyebrow"><Beer size={16}/> VÍTEJ V PARTĚ</span>
    <h2>Přihlášení a registrace</h2>
    <p className="muted">Poprvé? Přes Google máš účet hned. Už účet máš? Přihlas se stejně jako minule, Googlem nebo e-mailem a heslem.</p>
    {inAppBrowser&&<div className="auth-inapp" role="note"><b>Otevři Popijeme v prohlížeči</b><p>V aplikaci Facebook, Instagram nebo Messenger Google přihlášení nepovolí. Klepni na ⋯ vpravo nahoře a zvol „Otevřít v prohlížeči“.</p><div className="auth-inapp-actions">{isAndroid&&<a className="primary" href={'intent://'+pageUrl.replace(/^https?:\/\//,'')+'#Intent;scheme=https;package=com.android.chrome;end'}><ExternalLink size={16}/>Otevřít v Chrome</a>}<button type="button" className="secondary" onClick={copyLink}><Copy size={16}/>{copied?'Odkaz zkopírován':'Zkopírovat odkaz'}</button></div></div>}
    {error&&<div className="auth-error" role="alert">{error}</div>}
    {message&&<div className="auth-message" role="status">{message}</div>}
    <button className="secondary full" onClick={signIn} disabled={busy}>
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.23c1.89-1.74 2.99-4.3 2.99-7.36Z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.61-2.41l-3.23-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.41 13.92a6 6 0 0 1 0-3.84V7.49H3.07a10 10 0 0 0 0 9.02l3.34-2.59Z"/><path fill="#EA4335" d="M12 5.96c1.47 0 2.79.5 3.82 1.49l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.93 5.49l3.34 2.59C7.2 7.72 9.4 5.96 12 5.96Z"/></svg>
      {busy?'Chvilku…':'Pokračovat přes Google'}
    </button>
    <div className="auth-divider"><span>nebo e-mailem</span></div>
    <form className="auth-email" onSubmit={submit}>
      <label>E-mail<input name="email" type="email" required autoComplete="email" placeholder="tvuj@email.cz"/></label>
      {mode==='login'&&<label>Heslo<input name="password" type="password" required autoComplete="current-password" placeholder="Tvoje heslo"/></label>}
      <button className="primary full" disabled={busy}><Mail size={17}/>{busy?'Chvilku…':mode==='login'?'Přihlásit se':'Poslat odkaz na nové heslo'}</button>
    </form>
    <div className="auth-links">{mode==='login'?<button onClick={()=>change('reset')}>Zapomenuté heslo</button>:<button onClick={()=>change('login')}>← Zpět na přihlášení</button>}</div>
    <p className="muted auth-privacy">Popijeme je veřejná komunita. U každého zápisu zvolíš, zda ho sdílet. E-mail se ostatním nikdy nezobrazuje. Pro osoby od 18 let.</p>
  </section></div>;
}
