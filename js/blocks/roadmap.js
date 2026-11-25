import { escapeHtml, copyText, buildAiTaskPrompt } from '../utils.js';
import { store } from '../store.js';

let filterMode = 'all';
let selectedScriptPath = 'Assets/_Project/Scripts/Vehicles/RaycastVehicle.cs';
const openNotes = new Set();

export function renderRoadmapBlock(container, { roadmap }) {
  const allTasks = roadmap.phases.flatMap(p => p.tasks);
  const doneCount = allTasks.filter(t => store.getTask(t.id).done).length;
  const pct = Math.round((doneCount / Math.max(1, allTasks.length)) * 100);
  const selectedScript = roadmap.unityTree.find(s => s.path === selectedScriptPath) || roadmap.unityTree[0];

  container.innerHTML = `
    <div class="block-stack">
      <section class="block">
        <div class="block-header">
          <div><div class="section-kicker">Блок 12 // План под ИИ</div><h2>Дорожная карта Unity + FishNet</h2></div>
          <div class="flex-gap">
            <span class="badge badge-green">Готово: ${doneCount} / ${allTasks.length} (${pct}%)</span>
            <button class="btn btn-sm" id="btn-share-snap">Ссылка-снимок URL</button>
          </div>
        </div>
        <div class="bar-track mb-1" style="height:12px;"><div class="bar-fill" style="width:${pct}%;background:var(--green);"></div></div>
        <div class="grid-4 mt-2">${roadmap.goldRules.map(r => `<div class="card"><strong class="small" style="color:var(--accent);">${escapeHtml(r.title)}</strong><div class="small muted mt-1">${escapeHtml(r.desc)}</div></div>`).join('')}</div>
      </section>

      <section class="block">
        <div class="block-header">
          <div><div class="section-kicker">Блок 13 // Трекер задач</div><h3>Этапы разработки (0–6)</h3></div>
          <div class="pill-group">
            <button class="pill ${filterMode === 'all' ? 'active' : ''}" data-filter="all">Все (${allTasks.length})</button>
            <button class="pill ${filterMode === 'todo' ? 'active' : ''}" data-filter="todo">В работе (${allTasks.length - doneCount})</button>
            <button class="pill ${filterMode === 'done' ? 'active' : ''}" data-filter="done">Готовые (${doneCount})</button>
          </div>
        </div>
        ${roadmap.phases.map(phase => {
          const list = phase.tasks.filter(t => { const d = store.getTask(t.id).done; return filterMode === 'todo' ? !d : filterMode === 'done' ? d : true; });
          if (!list.length) return '';
          return `<div class="mb-1" style="margin-top:1rem;"><div class="flex-between mb-1"><div><span class="badge badge-accent">${escapeHtml(phase.code)}</span> <strong style="margin-left:0.4rem;">${escapeHtml(phase.title)}</strong></div><span class="small muted">${escapeHtml(phase.goal)}</span></div>
            ${list.map(t => {
              const st = store.getTask(t.id);
              const showNote = openNotes.has(t.id) || (st.note && st.note.trim().length > 0);
              return `<div class="task-item ${st.done ? 'done' : ''}"><div class="task-top"><label class="task-check"><input type="checkbox" data-toggle-task="${t.id}" ${st.done ? 'checked' : ''} /><div><div class="task-title"><strong>${t.id}. ${escapeHtml(t.title)}</strong></div><div class="small muted">${escapeHtml(t.desc)}</div><div class="flex-gap mt-1">${t.files.map(f => `<span class="badge mono">${escapeHtml(f)}</span>`).join('')}<span class="badge badge-green">DoD: ${escapeHtml(t.dod)}</span></div></div></label><div class="flex-gap"><button class="btn btn-sm" data-toggle-note="${t.id}">Заметка</button><button class="btn btn-sm btn-accent" data-copy-prompt="${t.id}" data-phase-id="${phase.id}">Промпт ИИ</button></div></div>
              ${showNote ? `<div class="task-note-box"><div class="flex-between mb-1"><span class="small muted">Заметка (подмешивается в промпт):</span>${st.updatedBy ? `<span class="mono" style="font-size:0.7rem;color:var(--text-dim);">изм.: ${escapeHtml(st.updatedBy)}</span>` : ''}</div><textarea rows="2" placeholder="Баги в Unity, правки для ИИ..." data-note-input="${t.id}">${escapeHtml(st.note || '')}</textarea></div>` : ''}</div>`;
            }).join('')}</div>`;
        }).join('')}
      </section>

      <section class="block">
        <div class="block-header">
          <div><div class="section-kicker">Блок 14 // Архитектура</div><h3>Дерево C#-скриптов Unity</h3></div>
          <button class="btn btn-sm btn-cyan" id="btn-copy-contract">Копировать контракт</button>
        </div>
        <div class="grid-sidebar">
          <div style="max-height:360px;overflow-y:auto;padding-right:0.25rem;">
            ${roadmap.unityTree.map(s => `<div class="card clickable mb-1 ${s.path === selectedScript.path ? 'active' : ''}" data-script="${escapeHtml(s.path)}" style="padding:0.6rem 0.8rem;"><div class="flex-between"><span class="mono small">${escapeHtml(s.path.replace('Assets/_Project/Scripts/', ''))}</span><span class="badge">${escapeHtml(s.layer)}</span></div></div>`).join('')}
          </div>
          <div class="card" style="background:var(--bg-input);">
            <div class="badge badge-cyan mb-1">${escapeHtml(selectedScript.layer)}</div>
            <div class="mono small" style="color:var(--accent);word-break:break-all;">${escapeHtml(selectedScript.path)}</div>
            <p class="mt-2">${escapeHtml(selectedScript.contract)}</p>
          </div>
        </div>
      </section>
    </div>`;

  container.querySelectorAll('[data-filter]').forEach(b => b.addEventListener('click', () => { filterMode = b.dataset.filter; renderRoadmapBlock(container, { roadmap }); }));
  container.querySelectorAll('[data-toggle-task]').forEach(c => c.addEventListener('change', () => store.setTask(c.dataset.toggleTask, { done: c.checked })));
  container.querySelectorAll('[data-toggle-note]').forEach(b => b.addEventListener('click', () => { const id = b.dataset.toggleNote; openNotes.has(id) ? openNotes.delete(id) : openNotes.add(id); renderRoadmapBlock(container, { roadmap }); }));
  container.querySelectorAll('[data-note-input]').forEach(ta => {
    let tm = null;
    ta.addEventListener('input', () => { clearTimeout(tm); tm = setTimeout(() => store.setTask(ta.dataset.noteInput, { note: ta.value }), 450); });
  });
  container.querySelectorAll('[data-copy-prompt]').forEach(b => b.addEventListener('click', () => {
    const p = roadmap.phases.find(x => x.id === b.dataset.phaseId);
    const t = p?.tasks.find(x => x.id === b.dataset.copyPrompt);
    if (t && p) copyText(buildAiTaskPrompt(t, p, store.getTask(t.id).note || '', roadmap.cursorrules), `Промпт ${t.id} скопирован`);
  }));
  container.querySelectorAll('[data-script]').forEach(el => el.addEventListener('click', () => { selectedScriptPath = el.dataset.script; renderRoadmapBlock(container, { roadmap }); }));
  container.querySelector('#btn-copy-contract')?.addEventListener('click', () => copyText(`Файл: ${selectedScript.path}\nСлой: ${selectedScript.layer}\nКонтракт: ${selectedScript.contract}\n\n${roadmap.cursorrules}`, 'Контракт скопирован'));
  container.querySelector('#btn-share-snap')?.addEventListener('click', () => copyText(store.createSnapshotUrl(), 'Ссылка-снимок скопирована'));
}
