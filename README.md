# Sahayak AI (Aura) 🛡️👵👴

> **Multimodal Life & Safety Companion Engineered for Older Adults**  
> Instant scam detection, prescription & medication verification, and multichannel caregiver alerts powered by Google Gemini Multimodal Vision & Audio.

---

## 📖 Overview

**Sahayak AI** (internally codenamed **Aura**) is an accessible, high-acuity life and safety companion designed specifically for elderly users, individuals with presbyopia, mild hand tremors, digital anxiety, or vulnerability to financial and cyber fraud.

Instead of navigating complex multi-tiered menus or dashboards, elders interact through a **Single Front Door**: they can simply point their device's camera at a document or pill bottle, speak aloud in conversational words, or paste an SMS notification. Sahayak verifies safety within seconds, speaks the explanation aloud in a gentle, calibrated voice, and provides instant one-tap dispatch alerts directly to designated family caregivers.

---

## ✨ Key Capabilities & Architectural Pillars

### 1. 🚪 Single Front-Door Multimodal Ingestion
- **Live Device Camera Viewfinder**: Real-time camera feed (`navigator.mediaDevices.getUserMedia`) with 3-second elder countdown, front/back camera flipping, high-contrast framing reticle, and auto-rasterization to JPEG.
- **Photo & Document Upload**: Drag-and-drop or file picker for physical mail, utility disconnection notices, and pill packaging with zoomable inspection view.
- **Voice Dictation Console**: Real-time Web Speech API recognition paired with a real-time Web Audio API signal meter (VU level display) so seniors can see their voice being registered.
- **1-Tap Real-World Test Presets**: Instant one-click simulations (e.g. *Urgent Power Disconnection SMS*, *Metformin Rx Blister Pack*, *Grandchild Emergency Impersonation*, *Vintage Wedding Photo*).

### 2. 🧠 Intelligent Classification Engine (Gemini 3.8 Flash)
Every interaction is parsed through a strict server-side JSON schema powered by `@google/genai` into one of four operational modes:
- **`SAFETY_BILL_SCAM`**: Detects extortion SMS, fake electricity cutoffs, phishing links, counterfeit bank warnings, lottery scams, and high-pressure threats.
- **`HEALTH_PILL`**: Ingests medicine labels, prescription bottles, and blister packs. Extracts drug names, dosages, and administration rules (with meals / bedtime).  
  *⚠️ Strict Medical Guardrail*: If the label is blurry, torn, or ambiguous, Sahayak refuses to guess, flags an alert, and advises the senior to consult their pharmacist.
- **`MEMORY_STIMULATION`**: Analyzes vintage family photographs and heirlooms, generating comforting, nostalgic reminiscence prompts.
- **`SMART_ASSIST`**: Translates informal complaints or spoken commands (*"It's too chilly in this room"*, *"I misplaced my glasses"*) into deterministic, concrete action steps.

### 3. 👓 High-Acuity Senior-Centric UX (WCAG AAA)
- **Engineered Typography**: Built with **Atkinson Hyperlegible** (developed by the Braille Institute of America to maximize low-vision character distinction) and **Newsreader** (authoritative, dignified serif).
- **Large Print Modes**: One-tap toggle between standard 18px body copy and 22px Jumbo Print.
- **Speech Synthesis**: Integrated browser text-to-speech with natural cadence tuning (0.70x to 1.0x slow-paced reading), play/pause toggles, and replay controls.
- **Strict Touch Geometries**: All interactive controls exceed the 44px–56px touch target threshold with single-line labels to avoid awkward line breaks on mobile.

### 4. 🚨 Multichannel Caregiver Safeguards
When a scam, unclear medication, or urgent bill is identified, Sahayak equips the elder with working communication channels:
- **Emergency Phone Call**: Direct `tel:` anchor that dials the family caregiver with zero intermediary clicks.
- **Direct SMS Dispatch**: Prefills an SMS message (`sms:`) containing the concise alert payload.
- **WhatsApp Web / Mobile Integration**: One-click opening of WhatsApp (`wa.me`) pre-populated with incident specifics.
- **Native OS Share Sheet**: Invokes `navigator.share` on mobile devices to send alerts to family messaging groups.
- **External Webhook Gateway**: Dispatches event payloads to external URLs (Slack webhooks, Telegram bots, Make, or Zapier).
- **Session Audit Log**: Real-time in-memory and local storage audit trails for visiting family members.

---

## 🏗️ Technical Architecture

```
├── client (React 19 + Vite + Tailwind CSS v4)
│   ├── /src/components
│   │   ├── Header.tsx             # Senior identity bar, print toggles, emergency call
│   │   ├── SingleFrontDoor.tsx    # Unified camera, microphone, and drop zone
│   │   ├── LiveCameraModal.tsx    # Live WebRTC camera viewfinder & countdown
│   │   ├── ReactiveResultCard.tsx # Color-coded verdict, voice player, caregiver action hub
│   │   ├── OnboardingForm.tsx     # Personalized senior profile & caregiver settings
│   │   ├── CaregiverLogModal.tsx  # Family alerts history & external webhook triggers
│   │   ├── ScannedHistoryModal.tsx# Local history archive of past scanned records
│   │   └── OfflineBanner.tsx      # Graceful network degradation and fallback
│   ├── /src/types.ts              # Strict TypeScript payload interfaces
│   └── /src/index.css             # High-acuity CSS tokens and font variables
│
└── server (Express + Node.js + @google/genai)
    └── server.ts                  # Server-side Gemini API proxy, Webhook dispatch, Vite middleware
```

### Tech Stack
- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide React, Motion
- **Backend**: Node.js, Express 4, `tsx` / `esbuild`
- **AI / Multimodal**: Google Gen AI SDK (`@google/genai`), `gemini-3.8-flash`
- **APIs**: Web Speech API (`SpeechRecognition`, `speechSynthesis`), Web Audio API (`AudioContext`, `AnalyserNode`), MediaDevices (`getUserMedia`)

---

## 🔌 API Endpoints

### `POST /api/analyze`
Submits text, image, or audio for multimodal safety verification.
- **Request Body**:
  ```json
  {
    "text": "URGENT: Your electricity will be disconnected tonight at 9:30 PM. Call 9876543210 immediately.",
    "image": {
      "mimeType": "image/jpeg",
      "data": "<base64-encoded-image>"
    },
    "userProfile": {
      "name": "Ramesh Sharma",
      "preferredGreeting": "Ramesh Ji",
      "age": 71,
      "caregiver": {
        "name": "Priya",
        "relationship": "Daughter",
        "phone": "+15550192834"
      }
    }
  }
  ```
- **Response**:
  ```json
  {
    "mode": "SAFETY_BILL_SCAM",
    "headline": "Fake Electricity Notice — Do Not Pay",
    "is_urgent_or_scam": true,
    "confidence_reason": "Power utilities never demand immediate payment through personal mobile numbers.",
    "bullets": [
      "Do not call the phone number in this message.",
      "Your electricity is safe and will not be cut off.",
      "Show this message to Priya to confirm your official utility account."
    ],
    "voice_readout": "Ramesh Ji, please do not worry. This message is fake. No one will disconnect your power...",
    "caregiver_alert": "Scam electricity disconnection notice detected on Ramesh Ji's phone."
  }
  ```

### `POST /api/caregiver-notify`
Records and forwards an alert to the family caregiver via in-memory log and optional external webhook.
- **Request Body**:
  ```json
  {
    "headline": "Scam Notice Detected",
    "mode": "SAFETY_BILL_SCAM",
    "is_urgent": true,
    "alertMessage": "Ramesh Ji received a fraudulent electricity shutoff warning.",
    "recipient": {
      "name": "Priya",
      "relationship": "Daughter",
      "phone": "+1 (555) 019-2834",
      "webhookUrl": "https://hooks.slack.com/services/..."
    }
  }
  ```

### `GET /api/caregiver-history`
Returns the recent list of dispatched alerts in the current session.

### `GET /api/health`
Health check endpoint returning service status and timestamp.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v20 or higher
- **npm** or **bun**
- A **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/sahayak-ai.git
cd sahayak-ai
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory (based on `.env.example`):
```env
# Required: Your Google Gemini API Key
GEMINI_API_KEY="your_actual_gemini_api_key_here"

# Port (Defaults to 3000)
PORT=3000
```

### 4. Run Development Server
```bash
npm run dev
```
The server will boot via `tsx server.ts` and bind to `http://localhost:3000`.

### 5. Production Build
```bash
# Compiles Vite client assets and bundles server.ts with esbuild
npm run build

# Start the compiled production server
npm start
```

---

## 🔒 Security & Medical Disclaimer

- **Privacy First**: All multimodal analysis is proxied through the authenticated backend; the Gemini API key is never exposed to the client browser.
- **Medical Disclaimer**: Sahayak AI is an assistive reference companion designed to transcribe and clarify labels for seniors. It is **not** a diagnostic device. If any medication label is unclear or damaged, Sahayak directs the senior to their licensed physician or pharmacist.
- **Scam Prevention**: Sahayak uses real-time zero-shot reasoning to cross-examine financial demands, urgency markers, and phishing vectors, empowering seniors to pause before transferring funds.

---

## 📄 License
This project is licensed under the MIT License.
