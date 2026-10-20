import {Recorder,frameVec,resample,classify,buildDB,api} from './sign.js';
const $=s=>document.querySelector(s),say=t=>$('#status').textContent=t;
const LAB={ready:'🟢 Ready',rec:'🔴 Recording…',think:'⏳ Thinking…'};let db=[],names=0;
api('samples').then(d=>{db=buildDB(d.signs||{});names=new Set(db.map(c=>c.name)).size;say(db.length?'🟢 Ready':'No signs trained yet. Use Admin to add some.')}).catch(()=>say('Could not load signs (is the site deployed with the API?)'));
const rec=new Recorder(frames=>{if(!db.length){say('No signs trained yet');return}
 const r=classify(resample(frames),db);
 if(names<2||r.conf>=0.12){window.onSignRecognized&&window.onSignRecognized(r.top[0][0]);say('✅ '+r.top[0][0]+' ('+Math.round(r.conf*100)+'%)')}else say('❓ Not sure, please sign again')},
 s=>{if(db.length)say(LAB[s])});
// thumbs up/down are reserved for confirm/undo, so they never count as part of a sign
window.onFrame=r=>{const g=r.gestures?.[0]?.[0],thumb=g&&g.score>.6&&/Thumb/.test(g.categoryName);
 rec.push(frameVec(r),!!r.landmarks?.length&&!thumb,performance.now())};
