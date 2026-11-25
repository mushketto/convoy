export const DEFAULT_SUPABASE_CONFIG = {
  url: 'https://ycbwykigluuiztunguxu.supabase.co',
  anonKey: 'sb_publishable_76BGnqTFJDkYBeOJlgcBRQ__IAtpkO6',
  workspaceId: 'expedition-2-main',
  callsign: 'Lead-Engineer'
};

export const STORAGE_KEYS = {
  config: 'exp2_supabase_cfg_v2',
  tasks: 'exp2_tasks_v2',
  presets: 'exp2_presets_v2'
};

export const ROUTES = [
  { id: 'overview',  label: '1. Обзор и цикл' },
  { id: 'vehicles',  label: '2. Техника и прицепы' },
  { id: 'craft',     label: '3. Шредер и чертежи' },
  { id: 'anomalies', label: '4. Аномалии и баланс' },
  { id: 'story',     label: '5. Сюжет (4 акта)' },
  { id: 'roadmap',   label: '6. Roadmap и Unity' }
];
