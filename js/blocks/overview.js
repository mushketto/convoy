import { escapeHtml } from '../utils.js';
let activeStepId = 'drive';

export function renderOverviewBlock(container, { gdd }) {
  const { project, coreLoop, coopRoles } = gdd;
  const activeStep = coreLoop.find(s => s.id === activeStepId) || coreLoop[0];
  container.innerHTML = `
    <div class="block-stack">
      <section class="block">
        <div class="block-header">
          <div><div class="section-kicker">Блок 01 // Концепция</div><h2>${escapeHtml(project.title)}</h2></div>
          <div class="flex-gap">${project.references.map(r => `<span class="badge badge-accent">${escapeHtml(r)}</span>`).join('')}</div>
        </div>
        <p>${escapeHtml(project.pitch)}</p>
        <div class="grid-3 mt-2">
          <div class="card"><div class="small muted">Жанр</div><strong>${escapeHtml(project.genre)}</strong></div>
          <div class="card"><div class="small muted">Мультиплеер</div><strong>${escapeHtml(project.players)}</strong></div>
          <div class="card"><div class="small muted">Стек</div><strong>${escapeHtml(project.engine)}</strong></div>
        </div>
      </section>
      <section class="block">
        <div class="block-header">
          <div><div class="section-kicker">Блок 02 // Core Loop</div><h3>Интерактивный игровой цикл</h3></div>
          <span class="badge badge-cyan">Кликните по этапу</span>
        </div>
        <div class="grid-4" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr));">
          ${coreLoop.map(s => `<div class="card clickable ${s.id === activeStep.id ? 'active' : ''}" data-step="${s.id}"><div class="mono small" style="color:var(--accent);">ШАГ ${s.step}</div><strong style="display:block;margin:0.25rem 0;">${escapeHtml(s.title)}</strong><div class="small muted">${escapeHtml(s.short)}</div></div>`).join('')}
        </div>
        <div class="card mt-2" style="border-color:var(--accent-border);">
          <div class="flex-between mb-1"><h4>${activeStep.step}. ${escapeHtml(activeStep.title)}</h4><span class="badge badge-accent">Активный этап</span></div>
          <p>${escapeHtml(activeStep.desc)}</p>
          <div class="grid-2 mt-1">
            <div class="card" style="background:var(--bg-input);"><div class="small" style="color:var(--cyan);font-weight:600;">Кооп</div><div class="small mt-1">${escapeHtml(activeStep.coop)}</div></div>
            <div class="card" style="background:var(--bg-input);"><div class="small" style="color:var(--green);font-weight:600;">Unity</div><div class="small mono mt-1">${escapeHtml(activeStep.unity)}</div></div>
          </div>
        </div>
      </section>
      <section class="block">
        <div class="block-header"><div><div class="section-kicker">Блок 03 // Колонна</div><h3>Роли в кооперативе (2–4 игрока)</h3></div></div>
        <div class="grid-2">${coopRoles.map(r => `<div class="card"><div class="flex-between mb-1"><strong>${escapeHtml(r.role)}</strong><span class="badge">${escapeHtml(r.vehicle)}</span></div><div class="small muted">${escapeHtml(r.tasks)}</div></div>`).join('')}</div>
      </section>
    </div>`;
  container.querySelectorAll('[data-step]').forEach(el => el.addEventListener('click', () => { activeStepId = el.dataset.step; renderOverviewBlock(container, { gdd }); }));
}
