# AI Chat Bot — Aura Goli

A Facebook Messenger chatbot for **Aura Goli** (https://aura-goli.vercel.app), a Bangladeshi premium T-shirt brand. Powered by **Groq (LLaMA 3.3 70B)** and built with **Node.js + Express**. Replies strictly and politely in **Bangla**.

---

## Features

- Answers customer questions about products, pricing, delivery, payment, and returns
- Replies in Bangla regardless of the language the customer writes in
- Integrated with Facebook Messenger via Meta Webhooks
- Fast AI responses via Groq API (free)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Server | Node.js + Express |
| AI | Groq API — `llama-3.3-70b-versatile` |
| Tunnel (dev) | ngrok |
| Platform | Meta (Facebook Messenger) |

---

## Project Structure

```
├── index.js          # Main server — webhook endpoints + AI logic
├── package.json
├── .env.example      # Environment variable template
└── .gitignore
```

---

## Setup

### 1. Clone & install

```bash
git clone https://github.com/fahimahmed420/AI-Chat-Bot.git
cd AI-Chat-Bot
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in `.env`:

```env
GROQ_API_KEY=your_groq_api_key
FACEBOOK_PAGE_ACCESS_TOKEN=your_page_access_token
VERIFY_TOKEN=your_custom_verify_token
PORT=3000
```

| Variable | Where to get it |
|---|---|
| `GROQ_API_KEY` | console.groq.com — free, no card needed |
| `FACEBOOK_PAGE_ACCESS_TOKEN` | Meta App Dashboard → Messenger → API Settings → Generate Token |
| `VERIFY_TOKEN` | Any string you choose — paste the same one in Meta Dashboard |

### 3. Run

```bash
npm start
```

### 4. Expose with ngrok

```bash
ngrok http 3000
```

Copy the `https://...ngrok-free.app` URL and set it as your webhook in the Meta App Dashboard:
- **Callback URL:** `https://your-url.ngrok-free.app/webhook`
- **Verify Token:** same as `VERIFY_TOKEN` in `.env`
- **Subscriptions:** `messages`

---

## Business Info (Aura Goli)

- **Products:** Plain, Oversized, Graphic, Premium T-Shirts
- **Material:** 220 GSM Supima Blend
- **Payment:** Cash on Delivery, bKash, Card
- **Order via:** Website or WhatsApp (01774433063)
- **Delivery:** Same-day in Dhaka | Free shipping above ৳2,000
- **Returns:** 3-day return policy
- **Contact:** auragolistore@gmail.com | 01774433063

---

## License

MIT
