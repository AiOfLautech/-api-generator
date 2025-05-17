require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

// Security Middlewares
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
    res.json({
      success: true,
      creator: "AI OF LAUTECH",
      ...data
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Server Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));