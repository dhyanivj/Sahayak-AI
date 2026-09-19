import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Support large image base64 uploads with secure parsing
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// 1. Comprehensive Security Headers Middleware
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Permissions-Policy',
    'camera=(self), microphone=(self), geolocation=()'
  );
  next();
});

// 2. High-Performance API Rate Limiter
interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const ipRateLimitMap = new Map<string, RateLimitRecord>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 120; // 120 requests per min

const apiRateLimiter = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.path.startsWith('/api')) return next();
  // Health check should bypass rate limit
  if (req.path === '/api/health') return next();

  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown-ip';
  const now = Date.now();
  const record = ipRateLimitMap.get(clientIp);

  if (!record || now > record.resetTime) {
    ipRateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  record.count += 1;
  if (record.count > MAX_REQUESTS_PER_WINDOW) {
    res.status(429).json({
      error: 'Too many requests. Please pause for a moment to protect server resources.',
      retryAfterSeconds: Math.ceil((record.resetTime - now) / 1000),
    });
    return;
  }
  next();
};

app.use(apiRateLimiter);

// 3. Input Sanitization Helper
export function sanitizeElderText(text: unknown): string {
  if (typeof text !== 'string') return '';
  return text
    .replace(/\0/g, '') // remove null bytes
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // remove scripts
    .trim();
}

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
                medicineDetails: {
                  type: Type.OBJECT,
                  description: 'Structured medicine information if mode is HEALTH_PILL',
                  properties: {
                    name: { type: Type.STRING, description: 'Brand or generic medicine name and strength' },
                    purpose: { type: Type.STRING, description: 'Plain English purpose e.g. blood pressure' },
                    timing: { type: Type.STRING, description: 'morning, afternoon, evening, night, or as_needed' },
                    instructions: { type: Type.STRING, description: 'e.g. Take with food' },
                    cautions: { type: Type.STRING, description: 'Elder-specific side effect or caution' },
                  },
                },
                scamDetails: {
                  type: Type.OBJECT,
                  description: 'Structured fraud breakdown if mode is SAFETY_BILL_SCAM',
                  properties: {
                    scamType: { type: Type.STRING, description: 'e.g. Electricity Cut Threat, Fake Bank KYC, Courier Parcel' },
                    psychologicalTrap: { type: Type.STRING, description: 'e.g. Artificial urgency threatening power cut in 2 hours' },
                    redFlags: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: 'List of 2-3 specific suspicious indicators detected',
                    },
                    safeRebuttalScript: { type: Type.STRING, description: 'Safe pre-written response message elder can send back' },
                  },
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

// Interactive AI Clarification / Follow-up Endpoint for Elders ("Ask Sahayak")
app.post('/api/clarify', async (req, res) => {
  try {
    const { question, currentPayload, history, userProfile } = req.body;

    if (!question || !question.trim()) {
      res.status(400).json({ error: 'Question is required' });
      return;
    }

    const ai = getGeminiClient();
    const seniorGreeting = userProfile?.preferredGreeting || userProfile?.name || 'Friend';
    const seniorAge = userProfile?.age || 70;

    const systemInstruction = `You are Sahayak AI, speaking directly and warmly with ${seniorGreeting} (age ${seniorAge}).
They just had a document, bill, or medicine analyzed.
They are now asking you a direct follow-up question to feel completely confident, safe, and calm.

CONTEXT OF THE INSPECTED ITEM:
- Headline: ${currentPayload?.headline || 'Not specified'}
- Category: ${currentPayload?.mode || 'General'}
- Is Urgent or Threat: ${currentPayload?.is_urgent_or_scam ? 'YES' : 'NO'}
- Key Points: ${(currentPayload?.bullets || []).join('; ')}
- Medicine Info: ${JSON.stringify(currentPayload?.medicineDetails || null)}
- Scam Info: ${JSON.stringify(currentPayload?.scamDetails || null)}

RULES FOR YOUR ANSWER:
1. Speak with deep warmth, patience, and absolute clarity at a 5th-grade level. No legal or pharmaceutical jargon.
2. Address ${seniorGreeting} with utmost respect.
3. Keep the answer concise (2-4 sentences maximum) so it is easy to listen to or read on a large screen.
4. If this is a medical question: remind them gently that for dosage changes, always check with their doctor or pharmacist.
5. If this is a scam question: reassure them they did the right thing by checking first, and remind them never to click links or share OTPs.`;

    const chatHistory = (history || []).slice(-6).map((msg: any) => ({
      role: msg.sender === 'elder' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        ...chatHistory,
        {
          role: 'user',
          parts: [{ text: question.trim() }],
        },
      ],
      config: {
        systemInstruction,
      },
    });

    const answer = response.text || `I am here with you, ${seniorGreeting}. Everything is safe and under control.`;
    res.json({ answer });
  } catch (error: any) {
    console.error('Clarify endpoint error:', error);
    res.status(500).json({ error: error?.message || 'Failed to process clarification question' });
  }
});

// Multilingual Elder Translation Endpoint
app.post('/api/translate', async (req, res) => {
  try {
    const { payload, targetLanguage } = req.body;

    if (!payload || !targetLanguage) {
      res.status(400).json({ error: 'Payload and targetLanguage are required' });
      return;
    }

    const ai = getGeminiClient();

    const prompt = `Translate the following elder safety card information accurately, naturally, and warmly into ${targetLanguage}.
Keep sentences simple, polite, and reassuring for an older person.
Preserve the exact JSON structure.

INPUT JSON:
${JSON.stringify({
  headline: payload.headline,
  bullets: payload.bullets,
  voice_readout: payload.voice_readout,
  caregiver_alert: payload.caregiver_alert,
  confidence_reason: payload.confidence_reason,
})}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING },
            bullets: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            voice_readout: { type: Type.STRING },
            caregiver_alert: { type: Type.STRING },
            confidence_reason: { type: Type.STRING },
          },
          required: ['headline', 'bullets', 'voice_readout', 'confidence_reason'],
        },
      },
    });

    if (!response.text) {
      throw new Error('Empty response from translation model');
    }

    const translatedData = JSON.parse(response.text);
    res.json({
      ...payload,
      headline: translatedData.headline,
      bullets: translatedData.bullets,
      voice_readout: translatedData.voice_readout,
      caregiver_alert: translatedData.caregiver_alert || payload.caregiver_alert,
      confidence_reason: translatedData.confidence_reason || payload.confidence_reason,
      currentLanguage: targetLanguage,
    });
  } catch (error: any) {
    console.error('Translation error:', error);
    res.status(500).json({ error: error?.message || 'Failed to translate content' });
  }
});

// AI Multi-Drug Interaction Watchdog Endpoint
app.post('/api/check-interactions', async (req, res) => {
  try {
    const { medicines, userProfile } = req.body;

    if (!Array.isArray(medicines) || medicines.length === 0) {
      res.status(400).json({ error: 'Please provide at least one medicine to check.' });
      return;
    }

    const ai = getGeminiClient();
    const seniorGreeting = userProfile?.preferredGreeting || userProfile?.name || 'Friend';
    const seniorAge = userProfile?.age || 70;

    const medListString = medicines
      .map(
        (m, idx) =>
          `${idx + 1}. Name: "${m.name}", Purpose: "${m.purpose || 'Not stated'}", Timing: "${m.timing || 'Not stated'}", Notes: "${m.instructions || ''}"`
      )
      .join('\n');

    const prompt = `You are Sahayak AI's Senior Clinical Pharmacist Safety Guard.
Evaluate the following list of medications currently taken by ${seniorGreeting} (age ${seniorAge}):

ACTIVE MEDICINE SCHEDULE:
${medListString}

TASK:
1. Determine if there are any known drug-drug interactions, duplicate drug classes (e.g. two blood thinners or NSAIDs), or dangerous combinations.
2. Identify critical food/drink interactions (e.g. grapefruit, milk/dairy, high potassium, antacids).
3. Provide optimal time-of-day spacing rules (e.g. "Take pill A in the morning after food, and pill B at night").
4. Write a warm, reassuring spoken readout that addresses ${seniorGreeting} directly with peace of mind.
5. If only 1 medicine is provided, review its safety profile, food rules, and common elder cautions.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hasConflict: {
              type: Type.BOOLEAN,
              description: 'True if potential dangerous interaction or duplicate drug class found',
            },
            overallSafety: {
              type: Type.STRING,
              description: 'One of: SAFE, CAUTION, DANGER',
            },
            headline: {
              type: Type.STRING,
              description: 'Max 8 words summary of routine safety e.g. "Your Medications Are Compatible"',
            },
            summary: {
              type: Type.STRING,
              description: 'Plain English explanation of how these medications work together',
            },
            warnings: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Specific interaction warnings or duplicate medication alerts',
            },
            foodCautions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Food, dairy, or supplement cautions e.g. Avoid grapefruit',
            },
            timingRecommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Suggested schedule spacing for maximum absorption and safety',
            },
            voiceReadout: {
              type: Type.STRING,
              description: 'Warm, spoken paragraph addressed to the elder',
            },
          },
          required: [
            'hasConflict',
            'overallSafety',
            'headline',
            'summary',
            'warnings',
            'foodCautions',
            'timingRecommendations',
            'voiceReadout',
          ],
        },
      },
    });

    if (!response.text) {
      throw new Error('Empty response from drug interaction model');
    }

    const report = JSON.parse(response.text);
    res.json(report);
  } catch (error: any) {
    console.error('Drug interaction check error:', error);
    res.status(500).json({ error: error?.message || 'Failed to analyze medicine interactions' });
  }
});

// Global Express Error Handler (Security Shield - hides stack traces)
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled server error:', err?.message || err);
  if (res.headersSent) return;
  res.status(err?.status || 500).json({
    error: 'An internal safety verification error occurred. Please try again shortly.',
  });
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
