
export type Language = 'en' | 'zh';
export type ThemeMode = 'light' | 'dark';

export interface ColorPalette {
  bg: string;
  fg: string;
  accent: string;
  surface: string;
  border: string;
}

export interface FlowerTheme {
  id: string;
  label: string;
  emoji: string;
  light: ColorPalette;
  dark: ColorPalette;
}

export type ModelProvider = 'gemini' | 'openai' | 'anthropic';

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  provider: ModelProvider;
  model: string;
  maxTokens: number;
  temperature: number;
  systemPrompt: string;
  input: string; // Specific input for this agent
  status: 'idle' | 'running' | 'success' | 'error' | 'skipped';
  output: string;
  tokenUsage: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

export type MagicTool = 'markdown' | 'entities' | 'mindmap' | 'quiz' | 'keywords';

export interface OcrPage {
  pageNumber: number;
  image: string; // Base64 data URL
  selected: boolean;
}

export interface AppState {
  lang: Language;
  darkMode: boolean;
  themeId: string;
  apiKeys: {
    gemini: string;
    openai: string;
    anthropic: string;
  };
  globalTask: string;
  globalPrompt: string;
  ocrText: string;
  
  // UI State
  isSidebarOpen: boolean;

  // OCR & PDF
  pdfPages: OcrPage[];
  ocrModel: string;
  ocrPrompt: string;
  ocrMaxTokens: number;
  
  // Note Keeper / Features
  noteKeeperText: string;
  noteKeeperTool: MagicTool;
  noteKeeperModel: string;
  noteKeeperPrompt: string;
  noteKeeperOutput: string;
  noteKeeperViewMode: 'edit' | 'preview';
  
  // Gamification & Status
  mana: number;
  health: number;
  xp: number;
  level: number;
  stress: number;

  executionLog: LogEntry[];
}

export const AVAILABLE_MODELS: Record<ModelProvider, string[]> = {
  gemini: ["gemini-2.5-flash", "gemini-2.5-flash-lite"],
  openai: ["gpt-4o-mini", "gpt-4.1-mini", "gpt-5-nano"],
  anthropic: ["claude-3-5-sonnet", "claude-3-haiku"]
};
