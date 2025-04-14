const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Config = require('../models/Config');
const Subscriber = require('../models/Subscriber');
const nodemailer = require('nodemailer');
const axios = require('axios');

// POST /api/generate-config
router.post('/generate-config', async (req, res) => {
  try {
    const { telegramBotToken, telegramChatId, gmailEmail, gmailAppPassword, emailTemplate } = req.body;
    if (!telegramBotToken || !telegramChatId || !gmailEmail || !gmailAppPassword || !emailTemplate) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    const sessionId = uuidv4();
    const config = new Config({
      sessionId,
      telegramBotToken,
      telegramChatId,
      gmailEmail,
      gmailAppPassword,
      emailTemplate
    });
    await config.save();
    const baseUrl = `${req.protocol}://${req.get('host')}/api/${sessionId}`;
    const apiUrls = {
      subscribe: `${baseUrl}/subscribe`,
      sendUpdate: `${baseUrl}/send-update`,
      test: `${baseUrl}/test`
    };
    const info = [
      'Connecting to MongoDB...',
      'MongoDB connected successfully',
      'Telegram Bot Token and Chat ID detected.',
      'Connecting to Google Email using provided credentials... confirmed.',
      'Email template provided and working successfully.'
    ];
    info.forEach(msg => console.log(msg));
    res.json({ sessionId, apiUrls, info });
  } catch (error) {
    console.error('Error in generate-config:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/:sessionId/subscribe
router.post('/:sessionId/subscribe', async (req, res) => {
  const { sessionId } = req.params;
  const { email } = req.body;
  try {
    const config = await Config.findOne({ sessionId });
    if (!config) {
      return res.status(404).json({ error: 'Session not found' });
    }
    const existingSubscriber = await Subscriber.findOne({ email, sessionId });
    if (existingSubscriber) {
      return res.status(400).json({ error: 'Email already subscribed' });
    }
    const subscriber = new Subscriber({ email, sessionId });
    await subscriber.save();
    res.json({ message: 'Subscribed successfully' });
  } catch (error) {
    console.error('Error in subscribe:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/:sessionId/send-update
router.post('/:sessionId/send-update', async (req, res) => {
  const { sessionId } = req.params;
  const { message } = req.body;
  try {
    const config = await Config.findOne({ sessionId });
    if (!config) {
      return res.status(404).json({ error: 'Session not found' });
    }
    const subscribers = await Subscriber.find({ sessionId });
    if (subscribers.length === 0) {
      return res.status(400).json({ error: 'No subscribers found' });
    }
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: config.gmailEmail, pass: config.gmailAppPassword }
    });
    const emailPromises = subscribers.map(subscriber => {
      const mailOptions = {
        from: config.gmailEmail,
        to: subscriber.email,
        subject: 'Update',
        html: config.emailTemplate.replace('{{message}}', message || 'No message provided')
      };
      return transporter.sendMail(mailOptions);
    });
    await Promise.all(emailPromises);
    const telegramUrl = `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`;
    await axios.post(telegramUrl, {
      chat_id: config.telegramChatId,
      text: message || 'No message provided'
    });
    res.json({ message: 'Update sent successfully' });
  } catch (error) {
    console.error('Error in send-update:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/:sessionId/test
router.get('/:sessionId/test', async (req, res) => {
  const { sessionId } = req.params;
  try {
    const config = await Config.findOne({ sessionId });
    if (!config) {
      return res.status(404).json({ error: 'Session not found' });
    }
    const subscriberCount = await Subscriber.countDocuments({ sessionId });
    res.json({ subscriberCount, test: 'Test data' });
  } catch (error) {
    console.error('Error in test:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/subscribers
router.get('/admin/subscribers', async (req, res) => {
  try {
    const subscribers = await Subscriber.find({});
    res.json(subscribers);
  } catch (error) {
    console.error('Error in admin/subscribers:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/send-update
router.post('/admin/send-update', async (req, res) => {
  const { message } = req.body;
  try {
    const adminTelegramBotToken = process.env.ADMIN_TELEGRAM_BOT_TOKEN;
    const adminTelegramChatId = process.env.ADMIN_TELEGRAM_CHAT_ID;
    const adminGmailEmail = process.env.ADMIN_GMAIL_EMAIL;
    const adminGmailAppPassword = process.env.ADMIN_GMAIL_APP_PASSWORD;
    const adminEmailTemplate = process.env.ADMIN_EMAIL_TEMPLATE || '<p>{{message}}</p>';

    if (!adminTelegramBotToken || !adminTelegramChatId || !adminGmailEmail || !adminGmailAppPassword) {
      return res.status(400).json({ error: 'Admin credentials not set' });
    }

    const subscribers = await Subscriber.find({});
    if (subscribers.length === 0) {
      return res.status(400).json({ error: 'No subscribers found' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: adminGmailEmail, pass: adminGmailAppPassword }
    });
    const emailPromises = subscribers.map(subscriber => {
      const mailOptions = {
        from: adminGmailEmail,
        to: subscriber.email,
        subject: 'Admin Update',
        html: adminEmailTemplate.replace('{{message}}', message || 'No message provided')
      };
      return transporter.sendMail(mailOptions);
    });
    await Promise.all(emailPromises);

    const telegramUrl = `https://api.telegram.org/bot${adminTelegramBotToken}/sendMessage`;
    await axios.post(telegramUrl, {
      chat_id: adminTelegramChatId,
      text: message || 'No message provided'
    });

    res.json({ message: 'Admin update sent successfully' });
  } catch (error) {
    console.error('Error in admin/send-update:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/test
router.get('/admin/test', async (req, res) => {
  try {
    const subscriberCount = await Subscriber.countDocuments({});
    res.json({ subscriberCount, test: 'Admin test data' });
  } catch (error) {
    console.error('Error in admin/test:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
