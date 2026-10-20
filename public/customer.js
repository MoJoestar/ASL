import {GestureRecognizer,FilesetResolver,DrawingUtils} from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/vision_bundle.mjs';
const $=s=>document.querySelector(s),box=$('#chat');let toks=[],edited=false;
const STARTERS=['Hello','Thank you','Yes','No','Please repeat','I do not understand','Can you help me?','I need to renew my license','I need a new ID card','Where is the window?','How much does it cost?','I have my documents','Where is the bathroom?','How long will it take?','Do I need an appointment?','I want to pay the fee','Please speak slowly','I want to change my address','I lost my license','I need a copy of this form'];
const FOLLOW=[[/\?$/,['Yes','No','I do not understand','Please repeat']],[/id|license|document|passport/i,['Here is my ID','I do not have it with me','Where do I get it?']],[/fee|pay|cost|price/i,['How much is it?','I will pay now','Can I pay by card?']],[/wait|window|go to/i,['Thank you','Which window?','How long?']]];
A.onMsg=(m,q)=>{A.render(box);if(m.from==='employee'){if(!q){box.classList.add('flash');setTimeout(()=>box.classList.remove('flash'),800)}suggest()}};
A.join('customer');A.render(box);
function sentence(){if(!toks.length)return'';let s=toks.join(' ').replace(/\bi\b/g,'I').replace(/^me\b/i,'I');s=s[0].toUpperCase()+s.slice(1);return /[.?!]$/.test(s)?s:(/^(what|where|when|who|why|how|which|can|do|does|is|are)\b/i.test(s)?s+'?':s+'.')}
function draw(){const t=$('#toks');t.innerHTML='';toks.forEach((w,i)=>{const c=document.createElement('span');c.className='chip tok';c.textContent=w;const x=document.createElement('b');x.textContent='✕';x.title='Delete this word';x.onclick=()=>{toks.splice(i,1);edited=false;draw()};c.append(x);t.append(c)});
 if(!edited)$('#prev').value=sentence();suggest()}
function suggest(){const s=$('#sug');s.innerHTML='';const cur=toks.join(' ').toLowerCase();let list=[];
 if(cur)list=STARTERS.filter(p=>p.toLowerCase().startsWith(cur)&&p.toLowerCase()!==cur);
 else{const last=[...A.msgs].reverse().find(m=>m.from==='employee');if(last)FOLLOW.forEach(([r,a])=>{if(r.test(last.text))list.push(...a)});list.push(...STARTERS)}
 [...new Set(list)].slice(0,6).forEach(p=>{const c=document.createElement('span');c.className='chip';c.textContent=p;c.onclick=()=>{toks=p.split(' ');edited=false;$('#prev').value=p;draw()};s.append(c)})}
window.onSignRecognized=w=>{toks.push(w);edited=false;draw()};
$('#prev').oninput=()=>{edited=true};
$('#undo').onclick=()=>{toks.pop();edited=false;draw()};
$('#clear').onclick=()=>{toks=[];edited=false;$('#prev').value='';draw()};
$('#nope').onclick=()=>{toks.pop();edited=false;draw();$('#status').textContent='Please sign it again'};
function confirm(){const t=$('#prev').value.trim();if(!t)return;A.say('customer',t);toks=[];edited=false;$('#prev').value='';draw()}
$('#ok').onclick=confirm;
$('#typed').addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.value.trim()){e.target.value.trim().split(/\s+/).forEach(w=>toks.push(w));e.target.value='';edited=false;draw()}});
draw();
let rec,hold={g:'',t0:0,cool:0},last=-1;
async function start(){try{
 const fs=await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm');
 const mk=d=>GestureRecognizer.createFromOptions(fs,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',delegate:d},runningMode:'VIDEO',numHands:2});
 try{rec=await mk('GPU')}catch(e){rec=await mk('CPU')}
 const v=$('#v');v.srcObject=await navigator.mediaDevices.getUserMedia({video:{width:640,height:480,frameRate:30}});await v.play();
 const c=$('#c'),x=c.getContext('2d'),du=new DrawingUtils(x);c.width=v.videoWidth;c.height=v.videoHeight;$('#status').textContent='🟢 Ready';
 const loop=()=>{if(v.currentTime!==last){last=v.currentTime;const r=rec.recognizeForVideo(v,performance.now());x.clearRect(0,0,c.width,c.height);
  (r.landmarks||[]).forEach(l=>{du.drawConnectors(l,GestureRecognizer.HAND_CONNECTIONS,{color:'#3b6cf6',lineWidth:3});du.drawLandmarks(l,{color:'#fff',radius:2})});
  gesture(r.gestures&&r.gestures[0]&&r.gestures[0][0]);window.onFrame&&window.onFrame(r)}
  v.requestVideoFrameCallback?v.requestVideoFrameCallback(loop):requestAnimationFrame(loop)};loop()
}catch(e){$('#status').textContent='Camera/model error: '+e.message}}
function gesture(g){const n=performance.now(),name=g&&g.score>0.6?g.categoryName:'';const ring=$('#ring');
 if(!$('#gest').checked||n<hold.cool||!(name==='Thumb_Up'||name==='Thumb_Down')){hold.g='';ring.style.width='0';return}
 if(name!==hold.g){hold.g=name;hold.t0=n}const need=name==='Thumb_Up'?1500:1000,p=Math.min(1,(n-hold.t0)/need);ring.style.width=p*100+'%';
 ring.style.background=name==='Thumb_Up'?'var(--ok)':'var(--bad)';
 if(p>=1){hold.cool=n+1800;hold.g='';ring.style.width='0';name==='Thumb_Up'?confirm():$('#undo').click()}}
start();
