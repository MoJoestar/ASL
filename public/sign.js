import {GestureRecognizer,FilesetResolver,DrawingUtils} from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/vision_bundle.mjs';
export const N=12;
export const api=(p,o)=>fetch('/api/'+p,o).then(r=>r.json());
// 88 numbers per frame: for each hand 21 points (x,y) relative to wrist and scaled by hand size, plus the wrist's position on screen (the hand's path)
export function frameVec(r){const v=new Array(88).fill(0);
 (r.landmarks||[]).forEach((l,i)=>{const side=r.handedness?.[i]?.[0]?.categoryName==='Left'?0:1,w=l[0];let s=0;
  l.forEach(p=>{s=Math.max(s,Math.hypot(p.x-w.x,p.y-w.y))});s=s||1;const o=side*44;
  l.forEach((p,k)=>{v[o+k*2]=(p.x-w.x)/s;v[o+k*2+1]=(p.y-w.y)/s});v[o+42]=w.x*2;v[o+43]=w.y*2});return v}
export function resample(f){const o=[];for(let i=0;i<N;i++)o.push(...f[Math.round(i*(f.length-1)/(N-1))]);return o}
export const round=v=>Array.from(v,x=>Math.round(x*100)/100);
export function classify(vec,db){const best={};
 for(const c of db){let d=0;const x=c.x;for(let i=0;i<x.length;i++){const e=x[i]-vec[i];d+=e*e}d=Math.sqrt(d);if(!(c.name in best)||d<best[c.name])best[c.name]=d}
 const r=Object.entries(best).sort((a,b)=>a[1]-b[1]);
 return{top:r.slice(0,3),conf:r.length<2?1:Math.max(0,1-r[0][1]/r[1][1])}}
export const buildDB=signs=>Object.entries(signs).flatMap(([n,s])=>s.clips.slice(-25).map(x=>({name:n,x:Float32Array.from(x)})));
// Clip logic: hand appears -> recording; hand rests or leaves for 0.7s -> clip done; then wait until the hand leaves
export class Recorder{constructor(cb,st){this.cb=cb;this.st=st;this.reset()}
 reset(){this.state='ready';this.f=[];this.t=[];this.gone=0}
 push(vec,has,now){
  if(this.state==='wait'){if(has)this.gone=0;else{this.gone=this.gone||now;if(now-this.gone>500){this.reset();this.st('ready')}}return}
  if(this.state==='ready'){if(has){this.state='rec';this.f=[vec];this.t=[now];this.st('rec')}return}
  if(has){this.f.push(vec);this.t.push(now)}
  const L=this.t.length-1,i=this.t.findIndex(x=>x>=now-700);let end=!has&&now-this.t[L]>700;
  if(has&&i>=0&&this.t[L]-this.t[i]>=600&&this.t[L]-this.t[0]>=900){const e=this.f[L];
   end=this.f.slice(i).every(g=>{let s=0;for(let k=0;k<88;k++)if(k%44<42)s+=Math.abs(g[k]-e[k]);return s/84<0.08&&Math.hypot(g[42]-e[42],g[43]-e[43])<0.1&&Math.hypot(g[86]-e[86],g[87]-e[87])<0.1})}
  if(end){const f=this.f;this.state='wait';this.gone=0;this.st('think');if(f.length>=5)this.cb(f);else this.st('ready')}}}
export async function startTracker(video,canvas,onResult){
 const fs=await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm');
 const mk=d=>GestureRecognizer.createFromOptions(fs,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',delegate:d},runningMode:'VIDEO',numHands:2});
 let rec;try{rec=await mk('GPU')}catch(e){rec=await mk('CPU')}
 video.srcObject=await navigator.mediaDevices.getUserMedia({video:{width:640,height:480,frameRate:30}});await video.play();
 canvas.width=video.videoWidth;canvas.height=video.videoHeight;const x=canvas.getContext('2d'),du=new DrawingUtils(x);let last=-1;
 const loop=()=>{if(video.currentTime!==last){last=video.currentTime;const r=rec.recognizeForVideo(video,performance.now());x.clearRect(0,0,canvas.width,canvas.height);
  (r.landmarks||[]).forEach(l=>{du.drawConnectors(l,GestureRecognizer.HAND_CONNECTIONS,{color:'#3b6cf6',lineWidth:3});du.drawLandmarks(l,{color:'#fff',radius:2})});onResult(r)}
  video.requestVideoFrameCallback?video.requestVideoFrameCallback(loop):requestAnimationFrame(loop)};loop()}
