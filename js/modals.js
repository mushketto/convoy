import { store } from './store.js';
import { escapeHtml, copyText, downloadFile, showToast } from './utils.js';

let sqlCache = '';
async function loadSql() {
  if (sqlCache) return sqlCache;
  try { sqlCache = await (await fetch('./supabase/schema.sql')).text(); }
  catch { sqlCache = '-- Откройте supabase/schema.sql'; }
  return sqlCache;
}

export function initModals({ getData, navigateTo }) {
  const sbModal = document.getElementById('modal-supabase');
  const searchModal = document.getElementById('modal-search');
  const searchInput = document.getElementById('global-search-input');
  const searchResults = document.getElementById('global-search-results');

  document.getElementById('btn-open-supabase')?.addEventListener('click', async () => {
    const c = store.config;
    document.getElementById('sb-url').value = c.url;
    document.getElementById('sb-key').value = c.anonKey;
    document.getElementById('sb-ws').value = c.workspaceId;
    document.getElementById('sb-callsign').value = c.callsign;
    document.getElementById('sb-sql-preview').textContent = await loadSql();
    sbModal.classList.add('open');
  });

  document.getElementById('btn-save-supabase')?.addEventListener('click', async () => {
    const ok = await store.saveConfig({
      url: document.getElementById('sb-url').value.trim(),
      anonKey: document.getElementById('sb-key').value.trim(),
      workspaceId: document.getElementById('sb-ws').value.trim() || 'expedition-2-main',
      callsign: document.getElementById('sb-callsign').value.trim() || 'Engineer'
    });
    showToast(ok ? 'Supabase подключён (Realtime)' : 'Локальный режим (LocalStorage)');
    sbModal.classList.remove('open');
  });

  document.getElementById('btn-push-cloud')?.addEventListener('click', () => store.pushAllLocalToCloud());
  document.getElementById('btn-copy-sql')?.addEventListener('click', async () => copyText(await loadSql(), 'SQL скопирован'));
  document.getElementById('btn-export-backup')?.addEventListener('click', () => downloadFile('expedition2_backup.json', store.exportBackupJson(), 'application/json'));
  document.getElementById('input-import-backup')?.addEventListener('change', async e => {
    const f = e.target.files?.[0]; if (!f) return;
    try { store.importBackupJson(await f.text()); } catch { showToast('Неверный JSON-бэкап'); }
    e.target.value = '';
  });

  document.querySelectorAll('[data-close-modal]').forEach(b => b.addEventListener('click', () => { sbModal.classList.remove('open'); searchModal.classList.remove('open'); }));
  [sbModal, searchModal].forEach(m => m?.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); }));

  function openSearch() { searchModal.classList.add('open'); searchInput.value = ''; renderSearch(''); setTimeout(() => searchInput.focus(), 30); }
  document.getElementById('btn-open-search')?.addEventListener('click', openSearch);
  window.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openSearch(); }
    else if (e.key === 'Escape') { sbModal.classList.remove('open'); searchModal.classList.remove('open'); }
  });
  searchInput?.addEventListener('input', e => renderSearch(e.target.value));

  function renderSearch(query) {
    const { gdd, roadmap } = getData(); if (!gdd || !roadmap) return;
    const q = query.trim().toLowerCase();
    const index = [
      ...gdd.trailers.map(t => ({ title: t.name, sub: `Прицеп · ${t.mass}`, route: 'vehicles' })),
      ...gdd.chassis.map(c => ({ title: c.name, sub: `Кузов · ${c.where}`, route: 'vehicles' })),
      ...gdd.recipes.map(r => ({ title: r.name, sub: `Рецепт (${r.tier})`, route: 'craft' })),
      ...gdd.anomalies.map(a => ({ title: a.name, sub: `Аномалия · ${a.effect}`, route: 'anomalies' })),
      ...gdd.storyActs.map(s => ({ title: `${s.act}: ${s.name}`, sub: s.biome, route: 'story' })),
      ...roadmap.phases.flatMap(p => p.tasks.map(t => ({ title: `${t.id} ${t.title}`, sub: `${p.code} · ${t.files.join(', ')}`, route: 'roadmap' }))),
      ...roadmap.unityTree.map(s => ({ title: s.path.split('/').pop(), sub: `C# (${s.layer}) · ${s.contract}`, route: 'roadmap' }))
    ];
    const list = q ? index.filter(i => i.title.toLowerCase().includes(q) || i.sub.toLowerCase().includes(q)).slice(0, 14) : index.slice(0, 8);
    searchResults.innerHTML = list.length ? list.map(m => `
      <div class="search-result" data-goto="${m.route}">
        <div><div class="small"><strong>${escapeHtml(m.title)}</strong></div><div class="small muted">${escapeHtml(m.sub)}</div></div>
        <span class="badge">${m.route}</span>
      </div>`).join('') : `<div class="muted small">Ничего не найдено.</div>`;
    searchResults.querySelectorAll('[data-goto]').forEach(el => el.addEventListener('click', () => { navigateTo(el.dataset.goto); searchModal.classList.remove('open'); }));
  }
}
