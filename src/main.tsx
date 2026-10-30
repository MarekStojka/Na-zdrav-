import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './styles.css';
// Keep an invitation or shared post through the fixed OAuth callback URL.
try{const saved=sessionStorage.getItem('popijeme-return-intent');if(saved&&!window.location.search){sessionStorage.removeItem('popijeme-return-intent');const intent=JSON.parse(saved),query=new URLSearchParams();for(const key of ['friend','post'])if(typeof intent[key]==='string'&&intent[key].length<=80)query.set(key,intent[key]);if(query.size)window.history.replaceState(null,'','/?'+query.toString()+window.location.hash);}}catch{sessionStorage.removeItem('popijeme-return-intent');}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
