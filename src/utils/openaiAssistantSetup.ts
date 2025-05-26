// Script to create and register an OpenAI Assistant for eco-friendly Python code analysis
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const CONFIG_PATH = path.join(__dirname, 'openai-assistant-config.json');

async function createEcoAssistant() {
  const instructions = `You are an eco-conscious code expert.\nAnalyze the given Python code. Identify any inefficient, resource-intensive, or environmentally unfriendly coding patterns.\nFor each issue, return:\n- \"issue\": short title of the problem.\n- \"suggestion\": what should be done.\n- \"snippet\": a replacement Python code snippet.\n- \"explanation\": why your suggestion is more eco-friendly.\nRespond in valid JSON format.`;

  const assistant = await openai.beta.assistants.create({
    name: 'Eco Python Code Analyzer',
    instructions,
    tools: [{ type: 'code_interpreter' }],
    model: 'gpt-4o',
  });

  // Save the assistant ID to a config file for reuse
  fs.writeFileSync(CONFIG_PATH, JSON.stringify({ assistant_id: assistant.id }, null, 2));
  console.log('Assistant created with ID:', assistant.id);
}

if (require.main === module) {
  createEcoAssistant().catch(err => {
    console.error('Failed to create assistant:', err);
    process.exit(1);
  });
}
