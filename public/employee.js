const $=s=>document.querySelector(s),box=$('#chat'),txt=$('#txt');
A.onMsg=(m,q)=>{A.render(box);if(m.from==='customer'&&!q)document.body.classList.add('flash'),setTimeout(()=>document.body.classList.remove('flash'),800)};
A.join('employee');A.render(box);
['Hello, how can I help you?','Please wait a moment.','Please show your ID.','Which service do you need?','Please go to window 2.','The fee is paid at the cashier.','Do you understand?','Thank you, have a good day.'].forEach(p=>{const c=document.createElement('span');c.className='chip';c.textContent=p;c.onclick=()=>{txt.value=(txt.value+' '+p).trim();txt.focus()};$('#quick').append(c)});
function send(){const t=txt.value.trim();if(!t)return;A.say('employee',t);txt.value=''}
$('#send').onclick=send;$('#clr').onclick=()=>{txt.value=''};
txt.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}});
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;let rec,on=false,base='';
if(!SR){$('#mic').disabled=true;$('#st').textContent='Speech input needs Chrome or Edge'}
else $('#mic').onclick=()=>{if(on){rec.stop();return}
 rec=new SR();rec.lang='en-US';rec.continuous=true;rec.interimResults=true;base=txt.value?txt.value.trim()+' ':'';
 rec.onresult=e=>{let f='',i='';for(let k=0;k<e.results.length;k++)(e.results[k].isFinal?f+=e.results[k][0].transcript:i+=e.results[k][0].transcript);txt.value=(base+f+i).trim()};
 rec.onstart=()=>{on=true;$('#mic').textContent='⏹ Stop';$('#st').textContent='Listening…'};
 rec.onend=()=>{on=false;$('#mic').textContent='🎤 Speak';$('#st').textContent=''};
 rec.onerror=e=>{$('#st').textContent='Mic error: '+e.error};rec.start()};
