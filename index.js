require('dotenv').config();
const express = require('express');
const axios = require('axios');
const Groq = require('groq-sdk');

// ── Startup validation ────────────────────────────────────────────────────────
const REQUIRED_ENV = ['GROQ_API_KEY', 'FACEBOOK_PAGE_ACCESS_TOKEN', 'VERIFY_TOKEN'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length) {
  console.error('Missing required environment variables:', missing.join(', '));
  process.exit(1);
}

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Online/Offline toggle ─────────────────────────────────────────────────────
// When ONLINE: bot stays silent, you reply manually.
// When OFFLINE: bot auto-replies to every message.
let isOnline = false;

app.get('/online', (req, res) => {
  if (req.query.key !== process.env.VERIFY_TOKEN) return res.sendStatus(403);
  isOnline = true;
  console.log('[mode] ONLINE — bot is silent');
  res.json({ mode: 'online' });
});

app.get('/offline', (req, res) => {
  if (req.query.key !== process.env.VERIFY_TOKEN) return res.sendStatus(403);
  isOnline = false;
  console.log('[mode] OFFLINE — bot is active');
  res.json({ mode: 'offline' });
});

app.get('/status', (req, res) => {
  if (req.query.key !== process.env.VERIFY_TOKEN) return res.sendStatus(403);
  res.json({ mode: isOnline ? 'online' : 'offline' });
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.get('/dashboard', (req, res) => {
  if (req.query.key !== process.env.VERIFY_TOKEN) return res.sendStatus(403);
  const key = req.query.key;
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Aura Goli — Bot Control</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0f0f0f;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #fff;
    }
    .card {
      background: #1a1a1a;
      border: 1px solid #2a2a2a;
      border-radius: 24px;
      padding: 48px 40px;
      text-align: center;
      width: 340px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    }
    .logo { font-size: 28px; font-weight: 700; letter-spacing: -0.5px; margin-bottom: 6px; }
    .logo span { color: #a78bfa; }
    .subtitle { color: #555; font-size: 13px; margin-bottom: 40px; }
    .status-label {
      font-size: 13px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 12px;
    }
    .status-text {
      font-size: 22px;
      font-weight: 600;
      margin-bottom: 36px;
      transition: color 0.3s;
    }
    .status-text.online  { color: #34d399; }
    .status-text.offline { color: #f87171; }
    .toggle-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 14px;
      margin-bottom: 36px;
    }
    .toggle-label { font-size: 14px; color: #777; }
    .toggle {
      position: relative;
      width: 64px;
      height: 34px;
      cursor: pointer;
    }
    .toggle input { display: none; }
    .slider {
      position: absolute;
      inset: 0;
      background: #2a2a2a;
      border-radius: 34px;
      transition: background 0.3s;
    }
    .slider::before {
      content: '';
      position: absolute;
      height: 26px; width: 26px;
      left: 4px; bottom: 4px;
      background: #fff;
      border-radius: 50%;
      transition: transform 0.3s;
    }
    input:checked + .slider { background: #34d399; }
    input:checked + .slider::before { transform: translateX(30px); }
    .info {
      background: #111;
      border-radius: 12px;
      padding: 16px;
      font-size: 13px;
      color: #555;
      line-height: 1.6;
    }
    .info strong { color: #888; }
    .dot {
      display: inline-block;
      width: 8px; height: 8px;
      border-radius: 50%;
      margin-right: 6px;
      vertical-align: middle;
    }
    .dot.online  { background: #34d399; box-shadow: 0 0 8px #34d399; }
    .dot.offline { background: #f87171; box-shadow: 0 0 8px #f87171; }
  </style>
</head>
<body>
<div class="card">
  <div class="logo">Aura <span>Goli</span></div>
  <div class="subtitle">Bot Control Panel</div>

  <div class="status-label">Current Status</div>
  <div class="status-text" id="statusText">Loading...</div>

  <div class="toggle-wrap">
    <span class="toggle-label">Bot Active</span>
    <label class="toggle">
      <input type="checkbox" id="toggle"/>
      <span class="slider"></span>
    </label>
    <span class="toggle-label">I'm Online</span>
  </div>

  <div class="info" id="infoBox">Checking status...</div>
</div>

<script>
  const KEY = '${key}';
  const toggle = document.getElementById('toggle');
  const statusText = document.getElementById('statusText');
  const infoBox = document.getElementById('infoBox');

  function updateUI(mode) {
    const online = mode === 'online';
    toggle.checked = online;
    statusText.className = 'status-text ' + mode;
    statusText.innerHTML = online
      ? '<span class="dot online"></span>You are Online'
      : '<span class="dot offline"></span>Bot is Active';
    infoBox.innerHTML = online
      ? '<strong>You are handling messages.</strong><br>Bot is silent — customers will hear from you directly.'
      : '<strong>Bot is auto-replying.</strong><br>Toggle when you come online to reply manually.';
  }

  async function fetchStatus() {
    const r = await fetch('/status?key=' + KEY);
    const d = await r.json();
    updateUI(d.mode);
  }

  toggle.addEventListener('change', async () => {
    const endpoint = toggle.checked ? '/online' : '/offline';
    statusText.textContent = 'Updating...';
    const r = await fetch(endpoint + '?key=' + KEY);
    const d = await r.json();
    updateUI(d.mode);
  });

  fetchStatus();
</script>
</body>
</html>`);
});

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_INSTRUCTION = `তুমি "Aura Goli"-র অফিসিয়াল কাস্টমার সার্ভিস অ্যাসিস্ট্যান্ট। তোমার নাম "Aura Bot"।
Aura Goli একটি বাংলাদেশি প্রিমিয়াম অনলাইন টি-শার্ট ব্র্যান্ড, যা ঢাকা থেকে পরিচালিত হয়।

🛍️ পণ্য:
- Plain/Basic T-Shirt
- Oversized T-Shirt
- Graphic T-Shirt
- Premium T-Shirt (SS 2025 কালেকশন)
সব টি-শার্ট 220 GSM Supima Blend কটন দিয়ে তৈরি, GOTS-সার্টিফাইড মিল থেকে।
Made in Bangladesh, ethically sourced।

🌐 ওয়েবসাইট: https://aura-goli.vercel.app/
📞 ফোন: 01774433063
💬 WhatsApp: 01774433063
📧 ইমেইল: auragolistore@gmail.com
🕐 সাপোর্ট সময়: রবিবার–বৃহস্পতিবার, সকাল ১০টা–সন্ধ্যা ৬টা
🏠 আমাদের কোনো ফিজিক্যাল স্টোর নেই। Facebook ও ওয়েবসাইটের মাধ্যমে অর্ডার নেওয়া হয়।

💳 পেমেন্ট পদ্ধতি:
- Cash on Delivery (ক্যাশ অন ডেলিভারি)
- bKash
- Card (ক্রেডিট/ডেবিট কার্ড)

🛒 অর্ডার করার উপায়:
- ওয়েবসাইটে: https://aura-goli.vercel.app/
- WhatsApp-এ: 01774433063

🚚 ডেলিভারি:
- ঢাকার মধ্যে Same-day delivery পাওয়া যায়
- ৳২,০০০-এর উপরে অর্ডারে Free Shipping

🔄 রিটার্ন পলিসি:
- পণ্য পাওয়ার ৩ দিনের মধ্যে রিটার্ন করা যাবে
- পণ্যে সমস্যা হলে বিনামূল্যে রিপ্লেসমেন্ট দেওয়া হবে

নিয়মাবলী:
- ব্যবহারকারী বাংলায় লিখলে বাংলায় উত্তর দেবে। ইংরেজিতে লিখলে ইংরেজিতে উত্তর দেবে।
- বিনয়ী, আন্তরিক ও পেশাদার ভঙ্গিতে কথা বলবে।
- দাম বা সাইজ সম্পর্কে জিজ্ঞেস করলে ওয়েবসাইট দেখতে বলবে বা WhatsApp-এ যোগাযোগ করতে বলবে।
- Aura Goli-র বাইরের কোনো বিষয়ে প্রশ্ন করলে বিনয়ের সাথে জানাবে যে তুমি শুধু Aura Goli-র বিষয়ে সাহায্য করতে পারবে।
- উত্তর সংক্ষিপ্ত, স্পষ্ট ও সহায়ক রাখবে।`;

// ── Groq ──────────────────────────────────────────────────────────────────────

async function generateReply(userMessage) {
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: SYSTEM_INSTRUCTION },
      { role: 'user', content: userMessage },
    ],
  });
  return response.choices[0].message.content;
}

// ── Meta send helpers ─────────────────────────────────────────────────────────

async function sendFacebookMessage(recipientId, text) {
  await axios.post(
    'https://graph.facebook.com/v20.0/me/messages',
    { recipient: { id: recipientId }, message: { text } },
    { params: { access_token: process.env.FACEBOOK_PAGE_ACCESS_TOKEN } }
  );
}

async function sendWhatsAppMessage(phoneNumberId, to, text) {
  await axios.post(
    `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
    {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  );
}

// ── Webhook: GET (Meta verification) ─────────────────────────────────────────

app.get('/webhook', (req, res) => {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    console.log('[webhook] Verified by Meta');
    return res.status(200).send(challenge);
  }

  console.warn('[webhook] Verification failed — token mismatch');
  res.sendStatus(403);
});

// ── Webhook: POST (incoming messages) ────────────────────────────────────────

app.post('/webhook', async (req, res) => {
  res.sendStatus(200);

  if (isOnline) {
    console.log('[mode] ONLINE — skipping auto-reply');
    return;
  }

  const body = req.body;

  try {
    if (body.object === 'page') {
      await handleFacebookEntries(body.entry);
    } else if (body.object === 'whatsapp_business_account') {
      await handleWhatsAppEntries(body.entry);
    }
  } catch (err) {
    console.error('[webhook] Error:', err.message);
  }
});

// ── Facebook Messenger ────────────────────────────────────────────────────────

async function handleFacebookEntries(entries = []) {
  for (const entry of entries) {
    for (const event of entry.messaging || []) {
      if (!event.message?.text || event.message.is_echo) continue;

      const senderId = event.sender.id;
      const text     = event.message.text;
      console.log(`[FB] From ${senderId}: ${text}`);

      const reply = await generateReply(text);
      await sendFacebookMessage(senderId, reply);
      console.log(`[FB] Replied to ${senderId}`);
    }
  }
}

// ── WhatsApp ─────────────────────────────────────────────────────────────────

async function handleWhatsAppEntries(entries = []) {
  for (const entry of entries) {
    for (const change of entry.changes || []) {
      const value    = change.value;
      const messages = value?.messages;
      if (!messages) continue;

      const phoneNumberId = value.metadata.phone_number_id;

      for (const msg of messages) {
        if (msg.type !== 'text') continue;

        const from = msg.from;
        const text = msg.text.body;
        console.log(`[WA] From ${from}: ${text}`);

        const reply = await generateReply(text);
        await sendWhatsAppMessage(phoneNumberId, from, reply);
        console.log(`[WA] Replied to ${from}`);
      }
    }
  }
}

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Mode: ${isOnline ? 'ONLINE (bot silent)' : 'OFFLINE (bot active)'}`);
});
