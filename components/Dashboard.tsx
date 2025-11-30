import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { AgentConfig, FlowerTheme, LogEntry } from '../types';
import { Trophy } from 'lucide-react';

interface DashboardProps {
  agents: AgentConfig[];
  currentTheme: FlowerTheme;
  darkMode: boolean;
  logs: LogEntry[];
}

const Dashboard: React.FC<DashboardProps> = ({ agents, currentTheme, darkMode, logs }) => {
  const accentColor = darkMode ? currentTheme.dark.accent : currentTheme.light.accent;
  const textColor = darkMode ? currentTheme.dark.fg : currentTheme.light.fg;
  const gridColor = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  const data = agents.map(a => ({
    name: a.name,
    tokens: a.tokenUsage,
    length: a.output.length
  }));

  const achievements = [
      { id: 1, label: "First Bloom", desc: "Run your first pipeline", unlocked: logs.length > 0 },
      { id: 2, label: "Token Master", desc: "Use over 5000 tokens", unlocked: agents.some(a => a.tokenUsage > 5000) },
      { id: 3, label: "Floral Harmony", desc: "Complete without errors", unlocked: agents.every(a => a.status === 'success') && agents.length > 0 },
  ];

  return (
    <div className="space-y-6">
        {/* Achievements Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {achievements.map(ach => (
                <div key={ach.id} className={`p-4 rounded-xl border glass-panel flex items-center gap-3 transition-all ${ach.unlocked ? 'opacity-100' : 'opacity-50 grayscale'}`}
                     style={{ borderColor: darkMode ? currentTheme.dark.border : currentTheme.light.border }}
                >
                    <div className={`p-2 rounded-full ${ach.unlocked ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-400'}`}>
                        <Trophy size={20} />
                    </div>
                    <div>
                        <div className="font-bold text-sm">{ach.label}</div>
                        <div className="text-xs opacity-60">{ach.desc}</div>
                    </div>
                </div>
            ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-4 rounded-xl border glass-panel"
            style={{ borderColor: darkMode ? currentTheme.dark.border : currentTheme.light.border }}
        >
            <h3 className="font-semibold mb-4 text-sm opacity-80">Token Usage (Approx)</h3>
            <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="name" stroke={textColor} fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke={textColor} fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ 
                        backgroundColor: darkMode ? currentTheme.dark.surface : currentTheme.light.surface,
                        borderColor: darkMode ? currentTheme.dark.border : currentTheme.light.border,
                        color: textColor,
                        fontSize: 12
                    }}
                />
                <Bar dataKey="tokens" radius={[4, 4, 0, 0]}>
                    {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={accentColor} fillOpacity={0.8} />
                    ))}
                </Bar>
                </BarChart>
            </ResponsiveContainer>
            </div>
        </div>

        <div className="p-4 rounded-xl border glass-panel"
            style={{ borderColor: darkMode ? currentTheme.dark.border : currentTheme.light.border }}
        >
            <h3 className="font-semibold mb-4 text-sm opacity-80">Response Length (Chars)</h3>
            <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="name" stroke={textColor} fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke={textColor} fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ 
                        backgroundColor: darkMode ? currentTheme.dark.surface : currentTheme.light.surface,
                        borderColor: darkMode ? currentTheme.dark.border : currentTheme.light.border,
                        color: textColor,
                        fontSize: 12
                    }}
                />
                <Line type="monotone" dataKey="length" stroke={accentColor} strokeWidth={3} dot={{r: 4, fill: accentColor}} />
                </LineChart>
            </ResponsiveContainer>
            </div>
        </div>
        </div>
    </div>
  );
};

export default Dashboard;