// Phone bottom bar hides while scrolling down and comes back on scrolling up, like the Safari toolbar.
// It also comes back at the top and at the very end of the page, and never hides while a menu or the keyboard is open.
// The state is a class on <html> (`nav-hidden`); scroll-nav.css moves the bar and the + button off screen.
export function installScrollNav(){
 const root=document.documentElement;
 let lastY=window.scrollY;
 const set=(hidden:boolean)=>root.classList.toggle('nav-hidden',hidden);
 const update=()=>{
  const y=window.scrollY,delta=y-lastY;
  const blocked=window.innerWidth>700||root.classList.contains('keyboard-open')||!!document.querySelector('.more-navigation,.quick-add-menu');
  const atTop=y<60,atEnd=window.innerHeight+y>=root.scrollHeight-40;
  if(blocked||atTop||atEnd){set(false);lastY=y;return}
  // Ignore small jitter (iOS bounce, toolbar resizing); act once the finger has moved the page a bit.
  if(Math.abs(delta)<8)return;
  set(delta>0);
  lastY=y;
 };
 // Scroll events already arrive at most once per frame and the work is tiny, so no extra throttling.
 window.addEventListener('scroll',update,{passive:true});
 window.addEventListener('resize',update);
 // Opening the Více menu or the + menu brings the bar back right away.
 document.addEventListener('click',()=>setTimeout(update));
}
