
import React, { useState, useEffect } from 'react';
import { UserProfile, LogType } from '../types';
import { GeminiService } from '../services/geminiService';
import { ShieldAlert, ArrowRight, Loader2, Brain } from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
  addLog: (type: LogType, content: string, metadata?: any) => void; 
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, addLog }) => {
  const [step, setStep] = useState(1);
  const [responses, setResponses] = useState({
    situation: '',
    distractions: '',
    routine: '',
    delayReason: ''
  });
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [completedProfile, setCompletedProfile] = useState<UserProfile | null>(null);

  // Restore state from local storage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mirror_onboarding_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.responses) setResponses(parsed.responses);
        if (parsed.step) setStep(parsed.step);
      }
    } catch (e) {
      console.warn("Failed to load onboarding draft");
    }
  }, []);

  // Save state on change
  useEffect(() => {
    localStorage.setItem('mirror_onboarding_draft', JSON.stringify({ step, responses }));
  }, [step, responses]);

  const handleNext = () => {
    if (step < 4) setStep(s => s + 1);
    else finalize();
  };

  const finalize = () => {
    const now = Date.now();
    addLog(LogType.CONFESSION, "INITIATION COMPLETED: Subject has submitted initial behavioral vectors.", {
       onboardingResponses: responses,
       completionTime: now
    });

    const profile: UserProfile = {
      id: 'user_profile',
      situation: responses.situation,
      distractions: responses.distractions,
      routine: responses.routine,
      delayReason: responses.delayReason,
      deadlineDate: new Date('2025-12-25').getTime(),
      hasCompletedOnboarding: true,
      sprintGoals: ['SQL ARCHITECTURE', 'PYTHON ANALYSIS', 'BI DASHBOARDS', 'EXCEL MODELS', 'STATS'],
      integrityDebt: 0
    };
    
    localStorage.removeItem('mirror_onboarding_draft');
    setCompletedProfile(profile);
  };

  const runOptionalAnalysis = async () => {
    setIsAnalysing(true);
    try {
       await GeminiService.analyzeOnboarding(responses);
    } catch (e) { console.warn(e); }
    setIsAnalysing(false);
    if(completedProfile) onComplete(completedProfile);
  };

  const questions = [
    { key: 'situation', label: 'DESCRIBE THE FAILURE.', sub: 'Detail why the Analyst role has been delayed for 6 months.' },
    { key: 'distractions', label: 'THE INTELLECTUAL SHIELDS.', sub: 'Identify the news/research you use to avoid execution.' },
    { key: 'routine', label: 'THE FABRICATED DAY.', sub: 'Detail your day as it is, not as you wish it to be.' },
    { key: 'delayReason', label: 'THE 180-DAY VOID.', sub: 'Identify the specific lie you have lived since June.' }
  ];

  if (completedProfile) {
      return (
          <div className="fixed inset-0 bg-background z-[500] flex flex-col items-center justify-center p-6 text-center">
             <h1 className="text-4xl font-black text-white mb-6 uppercase tracking-tighter">Initiation Complete</h1>
             <p className="text-gray-500 mb-10 max-w-md">Your responses have been archived. You may optionally request Amon to perform a deep-dive behavioral audit on your submission before proceeding.</p>
             <div className="flex gap-4">
                <button onClick={() => onComplete(completedProfile)} className="px-6 py-3 border border-gray-700 text-gray-400 font-bold uppercase hover:text-white rounded-lg">
                    Skip & Enter
                </button>
                <button onClick={runOptionalAnalysis} disabled={isAnalysing} className="px-6 py-3 bg-danger text-white font-bold uppercase rounded-lg flex items-center gap-2 shadow-glow hover:bg-red-600">
                    {isAnalysing ? <Loader2 className="animate-spin" /> : <Brain size={18}/>}
                    {isAnalysing ? "Analyzing..." : "Request Audit"}
                </button>
             </div>
          </div>
      );
  }

  const q = questions[step - 1];
  const currentVal = (responses as any)[q.key] || '';
  const canContinue = currentVal.trim().length >= 10;

  return (
    <div className="fixed inset-0 bg-background z-[500] flex flex-col items-center justify-center p-6 md:p-12 overflow-y-auto selection:bg-danger/30">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="h-full w-full bg-[radial-gradient(circle_at_center,_#ef4444_0%,_transparent_60%)] opacity-20" />
      </div>

      <div className="w-full max-w-2xl bg-surface/90 border border-border p-8 md:p-16 relative shadow-2xl backdrop-blur-xl rounded-2xl flex flex-col min-h-[60vh]">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-danger to-orange-600" />
        
        <div className="mb-6 md:mb-10 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-4 text-danger font-black text-[10px] tracking-[0.6em] mb-4 md:mb-6 uppercase animate-pulse">
            <ShieldAlert size={16}/> INITIATION // PHASE {step}/4
          </div>
          <h1 className="text-2xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none mb-4 md:mb-6">
            {q.label}
          </h1>
          <p className="text-gray-500 font-mono text-xs uppercase tracking-[0.2em] leading-relaxed italic">
            {q.sub}
          </p>
        </div>

        <div className="relative mb-8 md:mb-12 group flex-1">
          <textarea 
            autoFocus
            value={currentVal}
            onChange={e => setResponses({...responses, [q.key]: e.target.value})}
            className="w-full h-full min-h-[150px] bg-black/60 border border-border p-6 md:p-8 text-white font-mono text-base md:text-2xl focus:border-danger outline-none transition-all resize-none shadow-inner rounded-xl"
            placeholder="Etch your admission..."
          />
          <div className={`absolute bottom-4 right-6 text-[10px] font-black tracking-widest ${canContinue ? 'text-success' : 'text-danger'}`}>
            {currentVal.trim().length} / 10 CHARS
          </div>
        </div>

        <button 
          onClick={handleNext}
          disabled={!canContinue}
          className={`
            w-full py-4 md:py-6 font-black uppercase tracking-[0.5em] text-sm md:text-lg flex items-center justify-center gap-6 transition-all rounded-xl mt-auto
            ${canContinue ? 'bg-white text-black hover:bg-danger hover:text-white shadow-lg active:scale-95' : 'bg-card text-gray-600 cursor-not-allowed border border-border'}
          `}
        >
          <span>{step === 4 ? 'COMMIT' : 'NEXT'}</span>
          <ArrowRight size={24}/>
        </button>
        
        <div className="mt-8 md:mt-16 flex justify-center gap-4">
           {[1,2,3,4].map(i => (
             <div key={i} className={`h-1 w-12 rounded-full transition-all duration-700 ${i <= step ? 'bg-danger shadow-glow' : 'bg-border'}`} />
           ))}
        </div>
      </div>
    </div>
  );
};
