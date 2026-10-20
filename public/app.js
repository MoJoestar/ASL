const A={code:new URLSearchParams(location.search).get('code')||'',role:'',ch:null,msgs:[],onMsg:()=>{},
newCode(){const c='ABCDEFGHJKMNPQRSTUVWXYZ23456789';return Array.from({length:6},()=>c[Math.random()*c.length|0]).join('')},
join(role){this.role=role;this.ch=new BroadcastChannel('signchat-'+this.code);
 this.msgs=JSON.parse(localStorage.getItem('chat:'+this.code)||'[]');
 this.ch.onmessage=e=>{const d=e.data;
  if(d.t==='msg')this.add(d.m,true);
  else if(d.t==='sync'&&this.msgs.length)this.ch.postMessage({t:'hist',msgs:this.msgs});
  else if(d.t==='hist')d.msgs.forEach(m=>this.add(m,true));
  else if(d.t==='alive')this.last=Date.now();
  else if(d.t==='end'&&role!=='main')this.end()};
 this.ch.postMessage({t:'sync'});
 const c=document.getElementById('code');if(c)c.textContent=this.code;
 if(role==='main')setInterval(()=>this.ch.postMessage({t:'alive'}),2000);
 else{this.last=0;setInterval(()=>{if(this.last&&Date.now()-this.last>8000)this.end()},2000)}},
add(m,quiet){if(this.msgs.some(x=>x.id===m.id))return;this.msgs.push(m);this.msgs.sort((a,b)=>a.ts-b.ts);
 localStorage.setItem('chat:'+this.code,JSON.stringify(this.msgs));this.onMsg(m,quiet)},
say(from,text){const m={id:Date.now()+'-'+Math.random().toString(36).slice(2,7),from,text,ts:Date.now()};this.add(m);this.ch.postMessage({t:'msg',m})},
end(){const o=document.getElementById('over');if(o)o.style.display='flex';setTimeout(()=>window.close(),600)},
time(ts){return new Date(ts).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})},
bubble(m){const d=document.createElement('div');d.className='msg '+m.from;
 const s=document.createElement('small');s.textContent=(m.from==='customer'?'Customer':'Employee')+' · '+this.time(m.ts);
 d.append(s,document.createTextNode(m.text));return d},
render(box){box.innerHTML='';this.msgs.forEach(m=>box.append(this.bubble(m)));box.scrollTop=box.scrollHeight},
};
if(!A.code&&!location.pathname.endsWith('index.html')&&location.pathname!=='/')location.href='index.html';
