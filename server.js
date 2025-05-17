require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const OpenAI = require('openai');
const path = require('path');

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false
});

// API Routes
app.use('/api/', apiLimiter);

// DeepSeek Client
const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: process.env.DEEPSEEK_API_KEY
});

// Public API Endpoints
app.get('/api/v1/status', (req, res) => {
  res.json({
    status: 'operational',
    version: '1.2.0',
    timestamp: new Date().toISOString(),
    services: {
      deobfuscation: true,
      code_analysis: true
    }
  });
});

// Main Processing Endpoint
app.post('/api/v1/process', async (req, res) => {
  try {
    const { code, filename } = req.body;
    
    const completion = await openai.chat.completions.create({
      model: "deepseek-r1",
      messages: [
        { 
          role: "system", 
          content: `Deobfuscate this ${filename ? filename.split('.').pop() : 'code'} and return clean version.`
        },
        { role: "user", content: code }
      ],
      temperature: 0.2,
      max_tokens: 4096
    });

    res.json({
      success: true,
      result: completion.choices[0].message.content,
      metadata: {
        model: "deepseek-r1",
        tokens_used: completion.usage.total_tokens,
        detected_language: detectLanguage(filename, code)
      }
    });
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code
    });
  }
});

// Static File Serving
app.use(express.static(path.join(__dirname, 'public')));

// Fallback Route for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Helper Functions
function detectLanguage(filename, code) {
  const extension = filename?.split('.').pop()?.toLowerCase() || '';
  const codePatterns = {
    js: /(function|const|let|var|=>)/,
    py: /(def|import|print|class)/,
    html: /(<html|<!DOCTYPE|<\/\w+>)/,
    css: /({|}|;|:\s)/,
    json: /({|}|\[|\]|":)/,
  };

  if (extension && codePatterns[extension]) return extension;
  for (const [lang, pattern] of Object.entries(codePatterns)) {
    if (pattern.test(code)) return lang;
  }
  return 'txt';
}

// Server Configuration
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API Endpoints:`);
  console.log(`- GET  /api/v1/status`);
  console.log(`- POST /api/v1/process`);
  console.log(`Web Interface: http://localhost:${PORT}`);
});
