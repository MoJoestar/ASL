import {startTracker,Recorder,frameVec,resample,classify,buildDB,round,api} from './sign.js';
const $=s=>document.querySelector(s);let auth='',signs={},cur='',mode='rec';
const H=()=>({'x-auth':auth,'content-type':'application/json'}),msg=t=>$('#msg').textContent=t;
const save=async n=>{msg('Saving…');const s=signs[n];const r=await api('sign',{method:'PUT',headers:H(),body:JSON.stringify({name:n,type:s.type,clips:s.clips})}).catch(()=>({}));msg(r.ok?'✅ Saved to server':'❌ Save failed')};
$('#go').onclick=async()=>{const u=$('#u').value.trim(),p=$('#p').value;
 const r=await api('login',{method:'POST',body:JSON.stringify({u,p})}).catch(()=>null);
 if(!r){$('#err').textContent='Server error: the API is not running (deploy on Netlify first)';return}
 if(!r.ok){$('#err').textContent='Wrong username or password';return}
 auth=u+':'+p;$('#login').style.display='none';$('#app').style.display='';$('#who').textContent=u;init()};
$('#p').addEventListener('keydown',e=>{if(e.key==='Enter')$('#go').click()});
document.querySelectorAll('[name=m]').forEach(r=>r.onchange=()=>{mode=r.value;$('#res').textContent=''});
function render(){const l=$('#list');l.innerHTML='';let tot=0;
 Object.entries(signs).forEach(([n,s])=>{tot+=s.clips.length;const d=document.createElement('div');d.className='card';d.style.cssText='padding:10px;margin-bottom:8px'+(n===cur?';border-color:var(--pri)':'');
  d.innerHTML=`<div class="row"><b class="grow">${n} <span class="mut">(${s.type}) · ${s.clips.length} clips</span></b></div>`;
  const r=d.firstChild;const b=(t,f,c)=>{const x=document.createElement('button');x.textContent=t;x.className=c||'ghost';x.onclick=f;r.append(x)};
  b(n===cur?'Selected':'Select',()=>{cur=n;render()},n===cur?'ok':'ghost');
  b('Undo last clip',async()=>{s.clips.pop();render();await save(n)});
  b('Delete sign',async()=>{if(!confirm('Delete "'+n+'" and all its clips?'))return;delete signs[n];if(cur===n)cur='';render();await api('sign?name='+encodeURIComponent(n),{method:'DELETE',headers:H()});msg('Deleted')},'bad');
  l.append(d)});
 $('#tot').textContent='· '+tot+' clips total';if(!Object.keys(signs).length)l.innerHTML='<p class="mut">No signs yet. Add one above.</p>'}
$('#add').onclick=async()=>{const n=$('#nm').value.trim().toLowerCase();if(!n)return;if(!signs[n])signs[n]={type:$('#tp').value,clips:[]};cur=n;$('#nm').value='';render();await save(n)};
async function init(){signs=(await api('samples').catch(()=>({}))).signs||{};render();
 const say=t=>$('#status').textContent=t,L={ready:'🟢 Ready',rec:'🔴 Recording…',think:'⏳ Saving…'};
 const rec=new Recorder(frames=>{const v=resample(frames);
  if(mode==='test'){const db=buildDB(signs);if(!db.length){$('#res').textContent='No clips yet';return}const r=classify(v,db);
   $('#res').innerHTML=r.top.map(([n,d],i)=>`${i?'':'<b>'}${n}${i?'':'</b>'} <span class="mut">(distance ${d.toFixed(1)})</span>`).join('<br>')+`<br><span class="mut">confidence ${Math.round(r.conf*100)}%</span>`;return}
  if(!cur){$('#res').textContent='⚠ Select or add a sign first';return}
  signs[cur].clips.push(round(v));render();save(cur);$('#res').textContent='Clip '+signs[cur].clips.length+' saved for "'+cur+'"'},s=>say(L[s]));
 try{await startTracker($('#v'),$('#c'),r=>rec.push(frameVec(r),!!r.landmarks?.length,performance.now()));say('🟢 Ready')}catch(e){say('Camera/model error: '+e.message)}}
$('#exp').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({signs})]));a.download='signbridge-samples.json';a.click()};
$('#imp').onclick=()=>$('#file').click();
$('#file').onchange=async e=>{try{const d=JSON.parse(await e.target.files[0].text());let k=0;for(const[n,s]of Object.entries(d.signs||{})){signs[n]=s;await save(n);k++}render();msg('✅ Imported '+k+' signs')}catch(x){msg('❌ Import failed: '+x.message)}};
