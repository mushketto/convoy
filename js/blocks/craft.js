import { escapeHtml, copyText } from '../utils.js';
import { store } from '../store.js';

const state = { efficiency: 60, counts: { road_junk: 2, spare_part: 1, broken_engine: 0 } };

export function renderCraftBlock(container, { gdd }) {
  const { shredderInputs, recipes, blueprintTiers } = gdd;
  let totalWeight = 0;
  const out = { metal: 0, rubber: 0, copper: 0, alloy: 0 };
  for (const it of shredderInputs) {
    const q = state.counts[it.id] || 0;
    totalWeight += it.weight * q;
    for (const k of Object.keys(out)) out[k] += Math.round(it.yield[k] * q * (state.efficiency / 100));
  }
  const overloaded = totalWeight > 120;
  const saved = store.presets.filter(p => p.category === 'shredder');

  container.innerHTML = `
    <div class="block-stack">
      <section class="block">
        <div class="block-header">
          <div><div class="section-kicker">Блок 06 // Калькулятор</div><h2>Шредер, вес груза и проверка рецептов</h2></div>
          <div class="flex-gap">
            <button class="btn btn-sm btn-cyan" id="btn-copy-shredder-json">JSON для Unity</button>
            <button class="btn btn-sm btn-accent" id="btn-save-shredder-preset">Сохранить пресет</button>
          </div>
        </div>
        <div class="grid-sidebar">
          <div class="card">
            <div class="bar-label"><strong>КПД шредера</strong><span class="mono" style="color:var(--accent);">${state.efficiency}% ${state.efficiency >= 80 ? '(Ур. 2)' : '(Базовый)'}</span></div>
            <input type="range" id="shredder-eff" min="50" max="85" step="5" value="${state.efficiency}" />
            <div class="mt-2">
              ${shredderInputs.map(it => `<div class="flex-between card mb-1" style="background:var(--bg-input);padding:0.6rem 0.75rem;"><div><div class="small"><strong>${escapeHtml(it.name)}</strong></div><div class="mono" style="font-size:0.72rem;color:var(--text-muted);">${it.weight} кг · М:${it.yield.metal} Р:${it.yield.rubber} Медь:${it.yield.copper} Сплав:${it.yield.alloy}</div></div><div class="flex-gap"><button class="btn btn-sm" data-dec="${it.id}">−</button><span class="mono" style="min-width:22px;text-align:center;">${state.counts[it.id] || 0}</span><button class="btn btn-sm" data-inc="${it.id}">+</button></div></div>`).join('')}
            </div>
            <div class="flex-between mt-2"><span class="small">Вес партии: <strong class="mono">${totalWeight} кг</strong></span><span class="badge ${overloaded ? 'badge-red' : 'badge-green'}">${overloaded ? 'Перегруз Кей-кара (>120 кг)!' : 'В норме для Кей-кара'}</span></div>
          </div>
          <div class="card">
            <div class="small muted mb-1">Выход в бункер (4 int):</div>
            <div class="grid-4 mb-1">
              <div class="card" style="background:var(--bg-input);text-align:center;padding:0.6rem;"><div class="small muted">Металл</div><div class="mono" style="font-size:1.2rem;font-weight:800;">${out.metal}</div></div>
              <div class="card" style="background:var(--bg-input);text-align:center;padding:0.6rem;"><div class="small muted">Резина</div><div class="mono" style="font-size:1.2rem;font-weight:800;color:var(--cyan);">${out.rubber}</div></div>
              <div class="card" style="background:var(--bg-input);text-align:center;padding:0.6rem;"><div class="small muted">Медь</div><div class="mono" style="font-size:1.2rem;font-weight:800;color:var(--accent);">${out.copper}</div></div>
              <div class="card" style="background:var(--bg-input);text-align:center;padding:0.6rem;"><div class="small muted">Сплав</div><div class="mono" style="font-size:1.2rem;font-weight:800;color:var(--green);">${out.alloy}</div></div>
            </div>
            <div class="small muted mt-2 mb-1">Покрытие рецептов станка:</div>
            ${recipes.map(r => {
              const ok = out.metal >= r.cost.metal && out.rubber >= r.cost.rubber && out.copper >= r.cost.copper && out.alloy >= r.cost.alloy;
              return `<div class="flex-between mb-1" style="padding:0.45rem 0.65rem;border:1px solid var(--border);border-radius:8px;background:var(--bg-input);"><div><div class="small"><strong>${escapeHtml(r.name)}</strong></div><div class="mono" style="font-size:0.72rem;color:var(--text-muted);">М:${r.cost.metal} · Р:${r.cost.rubber} · Медь:${r.cost.copper} · Сплав:${r.cost.alloy} · ${r.timeSec}с</div></div><span class="badge ${ok ? 'badge-green' : 'badge-red'}">${ok ? 'Хватает' : 'Мало'}</span></div>`;
            }).join('')}
          </div>
        </div>
        ${saved.length ? `<div class="mt-2 flex-gap"><span class="small muted">Пресеты:</span>${saved.map(p => `<span class="badge badge-cyan" style="cursor:pointer;" data-load-shredder="${p.id}">${escapeHtml(p.name)}</span>`).join('')}</div>` : ''}
      </section>
      <section class="block">
        <div class="block-header"><div><div class="section-kicker">Блок 07 // Чертежи</div><h3>Тиры чертежей и обратная инженерия</h3></div><span class="badge badge-accent">Общая доска базы</span></div>
        <div class="table-wrap"><table><thead><tr><th>Тир</th><th>Открытие</th><th>Рецепты</th><th>Роль</th></tr></thead><tbody>
          ${blueprintTiers.map(b => `<tr><td><strong>${escapeHtml(b.tier)}</strong></td><td>${escapeHtml(b.how)}</td><td>${escapeHtml(b.items)}</td><td class="muted">${escapeHtml(b.purpose)}</td></tr>`).join('')}
        </tbody></table></div>
      </section>
    </div>`;

  container.querySelector('#shredder-eff')?.addEventListener('input', e => { state.efficiency = Number(e.target.value); renderCraftBlock(container, { gdd }); });
  container.querySelectorAll('[data-inc]').forEach(b => b.addEventListener('click', () => { state.counts[b.dataset.inc] = (state.counts[b.dataset.inc] || 0) + 1; renderCraftBlock(container, { gdd }); }));
  container.querySelectorAll('[data-dec]').forEach(b => b.addEventListener('click', () => { state.counts[b.dataset.dec] = Math.max(0, (state.counts[b.dataset.dec] || 0) - 1); renderCraftBlock(container, { gdd }); }));
  container.querySelector('#btn-copy-shredder-json')?.addEventListener('click', () => copyText(JSON.stringify({ shredderEfficiency: state.efficiency / 100, sampleBatch: state.counts, computedOutput: out, totalWeightKg: totalWeight }, null, 2), 'JSON шредера скопирован'));
  container.querySelector('#btn-save-shredder-preset')?.addEventListener('click', () => { const n = prompt('Название пресета:', `Партия ${totalWeight}кг @ ${state.efficiency}%`); if (n) store.addPreset('shredder', n, { efficiency: state.efficiency, counts: { ...state.counts } }); });
  container.querySelectorAll('[data-load-shredder]').forEach(el => el.addEventListener('click', () => { const p = store.presets.find(x => x.id === el.dataset.loadShredder); if (p?.payload) { state.efficiency = p.payload.efficiency ?? 60; state.counts = { ...p.payload.counts }; renderCraftBlock(container, { gdd }); } }));
}
