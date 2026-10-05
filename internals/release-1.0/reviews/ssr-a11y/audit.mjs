import {createRequire} from 'node:module'
import {realpath,readFile,writeFile,mkdir} from 'node:fs/promises'
import {resolve} from 'node:path'
const root=resolve('.evidence/review/ssr-a11y')
const require=createRequire(await realpath('packages/vue/node_modules/@nuxt/test-utils/package.json'))
const {chromium}=require('playwright-core')
const axe=await readFile('node_modules/.pnpm/axe-core@4.10.3/node_modules/axe-core/axe.min.js','utf8')
const only=process.env.AUDIT_ONLY?.split(',');const ssr=JSON.parse(await readFile(root+'/ssr.json','utf8'));const names=Object.keys(ssr).filter(x=>x.endsWith('-fixed')).map(x=>x.replace('-fixed','')).filter(x=>!only||only.includes(x))
await mkdir(root+'/screenshots',{recursive:true})
const browser=await chromium.launch({executablePath:'<local headless shell>',headless:true})
function snapshot(id='host'){
 const host=document.getElementById(id)
 const box=host.querySelector('.v-charts-wrapper')||host.firstElementChild||host
 const b=box.getBoundingClientRect()
 const svg=host.querySelector('svg')
 const nodes=[...host.querySelectorAll('path,rect,circle,polygon,polyline,ellipse,line,.v-charts-bar-list-bar')].filter(e=>!e.closest('defs')&&!e.closest('.v-charts-tooltip-cursor'))
 const shape=nodes.map(e=>({tag:e.tagName,cls:e.getAttribute('class'),attrs:Object.fromEntries(['d','x','y','cx','cy','r','width','height','points','stroke-dasharray','transform','opacity','fill-opacity','stroke-opacity'].filter(a=>e.hasAttribute(a)).map(a=>[a,e.getAttribute(a)])),style:e.getAttribute('style')}))
 const reveal=[...host.querySelectorAll('[style]')].filter(e=>/opacity|transform|clipPath|clip-path/.test(e.getAttribute('style'))).map(e=>({cls:e.getAttribute('class'),style:e.getAttribute('style')}))
 return {shape,reveal,box:{width:b.width,height:b.height,visibility:getComputedStyle(box).visibility},svg:svg?{width:svg.getAttribute('width'),height:svg.getAttribute('height')}:null}
}
function accessibility(){
 const host=document.getElementById('host')
 const roles=[...host.querySelectorAll('[role]')].map(e=>({tag:e.tagName,role:e.getAttribute('role'),name:e.getAttribute('aria-label')||[...(e.getAttribute('aria-labelledby')||'').split(' ')].map(id=>document.getElementById(id)?.textContent||'').join(' ')||e.querySelector('title')?.textContent||'',tabindex:e.getAttribute('tabindex'),cls:e.getAttribute('class')}))
 const focus=[...host.querySelectorAll('[tabindex],a,button,input')].filter(e=>e.tabIndex>=0).map(e=>({tag:e.tagName,role:e.getAttribute('role'),name:e.getAttribute('aria-label'),cls:e.getAttribute('class')}))
 const tooltip=[...host.querySelectorAll('.v-charts-tooltip-wrapper')].map(e=>({text:e.textContent,visibility:getComputedStyle(e).visibility,display:getComputedStyle(e).display,role:e.getAttribute('role')}))
 return {roles,focus,tooltip,live:[...host.querySelectorAll('[aria-live]')].map(e=>e.textContent),selected:[...host.querySelectorAll('[aria-selected="true"]')].map(e=>e.getAttribute('aria-label'))}
}
function contrast(){
 const rgb=c=>{const el=document.createElement('span');el.style.color=c;document.body.append(el);const s=getComputedStyle(el).color;el.remove();const m=s.match(/[\d.]+/g);return m?.slice(0,3).map(Number)}
 const lum=a=>a.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0)
 const background=getComputedStyle(document.body).backgroundColor
 const records=[...document.querySelectorAll('#host svg text,#host .v-charts-bar-list-name,#host .v-charts-bar-list-value,#host .v-charts-legend-item-text,#host .v-charts-tooltip-wrapper p,#host .v-charts-tooltip-wrapper li')].filter(e=>e.textContent.trim()&&getComputedStyle(e).visibility!=='hidden').map(e=>{
 const s=getComputedStyle(e);const fill=e.tagName==='text'?s.fill:s.color;let bg=background
 if(e.closest('.v-charts-tooltip-wrapper')) bg=getComputedStyle(e.closest('.v-charts-tooltip-wrapper')).backgroundColor==='rgba(0, 0, 0, 0)'?getComputedStyle(e.closest('.v-charts-tooltip-wrapper').firstElementChild).backgroundColor:getComputedStyle(e.closest('.v-charts-tooltip-wrapper')).backgroundColor
 const fgRGB=rgb(fill),bgRGB=rgb(bg);let ratio=null;if(fgRGB&&bgRGB){const l=[lum(fgRGB),lum(bgRGB)].sort((a,b)=>b-a);ratio=(l[0]+.05)/(l[1]+.05)}
 return {text:e.textContent,fill,bg,ratio:ratio===null?null:Math.round(ratio*100)/100,fontSize:s.fontSize,cls:e.getAttribute('class')}
 });return {background,variables:Object.fromEntries(['text','background','focus','tooltip-foreground','tooltip-background'].map(x=>['--v-charts-'+x,getComputedStyle(document.documentElement).getPropertyValue('--v-charts-'+x)])),records}
}
const jobs=names.flatMap(name=>[
 {name,mode:'fixed',theme:'light',reduced:false,width:900},
 {name,mode:'fixed',theme:'dark',reduced:false,width:900},
 {name,mode:'fixed',theme:'light',reduced:true,width:900},
 {name,mode:'responsive',theme:'light',reduced:false,width:900},
 {name,mode:'container',theme:'light',reduced:false,width:390}
])
const results=only?JSON.parse(await readFile(root+'/browser.json','utf8')).filter(x=>!only.includes(x.name)):[];let i=0
async function run(job){
 const page=await browser.newPage({viewport:{width:job.width,height:650},reducedMotion:job.reduced?'reduce':'no-preference'})
 await page.addInitScript(()=>{window.__VUE_OPTIONS_API__=true;window.__VUE_PROD_DEVTOOLS__=false;window.__VUE_PROD_HYDRATION_MISMATCH_DETAILS__=true});const warnings=[],errors=[];page.on('console',m=>{if(m.type()==='warning')warnings.push(m.text());if(m.type()==='error')errors.push(m.text())});page.on('pageerror',e=>errors.push(e.stack))
 const key=`${job.name}-${job.mode}-${job.theme}-${job.reduced?'reduce':'motion'}-${job.width}`
 const row={...job,key,warnings,errors}
 try {
 await page.goto(`http://127.0.0.1:4607/audit?name=${job.name}&mode=${job.mode}${job.theme==='dark'?'&dark=1':''}`)
 await page.waitForFunction(()=>window.ready)
 if(job.width===390)await page.evaluate(()=>document.getElementById('host').style.width='350px');row.server=await page.evaluate(snapshot); await page.evaluate(()=>window.hydrate());
 row.start=await page.evaluate(snapshot);await page.waitForTimeout(180);row.t180=await page.evaluate(snapshot);await page.waitForTimeout(1020);row.t1200=await page.evaluate(snapshot);await page.waitForTimeout(1800);row.final=await page.evaluate(snapshot);await page.waitForTimeout(400);row.later=await page.evaluate(snapshot)
 row.stable=JSON.stringify(row.final.shape)===JSON.stringify(row.later.shape)&&JSON.stringify(row.final.reveal)===JSON.stringify(row.later.reveal)
 row.entrance=JSON.stringify(row.start.shape)!==JSON.stringify(row.t1200.shape)||JSON.stringify(row.start.reveal)!==JSON.stringify(row.t1200.reveal)
 row.reducedAnimation=job.reduced&&(JSON.stringify(row.t180.shape)!==JSON.stringify(row.t1200.shape)||JSON.stringify(row.t180.reveal)!==JSON.stringify(row.t1200.reveal))
 row.a11yBefore=await page.evaluate(accessibility)
 if(job.mode==='fixed'&&!job.reduced){
 await page.addScriptTag({content:axe}); row.axeBefore=(await page.evaluate(()=>axe.run(document.getElementById('host')))).violations.map(v=>({rule:v.id,impact:v.impact,count:v.nodes.length,nodes:v.nodes.map(n=>({html:n.html,target:n.target,summary:n.failureSummary}))}))
 await page.keyboard.press('Tab');row.focused=await page.evaluate(()=>{const e=document.activeElement,s=getComputedStyle(e);return {tag:e.tagName,role:e.getAttribute('role'),cls:e.getAttribute('class'),outline:s.outline,outlineOffset:s.outlineOffset,html:e.outerHTML.slice(0,700)}})
 row.keyboardStart=await page.evaluate(accessibility);await page.keyboard.press('ArrowRight');await page.waitForTimeout(250);row.keyboardRight=await page.evaluate(accessibility);await page.keyboard.press('ArrowLeft');await page.waitForTimeout(250);row.keyboardLeft=await page.evaluate(accessibility)
 row.contrast=await page.evaluate(contrast)
 row.axeAfter=(await page.evaluate(()=>axe.run(document.getElementById('host')))).violations.map(v=>({rule:v.id,impact:v.impact,count:v.nodes.length,nodes:v.nodes.map(n=>({html:n.html,target:n.target,summary:n.failureSummary}))}))
 }
 await page.evaluate(()=>{window.app.unmount();document.getElementById('host').innerHTML='';window.baseline()});if(job.width===390)await page.evaluate(()=>document.getElementById('baseline').style.width='350px');await page.waitForTimeout(250);row.baseline=await page.evaluate(snapshot,'baseline');row.finalMatchesBaseline=JSON.stringify(row.final.shape)===JSON.stringify(row.baseline.shape)
 // Screenshot the hydrated state again; keep screenshots for every fixed case and all failure cases.
 if(job.mode==='fixed'||warnings.length||errors.length||!row.stable){await page.reload();await page.waitForFunction(()=>window.ready);await page.evaluate(()=>window.hydrate());await page.waitForTimeout(1600);if(job.mode==='fixed'&&!job.reduced){await page.keyboard.press('Tab');await page.keyboard.press('ArrowRight');await page.waitForTimeout(200)}await page.screenshot({path:root+'/screenshots/'+key+'.png',fullPage:true});}
 } catch(e){row.auditError=e.stack;await page.screenshot({path:root+'/screenshots/'+key+'-error.png',fullPage:true}).catch(()=>{})}
 results.push(row);await writeFile(root+'/browser.json',JSON.stringify(results,null,2));console.log(JSON.stringify({key,errors:errors.length,warnings:warnings.length,entrance:row.entrance,stable:row.stable,baseline:row.finalMatchesBaseline,axe:row.axeAfter?.map(x=>[x.rule,x.count]),auditError:row.auditError}));await page.close()
}
try{await Promise.all(Array.from({length:4},async()=>{while(i<jobs.length){const job=jobs[i++];await run(job)}}))}finally{await browser.close()}
