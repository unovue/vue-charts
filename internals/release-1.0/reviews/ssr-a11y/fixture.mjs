import {h, createSSRApp} from 'vue'
import * as C from './library/es/index.mjs'
export const names=['BarChart','LineChart','AreaChart','ComposedChart','PieChart','RadarChart','RadialBarChart','ScatterChart','FunnelChart','Treemap','Sankey','SunburstChart','Tracker','Heatmap','CohortChart','CalendarHeatmap','JourneySankey','BarList','Sparkline','Tooltip','Legend','Brush']
const data=[{name:'Alpha',value:10,x:10,y:20},{name:'Beta',value:25,x:20,y:10},{name:'Gamma',value:15,x:30,y:30}]
const tip=()=>h(C.Tooltip)
export function view(name,mode='fixed',settled=false){
 const size=mode==='fixed'?{width:560,height:300}:{height:300}
 const anim=settled?{isAnimationActive:false}:{}
 let root=name, props={...size}, children=[]
 const series=(n,p={})=>h(C[n],{dataKey:'value',...anim,...p})
 if(['BarChart','LineChart','AreaChart','ComposedChart','Tooltip','Legend','Brush'].includes(name)){
  root=['Tooltip','Legend','Brush'].includes(name)?'BarChart':name; props.data=data
  children=[h(C.XAxis,{dataKey:'name'}),h(C.YAxis),...(root==='ComposedChart'?[series('Area'),series('Bar'),series('Line')]:[series(root.replace('Chart',''))]),tip(),h(C.Legend)]
  if(name==='Brush')children.push(h(C.Brush,{dataKey:'name',height:30}))
 } else if(name==='PieChart') children=[series('Pie',{data,nameKey:'name'}),tip()]
 else if(name==='RadarChart') {props.data=data; children=[h(C.PolarGrid),h(C.PolarAngleAxis,{dataKey:'name'}),h(C.PolarRadiusAxis),series('Radar'),tip()]}
 else if(name==='RadialBarChart') {props.data=data; children=[series('RadialBar'),tip()]}
 else if(name==='ScatterChart')children=[h(C.XAxis,{dataKey:'x',type:'number'}),h(C.YAxis,{dataKey:'y',type:'number'}),series('Scatter',{data}),tip()]
 else if(name==='FunnelChart')children=[series('Funnel',{data,nameKey:'name'}),tip()]
 else {
  props={...size,...anim};children=[tip()]
  if(name==='Treemap')props={...props,data,dataKey:'value',nameKey:'name'}
  if(name==='Sankey')props.data={nodes:[{name:'Start'},{name:'End'},{name:'Exit'}],links:[{source:0,target:1,value:10},{source:0,target:2,value:5}]}
  if(name==='SunburstChart')props.data={name:'All',value:50,children:[{name:'Alpha',value:25,children:[{name:'Child',value:10}]},{name:'Beta',value:25}]}
  if(name==='Tracker')props.data=[{date:'2025-01-01',status:'up'},{date:'2025-01-02',status:'down'},{date:'2025-01-03',status:'degraded'}]
  if(name==='Heatmap')props={...props,showValues:true,data:[{x:'Mon',y:'AM',value:10},{x:'Tue',y:'AM',value:20},{x:'Mon',y:'PM',value:5},{x:'Tue',y:'PM',value:15}]}
  if(name==='CohortChart')props.data=[{cohort:'Jan',values:[100,70,40]},{cohort:'Feb',values:[100,50]}]
  if(name==='CalendarHeatmap')props={...props,start:'2025-01-01',end:'2025-02-28',data:[{date:'2025-01-02',value:5},{date:'2025-01-03',value:10}]}
  if(name==='JourneySankey')props.data=[{path:['/','/docs','/signup'],count:10},{path:['/','/about'],count:5}]
  if(name==='BarList')props.data=data
  if(name==='Sparkline')props.data=data.map(d=>d.value)
 }
 const chart=h(C[root],props,{default:()=>children})
 return mode==='container'?h(C.ResponsiveContainer,{width:'100%',height:300},{default:()=>chart}):chart
}
export function app(name,mode,settled){return createSSRApp({render:()=>view(name,mode,settled)})}
