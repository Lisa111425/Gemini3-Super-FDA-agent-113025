import { FlowerTheme, AgentConfig, MagicTool } from './types';

export const FLOWER_THEMES: FlowerTheme[] = [
    { id: "sakura_breeze", label: "Sakura Breeze", emoji: "🌸", light: { bg: "#fff5f8", fg: "#3b0b19", accent: "#ff99c8", surface: "#ffffff", border: "#fecdd3" }, dark: { bg: "#2b0f1b", fg: "#ffe6f2", accent: "#ff7aa2", surface: "#3f1526", border: "#831843" } },
    { id: "rose_gold", label: "Rose Gold", emoji: "🌹", light: { bg: "#fff6f7", fg: "#4b1114", accent: "#f75c77", surface: "#ffffff", border: "#fda4af" }, dark: { bg: "#2a0d0f", fg: "#ffe8ec", accent: "#ff6b81", surface: "#4c1218", border: "#9f1239" } },
    { id: "lavender_dream", label: "Lavender Dream", emoji: "💜", light: { bg: "#f4f1ff", fg: "#22164d", accent: "#a78bfa", surface: "#ffffff", border: "#ddd6fe" }, dark: { bg: "#1b1433", fg: "#ede9fe", accent: "#c4b5fd", surface: "#2e2055", border: "#5b21b6" } },
    { id: "sunflower_glow", label: "Sunflower Glow", emoji: "🌻", light: { bg: "#fffbea", fg: "#3b2f0c", accent: "#fbbf24", surface: "#ffffff", border: "#fde68a" }, dark: { bg: "#1f1303", fg: "#fef3c7", accent: "#facc15", surface: "#422a08", border: "#b45309" } },
    { id: "lotus_pond", label: "Lotus Pond", emoji: "🪷", light: { bg: "#ecfdf5", fg: "#064e3b", accent: "#22c55e", surface: "#ffffff", border: "#a7f3d0" }, dark: { bg: "#022c22", fg: "#dcfce7", accent: "#4ade80", surface: "#064e3b", border: "#065f46" } },
    { id: "orchid_mist", label: "Orchid Mist", emoji: "🌺", light: { bg: "#fdf2ff", fg: "#3b0764", accent: "#e879f9", surface: "#ffffff", border: "#f5d0fe" }, dark: { bg: "#2b0b39", fg: "#fae8ff", accent: "#f472b6", surface: "#4a044e", border: "#86198f" } },
    { id: "peony_blush", label: "Peony Blush", emoji: "🌷", light: { bg: "#fff1f2", fg: "#4a041c", accent: "#fb7185", surface: "#ffffff", border: "#fecdd3" }, dark: { bg: "#3f0213", fg: "#ffe4e6", accent: "#fb7185", surface: "#881337", border: "#9f1239" } },
    { id: "iris_night", label: "Iris Night", emoji: "🪻", light: { bg: "#eff6ff", fg: "#111827", accent: "#6366f1", surface: "#ffffff", border: "#c7d2fe" }, dark: { bg: "#020617", fg: "#e5e7eb", accent: "#4f46e5", surface: "#1e1b4b", border: "#312e81" } },
    { id: "cherry_meadow", label: "Cherry Meadow", emoji: "🍒", light: { bg: "#fef2f2", fg: "#111827", accent: "#fb7185", surface: "#ffffff", border: "#fecaca" }, dark: { bg: "#111827", fg: "#f9fafb", accent: "#f97316", surface: "#1f2937", border: "#374151" } },
    { id: "camellia_silk", label: "Camellia Silk", emoji: "🌸", light: { bg: "#fdf2f8", fg: "#4a044e", accent: "#ec4899", surface: "#ffffff", border: "#fbcfe8" }, dark: { bg: "#3b0764", fg: "#fdf2f8", accent: "#db2777", surface: "#500724", border: "#831843" } },
    { id: "magnolia_cloud", label: "Magnolia Cloud", emoji: "🌼", light: { bg: "#f9fafb", fg: "#111827", accent: "#eab308", surface: "#ffffff", border: "#e5e7eb" }, dark: { bg: "#0b1120", fg: "#e5e7eb", accent: "#f59e0b", surface: "#1f2937", border: "#374151" } },
    { id: "plum_blossom", label: "Plum Blossom", emoji: "💮", light: { bg: "#fef2ff", fg: "#4a044e", accent: "#f97316", surface: "#ffffff", border: "#f5d0fe" }, dark: { bg: "#3f0e40", fg: "#fce7f3", accent: "#f97316", surface: "#581c87", border: "#7e22ce" } },
    { id: "gardenia_moon", label: "Gardenia Moon", emoji: "🌙", light: { bg: "#f9fafb", fg: "#020617", accent: "#22c55e", surface: "#ffffff", border: "#e2e8f0" }, dark: { bg: "#020617", fg: "#e5e7eb", accent: "#22c55e", surface: "#0f172a", border: "#1e293b" } },
    { id: "wisteria_rain", label: "Wisteria Rain", emoji: "🌧️", light: { bg: "#eef2ff", fg: "#1e293b", accent: "#a855f7", surface: "#ffffff", border: "#ddd6fe" }, dark: { bg: "#020617", fg: "#e5e7eb", accent: "#8b5cf6", surface: "#1e1b4b", border: "#4c1d95" } },
    { id: "dahlia_fire", label: "Dahlia Fire", emoji: "🔥", light: { bg: "#fff7ed", fg: "#1f2937", accent: "#f97316", surface: "#ffffff", border: "#ffedd5" }, dark: { bg: "#111827", fg: "#f9fafb", accent: "#fb923c", surface: "#431407", border: "#7c2d12" } },
    { id: "bluebell_forest", label: "Bluebell Forest", emoji: "🦋", light: { bg: "#eff6ff", fg: "#111827", accent: "#3b82f6", surface: "#ffffff", border: "#bfdbfe" }, dark: { bg: "#020617", fg: "#e5e7eb", accent: "#60a5fa", surface: "#172554", border: "#1e3a8a" } },
    { id: "poppy_fields", label: "Poppy Fields", emoji: "🌺", light: { bg: "#fef2f2", fg: "#1f2937", accent: "#ef4444", surface: "#ffffff", border: "#fecaca" }, dark: { bg: "#111827", fg: "#f9fafb", accent: "#f87171", surface: "#450a0a", border: "#7f1d1d" } },
    { id: "lotus_dawn", label: "Lotus Dawn", emoji: "🌅", light: { bg: "#fefce8", fg: "#1f2937", accent: "#22c55e", surface: "#ffffff", border: "#fef08a" }, dark: { bg: "#1e293b", fg: "#e5e7eb", accent: "#10b981", surface: "#022c22", border: "#064e3b" } },
    { id: "hibiscus_sunset", label: "Hibiscus Sunset", emoji: "🌇", light: { bg: "#fff7ed", fg: "#1f2937", accent: "#fb7185", surface: "#ffffff", border: "#ffedd5" }, dark: { bg: "#1f2937", fg: "#e5e7eb", accent: "#f97316", surface: "#431407", border: "#7c2d12" } },
    { id: "jasmine_night", label: "Jasmine Night", emoji: "🌌", light: { bg: "#f9fafb", fg: "#1f2937", accent: "#22c55e", surface: "#ffffff", border: "#dcfce7" }, dark: { bg: "#020617", fg: "#e5e7eb", accent: "#84cc16", surface: "#0f172a", border: "#1e293b" } },
];

export const MAGIC_TOOLS: {id: MagicTool, label: string}[] = [
    { id: 'markdown', label: 'Transform → Structured Markdown' },
    { id: 'entities', label: 'Entity Extraction (20 items)' },
    { id: 'mindmap', label: 'Mindmap (Mermaid)' },
    { id: 'quiz', label: 'Generate Quiz (5 MCQs)' },
    { id: 'keywords', label: 'Keyword Highlighting' }
];

export const TRANSLATIONS = {
  app_title: {
    en: "Floral Agentic Workflow",
    zh: "花語智能代理工作台",
  },
  upload_label: {
    en: "Upload Document (PDF, TXT, JSON)",
    zh: "上傳文件（PDF, TXT, JSON）",
  },
  global_task: {
    en: "Global Task Description",
    zh: "全域任務說明",
  },
  run_agents: {
    en: "Run Pipeline",
    zh: "執行流程",
  },
  settings: {
    en: "Settings",
    zh: "設定",
  },
  api_keys: {
    en: "API Keys",
    zh: "API 金鑰",
  },
  dashboard: {
    en: "Agent Dashboard",
    zh: "代理儀表板",
  },
  agents_panel: {
    en: "Agent Pipeline",
    zh: "代理流程",
  },
  tools_panel: {
    en: "AI Tools",
    zh: "智能工具",
  },
  spin_wheel: {
    en: "Spin Floral Jackslot",
    zh: "旋轉花語幸運輪",
  },
  follow_up: {
    en: "Follow-up Questions",
    zh: "後續問題",
  },
  status: {
    en: "Status",
    zh: "狀態",
  },
  wow_factor: {
    en: "WOW Indicators",
    zh: "WOW 指標",
  },
  ocr_section: {
    en: "OCR & Analysis",
    zh: "OCR 與分析",
  }
};

export const MOCK_AGENTS_INIT: AgentConfig[] = [
  { id: 'ag1', name: 'Summarizer', description: 'Condenses the input document into key points.', provider: 'gemini', model: 'gemini-2.5-flash', maxTokens: 4000, temperature: 0.3, status: 'idle', output: '', input: '', tokenUsage: 0, systemPrompt: "Summarize the key points of the input text efficiently." },
  { id: 'ag2', name: 'Risk Analyst', description: 'Identifies potential risks in the summary.', provider: 'openai', model: 'gpt-4o-mini', maxTokens: 8000, temperature: 0.5, status: 'idle', output: '', input: '', tokenUsage: 0, systemPrompt: "Identify potential risks and mitigation strategies based on the summary." },
  { id: 'ag3', name: 'Creative Refiner', description: 'Rewrites content with a specific tone.', provider: 'openai', model: 'gpt-5-nano', maxTokens: 12000, temperature: 0.8, status: 'idle', output: '', input: '', tokenUsage: 0, systemPrompt: "Rewrite the content in a floral, poetic style." },
  { id: 'ag4', name: 'Translator', description: 'Translates final output to Traditional Chinese.', provider: 'gemini', model: 'gemini-2.5-flash-lite', maxTokens: 2000, temperature: 0.1, status: 'idle', output: '', input: '', tokenUsage: 0, systemPrompt: "Translate the content into Traditional Chinese." },
];

export const FOLLOW_UP_QUESTIONS = [
  "How does the floral theme influence user engagement and stress reduction?",
  "What specific benefits does Gemini 2.5 Flash offer over GPT-4o-mini for summarization?",
  "Can the pipeline handle concurrent execution of Agent 2 and Agent 3?",
  "How are the 'Mana' and 'XP' metrics calculated in the gamification engine?",
  "Does the Entity Extraction tool support custom entity types?",
  "What is the maximum token limit for the entire pipeline execution?",
  "How does the system handle API rate limits from different providers?",
  "Can I export the Mindmap output directly to a Mermaid-compatible file?",
  "Is the API Key stored persistently or cleared on session refresh?",
  "How does the 'Keyword Highlighting' tool determine relevance?",
  "Can we add a new custom agent with a Grok-3-mini model?",
  "Does the OCR simulation support multi-page PDF documents?",
  "What happens if the 'Global Task' input is left empty?",
  "How can I customize the system prompt for the Risk Analyst agent?",
  "Is there a way to roll back to a previous agent state?",
  "Does the application support dark mode for all floral themes?",
  "How accurate is the token usage estimation in the dashboard?",
  "Can I use the 'Jackslot' feature while a pipeline is running?",
  "What are the security implications of client-side API key handling?",
  "How do I switch the language interface from English to Traditional Chinese?"
];