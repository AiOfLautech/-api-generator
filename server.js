require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: process.env.DEEPSEEK_API_KEY
});

// Test API Endpoint
app.get('/api/test', async (req, res) => {
  try {
    const test = await openai.chat.completions.create({
      messages: [{
        role: "system",
        content: "You are a code deobfuscator assistant by AI OF LAUTECH"
      }, {
        role: "user",
        content: "Hi"
      }],
      model: "deepseek-chat",
    });
    
    res.json({
      status: 200,
      success: true,
      creator: "GiftedTech",
      response: test.choices[0].message.content
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Main API
app.post('/api/deobfuscate', async (req, res) => {
  try {
    const { code, filename } = req.body;
    
    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [{
        role: "system",
        content: "You are a professional code deobfuscator. Decode any obfuscated code and return only clean version."
      }, {
        role: "user",
        content: code
      }],
      temperature: 0.2,
      max_tokens: 4096
    });

    res.json({
      status: 200,
      success: true,
      creator: "GiftedTech",
      result: completion.choices[0].message.content,
      detected_language: filename?.split('.').pop() || 'txt'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));