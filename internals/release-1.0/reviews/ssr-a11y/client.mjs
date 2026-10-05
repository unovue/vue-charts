import {app,view} from './fixture.mjs'
import {createApp} from 'vue'
const {name,mode}=window.auditConfig
window.hydrate=()=>{const a=app(name,mode);a.mount('#host');window.app=a}
window.baseline=()=>{const el=document.createElement('div');el.id='baseline';el.style.cssText='width:560px;height:300px';document.body.append(el);createApp({render:()=>view(name,mode,true)}).mount(el)}
window.ready=true
