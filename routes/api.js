const express = require("express");
const router = express.Router();
const Subscriber = require("../models/Subscriber");
const nodemailer = require("nodemailer");
const axios = require("axios");

// Global configuration object for API generation
let apiConfig = {};

// POST /api/subscribe
router.post("/subscribe", async (req, res) => {
  const { email } = req.body;
  if (!email)
    return res.status(400).json({ status: false, error: "Email is required" });
  try {
    let subscriber = await Subscriber.findOne({ email });
    if (!subscriber) {
      subscriber = new Subscriber({ email });
      await subscriber.save();
      
      if (apiConfig.emailUser && apiConfig.emailPass && apiConfig.emailTemplate) {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: apiConfig.emailUser,
            pass: apiConfig.emailPass
          }
        });
        const mailOptions = {
          from: `"AllMovieDaluda" <${apiConfig.emailUser}>`,
          to: email,
          subject: "Subscription Confirmation",
          html: apiConfig.emailTemplate
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

// GET /api/subscribers
router.get("/subscribers", async (req, res) => {
  try {
    const subscribers = await Subscriber.find().sort({ subscribedAt: -1 });
    res.json({ status: true, subscribers });
  } catch (error) {
    res.status(500).json({ status: false, error: "Internal server error" });
  }
});

// POST /api/send-update
router.post("/send-update", async (req, res) => {
  const { message } = req.body;
  if (!message)
    return res.status(400).json({ status: false, error: "Message is required" });
  try {
    const subscribers = await Subscriber.find();
    if (apiConfig.emailUser && apiConfig.emailPass) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: apiConfig.emailUser,
          pass: apiConfig.emailPass
        }
      });
      subscribers.forEach(sub => {
        const mailOptions = {
          from: `"AllMovieDaluda" <${apiConfig.emailUser}>`,
          to: sub.email,
          subject: "Update from AllMovieDaluda",
          html: `<p>${message}</p><p>Visit our site: <a href="https://your-site.com">AllMovieDaluda</a></p>`
        };
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) console.error("Send update email error:", error);
        });
      });
    }
    if (apiConfig.telegramToken && apiConfig.telegramChatId) {
      await axios.post(`https://api.telegram.org/bot${apiConfig.telegramToken}/sendMessage`, {
        chat_id: apiConfig.telegramChatId,
        text: `Update: ${message}`
      });
    }
    res.json({ status: true, message: "Update sent to all subscribers" });
  } catch (error) {
    console.error("Send update error:", error);
    res.status(500).json({ status: false, error: "Internal server error" });
  }
});

// POST /api/generate-config
router.post("/generate-config", (req, res) => {
  const { mongoUrl, telegramToken, telegramChatId, emailUser, emailPass, emailTemplate } = req.body;
  if (!mongoUrl || !telegramToken || !telegramChatId || !emailUser || !emailPass || !emailTemplate) {
    return res.status(400).json({ status: false, error: "All configuration fields are required" });
  }
  apiConfig = { mongoUrl, telegramToken, telegramChatId, emailUser, emailPass, emailTemplate };
  const baseUrl = req.protocol + "://" + req.get("host");
  const subscribeApi = `${baseUrl}/api/subscribe`;
  const updateApi = `${baseUrl}/api/send-update`;
  
  res.json({
    status: true,
    subscribeApi,
    updateApi,
    info: "API endpoints generated. Use these in your integration."
  });
});

// GET /api/test
router.get("/test", async (req, res) => {
  try {
    const count = await Subscriber.countDocuments();
    res.json({
      creator: "AI OF LAUTECH",
      status: true,
      subscribers: count,
      info: "Test response from subscription API."
    });
  } catch (error) {
    res.status(500).json({ status: false, error: "Test error" });
  }
});

module.exports = router;