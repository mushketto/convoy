import { escapeHtml, clamp, statColor, copyText } from '../utils.js';
import { store } from '../store.js';

const sim = { chassisId: 'suv', weatherId: 'mud', suspension: 55, armorWeight: 40, mechanical: false };
const metricBar = (l, v) => `<div class="bar-row"><div class="bar-label"><span>${l}</span><strong class="mono">${v} / 100</strong></div><div class="bar-track"><div class="bar-fill" style="width:${v}%;background:${statColor(v)};"></div></div></div>`;

export function renderAnomaliesBlock(container, { gdd }) {
  const ch = gdd.chassis.find(c => c.id === sim.chassisId) || gdd.chassis[0];
  const w = gdd.anomalies.find(a => a.id === sim.weatherId) || gdd.anomalies[0];

  const pass = Math.round(clamp(ch.stats.pass + w.mods.pass + (sim.suspension - 50) * 0.45 - (sim.armorWeight - 35) * 0.25 + (sim.weatherId === 'mud' ? (sim.suspension - 50) * 0.25 : 0), 5, 100));
  const stab = Math.round(clamp(ch.stats.stab + w.mods.stab - (sim.suspension - 50) * 0.30 + (sim.armorWeight - 35) * 0.40 + (sim.weatherId === 'lowg' ? (sim.armorWeight - 35) * 0.35 : 0), 5, 100));
  const cool = Math.round(clamp(ch.stats.cool + w.mods.cool - (sim.armorWeight - 35) * 0.30 + (sim.mechanical ? 10 : -5), 5, 100));
  const emp  = Math.round(clamp(ch.stats.emp + w.mods.emp + (sim.mechanical ? 42 : -10) - (sim.weatherId === 'emp' && sim.armorWeight < 20 ? 5 : 0), 5, 100));

  const minStat = Math.min(pass, stab, cool, emp);
  let verdict = 'Сборка уверенно готова к вылазке.', vCls = 'badge-green';
  if (minStat < 35) {
    vCls = 'badge-red';
    verdict = emp === minStat ? 'Риск остановки в ЭМИ: нужен карбюратор или медная сетка.'
      : pass === minStat ? 'Машина увязнет: увеличьте клиренс или возьмите пикап.'
      : stab === minStat ? 'Риск опрокидывания/срыва ветром: добавьте балласт или опустите подвеску.'
      : 'Мотор закипит: снимите лишнюю броню или ставьте двойной радиатор.';
  } else if (minStat < 65) { vCls = 'badge-accent'; verdict = 'Рабочий компромисс — берите лебёдку и ремкомплект.'; }

  const saved = store.presets.filter(p => p.category === 'anomaly');

  container.innerHTML = `
    <div class="block-stack">
      <section class="block">
        <div class="block-header">
          <div><div class="section-kicker">Блок 08 // Симулятор</div><h2>Балансировщик кузова против аномалии</h2></div>
          <div class="flex-gap">
            <button class="btn btn-sm btn-cyan" id="btn-copy-anom-json">JSON для Unity</button>
            <button class="btn btn-sm btn-accent" id="btn-save-anom-preset">Сохранить билд</button>
          </div>
        </div>
        <div class="grid-sidebar">
          <div class="card">
            <div class="small muted mb-1">1. Кузов:</div>
            <div class="pill-group mb-1">${gdd.chassis.map(c => `<button class="pill ${c.id === sim.chassisId ? 'active' : ''}" data-chassis="${c.id}">${escapeHtml(c.name)}</button>`).join('')}</div>
            <div class="small muted mt-2 mb-1">2. Погодная аномалия:</div>
            <div class="pill-group mb-1">${gdd.anomalies.map(a => `<button class="pill ${a.id === sim.weatherId ? 'active' : ''}" data-weather="${a.id}">${escapeHtml(a.name)}</button>`).join('')}</div>
            <div class="mt-2"><div class="bar-label"><span class="small">Клиренс / Подвеска</span><span class="mono">${sim.suspension}%</span></div><input type="range" id="sim-susp" min="0" max="100" value="${sim.suspension}" /></div>
            <div class="mt-1"><div class="bar-label"><span class="small">Масса балласта / брони</span><span class="mono">${sim.armorWeight}%</span></div><input type="range" id="sim-armor" min="0" max="100" value="${sim.armorWeight}" /></div>
            <label class="flex-gap mt-2" style="cursor:pointer;"><input type="checkbox" id="sim-mech" ${sim.mechanical ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--accent);" /><span class="small"><strong>Карбюратор / чистая механика</strong> (+42 ЭМИ)</span></label>
          </div>
          <div class="card">
            <div class="flex-between mb-1"><h4>Показатели сборки</h4><span class="badge ${vCls}">Мин.: ${minStat}/100</span></div>
            ${metricBar('Проходимость', pass)}${metricBar('Устойчивость', stab)}${metricBar('Охлаждение', cool)}${metricBar('Стойкость к ЭМИ', emp)}
            <div class="card mt-2" style="background:var(--bg-input);"><div class="small"><strong>Вердикт:</strong> ${escapeHtml(verdict)}</div><div class="small muted mt-1"><strong>Польза аномалии:</strong> ${escapeHtml(w.exploit)}</div></div>
          </div>
        </div>
        ${saved.length ? `<div class="mt-2 flex-gap"><span class="small muted">Билды:</span>${saved.map(p => `<span class="badge badge-accent" style="cursor:pointer;" data-load-anom="${p.id}">${escapeHtml(p.name)}</span>`).join('')}</div>` : ''}
      </section>
      <section class="block">
        <div class="block-header"><div><div class="section-kicker">Блок 09 // WeatherManager</div><h3>5 погодных аномалий</h3></div></div>
        <div class="grid-3">${gdd.anomalies.filter(a => a.id !== 'clear').map(a => `<div class="card clickable ${a.id === sim.weatherId ? 'active' : ''}" data-weather="${a.id}"><div class="flex-between mb-1"><strong>${escapeHtml(a.name)}</strong><span class="badge badge-accent">${escapeHtml(a.badge)}</span></div><p class="small">${escapeHtml(a.effect)}</p><p class="small muted"><strong>Контра:</strong> ${escapeHtml(a.counter)}</p><div class="small" style="color:var(--cyan);"><strong>Польза:</strong> ${escapeHtml(a.exploit)}</div></div>`).join('')}</div>
      </section>
    </div>`;

  container.querySelectorAll('[data-chassis]').forEach(el => el.addEventListener('click', () => { sim.chassisId = el.dataset.chassis; renderAnomaliesBlock(container, { gdd }); }));
  container.querySelectorAll('[data-weather]').forEach(el => el.addEventListener('click', () => { sim.weatherId = el.dataset.weather; renderAnomaliesBlock(container, { gdd }); }));
  container.querySelector('#sim-susp')?.addEventListener('input', e => { sim.suspension = Number(e.target.value); renderAnomaliesBlock(container, { gdd }); });
  container.querySelector('#sim-armor')?.addEventListener('input', e => { sim.armorWeight = Number(e.target.value); renderAnomaliesBlock(container, { gdd }); });
  container.querySelector('#sim-mech')?.addEventListener('change', e => { sim.mechanical = e.target.checked; renderAnomaliesBlock(container, { gdd }); });
  container.querySelector('#btn-copy-anom-json')?.addEventListener('click', () => copyText(JSON.stringify({ chassisId: sim.chassisId, weatherType: sim.weatherId, tuning: { suspension: sim.suspension / 100, ballast: sim.armorWeight / 100, mechanical: sim.mechanical }, stats: { pass, stab, cool, emp } }, null, 2), 'JSON сборки скопирован'));
  container.querySelector('#btn-save-anom-preset')?.addEventListener('click', () => { const n = prompt('Название билда:', `${ch.name} vs ${w.name}`); if (n) store.addPreset('anomaly', n, { ...sim }); });
  container.querySelectorAll('[data-load-anom]').forEach(el => el.addEventListener('click', () => { const p = store.presets.find(x => x.id === el.dataset.loadAnom); if (p?.payload) { Object.assign(sim, p.payload); renderAnomaliesBlock(container, { gdd }); } }));
}
