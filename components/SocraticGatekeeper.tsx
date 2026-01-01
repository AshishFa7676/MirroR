
import React, { useState } from 'react';
import { GeminiService } from '../services/geminiService';
import { ShieldAlert, MessageSquare, Lock, Unlock, XCircle } from 'lucide-react';

interface SocraticGatekeeperProps {
  taskTitle: string;
  onAllowPause: (duration: number, transcript: string) => void;
  onCancel: () => void; // User gives up trying to pause
}

export const SocraticGatekeeper: React.FC<SocraticGatekeeperProps> = ({ taskTitle, onAllowPause, onCancel }) => {
  const [reason, setReason] = useState('');
  const [chat, setChat] = useState<{sender: 'AI'|'USER', text: string}[]>([]);
  const [status, setStatus] = useState<'IDLE'|'THINKING'|'DENIED'|'ALLOWED'>('IDLE');
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    
    const newHistory = [...chat, { sender: 'USER', text: reason }] as {sender: 'AI'|'USER', text: string}[];
    setChat(newHistory);
    setReason('');
    setStatus('THINKING');

    try {
      // Extract just the text for the API
      const historyText = newHistory.map(h => `${h.sender}: ${h.text}`);
      const result = await GeminiService.gatekeeperInterrogation(taskTitle, reason, historyText);

      setChat(prev => [...prev, { sender: 'AI', text: result.response }]);
      
      if (result.verdict === 'ALLOW') {
        setStatus('ALLOWED');
      } else if (result.verdict === 'DENY') {
        setStatus('DENIED');
        setAttempts(p => p + 1);
      } else {
        setStatus('IDLE');
      }
    } catch (e) {
      setChat(prev => [...prev, { sender: 'AI', text: "Connection unstable. But you know the truth. Get back to work." }]);
      setStatus('IDLE');
    }
  };

  if (status === 'ALLOWED') {
    return (
      <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4">
        <div className="bg-surface border border-success p-8 max-w-md w-full rounded-2xl text-center space-y-6">
          <Unlock className="mx-auto text-success" size={48} />
          <h2 className="text-2xl font-black text-white uppercase">Permission Granted</h2>
          <p className="text-gray-400 text-sm">You must select a strict pause window. The timer starts immediately.</p>
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map(min => (
              <button key={min} onClick={() => {
                const transcript = chat.map(c => `${c.sender}: ${c.text}`).join('\n');
                onAllowPause(min, transcript);
              }} className="p-4 bg-gray-900 border border-gray-700 hover:border-success hover:text-success text-white font-mono font-bold rounded-lg transition-all text-xl">
                {min}m
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] bg-red-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-black border-2 border-danger p-6 md:p-8 max-w-lg w-full rounded-2xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-transparent" />
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-danger font-black uppercase tracking-widest">
            <ShieldAlert size={20} /> Gatekeeper Active
          </div>
          <button onClick={onCancel} className="text-gray-500 hover:text-white text-xs uppercase font-bold flex items-center gap-1">
            <XCircle size={14} /> Return to Task
          </button>
        </div>

        <div className="h-64 overflow-y-auto space-y-4 mb-6 pr-2 scrollbar-hide bg-surface/50 p-4 rounded-lg border border-white/5">
          {chat.length === 0 && (
            <div className="text-center text-gray-500 italic text-sm mt-20">
              "Why do you seek to abandon your post?"
            </div>
          )}
          {chat.map((msg, i) => (
            <div key={i} className={`flex ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-lg text-sm ${msg.sender === 'USER' ? 'bg-gray-800 text-white' : 'bg-danger/10 text-red-200 border border-danger/30'}`}>
                <span className="text-[9px] font-black opacity-50 block mb-1">{msg.sender}</span>
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        <div className="relative">
          <input
            autoFocus
            disabled={status === 'THINKING' || status === 'DENIED'}
            value={reason}
            onChange={e => setReason(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder={status === 'DENIED' ? "ACCESS DENIED. RETURN TO WORK." : "Justify your retreat..."}
            className="w-full bg-surface border border-gray-700 p-4 pr-12 text-white focus:border-danger outline-none rounded-lg"
          />
          <button 
            disabled={status === 'THINKING' || status === 'DENIED'}
            onClick={handleSubmit}
            className="absolute right-2 top-2 p-2 bg-white text-black rounded hover:bg-gray-200 disabled:opacity-50"
          >
            <MessageSquare size={16} />
          </button>
        </div>
        
        {status === 'DENIED' && (
          <div className="mt-4 text-center">
             <p className="text-danger font-black uppercase text-sm animate-pulse mb-4">JUSTIFICATION REJECTED</p>
             <button onClick={onCancel} className="w-full py-3 bg-white text-black font-black uppercase tracking-widest hover:bg-gray-200 rounded-lg">
               I Accept My Duty
             </button>
          </div>
        )}
      </div>
    </div>
  );
};
