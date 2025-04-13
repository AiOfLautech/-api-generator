const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const mongoose = require("mongoose");
const Subscriber = require("../models/Subscriber");
const nodemailer = require("nodemailer");
const axios = require("axios");

// In-memory storage of configurations keyed by session ID
const configs = {};

// Helper function to generate a random session ID
const generateSessionId = () => crypto.randomBytes(8).toString("hex");

// POST /api/generate-config – Accepts configuration and generates dynamic API URLs
router.post("/generate-config", (req, res) => {
  const { mongoUrl, telegramToken, telegramChatId, emailUser, emailPass, emailTemplate } = req.body;
  if (!mongoUrl || !telegramToken || !telegramChatId || !emailUser || !emailPass || !emailTemplate) {
    return res.status(400).json({ status: false, error: "All configuration fields are required" });
  }
  // Check MongoDB connection status (1 = connected)
  const dbStatus = mongoose.connection.readyState;
  console.log("Processing: MongoDB connection status is", dbStatus === 1 ? "Connected" : "Not connected");

  const sessionId = generateSessionId();
  configs[sessionId] = { mongoUrl, telegramToken, telegramChatId, emailUser, emailPass, emailTemplate };

  const baseUrl = req.protocol + "://" + req.get("host");
  const subscribeApi = `${baseUrl}/api/${sessionId}/subscribe`;
  const updateApi = `${baseUrl}/api/${sessionId}/send-update`;
  const testApi = `${baseUrl}/api/${sessionId}/test`;

  res.json({
    status: true,
    sessionId,
    subscribeApi,
    updateApi,
    testApi,
    info: dbStatus === 1
      ? "MongoDB connected. API endpoints generated dynamically."
      : "Warning: MongoDB not connected. Please verify your connection."
  });
});

// Middleware to retrieve config for a session ID
router.use("/:sessionId", (req, res, next) => {
  const { sessionId } = req.params;
  if (!configs[sessionId]) {
    return res.status(400).json({ status: false, error: "Invalid session ID" });
  }
  req.config = configs[sessionId];
  next();
});

// POST /api/:sessionId/subscribe – Subscribes a user using session configuration
router.post("/:sessionId/subscribe", async (req, res) => {
  const { email } = req.body;
  if (!email)
    return res.status(400).json({ status: false, error: "Email is required" });
  try {
    let subscriber = await Subscriber.findOne({ email });
    if (!subscriber) {
      subscriber = new Subscriber({ email });
      await subscriber.save();
      const { emailUser, emailPass, emailTemplate } = req.config;
      if (emailUser && emailPass && emailTemplate) {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: emailUser,
            pass: emailPass
          }
        });
        const mailOptions = {
          from: `"AllMovieDaluda" <${emailUser}>`,
          to: email,
          subject: "Subscription Confirmation",
          html: emailTemplate
        };
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) console.error("Email error:", error);
          else console.log("Confirmation email sent:", info.response);
        });
      }
    }
    res.json({ status: true, creator: "AI OF LAUTECH", message: "Subscription successful" });
  } catch (error) {
    console.error("Subscribe API error:", error);
    res.status(500).json({ status: false, error: "Internal server error" });
  }
});

// GET /api/:sessionId/subscribers – Returns the list of subscribers
router.get("/:sessionId/subscribers", async (req, res) => {
  try {
    const subscribers = await Subscriber.find().sort({ subscribedAt: -1 });
    res.json({ status: true, subscribers });
  } catch (error) {
    res.status(500).json({ status: false, error: "Internal server error" });
  }
});

// POST /api/:sessionId/send-update – Sends update via email and Telegram
router.post("/:sessionId/send-update", async (req, res) => {
  const { message } = req.body;
  if (!message)
    return res.status(400).json({ status: false, error: "Message is required" });
  try {
    const subscribers = await Subscriber.find();
    const { emailUser, emailPass, telegramToken, telegramChatId } = req.config;
    if (emailUser && emailPass) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: emailUser,
          pass: emailPass
        }
      });
      subscribers.forEach(sub => {
        const mailOptions = {
          from: `"AllMovieDaluda" <${emailUser}>`,
          to: sub.email,
          subject: "Update from AllMovieDaluda",
          html: `<p>${message}</p><p>Visit our site: <a href="https://your-site.com">AllMovieDaluda</a></p>`
        };
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) console.error("Send update email error:", error);
        });
      });
    }
    if (telegramToken && telegramChatId) {
      await axios.post(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
        chat_id: telegramChatId,
        text: `Update: ${message}`
      });
    }
    res.json({ status: true, message: "Update sent to all subscribers" });
  } catch (error) {
    console.error("Send update error:", error);
    res.status(500).json({ status: false, error: "Internal server error" });
  }
});

// GET /api/:sessionId/test – Test endpoint for dynamic API configuration
router.get("/:sessionId/test", async (req, res) => {
  try {
    const count = await Subscriber.countDocuments();
    res.json({
      creator: "AI OF LAUTECH",
      status: true,
      subscribers: count,
      info: "Test response from dynamic subscription API."
    });
  } catch (error) {
    res.status(500).json({ status: false, error: "Test error" });
  }
});

module.exports = router;
