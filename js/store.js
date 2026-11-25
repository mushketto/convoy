import { DEFAULT_SUPABASE_CONFIG, STORAGE_KEYS } from './config.js';
import { showToast } from './utils.js';

class AppStore {
  constructor() {
    this.config = this.loadConfig();
    this.tasks = this.loadLocal(STORAGE_KEYS.tasks, {});
    this.presets = this.loadLocal(STORAGE_KEYS.presets, []);
    this.client = null; this.channel = null; this.status = 'local';
    this.listeners = new Set();
  }
  subscribe(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  notify(reason = 'update') { this.listeners.forEach(fn => fn(this, reason)); }
  loadLocal(key, fb) { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; } catch { return fb; } }
  saveLocal(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }

  loadConfig() {
    const s = this.loadLocal(STORAGE_KEYS.config, {});
    return {
      url: s.url || DEFAULT_SUPABASE_CONFIG.url || '',
      anonKey: s.anonKey || DEFAULT_SUPABASE_CONFIG.anonKey || '',
      workspaceId: s.workspaceId || DEFAULT_SUPABASE_CONFIG.workspaceId || 'expedition-2-main',
      callsign: s.callsign || DEFAULT_SUPABASE_CONFIG.callsign || 'Engineer'
    };
  }
  saveConfig(next) {
    this.config = { ...this.config, ...next };
    this.saveLocal(STORAGE_KEYS.config, this.config);
    return this.initSupabase();
  }
  applySnapshotFromUrl() {
    const snap = new URLSearchParams(window.location.search).get('snap');
    if (!snap) return;
    try {
      const dec = JSON.parse(decodeURIComponent(escape(atob(snap))));
      if (Array.isArray(dec.done)) {
        dec.done.forEach(id => { this.tasks[id] = { ...(this.tasks[id] || { note: '' }), done: true }; });
        this.saveLocal(STORAGE_KEYS.tasks, this.tasks);
        showToast(`Загружен снимок прогресса (${dec.done.length} задач)`);
      }
    } catch {}
  }
  createSnapshotUrl() {
    const done = Object.entries(this.tasks).filter(([, v]) => v && v.done).map(([k]) => k);
    const url = new URL(window.location.href);
    url.searchParams.set('snap', btoa(unescape(encodeURIComponent(JSON.stringify({ done })))));
    return url.toString();
  }
  getTask(id) { return this.tasks[id] || { done: false, note: '', updatedBy: '' }; }

  async setTask(taskId, patch) {
    const prev = this.getTask(taskId);
    const next = {
      done: patch.done !== undefined ? patch.done : prev.done,
      note: patch.note !== undefined ? patch.note : prev.note,
      updatedBy: this.config.callsign || 'Engineer',
      updatedAt: new Date().toISOString()
    };
    this.tasks[taskId] = next;
    this.saveLocal(STORAGE_KEYS.tasks, this.tasks);
    this.notify((patch.note !== undefined && patch.done === undefined) ? 'note-local' : 'task-local');

    if (this.client && this.status === 'online') {
      const { error } = await this.client.from('gdd_tasks').upsert({
        workspace_id: this.config.workspaceId, task_id: taskId,
        done: next.done, note: next.note, updated_by: next.updatedBy, updated_at: next.updatedAt
      }, { onConflict: 'workspace_id,task_id' });
      if (error) showToast('Ошибка записи в Supabase (сохранено локально)');
    }
  }

  async addPreset(category, name, payload) {
    const item = {
      id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
      category, name: name.trim() || 'Пресет', payload,
      created_by: this.config.callsign || 'Engineer', created_at: new Date().toISOString()
    };
    this.presets = [item, ...this.presets].slice(0, 30);
    this.saveLocal(STORAGE_KEYS.presets, this.presets);
    this.notify();

    if (this.client && this.status === 'online') {
      const { error } = await this.client.from('gdd_presets').insert({
        id: item.id, workspace_id: this.config.workspaceId,
        name: item.name, category: item.category, payload: item.payload, created_by: item.created_by
      });
      showToast(error ? 'Пресет сохранён локально (ошибка Supabase)' : 'Пресет синхронизирован в Supabase');
    } else showToast('Пресет сохранён локально');
  }

  async pushAllLocalToCloud() {
    if (!this.client || this.status !== 'online') return showToast('Сначала подключите Supabase');
    const rows = Object.entries(this.tasks).map(([taskId, v]) => ({
      workspace_id: this.config.workspaceId, task_id: taskId,
      done: !!v.done, note: v.note || '', updated_by: this.config.callsign || 'Engineer', updated_at: new Date().toISOString()
    }));
    if (rows.length) {
      const { error } = await this.client.from('gdd_tasks').upsert(rows, { onConflict: 'workspace_id,task_id' });
      if (error) return showToast('Ошибка выгрузки задач');
    }
    showToast(`Выгружено задач в Supabase: ${rows.length}`);
  }

  exportBackupJson() {
    return JSON.stringify({ version: 2, exportedAt: new Date().toISOString(), workspaceId: this.config.workspaceId, tasks: this.tasks, presets: this.presets }, null, 2);
  }
  importBackupJson(raw) {
    const data = JSON.parse(raw);
    if (data.tasks) { this.tasks = { ...this.tasks, ...data.tasks }; this.saveLocal(STORAGE_KEYS.tasks, this.tasks); }
    if (Array.isArray(data.presets)) { this.presets = data.presets; this.saveLocal(STORAGE_KEYS.presets, this.presets); }
    this.notify(); showToast('Бэкап импортирован');
  }

  async initSupabase() {
    if (this.channel && this.client) { await this.client.removeChannel(this.channel); this.channel = null; }
    if (!this.config.url || !this.config.anonKey || !window.supabase) {
      this.client = null; this.status = 'local'; this.notify(); return false;
    }
    try {
      this.client = window.supabase.createClient(this.config.url, this.config.anonKey);
      const ws = this.config.workspaceId || 'expedition-2-main';
      const [tRes, pRes] = await Promise.all([
        this.client.from('gdd_tasks').select('*').eq('workspace_id', ws),
        this.client.from('gdd_presets').select('*').eq('workspace_id', ws).order('created_at', { ascending: false }).limit(30)
      ]);
      if (tRes.error) throw tRes.error;
      if (pRes.error) throw pRes.error;
      (tRes.data || []).forEach(r => { this.tasks[r.task_id] = { done: r.done, note: r.note || '', updatedBy: r.updated_by || '', updatedAt: r.updated_at }; });
      this.saveLocal(STORAGE_KEYS.tasks, this.tasks);
      if (Array.isArray(pRes.data)) { this.presets = pRes.data; this.saveLocal(STORAGE_KEYS.presets, this.presets); }

      this.channel = this.client.channel(`gdd_ws_${ws}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'gdd_tasks', filter: `workspace_id=eq.${ws}` }, p => {
          const r = p.new; if (!r) return;
          this.tasks[r.task_id] = { done: r.done, note: r.note || '', updatedBy: r.updated_by || '', updatedAt: r.updated_at };
          this.saveLocal(STORAGE_KEYS.tasks, this.tasks); this.notify();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'gdd_presets', filter: `workspace_id=eq.${ws}` }, async () => {
          const { data } = await this.client.from('gdd_presets').select('*').eq('workspace_id', ws).order('created_at', { ascending: false }).limit(30);
          if (data) { this.presets = data; this.saveLocal(STORAGE_KEYS.presets, this.presets); this.notify(); }
        }).subscribe();

      this.status = 'online'; this.notify(); return true;
    } catch (err) {
      console.error('Supabase init failed:', err);
      this.status = 'error'; this.notify(); return false;
    }
  }
}

export const store = new AppStore();
