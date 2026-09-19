export interface SampleScenario {
  id: string;
  title: string;
  tag: string;
  tagColor: string;
  iconName: 'ShieldAlert' | 'Pill' | 'AlertTriangle' | 'FileText' | 'Heart' | 'Mic';
  description: string;
  text?: string;
  imageDataUri?: string;
}

// Generate high-contrast SVG data URIs for realistic document/photo inputs
function createSvgDataUri(svgContent: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
}

// 1. Phishing / Threat SMS image
const scamSmsSvg = createSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="#f8fafc"/>
  <rect x="30" y="30" width="540" height="340" rx="16" fill="#ffffff" stroke="#cbd5e1" stroke-width="3"/>
  <rect x="30" y="30" width="540" height="50" rx="16" fill="#dc2626"/>
  <text x="50" y="62" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#ffffff">SMS from +1-800-POWER-OFF (Urgent Notice)</text>
  
  <text x="50" y="120" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#0f172a">URGENT: ELECTRICITY DISCONNECTION WARNING</text>
  <text x="50" y="155" font-family="Arial, sans-serif" font-size="17" fill="#334155">Dear Consumer Ramesh, your power supply will be cut off tonight at 9:30 PM</text>
  <text x="50" y="185" font-family="Arial, sans-serif" font-size="17" fill="#334155">due to non-payment of last month utility bill ($184.50).</text>
  
  <rect x="50" y="210" width="500" height="55" rx="8" fill="#fef2f2" stroke="#f87171" stroke-width="2"/>
  <text x="65" y="245" font-family="Arial, sans-serif" font-size="17" font-weight="bold" fill="#991b1b">Immediately pay via wire link: http://power-bill-update-quick.apk.xyz</text>
  
  <text x="50" y="295" font-family="Arial, sans-serif" font-size="16" fill="#475569">Failure to update will lead to legal disconnection charges ($350 penalty).</text>
  <text x="50" y="325" font-family="Arial, sans-serif" font-size="15" fill="#64748b">Support Helpline: 1800-SCAM-99</text>
</svg>
`);

// 2. Prescription slip (Metformin)
const prescriptionSvg = createSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="#fefce8"/>
  <rect x="25" y="25" width="550" height="350" rx="12" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>
  <text x="50" y="65" font-family="Georgia, serif" font-size="24" font-weight="bold" fill="#065f46">St. Jude Elder Care Clinic - Dr. S. Rao, MD</text>
  <line x1="50" y1="80" x2="550" y2="80" stroke="#059669" stroke-width="2"/>
  
  <text x="50" y="115" font-family="Arial, sans-serif" font-size="18" fill="#1e293b"><tspan font-weight="bold">Patient:</tspan> Ramesh (Age 71)</text>
  <text x="350" y="115" font-family="Arial, sans-serif" font-size="18" fill="#1e293b"><tspan font-weight="bold">Date:</tspan> 18 Sept 2026</text>
  
  <rect x="50" y="140" width="500" height="150" rx="8" fill="#f0fdf4" stroke="#86efac" stroke-width="1.5"/>
  <text x="70" y="175" font-family="Courier New, monospace" font-size="22" font-weight="bold" fill="#166534">Rx 1: METFORMIN HCL 500mg</text>
  <text x="70" y="210" font-family="Arial, sans-serif" font-size="18" fill="#1e293b">• Take 1 tablet twice daily with meals (Breakfast &amp; Dinner).</text>
  <text x="70" y="240" font-family="Arial, sans-serif" font-size="18" fill="#1e293b">• Drink plenty of water throughout the day.</text>
  <text x="70" y="270" font-family="Arial, sans-serif" font-size="17" font-weight="bold" fill="#991b1b">• Do NOT take on an empty stomach.</text>
  
  <text x="50" y="325" font-family="Arial, sans-serif" font-size="16" fill="#64748b">Refill count: 3 | Dispensed by: MediPlus Pharmacy</text>
  <text x="50" y="350" font-family="Brush Script MT, cursive" font-size="22" fill="#1e3a8a">Signed: Dr. S. Rao (Lic #92831)</text>
</svg>
`);

// 3. Blurry / Ambiguous Medicine Bottle (Testing strict medical safety guardrail)
const blurryMedicineSvg = createSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <defs>
    <filter id="heavyBlur" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8"/>
    </filter>
  </defs>
  <rect width="600" height="400" fill="#f1f5f9"/>
  <!-- Blurry medicine bottle image simulation -->
  <g filter="url(#heavyBlur)">
    <rect x="180" y="80" width="240" height="260" rx="40" fill="#f59e0b"/>
    <rect x="230" y="40" width="140" height="50" rx="10" fill="#ffffff"/>
    <rect x="200" y="140" width="200" height="140" fill="#ffffff"/>
    <text x="220" y="190" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#000000">A...TOR...??</text>
    <text x="220" y="230" font-family="Arial, sans-serif" font-size="22" fill="#000000">20 mg / daily ?</text>
  </g>
  <rect x="40" y="320" width="520" height="55" rx="8" fill="#fff1f2" stroke="#fda4af" stroke-width="2"/>
  <text x="60" y="355" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#be123c">[Test Simulation: Blurry label with unreadable medicine name]</text>
</svg>
`);

// 4. Genuine Utility Water Bill Notice
const waterBillSvg = createSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="#f8fafc"/>
  <rect x="30" y="30" width="540" height="340" rx="12" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
  <rect x="30" y="30" width="540" height="50" fill="#0284c7"/>
  <text x="50" y="63" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#ffffff">Metropolitan Water Works Authority - Monthly Statement</text>
  
  <text x="50" y="115" font-family="Arial, sans-serif" font-size="18" fill="#1e293b"><tspan font-weight="bold">Account Holder:</tspan> Ramesh Sharma | Account #9084-210</text>
  <text x="50" y="145" font-family="Arial, sans-serif" font-size="18" fill="#1e293b"><tspan font-weight="bold">Billing Period:</tspan> Aug 1 - Aug 31, 2026</text>
  
  <rect x="50" y="170" width="500" height="85" rx="8" fill="#f0f9ff" stroke="#bae6fd" stroke-width="1.5"/>
  <text x="70" y="205" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#0369a1">Total Amount Due: $42.15</text>
  <text x="70" y="235" font-family="Arial, sans-serif" font-size="17" font-weight="bold" fill="#0f172a">Payment Due Date: October 10, 2026 (In 22 days)</text>
  
  <text x="50" y="290" font-family="Arial, sans-serif" font-size="16" fill="#475569">• Autopay is currently active on your designated checking account.</text>
  <text x="50" y="318" font-family="Arial, sans-serif" font-size="16" fill="#475569">• No urgent action required. Normal household usage recorded.</text>
  <text x="50" y="348" font-family="Arial, sans-serif" font-size="14" fill="#94a3b8">Official portal: citywater.gov/pay | Customer Support: (800) 555-0199</text>
</svg>
`);

// 5. Vintage Family Photograph (Memory Stimulation)
const vintagePhotoSvg = createSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="#fdfbf7"/>
  <!-- Sepia frame -->
  <rect x="30" y="30" width="540" height="340" rx="8" fill="#f5eedc" stroke="#d7c7af" stroke-width="4"/>
  <rect x="50" y="50" width="500" height="300" fill="#785c37" opacity="0.15"/>
  
  <!-- Stylized vintage family silhouette -->
  <circle cx="240" cy="150" r="45" fill="#8c6d46"/>
  <path d="M170,270 C170,200 310,200 310,270 Z" fill="#8c6d46"/>
  
  <circle cx="360" cy="160" r="40" fill="#8c6d46"/>
  <path d="M290,270 C290,210 430,210 430,270 Z" fill="#8c6d46"/>
  
  <circle cx="300" cy="210" r="28" fill="#a4845c"/>
  <path d="M250,290 C250,250 350,250 350,290 Z" fill="#a4845c"/>
  
  <text x="60" y="335" font-family="Georgia, serif" font-style="italic" font-size="20" fill="#5c4428">"Shimla Summer Vacation with Priya &amp; Sunita - May 1982"</text>
</svg>
`);

export const SAMPLE_SCENARIOS: SampleScenario[] = [
  {
    id: 'scam-sms',
    title: '🚨 Fake Power Disconnection SMS',
    tag: 'Safety Check',
    tagColor: 'bg-red-100 text-red-800 border-red-300',
    iconName: 'ShieldAlert',
    description: 'High-pressure phishing SMS demanding immediate wire transfer or power cut.',
    text: 'SMS received: URGENT: ELECTRICITY CUT OFF tonight at 9:30 PM due to unpaid $184.50 bill. Immediately download APK and pay via http://power-bill-update-quick.apk.xyz or call 1800-SCAM-99 to avoid $350 police penalty!',
    imageDataUri: scamSmsSvg,
  },
  {
    id: 'prescription',
    title: '💊 Prescription: Metformin 500mg',
    tag: 'Health Pill',
    tagColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    iconName: 'Pill',
    description: 'Doctor prescription slip with dosing timing, food requirement, and schedule.',
    text: 'Handwritten Doctor Prescription for Ramesh: Rx 1: METFORMIN HCL 500mg. Take 1 tablet twice daily with breakfast and dinner. Do NOT take on empty stomach. Drink plenty of water.',
    imageDataUri: prescriptionSvg,
  },
  {
    id: 'blurry-pill',
    title: '⚠️ Blurry Unclear Pill Bottle',
    tag: 'Guardrail Test',
    tagColor: 'bg-amber-100 text-amber-900 border-amber-300',
    iconName: 'AlertTriangle',
    description: 'Unreadable medication photo testing the strict medical safety guardrail.',
    text: 'A photo of a yellow bottle where the name is smudged and unreadable (looks like A...TOR... 20mg?). Can I take this tonight?',
    imageDataUri: blurryMedicineSvg,
  },
  {
    id: 'utility-bill',
    title: '📄 Genuine Monthly Water Bill',
    tag: 'Bill Clarity',
    tagColor: 'bg-sky-100 text-sky-800 border-sky-300',
    iconName: 'FileText',
    description: 'Legitimate utility bill notice with autopay confirmed and no urgent threat.',
    text: 'Metropolitan Water Works Authority statement for Ramesh Sharma: Total Due $42.15 on Oct 10, 2026. Autopay active. Routine usage.',
    imageDataUri: waterBillSvg,
  },
  {
    id: 'vintage-photo',
    title: '📷 1982 Family Vacation Photo',
    tag: 'Memory Lane',
    tagColor: 'bg-purple-100 text-purple-800 border-purple-300',
    iconName: 'Heart',
    description: 'Sepia memory from Shimla summer trip with daughter Priya and wife Sunita.',
    text: 'Old family photograph labeled "Shimla Summer Vacation with young Priya and Sunita - May 1982". Sitting together on the ridge enjoying ice cream.',
    imageDataUri: vintagePhotoSvg,
  },
  {
    id: 'smart-assist',
    title: '🗣️ Spoken: "The room feels too cold"',
    tag: 'Voice Command',
    tagColor: 'bg-blue-100 text-blue-800 border-blue-300',
    iconName: 'Mic',
    description: 'Spoken request converting conversational elder speech into simple room actions.',
    text: 'Conversational speech from Ramesh: "Aura, the living room feels very chilly and my hands are shivering. What should I adjust on the thermostat?"',
  },
];
