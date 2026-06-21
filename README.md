# Aura Goli — AI Chat Bot

An intelligent Facebook Messenger customer service chatbot for **[Aura Goli](https://aura-goli.vercel.app)**, a Bangladeshi premium T-shirt brand. Built with **Node.js + Express**, powered by **Groq (LLaMA 3.3 70B)**, and deployed via **Meta Webhooks**.

The bot automatically detects the customer's language and replies in **Bangla** or **English** accordingly.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running Locally](#running-locally)
- [Meta Webhook Setup](#meta-webhook-setup)
- [How It Works](#how-it-works)
- [Business Information](#business-information)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Features

- Replies in **Bangla or English** based on the customer's message language
- Answers questions about products, ordering, payment, delivery, and returns
- Integrated with **Facebook Messenger** via Meta Graph API
- Uses **Groq AI (LLaMA 3.3 70B)** — free, fast, no billing required
- Handles both **Facebook Messenger** and **WhatsApp Business** webhooks
- Gracefully declines off-topic questions and redirects to support

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| AI Model | Groq API — `llama-3.3-70b-versatile` |
| Messaging Platform | Meta (Facebook Messenger / WhatsApp) |
| HTTP Client | Axios |
| Tunnel (development) | ngrok |

---

## Project Structure

```
AI-Chat-Bot/
├── index.js          # Main server — webhook endpoints, AI logic, send helpers
├── package.json      # Dependencies and scripts
├── .env.example      # Environment variable template (no real secrets)
├── .gitignore        # Ignores .env and node_modules
└── README.md
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- A [Meta Developer](https://developers.facebook.com/) account
- A Facebook Page (for Messenger)
- A free [Groq](https://console.groq.com/) account
- [ngrok](https://ngrok.com/) for local development

---

## Installation

```bash
# Clone the repository
git clone https://github.com/fahimahmed420/AI-Chat-Bot.git
cd AI-Chat-Bot

# Install dependencies
npm install
```

---

## Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description | Where to Get |
|---|---|---|
| `GROQ_API_KEY` | Groq API key for LLaMA model | [console.groq.com](https://console.groq.com) → API Keys → Create API Key |
| `FACEBOOK_PAGE_ACCESS_TOKEN` | Page token to send Messenger messages | Meta App Dashboard → Messenger → API Settings → Generate Token |
| `VERIFY_TOKEN` | Custom string to verify the webhook | Make up any string — use the same in Meta Dashboard |
| `PORT` | Port the server listens on | Default: `3000` |

**Example `.env`:**

```env
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
FACEBOOK_PAGE_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxx
VERIFY_TOKEN=mybot_secret_2024
PORT=3000
```

> Never commit your `.env` file. It is listed in `.gitignore`.

---

## Running Locally

### 1. Start the bot server

```bash
npm start
```

The server starts on `http://localhost:3000`.

For auto-reload during development:

```bash
npm run dev
```

### 2. Start ngrok tunnel

```bash
ngrok http 3000
```

ngrok prints a public URL like:
```
https://abc123.ngrok-free.app
```

Your webhook URL will be:
```
https://abc123.ngrok-free.app/webhook
```

> ngrok gives a new URL every restart. Update the webhook URL in Meta Dashboard each time, unless you have a paid ngrok plan with a fixed domain.

---

## Meta Webhook Setup

### Step 1 — Create a Meta App

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Click **My Apps → Create App**
3. Select **Business** → fill in details → Create

### Step 2 — Add Messenger

1. In your App Dashboard → **Add Products → Messenger → Set Up**

### Step 3 — Generate Page Access Token

1. Messenger → **API Settings → Access Tokens**
2. Connect your Facebook Page → click **Generate Token**
3. Copy and paste into `.env` as `FACEBOOK_PAGE_ACCESS_TOKEN`

### Step 4 — Configure Webhook

1. Messenger → API Settings → **Webhooks → Add Callback URL**
2. Fill in:
   - **Callback URL:** `https://your-ngrok-url.ngrok-free.app/webhook`
   - **Verify Token:** same value as `VERIFY_TOKEN` in your `.env`
3. Click **Verify and Save**
4. Under **Webhook Fields**, click **Add Subscriptions** next to your Page → tick **`messages`** → Save

### Step 5 — Test

Send a message to your Facebook Page. The bot should reply within seconds.

---

## How It Works

```
Customer sends message
        │
        ▼
Meta sends POST /webhook to your server
        │
        ▼
Server extracts message text + sender ID
        │
        ▼
Groq AI generates a reply (Bangla or English)
        │
        ▼
Server calls Meta Graph API to send the reply
        │
        ▼
Customer receives the message
```

### Webhook Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/webhook` | Meta verification handshake |
| `POST` | `/webhook` | Receive incoming messages |

### Language Detection

The bot reads the customer's message language and replies accordingly:
- Customer writes in **Bangla** → replies in **Bangla**
- Customer writes in **English** → replies in **English**

---

## Business Information

The bot is pre-loaded with the following Aura Goli information:

### Products
| Type | Description |
|---|---|
| Plain / Basic | Simple, comfortable everyday T-shirts |
| Oversized | Relaxed oversized fit |
| Graphic | Printed graphic designs |
| Premium | SS 2025 collection, 220 GSM Supima Blend |

**Material:** 100% Supima Cotton, 220 GSM, GOTS-certified mills, Made in Bangladesh

### Ordering
- **Website:** [aura-goli.vercel.app](https://aura-goli.vercel.app)
- **WhatsApp:** 01774433063

### Payment Methods
- Cash on Delivery
- bKash
- Credit / Debit Card

### Delivery
- Same-day delivery within Dhaka
- Free shipping on orders above ৳2,000

### Return Policy
- 3-day return window from delivery date
- Free replacement for defective products

### Contact
| Channel | Details |
|---|---|
| Phone / WhatsApp | 01774433063 |
| Email | auragolistore@gmail.com |
| Support Hours | Sunday – Thursday, 10:00 AM – 6:00 PM |
| Location | Home-based, no physical store |

---

## Deployment

For permanent hosting (so you don't need ngrok), deploy to any Node.js platform:

| Platform | Free Tier | Notes |
|---|---|---|
| [Railway](https://railway.app) | Yes | Easiest, auto-deploy from GitHub |
| [Render](https://render.com) | Yes | Free tier sleeps after 15 min inactivity |
| [Cyclic](https://cyclic.sh) | Yes | Simple GitHub integration |

After deploying, update the webhook URL in Meta Dashboard to your production URL.

---

## Troubleshooting

| Problem | Likely Cause | Fix |
|---|---|---|
| Webhook verification fails | Server not running or wrong `VERIFY_TOKEN` | Ensure `npm start` is running and tokens match |
| Bot not replying | ngrok tunnel died | Restart ngrok and update webhook URL |
| `limit: 0` Groq error | Invalid or wrong API key | Create a new key at console.groq.com |
| `Cannot send messages to this id` | Wrong Page Access Token | Regenerate token in Meta Dashboard |
| Token rejected by Meta | Using personal user token instead of Page token | Generate token from Messenger → API Settings, not Graph Explorer |

---

## License

MIT — feel free to fork and adapt for your own business.
