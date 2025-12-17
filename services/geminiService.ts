
import { GoogleGenAI, Type } from "@google/genai";
import { LogEntry, Task, UserProfile } from "../types";

const MODEL_NAME = "gemini-3-flash-preview";

// Helper to get fresh AI instance
const getAi = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const GeminiService = {
  async analyzeOnboarding(responses: any): Promise<void> {
    const ai = getAi();
    await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `OBLIGATION INTAKE: ${JSON.stringify(responses)}`,
      config: {
        systemInstruction: `
          ROLE: Amon (Master Behavioral Pathologist).
          DATA: User is an intellectual procrastinator. 180 days of failure.
          MISSION: Analyst Sprint (SQL, Python, BI, Excel, Stats).
          TASK: Create a ruthless psychological profile. Identify the user's "Shield" (the intellectual activity they use to hide).
        `,
        thinkingConfig: { thinkingBudget: 4000 }
      }
    });
  },

  async getSocraticQuestion(task: Task, profile: UserProfile, history: string[], currentStep: number): Promise<string> {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `REPUDIATION ATTEMPT: ${task.title}. LOGS: ${JSON.stringify(history.slice(-10))}`,
      config: {
        systemInstruction: `
          ROLE: Amon. User is trying to delete or avoid a task. 
          Invoke their 6-month delay. Force them to confront the Dec 25 deadline.
          Ask ONE forensic question (max 12 words) that cuts through their rationalization.
        `,
        thinkingConfig: { thinkingBudget: 2000 }
      },
    });
    return response.text?.trim() || "Does this retreat feel familiar, or is it merely a continuation of your last six months?";
  },

  async generateTechnicalQuiz(taskTitle: string): Promise<string[]> {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `VERIFICATION_AUDIT: "${taskTitle}"`,
      config: {
        systemInstruction: `
          Generate 3 HIGHLY SPECIFIC technical questions for a Data Analyst regarding "${taskTitle}".
          Focus on SQL, Python, or BI logic. No generic questions.
          Return ONLY a JSON array of 3 strings.
        `,
        responseMimeType: "application/json",
        responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    });
    try {
      return JSON.parse(response.text || "[]");
    } catch {
      return ["Explain the specific SQL optimization you utilized.", "Detail the data cleaning logic for this module.", "Identify the potential bias in your dataset."];
    }
  },

  async gradeQuiz(questions: string[], answers: string[]): Promise<{passed: boolean, feedback: string}> {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `EVIDENCE: Q: ${JSON.stringify(questions)} | A: ${JSON.stringify(answers)}`,
      config: {
        systemInstruction: `
          ROLE: Senior Analyst Lead (Ruthless).
          FAIL criteria: Vague answers, generic definitions, or lack of technical rigor.
          Return JSON: { "passed": boolean, "feedback": string }.
        `,
        responseMimeType: "application/json",
        responseSchema: { 
          type: Type.OBJECT, 
          properties: { 
            passed: { type: Type.BOOLEAN }, 
            feedback: { type: Type.STRING } 
          },
          required: ["passed", "feedback"]
        }
      }
    });
    return JSON.parse(response.text || '{"passed": false, "feedback": "Evidence rejected."}');
  },

  async generateInquisitionQuestions(logs: LogEntry[], profile: UserProfile): Promise<string[]> {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `REGISTRY_AUDIT: ${JSON.stringify(logs.slice(0, 30))}`,
      config: {
        systemInstruction: `
          Generate 3 forensic questions based on these logs.
          Target their pattern of intellectual procrastination.
          Return ONLY a JSON array of 3 strings.
        `,
        responseMimeType: "application/json",
        responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    });
    try {
      return JSON.parse(response.text || "[]");
    } catch {
      return ["Why did you prioritize passive consumption at 11:00 AM?", "Identify the lie behind your most recent delay.", "Quantify the cost of your 6-month avoidance."];
    }
  },

  async analyzeBehaviorLogs(logs: LogEntry[], profile: UserProfile, inquisitionAnswers?: string[]): Promise<string> {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `FULL REGISTRY: ${JSON.stringify(logs.slice(0, 50))}. ANSWERS: ${JSON.stringify(inquisitionAnswers)}`,
      config: {
        systemInstruction: `
          ROLE: Amon (Master Pathologist).
          TASK: Final Forensic Autopsy of the week.
          1. The Pattern.
          2. The Lie.
          3. The Three Commands for Execution.
          Target the Dec 18-25 Analyst sprint.
        `,
        thinkingConfig: { thinkingBudget: 8000 }
      }
    });
    return response.text || "The registry is silent. Your failure is loud.";
  },

  async reflectOnJournal(entry: string, profile: UserProfile): Promise<string> {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `NEURAL DUMP: "${entry}"`,
      config: {
        systemInstruction: `ROLE: Amon. Analyze this dump. Find the rationalization and puncture it with one sharp sentence.`
      }
    });
    return response.text || "A labyrinth of words to hide the fact that you still haven't started.";
  }
};
