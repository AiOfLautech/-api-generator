require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fetch = require('node-fetch');
const path = require('path');

const app = express();

// Middlewares
app.use(helmet());
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

// API Proxy
app.post('/api/v1/deobfuscate', async (req, res) => {
  try {
    const { code, filename } = req.body;
    
    const apiResponse = await fetch(
      `https://api.giftedtech.web.id/api/ai/deepseek-r1?apikey=gifted&q=${encodeURIComponent(code)}`
    );
    
    const data = await apiResponse.json();
    
    res.json({
      status: 200,
      success: true,
      creator: "AI OF LAUTECH",
      result: data.response,
      metadata: {
        original_length: code.length,
        processed_length: data.response.length,
        detected_language: detectLanguage(filename, code)
      }
    });
    
  } catch (error) {
    res.status(500).json({
      status: 500,
      success: false,
      error: error.message,
      creator: "GiftedTech"
    });
  }
});

// Static Files
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Helpers
function detectLanguage(filename, code) {
  const ext = filename?.split('.').pop()?.toLowerCase() || '';
  const patterns = {
    js: /(function|=>|const|let)/,
    py: /(def|import|print)/,
    html: /(<\!DOCTYPE|<\/\w+>)/,
    css: /({|}|;|:\s)/,
  };
  return ext || Object.entries(patterns).find(([_, re]) => re.test(code))?.[0] || 'txt';
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));