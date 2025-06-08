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
const GROQ_API_KEY = '';
const GROQ_API_URL = 'https://api.groq.com/v1/your-endpoint'; // to be replace with actual endpoint

async function realGroqApiCall(codes: string[]): Promise<any[]> {
    if (!GROQ_API_KEY) {
        throw new Error('No Groq API key set. Please configure your API key to use AI analysis.');
    }
    // Example: send a POST request with code snippets
    const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
            inputs: codes
        })
    });
    if (!response.ok) {
        throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
    }
    const data: any = await response.json();
    // Adapt this to match your API's response structure
    return data.results || data;
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
