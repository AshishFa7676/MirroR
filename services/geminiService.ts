
import { GoogleGenAI, Type } from "@google/genai";
import { LogEntry, Task, UserProfile, JournalEntry, PatternAnalysis, LogType } from "../types";

// CONFIGURATION FOR REAL-WORLD DEPLOYMENT
// We use 2.5 Flash for high-speed interaction (Gatekeeper, Verifier)
// We use 3.0 Pro for deep analytical reasoning (Pattern Analysis)
const MODEL_NAME = "gemini-2.5-flash-latest";
const PRO_MODEL = "gemini-3-pro-preview"; 

const getAi = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to clean Markdown JSON
const cleanJSON = (text: string) => {
  if (!text) return text;
  return text.replace(/```json\n?|\n?```/g, "").trim();
};

export const GeminiService = {
  async analyzeOnboarding(responses: any): Promise<void> {
    const ai = getAi();
    await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `OBLIGATION INTAKE: ${JSON.stringify(responses)}`,
      config: {
        systemInstruction: `ROLE: Amon (Master Behavioral Pathologist). Analyze intellectual procrastination patterns for a Data Analyst trainee.`,
        thinkingConfig: { thinkingBudget: 1024 }
      }
    });
  },

  // --- Socratic Gatekeeper ---
  async gatekeeperInterrogation(taskTitle: string, userReason: string, chatHistory: string[]): Promise<{verdict: 'ALLOW' | 'DENY' | 'CONTINUE', response: string}> {
    const ai = getAi();
    
    // Check turn count to enforce depth
    const turns = chatHistory.length / 2; // Approximate turns

    const result = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `TASK: "${taskTitle}"
      USER WANTS TO PAUSE.
      REASON: "${userReason}"
      HISTORY: ${JSON.stringify(chatHistory)}
      TURNS_SO_FAR: ${turns}
      
      INSTRUCTIONS:
      1. You are the Socratic Gatekeeper.
      2. Unless the reason is a clear MEDICAL EMERGENCY or FAMILY CRISIS, you MUST NOT allow the pause until you have asked at least 3 probing questions to expose the user's laziness or fear.
      3. If turns < 3 and not emergency, return verdict "CONTINUE" and ask a sharp, uncomfortable question about why they are avoiding the work.
      4. If turns >= 3, you may render a verdict (ALLOW or DENY) based on whether their justification holds up to scrutiny.
      5. If DENY, provide a savage, motivating rebuttal.
      `,
      config: {
        systemInstruction: "You are Amon. Cold, logical, relentless. You do not accept 'tired' or 'bored' as valid reasons. You force the user to confront their avoidance.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            verdict: { type: Type.STRING, enum: ['ALLOW', 'DENY', 'CONTINUE'] },
            response: { type: Type.STRING }
          },
          required: ['verdict', 'response']
        }
      }
    });
    
    try {
      return JSON.parse(cleanJSON(result.text || ''));
    } catch (e) {
      return { verdict: "CONTINUE", response: "I cannot process that. Speak clearly. Why are you stopping?" };
    }
  },

  // --- Completion Verifier ---
  async verifyTaskCompletion(task: Task, evidence: string): Promise<{score: number, feedback: string, isValid: boolean}> {
    const ai = getAi();
    const result = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `TASK: ${task.title}
      DESC: ${task.description}
      USER EVIDENCE: "${evidence}"
      
      Verify if the user actually completed the task based on their description. 
      Score from 0-100.
      < 60 is a FAIL (suspicious, vague, too short).
      > 60 is a PASS (detailed, specific, matches expectations).
      
      Provide a short, punchy feedback sentence.`,
      config: {
        systemInstruction: "You are the Completion Auditor. You are skeptical. Vague answers get low scores (<40). Technical details get high scores. Be strict.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            feedback: { type: Type.STRING },
            isValid: { type: Type.BOOLEAN }
          },
          required: ['score', 'feedback', 'isValid']
        }
      }
    });
    
    try {
      return JSON.parse(cleanJSON(result.text || ''));
    } catch (e) {
      return { score: 0, feedback: "Verification system error. Integrity questionable.", isValid: false };
    }
  },

  // --- Deep Pattern Analysis (USES GEMINI 3.0 PRO) ---
  async generatePatternAnalysis(
    tasks: Task[], 
    logs: LogEntry[], 
    journals: JournalEntry[]
  ): Promise<PatternAnalysis> {
    const ai = getAi();
    
    const taskSummary = tasks.map(t => ({ title: t.title, status: t.status, duration: t.accumulatedTimeSeconds, attempts: t.escapeAttempts }));
    
    const deepLogs = logs.map(l => {
        if (l.type === LogType.REFLECTION_SUBMITTED) {
           return { type: l.type, timestamp: l.timestamp, detail: l.content, metadata: l.metadata };
        }
        if (l.type === LogType.GHOSTING_DETECTED || l.type === LogType.TASK_DELETED) {
           return { type: l.type, timestamp: l.timestamp, reason: l.metadata };
        }
        return { type: l.type, time: new Date(l.timestamp).getHours() };
    });

    const journalSummary = journals.slice(0, 50).map(j => ({ 
        date: new Date(j.timestamp).toDateString(),
        content: j.content.substring(0, 300),
        stats: j.metadata 
    }));

    const result = await ai.models.generateContent({
      model: PRO_MODEL,
      contents: `
        ANALYZE THIS USER DATA:
        TASKS: ${JSON.stringify(taskSummary)}
        LOGS (Includes Reflections): ${JSON.stringify(deepLogs)}
        JOURNALS: ${JSON.stringify(journalSummary)}
      `,
      config: {
        systemInstruction: `
          You are Amon, the Master Behavioral Pathologist. 
          Analyze the user's procrastination patterns.
          Identify escape patterns, peak hours, self-deception, and the "Honest Truth".
          Return strictly structured JSON matching the schema.
        `,
        thinkingConfig: { thinkingBudget: 4096 }, // Increased budget for Deep Analysis on Pro model
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.NUMBER },
            primaryPattern: { type: Type.STRING },
            escapePatterns: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  pattern: { type: Type.STRING },
                  frequency: { type: Type.STRING },
                  triggerTime: { type: Type.STRING }
                }
              }
            },
            productivityInsights: {
              type: Type.OBJECT,
              properties: {
                peakHours: { type: Type.ARRAY, items: { type: Type.STRING } },
                worstHours: { type: Type.ARRAY, items: { type: Type.STRING } },
                bestCategory: { type: Type.STRING },
                worstCategory: { type: Type.STRING }
              }
            },
            excusePatterns: { type: Type.ARRAY, items: { type: Type.STRING } },
            selfDeceptionFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            urgentRecommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  recommendation: { type: Type.STRING },
                  reason: { type: Type.STRING }
                }
              }
            },
            honestTruth: { type: Type.STRING }
          },
          required: ['overallScore', 'primaryPattern', 'escapePatterns', 'productivityInsights', 'excusePatterns', 'selfDeceptionFlags', 'strengths', 'urgentRecommendations', 'honestTruth']
        }
      }
    });

    try {
      return JSON.parse(cleanJSON(result.text || '{}')) as PatternAnalysis;
    } catch (e) {
      console.error("Pattern Analysis Parse Error", e);
      throw e;
    }
  },

  async reflectOnJournal(entry: string, profile: UserProfile): Promise<string> {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `NEURAL DUMP: "${entry}"`,
      config: {
        systemInstruction: `ROLE: Amon. Puncture the user's rationalization in one sharp, cold sentence.`
      }
    });
    return response.text || "Words without action are just noise.";
  },

  async analyzeBehaviorLogs(logs: LogEntry[], profile: UserProfile): Promise<string> {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `AUDIT_LOGS: ${JSON.stringify(logs.slice(0, 100))} | SUBJECT_PROFILE: ${JSON.stringify(profile)}`,
      config: {
        systemInstruction: `ROLE: Amon (Master Behavioral Pathologist). Analyze behavior logs clinically. Use Markdown formatting.`,
        thinkingConfig: { thinkingBudget: 2000 }
      }
    });
    return response.text || "Analysis failed to penetrate the subject's defenses.";
  }
};
