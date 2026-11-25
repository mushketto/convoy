import { ROUTES } from './config.js';
import { store } from './store.js';
import { downloadFile, buildMarkdownRoadmap } from './utils.js';
import { initModals } from './modals.js';
import { renderOverviewBlock } from './blocks/overview.js';
import { renderVehiclesBlock } from './blocks/vehicles.js';
import { renderCraftBlock } from './blocks/craft.js';
import { renderAnomaliesBlock } from './blocks/anomalies.js';
import { renderStoryBlock } from './blocks/story.js';
import { renderRoadmapBlock } from './blocks/roadmap.js';

const RENDERERS = {
  overview: renderOverviewBlock, vehicles: renderVehiclesBlock, craft: renderCraftBlock,
  anomalies: renderAnomaliesBlock, story: renderStoryBlock, roadmap: renderRoadmapBlock
};
let appData = { gdd: null, roadmap: null };
let currentRoute = 'overview';

const getRoute = () => { const r = (window.location.hash || '#overview').replace('#', '').trim(); return RENDERERS[r] ? r : 'overview'; };

function navigateTo(routeId) {
  if (!RENDERERS[routeId]) return;
  currentRoute = routeId;
  if (window.location.hash !== `#${routeId}`) window.location.hash = `#${routeId}`;
  renderNav(); renderCurrentBlock();
}

function renderNav() {
  const nav = document.getElementById('nav-tabs');
  nav.innerHTML = ROUTES.map(r => `<button class="nav-tab ${r.id === currentRoute ? 'active' : ''}" data-route="${r.id}">${r.label}</button>`).join('');
  nav.querySelectorAll('[data-route]').forEach(b => b.addEventListener('click', () => navigateTo(b.dataset.route)));
}

function renderStatusBadge() {
  const btn = document.getElementById('btn-open-supabase'); if (!btn) return;
  const info = { online: ['online', `Supabase: ${store.config.workspaceId}`], local: ['local', 'БД: LocalStorage'], error: ['error', 'Supabase: Ошибка'] }[store.status] || ['local', 'БД: LocalStorage'];
  btn.innerHTML = `<span class="dot ${info[0]}"></span> ${info[1]}`;
}

function renderCurrentBlock() {
  const root = document.getElementById('app-root');
  if (root && appData.gdd && appData.roadmap) RENDERERS[currentRoute](root, appData);
}

async function bootstrap() {
  try {
    const [gRes, rRes] = await Promise.all([fetch('./data/gdd-data.json'), fetch('./data/roadmap-data.json')]);
    appData.gdd = await gRes.json(); appData.roadmap = await rRes.json();
  } catch (err) {
    document.getElementById('app-root').innerHTML = `<div class="block"><h3>Запустите через HTTP-сервер</h3><p class="muted">Браузер блокирует <code>fetch()</code> для JSON через <code>file://</code>. Используйте GitHub Pages, Live Server или <code>python -m http.server 8080</code>.</p></div>`;
    return;
  }

  store.applySnapshotFromUrl();
  store.subscribe((_s, reason) => {
    renderStatusBadge();
    if (reason === 'note-local') return;
    if (document.activeElement && document.activeElement.matches('[data-note-input]')) return;
    if (['roadmap', 'craft', 'anomalies'].includes(currentRoute)) renderCurrentBlock();
  });

  initModals({ getData: () => appData, navigateTo });
  document.getElementById('btn-dl-rules')?.addEventListener('click', () => downloadFile('.cursorrules', appData.roadmap.cursorrules));
  document.getElementById('btn-dl-roadmap')?.addEventListener('click', () => downloadFile('ai_development_roadmap.md', buildMarkdownRoadmap(appData.roadmap, store.tasks), 'text/markdown;charset=utf-8'));
  window.addEventListener('hashchange', () => { currentRoute = getRoute(); renderNav(); renderCurrentBlock(); });

  currentRoute = getRoute(); renderNav(); renderStatusBadge(); renderCurrentBlock();
  store.initSupabase();
}
bootstrap();
