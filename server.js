require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// DeepSeek Client
const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: process.env.DEEPSEEK_API_KEY
});

// Proxy Endpoint
app.post('/api/v1/deobfuscate', async (req, res) => {
  try {
    const { code, filename } = req.body;
    
    const completion = await openai.chat.completions.create({
      model: "deepseek-r1",
      messages: [
        { 
          role: "system", 
          content: `As a code deobfuscation expert, return only clean code. Detect language from ${filename}`
        },
        { role: "user", content: code }
      ],
      temperature: 0.2,
      max_tokens: 4096
    });

    res.json({
      success: true,
      code: completion.choices[0].message.content,
      detectedLanguage: detectLanguage(filename, completion.choices[0].message.content)
    });
    
  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

function detectLanguage(filename, code) {
  const ext = filename?.split('.').pop()?.toLowerCase() || '';
  if (ext) return ext;
  if (code.includes('<html')) return 'html';
  if (code.includes('function')) return 'js';
  if (code.includes('package')) return 'json';
  return 'txt';
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy server running: http://localhost:${PORT}`);
});