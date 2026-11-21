import {useState} from 'react';
import {X,Beer,Copy,ExternalLink} from 'lucide-react';
import {requireClient,errorMessage} from './supabase';

// Google refuses OAuth inside embedded browsers (Facebook, Messenger, Instagram, WhatsApp on Android…) with "disallowed_useragent".
const inAppBrowser=/FBAN|FBAV|FB_IAB|FBIOS|Instagram|Messenger|WhatsApp|Line\/|MicroMessenger|; wv\)/i.test(navigator.userAgent);
const isAndroid=/Android/i.test(navigator.userAgent);

// Sign-in is Google only (Marek, 21 Nov 2026): Popijeme stores no passwords. New accounts are made on the first
// Google sign-in.
export default function AuthDialog({onClose}:{onClose:()=>void}) {
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [copied,setCopied]=useState(false);
  const pageUrl=window.location.href;
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

  return <div className="overlay"><section className="modal auth-modal" role="dialog" aria-modal="true" aria-label="Přihlášení a registrace">
    <button className="close" aria-label="Zavřít" onClick={onClose} disabled={busy}><X/></button>
    <span className="eyebrow"><Beer size={16}/> VÍTEJ V PARTĚ</span>
    <h2>Přihlášení a registrace</h2>
    <p className="muted">Přihlašujeme se jen přes Google. Poprvé? Účet máš hned. Hesla u nás nenecháváš žádná.</p>
    {inAppBrowser&&<div className="auth-inapp" role="note"><b>Otevři Popijeme v prohlížeči</b><p>V aplikaci Facebook, Instagram nebo Messenger Google přihlášení nepovolí. Klepni na ⋯ vpravo nahoře a zvol „Otevřít v prohlížeči“.</p><div className="auth-inapp-actions">{isAndroid&&<a className="primary" href={'intent://'+pageUrl.replace(/^https?:\/\//,'')+'#Intent;scheme=https;package=com.android.chrome;end'}><ExternalLink size={16}/>Otevřít v Chrome</a>}<button type="button" className="secondary" onClick={copyLink}><Copy size={16}/>{copied?'Odkaz zkopírován':'Zkopírovat odkaz'}</button></div></div>}
    {error&&<div className="auth-error" role="alert">{error}</div>}
    <button className="secondary full" onClick={signIn} disabled={busy}>
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.23c1.89-1.74 2.99-4.3 2.99-7.36Z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.61-2.41l-3.23-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.41 13.92a6 6 0 0 1 0-3.84V7.49H3.07a10 10 0 0 0 0 9.02l3.34-2.59Z"/><path fill="#EA4335" d="M12 5.96c1.47 0 2.79.5 3.82 1.49l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.93 5.49l3.34 2.59C7.2 7.72 9.4 5.96 12 5.96Z"/></svg>
      {busy?'Chvilku…':'Pokračovat přes Google'}
    </button>
    <p className="muted auth-privacy">Popijeme je veřejná komunita. U každého zápisu zvolíš, zda ho sdílet. E-mail se ostatním nikdy nezobrazuje. Pro osoby od 18 let. Přihlášením souhlasíš s <a href="/podminky.html" target="_blank">podmínkami užívání</a>, jak s údaji zacházíme, popisují <a href="/soukromi.html" target="_blank">zásady ochrany soukromí</a>.</p>
  </section></div>;
}
