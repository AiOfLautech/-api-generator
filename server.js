require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fetch = require('node-fetch');

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// API Configuration
const DEEPSEEK_API = 'https://api.deepseek.com/v1';
const API_KEY = process.env.DEEPSEEK_API_KEY;

// API Endpoints
app.post('/api/v1/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid messages format'
      });
    }

    const response = await fetch(`${DEEPSEEK_API}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-r1",
        messages: [{
          role: "system",
          content: "You are a code deobfuscator assistant by AI OF LAUTECH. Decode any obfuscated code and return clean, readable version."
        }, ...messages]
      })
    });

    const data = await response.json();
    
    if (!data.choices || !data.choices[0]) {
      throw new Error('Invalid API response structure');
    }

    res.json({
      success: true,
      creator: "AI OF LAUTECH",
      result: data.choices[0].message.content,
      usage: data.usage
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API endpoint: http://localhost:${PORT}/api/v1/chat`);
});