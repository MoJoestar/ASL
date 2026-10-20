import { getStore } from '@netlify/blobs';
// The 6 team accounts. Edit the names/passwords here.
const USERS = { member1: 'dmv-1111', member2: 'dmv-2222', member3: 'dmv-3333', member4: 'dmv-4444', member5: 'dmv-5555', member6: 'dmv-6666' };
export const config = { path: '/api/*' };
export default async (req) => {
  const store = getStore({ name: 'signbridge', consistency: 'strong' });
  const url = new URL(req.url), p = url.pathname.replace('/api/', '');
  const [a, b] = (req.headers.get('x-auth') || ':').split(':');
  const authed = !!USERS[a] && USERS[a] === b;
  if (p === 'login') { const d = await req.json(); return Response.json({ ok: !!USERS[d.u] && USERS[d.u] === d.p }); }
  if (p === 'samples') {
    const { blobs } = await store.list({ prefix: 'sign:' }), signs = {};
    await Promise.all(blobs.map(async x => { signs[decodeURIComponent(x.key.slice(5))] = await store.get(x.key, { type: 'json' }); }));
    return Response.json({ signs });
  }
  if (!authed) return Response.json({ error: 'auth' }, { status: 401 });
  if (p === 'sign' && req.method === 'PUT') { const d = await req.json(); await store.setJSON('sign:' + encodeURIComponent(d.name), { type: d.type, clips: d.clips }); return Response.json({ ok: true }); }
  if (p === 'sign' && req.method === 'DELETE') { await store.delete('sign:' + encodeURIComponent(url.searchParams.get('name'))); return Response.json({ ok: true }); }
  return Response.json({ error: 'not found' }, { status: 404 });
};
