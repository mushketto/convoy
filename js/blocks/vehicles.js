import { escapeHtml, statColor } from '../utils.js';
let activeSubTab = 'trailers';

const miniStat = (l, v) => `<div><div class="bar-label" style="font-size:0.74rem;"><span class="muted">${l}</span><span class="mono">${v}</span></div><div class="bar-track" style="height:6px;"><div class="bar-fill" style="width:${v}%;background:${statColor(v)};"></div></div></div>`;

export function renderVehiclesBlock(container, { gdd }) {
  const content = activeSubTab === 'trailers'
    ? `<div class="grid-2">${gdd.trailers.map(t => `<div class="card"><div class="flex-between mb-1"><h4>${escapeHtml(t.name)}</h4><span class="badge badge-accent">${escapeHtml(t.tag)}</span></div><div class="flex-gap mb-1"><span class="badge">Масса: ${escapeHtml(t.mass)}</span><span class="badge badge-cyan">Проходимость: ${escapeHtml(t.mobility)}</span></div><div class="small mono muted mb-1">Large_Station=${t.slots.Large_Station} | Medium_Rack=${t.slots.Medium_Rack} | Vehicle_Dock=${t.slots.Vehicle_Dock}</div><p class="small"><strong>Плюсы:</strong> ${escapeHtml(t.pros)}</p><p class="small muted"><strong>Компромисс:</strong> ${escapeHtml(t.cons)}</p><div class="small" style="color:var(--green);"><strong>Где найти:</strong> ${escapeHtml(t.obtain)}</div></div>`).join('')}</div>`
    : `<div class="grid-2">${gdd.chassis.map(c => `<div class="card"><div class="flex-between mb-1"><h4>${escapeHtml(c.name)}</h4><span class="badge badge-cyan">${escapeHtml(c.tag)}</span></div><div class="small muted mb-1">${escapeHtml(c.where)} · Лимит груза: <strong>${c.cargoMaxKg} кг</strong></div><div class="grid-2 mt-1 mb-1">${miniStat('Проходимость', c.stats.pass)}${miniStat('Устойчивость', c.stats.stab)}${miniStat('Охлаждение', c.stats.cool)}${miniStat('Стойкость ЭМИ', c.stats.emp)}</div><p class="small"><strong>Сильные стороны:</strong> ${escapeHtml(c.pros)}</p><p class="small muted"><strong>Ограничения:</strong> ${escapeHtml(c.cons)}</p></div>`).join('')}</div>`;

  container.innerHTML = `
    <div class="block-stack">
      <section class="block">
        <div class="block-header">
          <div><div class="section-kicker">Блок 04 // База и автопарк</div><h2>Техника, прицепы и кузова</h2></div>
          <div class="pill-group">
            <button class="pill ${activeSubTab === 'trailers' ? 'active' : ''}" data-vtab="trailers">Прицепы базы (4)</button>
            <button class="pill ${activeSubTab === 'chassis' ? 'active' : ''}" data-vtab="chassis">Кузова разведчиков (4)</button>
          </div>
        </div>${content}
      </section>
      <section class="block">
        <div class="block-header">
          <div><div class="section-kicker">Блок 05 // Тактильный переезд</div><h3>Перенос модулей между прицепами (BaseModule → InteriorSlot)</h3></div>
          <span class="badge badge-green">Без потери лута</span>
        </div>
        <div class="grid-2">${gdd.migrationSteps.map((s, i) => `<div class="card"><div class="mono small" style="color:var(--accent);">ШАГ 0${i + 1}</div><div class="small mt-1">${escapeHtml(s)}</div></div>`).join('')}</div>
      </section>
    </div>`;
  container.querySelectorAll('[data-vtab]').forEach(b => b.addEventListener('click', () => { activeSubTab = b.dataset.vtab; renderVehiclesBlock(container, { gdd }); }));
}
