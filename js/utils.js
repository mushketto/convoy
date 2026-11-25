export function escapeHtml(str = '') {
  return String(str)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

export function showToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => el.remove(), 2800);
}

export async function copyText(text, label = 'Скопировано в буфер обмена') {
  try {
    await navigator.clipboard.writeText(text);
    showToast(label);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); ta.remove();
    showToast(label);
  }
}

export function downloadFile(filename, content, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
  showToast(`Файл ${filename} скачан`);
}

export const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
export const statColor = v => (v >= 70 ? 'var(--green)' : v >= 40 ? 'var(--accent)' : 'var(--red)');

export function buildAiTaskPrompt(task, phase, note, cursorrules) {
  return [
    `Ты Senior Unity C# и FishNet разработчик проекта «Экспедиция №2».`,
    `Выполни задачу [${task.id}] из этапа «${phase.code}: ${phase.title}».`,
    ``,
    `### Задача: ${task.title}`,
    `Описание: ${task.desc}`,
    `Целевые C#-файлы: ${task.files.join(', ')}`,
    `Критерий приёмки (DoD): ${task.dod}`,
    note ? `\n### Заметки разработчика:\n${note}` : '',
    ``,
    `### Обязательные правила проекта:`,
    cursorrules,
    ``,
    `Выдай полные компилируемые C#-файлы и пошаговую инструкцию сборки префаба в Unity Inspector.`
  ].filter(Boolean).join('\n');
}

export function buildMarkdownRoadmap(roadmapData, tasksState) {
  const lines = [`# ЭКСПЕДИЦИЯ №2 — Дорожная карта (Unity + FishNet)`, ``, `## Системные правила`, '```text', roadmapData.cursorrules, '```', ``];
  for (const phase of roadmapData.phases) {
    lines.push(`## ${phase.code}: ${phase.title}`, `*Цель:* ${phase.goal}`, ``);
    for (const t of phase.tasks) {
      const st = tasksState[t.id] || { done: false, note: '' };
      lines.push(`- [${st.done ? 'x' : ' '}] **${t.id} ${t.title}**`);
      lines.push(`  - Файлы: \`${t.files.join('`, `')}\``);
      lines.push(`  - Описание: ${t.desc}`);
      lines.push(`  - DoD: ${t.dod}`);
      if (st.note && st.note.trim()) lines.push(`  - Заметка: ${st.note.trim()}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}
