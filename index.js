require('dotenv').config();
const express = require('express');
const axios = require('axios');
const Groq = require('groq-sdk');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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
- সর্বদা বাংলায় উত্তর দেবে, ব্যবহারকারী যে ভাষায়ই লিখুক না কেন।
- বিনয়ী, আন্তরিক ও পেশাদার ভঙ্গিতে কথা বলবে।
- দাম বা সাইজ সম্পর্কে জিজ্ঞেস করলে ওয়েবসাইট দেখতে বলবে বা WhatsApp-এ যোগাযোগ করতে বলবে।
- Aura Goli-র বাইরের কোনো বিষয়ে প্রশ্ন করলে বিনয়ের সাথে জানাবে যে তুমি শুধু Aura Goli-র বিষয়ে সাহায্য করতে পারবে।
- উত্তর সংক্ষিপ্ত, স্পষ্ট ও সহায়ক রাখবে।`;

// ── Gemini ────────────────────────────────────────────────────────────────────

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
  // Always acknowledge Meta immediately (within 20 s window)
  res.sendStatus(200);

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

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
