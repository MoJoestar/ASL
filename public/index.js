const $ = s => document.querySelector(s);
let wins = {};

function pos() {
  const w = screen.availWidth, h = screen.availHeight;
  const l = screen.availLeft || 0, t = screen.availTop || 0, hw = w >> 1;
  return {
    customer: [l, t, hw, h],
    employee: [l + hw, t, w - hw, h >> 1],
    shared: [l + hw, t + (h >> 1), w - hw, h - (h >> 1)]
  };
}

function openRole(r) {
  const [l, t, w, h] = pos()[r];
  const x = window.open(
    `${r}.html?code=${A.code}`,
    `sb-${r}-${A.code}`,
    `popup=yes,left=${l},top=${t},width=${w},height=${h}`
  );
  if (x) wins[r] = x;
  return x;
}

function activate(code, fresh) {
  A.code = code;
  A.join('main');
  sessionStorage.setItem('mainCode', code);
  $('#code').style.display = '';
  $('#ac').textContent = code;
  $('#active').style.display = '';
  $('#start').style.display = 'none';

  if (fresh) {
    const r = JSON.parse(localStorage.getItem('recent') || '[]').filter(c => c !== code);
    r.unshift(code);
    localStorage.setItem('recent', JSON.stringify(r.slice(0, 8)));
    const ok = ['customer', 'employee', 'shared'].map(openRole).every(Boolean);
    if (!ok) alert('Pop-ups were blocked. Allow them for this site or use the three buttons.');
  }
}

$('#create').onclick = () => activate(A.newCode(), true);

$('#join').onclick = () => {
  const c = $('#joinCode').value.trim().toUpperCase();
  if (c.length === 6) {
    A.code = c;
    activate(c, false);
  }
};

document.querySelectorAll('[data-open]').forEach(b => b.onclick = () => openRole(b.dataset.open));

$('#end').onclick = () => {
  A.ch.postMessage({ t: 'end' });
  Object.values(wins).forEach(w => {
    try { w.close(); } catch (e) {}
  });
  sessionStorage.removeItem('mainCode');
  location.reload();
};

const m = sessionStorage.getItem('mainCode');
if (m) activate(m, false);

JSON.parse(localStorage.getItem('recent') || '[]').forEach(c => {
  const s = document.createElement('span');
  s.className = 'chip';
  s.textContent = c;
  s.onclick = () => { $('#joinCode').value = c; };
  $('#recent').append(s);
});

async function test(c, txt) {
  try {
    const s = await navigator.mediaDevices.getUserMedia(c);
    s.getTracks().forEach(t => t.stop());
    $('#chk').textContent = '✅ ' + txt + ' works';
  } catch (e) {
    $('#chk').textContent = '❌ ' + txt + ': ' + e.name;
  }
}

$('#tcam').onclick = () => test({ video: true }, 'Camera');
$('#tmic').onclick = () => test({ audio: true }, 'Microphone');
