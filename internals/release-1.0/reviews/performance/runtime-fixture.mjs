import {createApp,h,ref,nextTick} from 'vue';
import {LineChart,Line,BarChart,Bar,XAxis,YAxis,Heatmap,CalendarHeatmap} from './library/dist/es/index.mjs';
const host=document.getElementById('app');
const frame=()=>new Promise(requestAnimationFrame);
const flush=async()=>{await nextTick();await nextTick();host.getBoundingClientRect();host.querySelector('svg')?.getBoundingClientRect();};
function dataFor(kind,n,phase=0){
 if(kind==='Heatmap')return Array.from({length:168},(_,i)=>({x:i%24,y:Math.floor(i/24),value:1+(i*7+phase*19)%97}));
 if(kind==='CalendarHeatmap')return Array.from({length:365},(_,i)=>({date:new Date(Date.UTC(2025,0,1)+i*86400000).toISOString().slice(0,10),value:1+(i*7+phase*19)%97}));
 return Array.from({length:n},(_,i)=>({name:String(i),value:1+(i*7+phase*19)%97}));
}
function fixture(kind,n){
 const data=ref(dataFor(kind,n));const active=ref(false);
 const component={LineChart,BarChart,Heatmap,CalendarHeatmap}[kind];
 const app=createApp({render(){return h(component,{width:900,height:400,data:data.value,isAnimationActive:active.value,...(kind==='CalendarHeatmap'?{start:'2025-01-01',end:'2025-12-31'}:{})},kind==='LineChart'||kind==='BarChart'?{default:()=>[h(XAxis,{dataKey:'name',interval:'preserveStartEnd'}),h(YAxis),h(kind==='LineChart'?Line:Bar,{dataKey:'value',isAnimationActive:active.value,...(kind==='LineChart'?{dot:true}:{} )})]}:undefined)}});
 return {app,data,active};
}
let animated;
window.bench={
 async prepareAnimated(kind,n){animated=fixture(kind,n);animated.app.mount(host);await flush();await frame();animated.active.value=true;await flush();await new Promise(r=>setTimeout(r,2200));},
 async animatedUpdate(kind,n,phase){const times=[];let running=true;const tick=t=>{times.push(t);if(running)requestAnimationFrame(tick);};await frame();requestAnimationFrame(tick);const start=performance.now();animated.data.value=dataFor(kind,n,phase);await flush();const initialUpdateMs=performance.now()-start;await new Promise(r=>setTimeout(r,700));running=false;await frame();await flush();return {initialUpdateMs,frames:times.length,intervals:times.slice(1).map((t,i)=>t-times[i]),windowMs:performance.now()-start};},
 async endAnimated(){animated.app.unmount();animated=undefined;await flush();await frame();},
 async run(kind,n){
 const {app,data}=fixture(kind,n);
 await frame();const t=performance.now();app.mount(host);await flush();const mountMs=performance.now()-t;
 const count=host.querySelectorAll(kind==='LineChart'?'.v-charts-line-dot':kind==='BarChart'?'.v-charts-bar-rectangle':'.v-charts-cell').length;
 const curve=host.querySelector('.v-charts-line-curve');const oldPath=curve?.getAttribute('d');
 const rect=host.querySelector('.v-charts-bar-rectangle');const oldBar=rect?.outerHTML;
 const next=dataFor(kind,n,1);await frame();const u=performance.now();data.value=next;await flush();const updateMs=performance.now()-u;
 await frame();const updateToRafMs=performance.now()-u;
 const changed=kind==='LineChart'?oldPath!==curve?.getAttribute('d'):kind==='BarChart'?oldBar!==rect?.outerHTML:true;
 const result={kind,n,mountMs,updateMs,updateToRafMs,count,changed,domNodes:host.querySelectorAll('*').length};
 app.unmount();await flush();await frame();return result;
 },
 async cycle(kind,n,count){for(let i=0;i<count;i++){const {app}=fixture(kind,n);app.mount(host);await flush();app.unmount();await flush();await frame();}return host.childElementCount;},
 async screenshot(kind,n){const {app}=fixture(kind,n);app.mount(host);await flush();await frame();return true;}
};
