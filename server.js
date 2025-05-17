require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const OpenAI = require('openai');
const path = require('path');
const fs = require('fs');

const app = express();

// Security Middlewares
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: 'Too many requests, please try again later' }
});
app.use('/api/', limiter);

// DeepSeek Configuration
const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: process.env.DEEPSEEK_API_KEY
});

// API Endpoints
app.get('/api/v1/status', (req, res) => {
  res.json({
    service: 'AI Deobfuscator',
    version: '2.3.1',
    status: 'operational',
    timestamp: new Date().toISOString(),
    limits: {
      file_size: '50MB',
      requests: '1000/15min'
    }
  });
});

app.post('/api/v1/deobfuscate', async (req, res) => {
  try {
    const { code, filename, options } = req.body;
    
    // Validate input
    if (!code || code.length > 10_000_000) {
      return res.status(400).json({ 
        error: 'Invalid input: Code is required and must be less than 10MB' 
      });
    }

    // Process with DeepSeek
    const completion = await openai.chat.completions.create({
      model: "deepseek-reasoner",
      messages: [
        { 
          role: "system", 
          content: `As AI OF LAUTECH code deobfuscator, return only clean code. ${options?.instructions || ''}`
        },
        { role: "user", content: code }
      ],
      temperature: 0.2,
      max_tokens: 4096
    });

    // Prepare response
    const result = {
      success: true,
      original_length: code.length,
      processed_length: completion.choices[0].message.content.length,
      detected_language: detectLanguage(filename, code),
      processing_time: Date.now() - res.locals.startTime,
      result: completion.choices[0].message.content,
      metadata: {
        model: "deepseek-reasoner",
        tokens_used: completion.usage.total_tokens,
        api_version: "v2.3"
      }
    };

    // Cache result
    if (process.env.NODE_ENV === 'production') {
      cacheResult(result);
    }

    res.json(result);

  } catch (error) {
    console.error('Deobfuscation Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      error_code: error.code
    });
  }
});

// Static Files and SPA Fallback
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Helper Functions
function detectLanguage(filename, code) {
  const extension = filename?.split('.').pop()?.toLowerCase() || '';
  const codeSignatures = {
    js: /(function|=>|const|let|var)/,
    py: /(def|import|from|class|print)/,
    html: /(<\!DOCTYPE|<\/?\w+>)/,
    css: /(\{|\}|;|:\s)/,
    json: /(\{|\}|\[|\])/
  };
  return extension || Object.entries(codeSignatures).find(([_, re]) => 
    re.test(code))?.[0] || 'txt';
}

function cacheResult(result) {
  const cacheEntry = {
    timestamp: new Date().toISOString(),
    ...result
  };
  fs.appendFile('cache.log', JSON.stringify(cacheEntry) + '\n', (err) => {
    if (err) console.error('Caching failed:', err);
  });
}

// Server Initialization
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API Documentation: http://localhost:${PORT}/api/v1/status`);
});