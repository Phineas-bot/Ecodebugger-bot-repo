// Groq API management and batching for EcoDebugger 

let groqRateLimit = { count: 0, lastReset: Date.now() };
const GROQ_RATE_LIMIT = 60; // max 60 requests per hour
let groqBatchQueue: { code: string, resolve: Function, reject: Function }[] = [];
let groqBatchTimer: NodeJS.Timeout | undefined;

export function canSendGroqRequest() {
    const now = Date.now();
    if (now - groqRateLimit.lastReset > 60 * 60 * 1000) {
        groqRateLimit = { count: 0, lastReset: now };
    }
    return groqRateLimit.count < GROQ_RATE_LIMIT;
}

// === Real Groq API Integration ===
// To insert the shared API key below. This key will be used for all users usx batch request and restricted acess for fair use .
const GROQ_API_KEY = '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';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'; // to be replace with actual endpoint
const SYSTEM_PROMPT = `You are an expert eco-coding assistant. Your tasks:
1. Analyze the code and identify any potential environmental inefficiencies.
2. Suggest concrete improvements that reduce energy consumption, enhance performance, and promote green software engineering practices.
3. If no improvements are needed, acknowledge that the code is eco-friendly and efficient.
4. Format your output as:
- **Detected Issues**: [list]
- **Eco Tips**: [list of suggestions]
- **Estimated CO₂ Impact**

Be concise, practical, and helpful.`;
const GROQ_MODEL = 'llama3-70b-8192'; // You can change this to any supported Groq model

async function realGroqApiCall(codes: string[]): Promise<any[]> {
    if (!GROQ_API_KEY) {
        throw new Error('No Groq API key set. Please configure your API key to use AI analysis.');
    }
    // Send one request per code snippet, as the OpenAI chat/completions endpoint expects a single conversation per request
    const results = await Promise.all(
        codes.map(async (code) => {
            const response = await fetch(GROQ_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: GROQ_MODEL,
                    messages: [
                        { role: 'system', content: SYSTEM_PROMPT },
                        { role: 'user', content: code }
                    ]
                })
            });
            if (!response.ok) {
                throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
            }
            const data: any = await response.json();
            // Return the main content from the first choice
            return data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : data;
        })
    );
    return results;
}

export async function sendGroqRequestBatch() {
    if (!canSendGroqRequest()) {
        groqBatchQueue.forEach(({ reject }) => reject('Rate limit exceeded'));
        groqBatchQueue = [];
        return;
    }
    const batch = groqBatchQueue.splice(0, groqBatchQueue.length);
    const codes = batch.map(item => item.code);
    try {
        // Use the real API call here
        const response = await realGroqApiCall(codes);
        batch.forEach(({ resolve }, i) => resolve(response[i]));
        groqRateLimit.count += batch.length;
    } catch (err) {
        batch.forEach(({ reject }) => reject(err));
    }
}

export function queueGroqRequest(code: string): Promise<any> {
    return new Promise((resolve, reject) => {
        groqBatchQueue.push({ code, resolve, reject });
        if (!groqBatchTimer) {
            groqBatchTimer = setTimeout(() => {
                sendGroqRequestBatch();
                groqBatchTimer = undefined;
            }, 1000); // batch every 1second 
        }
    });
}
