// Utility to call Ollama (local Llama 3.2) for code analysis and eco tips
import * as http from 'http';

export async function getEcoTipFromOllama(code: string, language: string): Promise<string | null> {
    const prompt = `Analyze the following ${language} code and suggest one eco-friendly improvement as a concise tip. Only return the tip, no explanation.\n\nCode:\n${code}`;
    const data = JSON.stringify({
        model: 'llama3.2', // or your local model name
        prompt,
        stream: false
    });
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: 'localhost',
            port: 11434,
            path: '/api/generate',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        }, res => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    resolve(json.response?.trim() || null);
                } catch {
                    resolve(null);
                }
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

export type LLMAnalysisResult = {
    issue: string;
    suggestion: string;
    cpuSaved: string;
    replacement: string;
};

export async function getDetailedEcoTipFromOllama(code: string, language: string): Promise<LLMAnalysisResult | null> {
    const prompt = `Analyze the following ${language} code. Identify one eco-unfriendly issue, suggest an improvement, estimate the CPU saved (or efficiency gain), and provide a replacement code snippet. Respond in this JSON format: { "issue": "...", "suggestion": "...", "cpuSaved": "...", "replacement": "..." }\n\nCode:\n${code}`;
    const data = JSON.stringify({
        model: 'llama3.2',
        prompt,
        stream: false
    });
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: 'localhost',
            port: 11434,
            path: '/api/generate',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        }, res => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    const response = json.response?.trim();
                    if (!response) {
                        resolve(null);
                        return;
                    }
                    // Try to extract JSON from the response
                    const match = response.match(/\{[\s\S]*\}/);
                    if (match) {
                        const result = JSON.parse(match[0]);
                        resolve(result);
                    } else {
                        resolve(null);
                    }
                } catch {
                    resolve(null);
                }
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}
