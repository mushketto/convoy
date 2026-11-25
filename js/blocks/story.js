import { escapeHtml } from '../utils.js';
let activeActId = 'act1';

export function renderStoryBlock(container, { gdd }) {
  const { storyActs, goalLayers } = gdd;
  const act = storyActs.find(a => a.id === activeActId) || storyActs[0];
  container.innerHTML = `
    <div class="block-stack">
      <section class="block">
        <div class="block-header">
          <div><div class="section-kicker">Блок 10 // Сюжет</div><h2>След Конвоя №1 ↔ Климатическая сеть</h2></div>
          <span class="badge badge-accent">Рация и аудиокассеты</span>
        </div>
        <div class="grid-4">${storyActs.map(a => `<div class="card clickable ${a.id === act.id ? 'active' : ''}" data-act="${a.id}"><div class="mono small" style="color:var(--accent);">${escapeHtml(a.act)}</div><strong style="display:block;margin:0.25rem 0;">${escapeHtml(a.name)}</strong><div class="small muted">${escapeHtml(a.biome)}</div></div>`).join('')}</div>
        <div class="card mt-2" style="border-color:var(--accent-border);">
          <div class="flex-between mb-1"><h3>${escapeHtml(act.act)}: ${escapeHtml(act.name)}</h3><span class="badge badge-cyan">${escapeHtml(act.biome)}</span></div>
          <div class="quote-box">${escapeHtml(act.tape)}</div>
          <div class="grid-2 mt-1">
            <div class="card" style="background:var(--bg-input);"><div class="small" style="color:var(--accent);font-weight:600;">След Конвоя №1</div><div class="small mt-1">${escapeHtml(act.convoyClue)}</div></div>
            <div class="card" style="background:var(--bg-input);"><div class="small" style="color:var(--cyan);font-weight:600;">Задача сети</div><div class="small mt-1">${escapeHtml(act.towerGoal)}</div></div>
            <div class="card" style="background:var(--bg-input);"><div class="small" style="color:var(--green);font-weight:600;">Изменение мира</div><div class="small mt-1">${escapeHtml(act.worldChange)}</div></div>
            <div class="card" style="background:var(--bg-input);"><div class="small" style="font-weight:600;">Награда</div><div class="small mt-1">${escapeHtml(act.reward)}</div></div>
          </div>
        </div>
      </section>
      <section class="block">
        <div class="block-header"><div><div class="section-kicker">Блок 11 // QuestManager</div><h3>Три уровня целей</h3></div></div>
        <div class="grid-3">${goalLayers.map(g => `<div class="card"><strong style="color:var(--accent);">${escapeHtml(g.layer)}</strong><p class="small muted mt-1">${escapeHtml(g.desc)}</p></div>`).join('')}</div>
      </section>
    </div>`;
  container.querySelectorAll('[data-act]').forEach(el => el.addEventListener('click', () => { activeActId = el.dataset.act; renderStoryBlock(container, { gdd }); }));
}
