# 🎙️ VoiceForge AI

> **Hackathon Module:** AI Rulebook Generation & ElevenLabs Voice Agent Creation.  
> Transform raw business descriptions into structured, guardrailed JSON Rulebooks, review and refine the agent persona, and deploy directly to the ElevenLabs Conversational AI platform.

---

## 🌟 Features

1. **Step 1: Business Blueprint Intake**
   - Provide business name, description, industry, tone, key services, and safety constraints.
   - Includes **1-Click Demo Presets** (Dental Clinic, Real Estate Agency, Cafe, SaaS Support) for instant testing during hackathon presentations.

2. **Step 2: AI Rulebook Generation & Review**
   - Transforms natural language into an architectural **JSON Rulebook** containing:
     - Identity & Persona
     - First Greeting & Fallback Responses
     - System Prompt
     - Structured Knowledge Base Topics
     - Guardrails & Strict Safety Boundaries
   - **Dual-Mode Reviewer:**
     - **Interactive UI Editor:** Add/remove guardrails, adjust first messages, tweak knowledge base items.
     - **Raw JSON Editor:** Live syntax validation, instant sync, and 1-click clipboard copy.
   - Built-in intelligent synthesis engine (works out of the box even before adding external LLM keys, with optional Gemini or OpenAI integration).

3. **Step 3: ElevenLabs Voice Selection & Agent Deployment**
   - Automatically loads available voices from ElevenLabs or curated premade voices (Rachel, Domi, Bella, Antoni, Adam, Nicole).
   - Audio sample playback tester.
   - Pushes the compiled prompt, greeting, and voice configuration to the ElevenLabs Conversational AI API (`/v1/convai/agents/create`).

4. **Step 4: Success & Live Testing Hub**
   - Displays ElevenLabs Agent ID.
   - Direct link to open the agent in the ElevenLabs Console for live voice conversations.
   - Ready-to-use HTML floating widget code snippet for website embedding.

---

## 📁 Project Architecture

```
VOICEFORGE-AI/
├── package.json               # Root orchestrator (concurrent dev scripts)
├── .gitignore
├── README.md
│
├── server/                    # Node.js + Express + TypeScript Backend
│   ├── .env                   # Environment variables (ELEVENLABS_API_KEY, PORT)
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts           # Express entry point (port 5000)
│       ├── types/
│       │   └── rulebook.ts    # TypeScript schemas & Rulebook interfaces
│       ├── services/
│       │   ├── aiService.ts   # Rulebook generation & intelligent fallback
│       │   └── elevenLabsService.ts # ElevenLabs API integration
│       └── routes/
│           ├── rulebookRoutes.ts    # /api/rulebook/generate & /validate
│           ├── elevenLabsRoutes.ts  # /api/elevenlabs/voices & /agents
│           └── configRoutes.ts      # /api/config/status (key health checks)
│
└── client/                    # React + Vite + TypeScript Frontend
    ├── package.json
    ├── vite.config.ts         # Vite config with backend proxy
    ├── tailwind.config.js     # Tailwind CSS setup
    ├── index.html
    └── src/
        ├── App.tsx            # Main multi-step application workflow
        ├── main.tsx
        ├── index.css
        ├── api.ts             # Typed API fetchers
        ├── types.ts           # Shared interfaces
        └── components/
            ├── Header.tsx            # Navigation & ElevenLabs status badge
            ├── StatusBanner.tsx      # Helpful .env guidance
            ├── BusinessForm.tsx      # Step 1: Input & Presets
            ├── RulebookReviewer.tsx  # Step 2: Interactive & JSON Reviewer
            ├── AgentDeployer.tsx     # Step 3: Voice selector & deployment
            └── AgentSuccessModal.tsx # Step 4: Success, ID & Embed widget
```

---

## 🚀 Quick Start Guide

### 1. Install Dependencies

You can install all dependencies across root, server, and client by running:

```powershell
npm run install:all
```

Or install them individually:
```powershell
# In root directory:
npm install

# In server directory:
cd server
npm install
cd ..

# In client directory:
cd client
npm install
cd ..
```

---

### 2. Configure Your API Keys

Open `server/.env` in your text editor:

```env
PORT=5000

# Required for live voice agent creation:
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Optional:
GEMINI_API_KEY=
OPENAI_API_KEY=
```

> 💡 **Where to get an ElevenLabs API key:**
> Sign up for free at [ElevenLabs](https://elevenlabs.io), go to your Profile Settings, and create an API Key.

---

### 3. Run the Application

From the root project folder, run:

```powershell
npm run dev
```

This starts both:
- **Backend API:** `http://localhost:5000`
- **Frontend App:** `http://localhost:5173`

Open `http://localhost:5173` in your browser.

---

## 🏆 Hackathon Demo Guide

1. Open `http://localhost:5173`.
2. Click one of the quick preset buttons (e.g. **SmileCare Dental**).
3. Click **"Generate Rulebook"** to show the structured JSON generation.
4. Switch between the **Interactive Editor** and the **Raw JSON** tab to demonstrate the editable guardrails and system prompt.
5. Click **"Configure Voice & Deploy"**, choose a voice (e.g. Rachel or Domi), and click **"Create ElevenLabs Voice Agent"**.
6. Click **"Open in ElevenLabs Console"** to talk to your new live voice agent directly!
