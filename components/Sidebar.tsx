
import React, { useState } from 'react';
import { Settings, Key, Globe, Moon, Sun, Flower, Shuffle, PanelLeftClose } from 'lucide-react';
import { FLOWER_THEMES, TRANSLATIONS } from '../constants';
import { AppState, FlowerTheme } from '../types';

interface SidebarProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  currentTheme: FlowerTheme;
}

const Sidebar: React.FC<SidebarProps> = ({ state, setState, currentTheme }) => {
  const t = (key: keyof typeof TRANSLATIONS) => TRANSLATIONS[key][state.lang];
  const [spinning, setSpinning] = useState(false);

  const handleJackslot = () => {
    setSpinning(true);
    let duration = 0;
    const interval = setInterval(() => {
      const randomTheme = FLOWER_THEMES[Math.floor(Math.random() * FLOWER_THEMES.length)];
      setState(prev => ({ ...prev, themeId: randomTheme.id }));
      duration += 100;
      if (duration > 1200) {
        clearInterval(interval);
        setSpinning(false);
      }
    }, 80);
  };

  const updateApiKey = (provider: 'gemini' | 'openai' | 'anthropic', value: string) => {
    setState(prev => ({
      ...prev,
      apiKeys: { ...prev.apiKeys, [provider]: value }
    }));
  };

  return (
    <aside 
      className={`flex-shrink-0 flex flex-col h-full border-r transition-all duration-500 overflow-hidden ${state.isSidebarOpen ? 'w-full md:w-80 opacity-100' : 'w-0 opacity-0 border-none'}`}
      style={{
        backgroundColor: state.darkMode ? currentTheme.dark.surface : currentTheme.light.surface,
        borderColor: state.darkMode ? currentTheme.dark.border : currentTheme.light.border,
      }}
    >
      <div className="p-6 h-full overflow-y-auto flex flex-col">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2"
            style={{ color: state.darkMode ? currentTheme.dark.accent : currentTheme.light.accent }}
            >
            <Flower className={spinning ? "animate-spin" : ""} />
            <span>Floral Agentic</span>
            </h1>
            <button 
                onClick={() => setState(p => ({ ...p, isSidebarOpen: false }))}
                className="opacity-50 hover:opacity-100 transition-opacity"
            >
                <PanelLeftClose size={20} />
            </button>
        </div>

        {/* Global Settings */}
        <div className="space-y-6 flex-1">
          
          {/* Theme Jackslot */}
          <div className="p-4 rounded-xl border glass-panel relative overflow-hidden group"
             style={{ borderColor: state.darkMode ? currentTheme.dark.border : currentTheme.light.border }}
          >
            <div className="absolute top-0 right-0 p-2 opacity-10">
                <Shuffle size={64} />
            </div>
            <h3 className="font-semibold mb-3 flex items-center gap-2 relative z-10">
              <span className="text-xl">{currentTheme.emoji}</span>
              {currentTheme.label}
            </h3>
            <button
              onClick={handleJackslot}
              disabled={spinning}
              className="w-full py-2 px-4 rounded-lg font-medium transition-all hover:opacity-90 active:scale-95 text-white shadow-md relative z-10 flex justify-center items-center gap-2"
              style={{ backgroundColor: state.darkMode ? currentTheme.dark.accent : currentTheme.light.accent }}
            >
              {spinning ? "Spinning..." : <>{t('spin_wheel')} <Shuffle size={14}/></>}
            </button>
          </div>

          {/* Lang & Mode */}
          <div className="flex gap-2">
            <button
              onClick={() => setState(p => ({ ...p, lang: p.lang === 'en' ? 'zh' : 'en' }))}
              className="flex-1 py-2 px-3 rounded-lg border flex items-center justify-center gap-2 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              style={{ borderColor: state.darkMode ? currentTheme.dark.border : currentTheme.light.border }}
            >
              <Globe size={16} />
              {state.lang === 'en' ? 'EN' : '繁中'}
            </button>
            <button
              onClick={() => setState(p => ({ ...p, darkMode: !p.darkMode }))}
              className="flex-1 py-2 px-3 rounded-lg border flex items-center justify-center gap-2 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              style={{ borderColor: state.darkMode ? currentTheme.dark.border : currentTheme.light.border }}
            >
              {state.darkMode ? <Sun size={16} /> : <Moon size={16} />}
              {state.darkMode ? 'Light' : 'Dark'}
            </button>
          </div>

          {/* API Keys */}
          <div className="space-y-4 pt-2">
            <h3 className="font-semibold flex items-center gap-2 text-sm opacity-80">
              <Key size={16} /> {t('api_keys')}
            </h3>
            
            {['Gemini', 'OpenAI', 'Anthropic'].map((provider) => {
              const keyName = provider.toLowerCase() as keyof AppState['apiKeys'];
              // Simulate checking ENV by checking if it's already set in initial state but hidden in UI
              const hasEnv = false; // Mock

              return (
                <div key={provider} className="relative group">
                  <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-bold opacity-60 uppercase tracking-wider">{provider}</label>
                      {hasEnv && <span className="text-[10px] text-green-500">ENV Loaded</span>}
                  </div>
                  <input
                    type="password"
                    placeholder={hasEnv ? "••••••••••••••••" : "sk-..."}
                    disabled={hasEnv}
                    value={state.apiKeys[keyName]}
                    onChange={(e) => updateApiKey(keyName, e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-transparent focus:ring-1 outline-none transition-all text-xs font-mono"
                    style={{
                      borderColor: state.darkMode ? currentTheme.dark.border : currentTheme.light.border,
                      "--tw-ring-color": state.darkMode ? currentTheme.dark.accent : currentTheme.light.accent
                    } as React.CSSProperties}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 text-[10px] opacity-40 text-center">
            Floral Agentic System v2.0
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
