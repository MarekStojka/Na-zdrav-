// Keyboard-aware layout for phones.
// iOS Safari (and Android Chrome by default) do not shrink the layout viewport when the on-screen keyboard opens;
// the keyboard just covers the bottom of the page. We expose the *visible* area as CSS variables so full-screen
// dialogs can size themselves to it, mark <html> while the keyboard is open, and keep the focused field visible.
export function installViewportTracking(){
 const root=document.documentElement;
 const vv=window.visualViewport;
 const update=()=>{
  const height=vv?vv.height:window.innerHeight;
  const top=vv?vv.offsetTop:0;
  root.style.setProperty('--vvh',height+'px');
  root.style.setProperty('--vvtop',top+'px');
  // A keyboard takes well over 150px; smaller differences are browser toolbars collapsing.
  root.classList.toggle('keyboard-open',window.innerHeight-height>150);
 };
 update();
 vv?.addEventListener('resize',update);
 vv?.addEventListener('scroll',update);
 window.addEventListener('resize',update);
 // After the keyboard animates in, bring the focused field into the middle of what is still visible.
 document.addEventListener('focusin',event=>{
  const el=event.target as HTMLElement|null;
  if(!el||!el.matches('input:not([type=checkbox]):not([type=radio]):not([type=file]),textarea,select'))return;
  if(window.innerWidth>700)return;
  window.setTimeout(()=>{if(document.activeElement===el)el.scrollIntoView({block:'center',behavior:'smooth'})},320);
 });
}
