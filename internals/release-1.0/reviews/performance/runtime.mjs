import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import os from 'node:os';import {createRequire} from 'node:module';import {execFileSync} from 'node:child_process';
const require=createRequire(import.meta.url);const root=process.cwd(),dir=path.resolve('.evidence/review/performance');
const {build}=require(path.resolve('node_modules/.pnpm/esbuild@0.28.2/node_modules/esbuild'));
const {chromium}=require(path.resolve('node_modules/.pnpm/playwright-core@1.58.2/node_modules/playwright-core'));
await build({entryPoints:[path.join(dir,'runtime-static-fixture.mjs')],nodePaths:[path.resolve('packages/vue/node_modules')],bundle:true,minify:true,format:'iife',platform:'browser',target:'es2022',outfile:path.join(dir,'runtime.js'),alias:{vue:require.resolve('vue',{paths:[path.resolve('packages/vue')]}).replace('/index.js','/dist/vue.runtime.esm-bundler.js'),'motion-v':path.resolve('packages/vue/node_modules/motion-v/dist/es/index.mjs')},define:{'process.env.NODE_ENV':'"production"',__VUE_OPTIONS_API__:'true',__VUE_PROD_DEVTOOLS__:'false',__VUE_PROD_HYDRATION_MISMATCH_DETAILS__:'false'}});
const server=http.createServer((req,res)=>{const file=path.join(dir,req.url==='/'?'index.html':req.url.slice(1));if(!file.startsWith(dir)){res.writeHead(403).end();return;}try{res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':'text/html');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
let browser;const result={machine:{platform:os.platform(),arch:os.arch(),cpus:os.cpus().length,cpu:os.cpus()[0].model,memory:os.totalmem(),uptimeStart:execFileSync('uptime').toString().trim()},runs:[],leaks:[],errors:[]};
try{
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(4600,'127.0.0.1',resolve);});
 browser=await chromium.launch({headless:true,executablePath:'<local headless shell>',args:['--enable-precise-memory-info']});
 result.browser=await browser.version();const page=await browser.newPage({viewport:{width:1100,height:700}});page.on('pageerror',e=>result.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')result.errors.push(m.text());});
 await page.goto('http://127.0.0.1:4600');await page.waitForFunction(()=>!!window.bench);
 const cdp=await page.context().newCDPSession(page);await cdp.send('Performance.enable');
 for(const kind of ['LineChart','BarChart','Heatmap','CalendarHeatmap'])await page.evaluate(([k,n])=>window.bench.run(k,n),[kind,kind==='Heatmap'?168:kind==='CalendarHeatmap'?365:100]);
 const cases=[['LineChart',100],['LineChart',1000],['LineChart',10000],['BarChart',100],['BarChart',1000],['BarChart',10000],['Heatmap',168],['CalendarHeatmap',365]];
 for(let round=0;round<7;round++)for(const [kind,n]of [...cases.slice(round%cases.length),...cases.slice(0,round%cases.length)]){
 const row=await page.evaluate(([k,n])=>window.bench.run(k,n),[kind,n]);result.runs.push({...row,round});console.log(JSON.stringify({...row,round}));fs.writeFileSync(path.join(dir,'runtime-results.json'),JSON.stringify(result,null,2));
 }
 async function snapshot(){await cdp.send('HeapProfiler.collectGarbage');await cdp.send('HeapProfiler.collectGarbage');return {heap:await cdp.send('Runtime.getHeapUsage'),dom:await cdp.send('Memory.getDOMCounters')};}
 for(const kind of ['LineChart','BarChart','Heatmap','CalendarHeatmap']){
 // Warm five cycles before a full GC, then compare two consecutive 50-cycle batches.
 const n=kind==='CalendarHeatmap'?365:kind==='Heatmap'?168:1000;
 await page.evaluate(([k,n])=>window.bench.cycle(k,n,5),[kind,n]);
 const before=await snapshot();await page.evaluate(([k,n])=>window.bench.cycle(k,n,50),[kind,n]);const after50=await snapshot();await page.evaluate(([k,n])=>window.bench.cycle(k,n,50),[kind,n]);const after100=await snapshot();result.leaks.push({kind,n,before,after50,after100});console.log('leaks',JSON.stringify(result.leaks.at(-1)));
 }
 for(const kind of ['LineChart','BarChart','Heatmap','CalendarHeatmap']){await page.reload();await page.waitForFunction(()=>!!window.bench);await page.evaluate(([k,n])=>window.bench.screenshot(k,n),[kind,kind==='CalendarHeatmap'?365:kind==='Heatmap'?168:100]);await page.screenshot({path:path.join(dir,kind+'.png')});}
 result.machine.uptimeEnd=execFileSync('uptime').toString().trim();fs.writeFileSync(path.join(dir,'runtime-results.json'),JSON.stringify(result,null,2));
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
