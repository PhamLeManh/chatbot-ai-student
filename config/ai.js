const { OpenAI } = require('openai');

let openaiClient = null;

const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey && apiKey.trim() !== '') {
    if (!openaiClient) {
      openaiClient = new OpenAI({
        apiKey: apiKey.trim(),
      });
      console.log('[AI Config] Đã kết nối với OpenAI API.');
    }
    return openaiClient;
  }

  return null;
};

const getGeminiApiKey = () => {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  return key && key.trim() !== '' ? key.trim() : null;
};

const aiConfig = {
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  temperature: 0.7,
  max_tokens: 2048,
  isAIConfigured: () => {
    return Boolean(
      (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== '') ||
      (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '') ||
      (process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY.trim() !== '')
    );
  }
};

module.exports = {
  getOpenAIClient,
  getGeminiApiKey,
  aiConfig
};
