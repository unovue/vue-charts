import {createServer as viteServer} from 'vite'
import {createServer} from 'node:http'
import {readFile,writeFile} from 'node:fs/promises'
import {resolve} from 'node:path'
const root=resolve('.evidence/review/ssr-a11y')
const vite=await viteServer({root,cacheDir:root+'/.vite',configFile:false,define:{__VUE_OPTIONS_API__:true,__VUE_PROD_DEVTOOLS__:false,__VUE_PROD_HYDRATION_MISMATCH_DETAILS__:true},server:{middlewareMode:true,hmr:false},resolve:{dedupe:['vue']}})
const fixture=await vite.ssrLoadModule('/fixture.mjs'); const {renderToString}=await vite.ssrLoadModule('vue/server-renderer')
const css=(await readFile('docs/app/assets/main.css','utf8')).split('/* Match Recharts')[0]+ '\nbody{margin:20px;background:var(--ds-surface);color:var(--ds-text)} #host{width:560px;height:300px} '
const ssr={}
for(const name of fixture.names) for(const mode of ['fixed','responsive','container']){
 const key=name+'-'+mode
 try { const warnings=[];const a=fixture.app(name,mode);a.config.warnHandler=m=>warnings.push(m);const html=await renderToString(a);ssr[key]={html,warnings};await writeFile(root+'/'+key+'.html',html) }catch(e){ssr[key]={error:e.stack}}
}
await writeFile(root+'/ssr.json',JSON.stringify(ssr,null,2))
const server=createServer(async(req,res)=>{
 if(req.url.startsWith('/audit?')){
 const url=new URL(req.url,'http://localhost');const name=url.searchParams.get('name');const mode=url.searchParams.get('mode')||'fixed';const item=ssr[name+'-'+mode]
 res.setHeader('Content-Type','text/html; charset=utf-8'); res.end(`<!DOCTYPE html><html lang="en" class="${url.searchParams.get('dark')?'dark':''}"><head><meta charset="utf-8"><title>Chart audit</title><style>${css}</style></head><body><main><h1>${name}</h1><div id="host">${item.html||''}</div></main><script>window.auditConfig=${JSON.stringify({name,mode})}</script><script type="module" src="/client.mjs"></script></body></html>`)

 }else vite.middlewares(req,res,()=>{res.statusCode=404;res.end()})
})
server.listen(4607,'127.0.0.1',()=>console.log('Audit fixture http://127.0.0.1:4607; SSR cases '+Object.keys(ssr).length))
async function stop(){server.close();await vite.close();process.exit()}; process.on('SIGTERM',stop);process.on('SIGINT',stop)
