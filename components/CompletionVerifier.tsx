import React, { useState, useEffect } from 'react';
import { GeminiService } from '../services/geminiService';
import { Task } from '../types';
import { CheckCircle, AlertTriangle, Loader2, CalendarClock } from 'lucide-react';

interface CompletionVerifierProps {
  task: Task;
  onVerified: () => void;
  onFail: (shouldReschedule: boolean) => void;
  onCancel: () => void;
}

// Simple particle system for confetti
const Confetti = () => {
  const particles = Array.from({ length: 50 });
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      {particles.map((_, i) => (
        <div 
          key={i}
          className="absolute w-2 h-2 bg-primary rounded-full animate-[fall_1s_ease-out_forwards]"
          style={{
            left: `${Math.random() * 100}%`,
            top: '-10px',
            backgroundColor: ['#f97316', '#ef4444', '#10b981', '#ffffff'][Math.floor(Math.random() * 4)],
            animationDuration: `${1 + Math.random()}s`,
            animationDelay: `${Math.random() * 0.5}s`
          }}
        />
      ))}
      <style>{`
        @keyframes fall {
          to { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export const CompletionVerifier: React.FC<CompletionVerifierProps> = ({ task, onVerified, onFail, onCancel }) => {
  const [evidence, setEvidence] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<{score: number, feedback: string, isValid: boolean} | null>(null);

  const handleSubmit = async () => {
    if (!evidence.trim()) return;
    setVerifying(true);
    try {
      const res = await GeminiService.verifyTaskCompletion(task, evidence);
      setResult(res);
      if (res.score >= 60) {
        setTimeout(onVerified, 3000); // 3 seconds to enjoy confetti
      }
    } catch (e) {
      setResult({ score: 0, feedback: "Verification service offline. Integrity check failed.", isValid: false });
    }
    setVerifying(false);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4">
      {result && result.score >= 60 && <Confetti />}
      
      <div className="bg-surface border border-gray-800 p-8 max-w-lg w-full rounded-2xl shadow-2xl relative overflow-hidden">
        {!result ? (
          <>
            <h2 className="text-2xl font-black text-white uppercase mb-2">Proof of Work</h2>
            <p className="text-gray-500 text-sm mb-6">Describe exactly what was accomplished. The AI Auditor will verify.</p>
            
            <textarea 
              autoFocus
              value={evidence}
              onChange={e => setEvidence(e.target.value)}
              className="w-full h-32 bg-black border border-gray-700 p-4 text-white rounded-lg focus:border-white outline-none mb-6 resize-none"
              placeholder="I implemented the feature by..."
            />
            
            <div className="flex gap-3">
              <button onClick={onCancel} className="flex-1 py-3 text-gray-500 font-bold text-xs uppercase hover:text-white">Cancel</button>
              <button 
                onClick={handleSubmit} 
                disabled={verifying || !evidence.trim()}
                className="flex-1 py-3 bg-white text-black font-black uppercase text-xs rounded-lg hover:bg-gray-200 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {verifying && <Loader2 className="animate-spin" size={14}/>}
                Verify
              </button>
            </div>
          </>
        ) : (
          <div className="text-center space-y-6">
            {result.score >= 60 ? (
               <div className="animate-in zoom-in duration-300">
                 <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                   <CheckCircle className="text-success" size={40} />
                 </div>
                 <h2 className="text-3xl font-black text-white uppercase tracking-tighter">VERIFIED</h2>
                 <div className="text-success font-mono text-xl mt-1">{result.score}/100</div>
                 <p className="text-gray-500 text-xs uppercase tracking-widest mt-2">Protocol Complete</p>
               </div>
            ) : (
               <div className="animate-in shake duration-300">
                 <div className="w-20 h-20 bg-danger/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="text-danger" size={40} />
                 </div>
                 <h2 className="text-3xl font-black text-white uppercase tracking-tighter">REJECTED</h2>
                 <div className="text-danger font-mono text-xl mt-1">{result.score}/100</div>
                 <p className="text-gray-500 text-xs uppercase tracking-widest mt-2">Insufficient Evidence</p>
               </div>
            )}
            
            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800">
               <p className="text-gray-300 italic text-sm">"{result.feedback}"</p>
            </div>
            
            {result.score < 60 && (
              <div className="flex gap-3">
                 <button onClick={() => onFail(false)} className="flex-1 py-3 bg-gray-800 text-gray-400 font-bold uppercase text-xs rounded-lg hover:bg-gray-700">
                   Keep Active
                 </button>
                 <button onClick={() => onFail(true)} className="flex-1 py-3 bg-gradient-primary text-white font-bold uppercase text-xs rounded-lg hover:brightness-110 flex items-center justify-center gap-2">
                   <CalendarClock size={14} /> Reschedule
                 </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};