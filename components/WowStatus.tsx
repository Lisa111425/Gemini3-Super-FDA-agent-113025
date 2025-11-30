import React from 'react';
import { FlowerTheme } from '../types';
import { Zap, Heart, Star, Activity } from 'lucide-react';

interface WowStatusProps {
  mana: number;
  health: number;
  xp: number;
  level: number;
  stress: number;
  currentTheme: FlowerTheme;
  darkMode: boolean;
}

const WowStatus: React.FC<WowStatusProps> = ({ mana, health, xp, level, stress, currentTheme, darkMode }) => {
  const accent = darkMode ? currentTheme.dark.accent : currentTheme.light.accent;
  const border = darkMode ? currentTheme.dark.border : currentTheme.light.border;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 animate-in fade-in slide-in-from-top-4 duration-700">
      
      {/* Health */}
      <div className="p-3 rounded-xl border glass-panel flex items-center gap-3" style={{ borderColor: border }}>
        <div className="p-2 rounded-full bg-red-100 text-red-500">
            <Heart size={18} fill="currentColor" />
        </div>
        <div className="flex-1">
            <div className="text-[10px] opacity-60 font-bold uppercase">Health</div>
            <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${health}%` }} />
            </div>
        </div>
      </div>

      {/* Mana Orb */}
      <div className="p-3 rounded-xl border glass-panel flex items-center gap-3 relative overflow-hidden" style={{ borderColor: border }}>
         <div className="p-2 rounded-full text-blue-500 relative z-10" style={{ backgroundColor: `${accent}22`, color: accent }}>
            <Zap size={18} fill="currentColor" />
        </div>
        <div className="flex-1 z-10">
            <div className="text-[10px] opacity-60 font-bold uppercase">Mana</div>
            <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
                <div className="h-full transition-all duration-500" style={{ width: `${mana}%`, backgroundColor: accent }} />
            </div>
        </div>
        {/* Glow effect */}
        <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full blur-xl opacity-40 animate-pulse" style={{ backgroundColor: accent }} />
      </div>

      {/* Level / XP */}
      <div className="p-3 rounded-xl border glass-panel flex items-center gap-3" style={{ borderColor: border }}>
        <div className="p-2 rounded-full bg-yellow-100 text-yellow-500">
            <Star size={18} fill="currentColor" />
        </div>
        <div>
            <div className="text-[10px] opacity-60 font-bold uppercase">Level {level}</div>
            <div className="text-sm font-bold">XP: {xp}</div>
        </div>
      </div>

      {/* Stress Meter */}
      <div className="p-3 rounded-xl border glass-panel flex items-center gap-3" style={{ borderColor: border }}>
         <div className="p-2 rounded-full bg-purple-100 text-purple-500">
            <Activity size={18} />
        </div>
        <div className="flex-1">
             <div className="text-[10px] opacity-60 font-bold uppercase">Stress</div>
             <div className="flex gap-1 mt-1">
                 {[1,2,3,4,5].map(i => (
                     <div key={i} className={`h-2 flex-1 rounded-sm transition-colors ${i * 20 <= stress ? 'bg-purple-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
                 ))}
             </div>
        </div>
      </div>

    </div>
  );
};

export default WowStatus;