import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Support large image base64 uploads
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// In-memory caregiver dispatch log for the session
const dispatchLogs: Array<{
  id: string;
  timestamp: string;
  headline: string;
  mode: string;
  is_urgent: boolean;
  alertMessage: string;
  recipient: {
    name: string;
    relationship: string;
    phone: string;
  };
  status: 'SENT' | 'FAILED';
}> = [];

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in environment.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check route
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Sahayak AI (Aura)',
    timestamp: new Date().toISOString(),
  });
});

// Caregiver notification dispatch endpoint
app.post('/api/caregiver-notify', async (req, res) => {
  try {
    const { headline, mode, alertMessage, recipient, is_urgent } = req.body;
    
    if (!alertMessage) {
      res.status(400).json({ error: 'Missing alert message' });
      return;
    }

    let webhookDispatched = false;
    // If an external webhook URL (e.g. Zapier, Slack, Make, Telegram) is configured, dispatch to it
    if (recipient?.webhookUrl && recipient.webhookUrl.startsWith('http')) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const webhookResp = await fetch(recipient.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'SAHAYAK_AI_CAREGIVER_ALERT',
            timestamp: new Date().toISOString(),
            headline,
            mode,
            is_urgent: !!is_urgent,
            alertMessage,
            recipient,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        webhookDispatched = webhookResp.ok;
      } catch (webhookErr) {
        console.warn('Caregiver external webhook dispatch notice:', webhookErr);
      }
    }

    const logEntry = {
      id: `DISP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      headline: headline || 'Urgent Safety Update',
      mode: mode || 'SAFETY_BILL_SCAM',
      is_urgent: !!is_urgent,
      alertMessage,
      recipient: recipient || {
        name: 'Priya',
        relationship: 'Daughter (Emergency Contact)',
        phone: '+1 (555) 019-2834',
      },
      status: 'SENT' as const,
      webhookDispatched,
    };

    dispatchLogs.unshift(logEntry);
    // Keep max 30 entries
    if (dispatchLogs.length > 30) dispatchLogs.pop();

    res.json({
      success: true,
      message: `Alert dispatched to ${logEntry.recipient.name} (${logEntry.recipient.relationship})`,
      dispatch: logEntry,
    });
  } catch (error: any) {
    console.error('Caregiver dispatch error:', error);
    res.status(500).json({ error: error?.message || 'Failed to dispatch alert' });
  }
});

// Retrieve caregiver notification dispatch history
app.get('/api/caregiver-history', (_req, res) => {
  res.json({
    dispatches: dispatchLogs,
  });
});

// Multimodal analyze endpoint for Sahayak AI
app.post('/api/analyze', async (req, res) => {
  const startTime = Date.now();
  try {
    const { text, image, audio, userProfile } = req.body;

    if (!text && !image && !audio) {
      res.status(400).json({ error: 'Please provide either text, an image, or audio input.' });
      return;
    }

    const ai = getGeminiClient();

    const parts: any[] = [];

    if (image?.data) {
      parts.push({
        inlineData: {
          mimeType: image.mimeType || 'image/jpeg',
          data: image.data,
        },
      });
    }

    if (audio?.data) {
      parts.push({
        inlineData: {
          mimeType: audio.mimeType || 'audio/webm',
          data: audio.data,
        },
      });
    }

    const promptText = text && text.trim().length > 0 
      ? text.trim() 
      : 'Analyze this input thoroughly for an older adult with maximum safety vigilance.';
    
    parts.push({
      text: promptText,
    });

    const seniorName = userProfile?.name || 'Ramesh';
    const seniorGreeting = userProfile?.preferredGreeting || 'Ramesh Ji';
    const seniorAge = userProfile?.age || 71;
    const caregiverName = userProfile?.caregiver?.name || 'Priya';
    const caregiverRel = userProfile?.caregiver?.relationship || 'Daughter';

    const systemInstruction = `You are Sahayak AI (Aura), an autonomous multimodal life and safety companion engineered specifically for older adults.
You are currently assisting ${seniorName} (prefers to be addressed as "${seniorGreeting}", age ${seniorAge}).
Their designated family emergency caregiver is ${caregiverName} (${caregiverRel}).
Your primary users have presbyopia, mild hand tremors, digital anxiety, and heightened vulnerability to cyber/financial fraud.

OPERATIONAL INSTRUCTIONS:
1. Classify the input into exactly ONE of these four operational modes:
   - "SAFETY_BILL_SCAM": Scrutinize payment demands, utility disconnection notices, bank SMS, lottery/prize claims, suspicious APK downloads, urgent threats, and phishing attempts. Look for urgency markers, suspicious phone numbers/links, high-pressure phrasing, and fake executive claims.
   - "HEALTH_PILL": Ingest medicine packaging, prescriptions, blister packs, pill bottles. Extract drug names, dosage cadence, whether to take with meals, and safety rules.
     CRITICAL MEDICAL GUARDRAIL: If the image is blurry, pill name is cut off, partially obstructed, or unidentifiable, YOU MUST NEVER GUESS. Set is_urgent_or_scam: true. In the headline state "Medicine Unclear - Verification Needed". In bullets and voice_readout include: "Image unclear. Please show this bottle directly to your pharmacist or doctor before consuming."
   - "MEMORY_STIMULATION": Ingest legacy family photos, old relics, sepia prints, wedding photos, childhood memories. Prompt gentle, comforting reminiscence dialogues.
   - "SMART_ASSIST": Translate conversational spoken instructions (e.g. "It's too warm in the room", "Please remind me to drink water", "I can't find my reading glasses") into deterministic, concrete action steps.

2. LANGUAGE & PRESENTATION:
   - 5th-grade natural language: Warm, crystal-clear, calm, reassuring, and completely free of confusing technical jargon.
   - Headline: Max 8 words, ultra-clear.
   - Bullets: Exactly 2 to 3 concise, high-value bullet points addressed specifically to ${seniorGreeting}.
   - Voice Readout: A gentle, warm, conversational paragraph written specifically to be spoken aloud slowly to ${seniorGreeting}. Address them warmly (e.g., "${seniorGreeting}, ...").
   - Caregiver Alert: Provide a short, actionable summary string for their family caregiver (${caregiverName}) if this requires attention (scam detected, unclear medicine, urgent bill due, health notice). If completely routine and safe, return null or empty string.
   - is_urgent_or_scam: true if it is a scam, phishing, threatening notice, unclear pill image, or high-risk scenario. false if it is safe, routine, or benign.
   - Confidence Reason: 1 brief sentence explaining the safety evaluation or intent reasoning.`;

    const modelsToTry = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
    let responseText: string | null = null;
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: {
            parts,
          },
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                mode: {
                  type: Type.STRING,
                  description: 'One of: HEALTH_PILL, SAFETY_BILL_SCAM, MEMORY_STIMULATION, SMART_ASSIST',
                },
                headline: {
                  type: Type.STRING,
                  description: 'Clear, high-contrast headline max 8 words',
                },
                is_urgent_or_scam: {
                  type: Type.BOOLEAN,
                  description: 'True if high alert, scam, threat, or unclear medicine',
                },
                confidence_reason: {
                  type: Type.STRING,
                  description: 'Brief reason for the classification and threat level',
                },
                bullets: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.STRING,
                  },
                  description: 'Up to 3 clear, plain-language action points',
                },
                voice_readout: {
                  type: Type.STRING,
                  description: 'Warm, slow-cadence spoken summary for speech synthesis',
                },
                caregiver_alert: {
                  type: Type.STRING,
                  description: 'Notification message for family caregiver or empty string if not required',
                },
              },
              required: [
                'mode',
                'headline',
                'is_urgent_or_scam',
                'confidence_reason',
                'bullets',
                'voice_readout',
              ],
            },
          },
        });

        if (response.text) {
          responseText = response.text;
          break;
        }
      } catch (err: any) {
        console.warn(`Model ${modelName} failed or busy:`, err?.message || err);
        lastError = err;
        // Small delay before trying fallback model
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }

    if (!responseText) {
      throw lastError || new Error('All model attempts were busy or returned empty.');
    }

    const payload = JSON.parse(responseText);

    // Normalize caregiver_alert null if empty string
    if (!payload.caregiver_alert || payload.caregiver_alert.trim() === '') {
      payload.caregiver_alert = null;
    }

    payload.inferenceTimeMs = Date.now() - startTime;

    res.json(payload);
  } catch (error: any) {
    console.error('Gemini Analysis Error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to process input through Sahayak AI pipeline',
    });
  }
});

// Vite Middleware for development vs Static serving for production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sahayak AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
