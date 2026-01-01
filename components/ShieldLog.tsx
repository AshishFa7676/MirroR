
import React, { useState } from 'react';
import { Shield, ChevronRight, AlertTriangle } from 'lucide-react';
import { soundService } from '../services/soundService';

interface ShieldLogProps {
  onLogShield: (shield: string) => void;
}

export const ShieldLog: React.FC<ShieldLogProps> = ({ onLogShield }) => {
  const [shield, setShield] = useState('');
  const [isLogged, setIsLogged] = useState(false);

  const commonShields = [
    "READING DOCUMENTATION WITHOUT CODE",
    "WATCHING TUTORIALS REPETITIVELY",
    "REFACTORING WORKING CODE UNNECESSARILY",
    "ENVIRONMENT CONFIGURATION OVERKILL",
    "BROWSING TECHNICAL SUBREDDITS",
    "OVER-PLANNING WITHOUT EXECUTION"
  ];

  const handleLog = (s: string) => {
     soundService.playError();
     onLogShield(s);
     setShield('');
     setIsLogged(true);
     setTimeout(() => setIsLogged(false), 2000);
  };

  return (
    <div className="bg-surface border border-gray-900 p-6 rounded-xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-20 h-20 bg-danger/5 rounded-full blur-2xl group-hover:bg-danger/10 transition-colors" />
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 text-danger font-black text-xs uppercase tracking-widest mb-1">
            <Shield size={14} className="animate-pulse" /> INTELLECTUAL SHIELD DETECTOR
          </div>
          <p className="text-[10px] text-gray-500 font-mono italic">
            "Admit the productive-feeling activity you are currently using to hide from the core obligation."
          </p>
        </div>
        {isLogged && <span className="text-xs font-bold text-danger animate-in fade-in slide-in-from-right">LOGGED</span>}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
        {commonShields.map(s => (
          <button 
            key={s} 
            onClick={() => handleLog(s)}
            className="text-left px-3 py-2 text-[9px] font-bold text-gray-500 bg-black/40 border border-gray-800 rounded hover:bg-danger/10 hover:border-danger hover:text-white transition-all flex justify-between items-center group/btn"
          >
            {s} <ChevronRight size={10} className="opacity-0 group-hover/btn:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>

      <div className="relative">
        <input 
          value={shield}
          onChange={e => setShield(e.target.value)}
          placeholder="OTHER SHIELD (TYPE & PRESS ENTER)..."
          onKeyDown={e => e.key === 'Enter' && shield && handleLog(shield)}
          className="w-full bg-black border border-gray-800 p-3 text-xs text-white focus:border-danger outline-none rounded font-mono uppercase placeholder:text-gray-700"
        />
        <button 
          onClick={() => shield && handleLog(shield)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-danger p-1"
        >
          <AlertTriangle size={14} />
        </button>
      </div>
    </div>
  );
};
