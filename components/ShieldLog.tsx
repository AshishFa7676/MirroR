
import React, { useState } from 'react';
import { Shield, ChevronRight, AlertTriangle } from 'lucide-react';

interface ShieldLogProps {
  onLogShield: (shield: string) => void;
}

export const ShieldLog: React.FC<ShieldLogProps> = ({ onLogShield }) => {
  const [shield, setShield] = useState('');
  const commonShields = [
    "READING DOCUMENTATION WITHOUT CODE",
    "WATCHING TUTORIALS REPETITIVELY",
    "REFACTORING WORKING CODE UNNECESSARILY",
    "ENVIRONMENT CONFIGURATION OVERKILL",
    "BROWSING TECHNICAL SUBREDDITS",
    "OVER-PLANNING WITHOUT EXECUTION"
  ];

  return (
    <div className="bg-surface border-2 border-gray-900 p-6 space-y-6">
      <div className="flex items-center gap-3 text-danger font-black text-[10px] uppercase tracking-widest">
        <Shield size={16} /> INTELLECTUAL SHIELD DETECTED
      </div>
      <p className="text-[10px] text-gray-500 font-mono leading-relaxed italic">
        "Admit the productive-feeling activity you are currently using to hide from the core obligation."
      </p>
      
      <div className="space-y-2">
        {commonShields.map(s => (
          <button 
            key={s} 
            onClick={() => onLogShield(s)}
            className="w-full text-left p-3 text-[9px] font-black text-gray-600 border border-gray-800 hover:bg-danger/10 hover:border-danger hover:text-white transition-all flex justify-between items-center group"
          >
            {s} <ChevronRight size={12} className="opacity-0 group-hover:opacity-100" />
          </button>
        ))}
      </div>

      <div className="relative">
        <input 
          value={shield}
          onChange={e => setShield(e.target.value)}
          placeholder="OTHER SHIELD..."
          className="w-full bg-black border border-gray-800 p-3 text-[10px] text-white focus:border-danger outline-none"
        />
        <button 
          onClick={() => { if(shield) onLogShield(shield); setShield(''); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-danger"
        >
          <AlertTriangle size={14} />
        </button>
      </div>
    </div>
  );
};
