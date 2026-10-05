import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import {gzipSync,brotliCompressSync} from 'node:zlib';
const require=createRequire(import.meta.url);
const {build,version}=require(path.resolve('node_modules/.pnpm/esbuild@0.28.2/node_modules/esbuild'));
const dir=path.resolve('.evidence/review/performance');
const lib=path.resolve('.evidence/review/performance/library/dist/es/index.mjs');
const charts=['BarChart','LineChart','AreaChart','ComposedChart','PieChart','RadarChart','RadialBarChart','ScatterChart','FunnelChart','Treemap','Sankey','Tracker','Heatmap','CohortChart','CalendarHeatmap','JourneySankey','BarList','Sparkline'];
const cases=Object.fromEntries(charts.map(c=>[c,`export {${c}} from ${JSON.stringify(lib)}`]));
cases['Line+Bar']='export {LineChart, BarChart} from '+JSON.stringify(lib);
cases['All charts']='export {'+charts.join(',')+'} from '+JSON.stringify(lib);
cases['Import everything']='export * from '+JSON.stringify(lib);
cases['Line rendered']='export {LineChart,Line,XAxis,YAxis} from '+JSON.stringify(lib);
cases['Bar rendered']='export {BarChart,Bar,XAxis,YAxis} from '+JSON.stringify(lib);
const results=[];
function group(p){
 if(!p.includes('node_modules/'))return 'internal modules';
 if(p.includes('@reduxjs/toolkit'))return 'Redux Toolkit';
 if(/[/]immer[/]/.test(p))return 'immer';
 if(/[/]reselect[/]/.test(p))return 'reselect';
 if(/victory-vendor|[/]d3-[^/]+[/]/.test(p))return 'victory-vendor/d3';
 if(/lodash-es|es-toolkit/.test(p))return 'lodash-es/es-toolkit';
 return 'other dependencies';
}
for(const [name,contents] of Object.entries(cases)){
 const r=await build({stdin:{contents,resolveDir:process.cwd(),sourcefile:name+'.js'},nodePaths:[path.resolve('packages/vue/node_modules')],bundle:true,minify:true,format:'esm',platform:'browser',target:'es2022',external:['vue','vue/*','motion-v','motion-v/*'],metafile:true,write:false,outfile:path.join(dir,'bundles',name.replaceAll(/[^a-zA-Z0-9]/g,'_')+'.mjs')});
 const out=r.outputFiles[0];fs.mkdirSync(path.dirname(out.path),{recursive:true});fs.writeFileSync(out.path,out.contents);
 const contributions={};const modules=[];
 for(const o of Object.values(r.metafile.outputs))for(const [p,v]of Object.entries(o.inputs)){contributions[group(p)]=(contributions[group(p)]??0)+v.bytesInOutput;modules.push({path:p,bytes:v.bytesInOutput});}
 const row={name,minified:out.contents.length,gzip:gzipSync(out.contents,{level:9}).length,brotli:brotliCompressSync(out.contents).length,contributions,modules:modules.sort((a,b)=>b.bytes-a.bytes)};results.push(row);
 fs.writeFileSync(path.join(dir,'bundles',name.replaceAll(/[^a-zA-Z0-9]/g,'_')+'.meta.json'),JSON.stringify(r.metafile,null,2));
 console.log(name,row.minified,row.gzip,row.brotli);
}
fs.writeFileSync(path.join(dir,'bundle-results.json'),JSON.stringify({esbuild:version,external:['vue','motion-v'],results},null,2));
