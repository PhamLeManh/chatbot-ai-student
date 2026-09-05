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

const aiConfig = {
  model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  temperature: 0.7,
  max_tokens: 2000,
  isAIConfigured: () => {
    return Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== '');
  }
};

module.exports = {
  getOpenAIClient,
  aiConfig
};
