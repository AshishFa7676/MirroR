
import { GoogleGenAI, Type } from "@google/genai";
import { LogEntry, Task, UserProfile } from "../types";

const MODEL_NAME = "gemini-3-flash-preview";
const PRO_MODEL = "gemini-3-pro-preview"; // Used for deeper technical audits
const getAi = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const GeminiService = {
  async analyzeOnboarding(responses: any): Promise<void> {
    const ai = getAi();
    await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `OBLIGATION INTAKE: ${JSON.stringify(responses)}`,
      config: {
        systemInstruction: `ROLE: Amon (Master Behavioral Pathologist). Analyze intellectual procrastination patterns for a Data Analyst trainee.`,
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
        systemInstruction: `ROLE: Amon. Generate ONE forensic question (max 12 words) to stop a procrastination event.`,
        thinkingConfig: { thinkingBudget: 2000 }
      },
    });
    return response.text?.trim() || "Is this delay a strategy or a symptom?";
  },

  async generateTechnicalQuiz(taskTitle: string): Promise<string[]> {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `VERIFICATION_AUDIT: "${taskTitle}"`,
      config: {
        systemInstruction: `Generate 3 HIGHLY SPECIFIC technical questions (SQL/Python/BI). Return JSON array of strings.`,
        responseMimeType: "application/json",
        responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    });
    return JSON.parse(response.text || "[]");
  },

  async gradeQuiz(questions: string[], answers: string[]): Promise<{passed: boolean, feedback: string}> {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `EVIDENCE: Q: ${JSON.stringify(questions)} | A: ${JSON.stringify(answers)}`,
      config: {
        systemInstruction: `ROLE: Senior Analyst Lead. Fail vague answers. Return JSON: {passed, feedback}.`,
        responseMimeType: "application/json",
        responseSchema: { 
          type: Type.OBJECT, 
          properties: { passed: { type: Type.BOOLEAN }, feedback: { type: Type.STRING } },
          required: ["passed", "feedback"]
        }
      }
    });
    return JSON.parse(response.text || '{"passed": false, "feedback": "Evidence rejected."}');
  },

  async verifyTechnicalEvidence(taskTitle: string, evidence: string): Promise<{passed: boolean, audit: string}> {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: PRO_MODEL,
      contents: `AUDIT_TASK: "${taskTitle}"\nSUBMITTED_EVIDENCE: "${evidence}"`,
      config: {
        systemInstruction: `ROLE: Technical Auditor. Verify if the evidence is legitimate SQL/Python/Logic related to the task or if it's filler/evasive text. Be ruthless. Return JSON: {passed: boolean, audit: string}.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { passed: { type: Type.BOOLEAN }, audit: { type: Type.STRING } },
          required: ["passed", "audit"]
        }
      }
    });
    return JSON.parse(response.text || '{"passed": false, "audit": "Audit system failure."}');
  },

  async reflectOnJournal(entry: string, profile: UserProfile): Promise<string> {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `NEURAL DUMP: "${entry}"`,
      config: {
        systemInstruction: `ROLE: Amon. Puncture the user's rationalization in one sharp sentence.`
      }
    });
    return response.text || "Words without action are just noise.";
  },

  async analyzeBehaviorLogs(logs: LogEntry[], profile: UserProfile, history: any[]): Promise<string> {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `AUDIT_LOGS: ${JSON.stringify(logs.slice(0, 100))} | SUBJECT_PROFILE: ${JSON.stringify(profile)}`,
      config: {
        systemInstruction: `ROLE: Amon (Master Behavioral Pathologist). Analyze behavior logs clinically. Use Markdown.`,
        thinkingConfig: { thinkingBudget: 4000 }
      }
    });
    return response.text || "Analysis failed to penetrate the subject's defenses.";
  }
};
