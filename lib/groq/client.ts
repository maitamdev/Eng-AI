import Groq from 'groq-sdk';

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

export const MODELS = {
  fast: 'llama-3.1-8b-instant',      // Real-time conversation chat
  smart: 'llama-3.3-70b-versatile',  // Essay corrections, deep grading
  balanced: 'mixtral-8x7b-32768',    // Default balanced responses
};
