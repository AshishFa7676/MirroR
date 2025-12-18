
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { GeminiService } from '../services/geminiService';
import { ShieldAlert, ArrowRight, Loader2 } from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [responses, setResponses] = useState({
    situation: '',
    distractions: '',
    routine: '',
    delayReason: ''
  });
  const [isAnalysing, setIsAnalysing] = useState(false);

  const handleNext = () => {
    if (step < 4) setStep(s => s + 1);
    else finalize();
  };

  const finalize = async () => {
    setIsAnalysing(true);
    try {
      await GeminiService.analyzeOnboarding(responses);
    } catch (e) {
      console.warn("Amon initial audit timeout.");
    }
    // Fix: Added missing 'integrityDebt' required property to the UserProfile object
    const profile: UserProfile = {
      situation: responses.situation,
      distractions: responses.distractions,
      routine: responses.routine,
      delayReason: responses.delayReason,
      deadlineDate: new Date('2025-12-25').getTime(),
      hasCompletedOnboarding: true,
      sprintGoals: ['SQL ARCHITECTURE', 'PYTHON ANALYSIS', 'BI DASHBOARDS', 'EXCEL MODELS', 'STATS'],
      integrityDebt: 0
    };
    onComplete(profile);
  };

  const questions = [
    { key: 'situation', label: 'DESCRIBE THE FAILURE.', sub: 'Detail why the Analyst role has been delayed for 6 months.' },
    { key: 'distractions', label: 'THE INTELLECTUAL SHIELDS.', sub: 'Identify the news/research you use to avoid execution.' },
    { key: 'routine', label: 'THE FABRICATED DAY.', sub: 'Detail your day as it is, not as you wish it to be.' },
    { key: 'delayReason', label: 'THE 180-DAY VOID.', sub: 'Identify the specific lie you have lived since June.' }
  ];

  const q = questions[step - 1];
  const currentVal = (responses as any)[q.key] || '';
  const canContinue = currentVal.trim().length >= 10;

  return (
    <div className="fixed inset-0 bg-void z-[500] flex flex-col items-center justify-center p-6 md:p-12 overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="h-full w-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-danger via-transparent to-transparent" />
      </div>

      <div className="w-full max-w-2xl bg-surface/90 border-2 border-gray-900 p-8 md:p-16 relative shadow-[0_0_100px_rgba(0,0,0,1)]">
        <div className="absolute top-0 left-0 w-full h-1 bg-danger shadow-[0_0_15px_#7f1d1d]" />
        
        <div className="mb-10 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-4 text-danger font-black text-[10px] tracking-[0.6em] mb-6 uppercase animate-pulse">
            <ShieldAlert size={16}/> INITIATION // PHASE {step}/4
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none mb-6">
            {q.label}
          </h1>
          <p className="text-gray-500 font-mono text-xs uppercase tracking-[0.2em] leading-relaxed italic">
            {q.sub}
          </p>
        </div>

        <div className="relative mb-12 group">
          <textarea 
            autoFocus
            value={currentVal}
            onChange={e => setResponses({...responses, [q.key]: e.target.value})}
            className="w-full h-48 md:h-64 bg-black/60 border-2 border-gray-800 p-8 text-white font-mono text-lg md:text-2xl focus:border-danger outline-none transition-all resize-none shadow-inner"
            placeholder="Etch your admission..."
          />
          <div className={`absolute bottom-4 right-6 text-[10px] font-black tracking-widest ${canContinue ? 'text-success' : 'text-danger'}`}>
            {currentVal.trim().length} / 10 CHARS
          </div>
        </div>

        <button 
          onClick={handleNext}
          disabled={!canContinue || isAnalysing}
          className={`
            w-full py-8 font-black uppercase tracking-[0.8em] text-sm md:text-lg flex items-center justify-center gap-6 transition-all
            ${canContinue ? 'bg-white text-black hover:bg-danger hover:text-white shadow-2xl active:scale-95' : 'bg-gray-900 text-gray-700 opacity-50 cursor-not-allowed'}
          `}
        >
          {isAnalysing ? (
            <>
              <Loader2 className="animate-spin" size={24}/>
              <span>ETCHING...</span>
            </>
          ) : (
            <>
              <span>SUBMIT TO REGISTRY</span>
              <ArrowRight size={24}/>
            </>
          )}
        </button>
        
        <div className="mt-16 flex justify-center gap-6">
           {[1,2,3,4].map(i => (
             <div key={i} className={`h-1.5 w-16 transition-all duration-700 ${i <= step ? 'bg-danger shadow-[0_0_15px_#7f1d1d]' : 'bg-gray-900'}`} />
           ))}
        </div>
      </div>
    </div>
  );
};
