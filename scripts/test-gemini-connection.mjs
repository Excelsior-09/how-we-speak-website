// ==============================================================================
// TRYHOWWESPEAK — SERVER-SIDE INDEPENDENT GEMINI API DIAGNOSTIC
// Tests:
// 1. Reads GEMINI_API_KEY from environment or .env file (strictly sanitized, never printed)
// 2. Tests connectivity to https://generativelanguage.googleapis.com
// 3. Tests model: gemini-flash-latest
// 4. Fallback check: lists available models if model is not found
// ==============================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// Load environment variables from .env if present
function loadEnv() {
  const envPath = path.join(ROOT, '.env');
  if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, 'utf8');
    raw.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [k, ...v] = trimmed.split('=');
        const key = k.trim();
        const val = v.join('=').trim().replace(/^["']|["']$/g, '');
        if (key && !process.env[key]) {
          process.env[key] = val;
        }
      }
    });
  }
}

loadEnv();

async function runDiagnostic() {
  console.log('🔍 Running Google Gemini API Diagnostic...\n');

  let apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
  const cliKeyArg = process.argv.find((arg) => arg.startsWith('--key='));
  if (cliKeyArg) {
    apiKey = cliKeyArg.replace('--key=', '').trim();
  }

  if (!apiKey || apiKey.trim() === '') {
    console.error('❌ DIAGNOSTIC RESULT: GEMINI_API_KEY is MISSING in the server environment.');
    console.error('   Neither GEMINI_API_KEY nor AI_API_KEY was found in process.env or .env.');
    console.error('   Expected variable name: GEMINI_API_KEY');
    return {
      success: false,
      errorType: 'MISSING_API_KEY',
      message: 'GEMINI_API_KEY is empty or not configured in environment',
    };
  }

  const sanitizedKeyPreview = `${apiKey.slice(0, 4)}...${apiKey.slice(-4)} (${apiKey.length} characters)`;
  console.log(`ℹ️ API Key detected: [REDACTED ${sanitizedKeyPreview}]`);

  const model = process.env.GEMINI_MODEL || 'gemini-flash-latest';
  console.log(`ℹ️ Target Model: ${model}`);

  const testPrompt = 'Explain how AI works in one short paragraph.';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  console.log(`📡 Sending test request to: https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`);

  try {
    const start = Date.now();
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: testPrompt }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 150,
          temperature: 0.2,
        },
      }),
    });
    const elapsed = Date.now() - start;

    console.log(`📊 HTTP Status: ${res.status} ${res.statusText} (${elapsed}ms)`);

    if (res.ok) {
      const data = await res.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (generatedText && generatedText.trim().length > 0) {
        console.log('✅ DIAGNOSTIC RESULT: SUCCESS!');
        console.log(`   Real Gemini text received (${generatedText.trim().length} characters).`);
        console.log(`   Sample text preview: "${generatedText.trim().slice(0, 80)}..."`);
        return {
          success: true,
          status: res.status,
          model,
          generatedLength: generatedText.length,
        };
      } else {
        console.warn('⚠️ HTTP 200 returned but candidates payload had no text parts.');
        console.warn(JSON.stringify(data, null, 2));
        return {
          success: false,
          errorType: 'EMPTY_CANDIDATE',
          status: res.status,
        };
      }
    } else {
      const errBody = await res.text();
      let parsedErr = errBody;
      try {
        parsedErr = JSON.parse(errBody);
      } catch (e) {}

      console.error(`❌ DIAGNOSTIC RESULT: Gemini API returned HTTP ${res.status}`);
      console.error('   Sanitized Error Response:', typeof parsedErr === 'object' ? JSON.stringify(parsedErr, null, 2) : parsedErr);

      // Check if 404 model not found, query available models
      if (res.status === 404) {
        console.log('\n🔎 Querying list of models available to this API key...');
        try {
          const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
          if (listRes.ok) {
            const listData = await listRes.json();
            const models = (listData.models || []).map((m) => m.name.replace('models/', ''));
            console.log('   Available models for this key:', models.slice(0, 10).join(', '));
          }
        } catch (e) {
          console.warn('   Could not fetch model list:', e.message);
        }
      }

      return {
        success: false,
        status: res.status,
        error: parsedErr,
      };
    }
  } catch (netErr) {
    console.error('❌ Network or connectivity failure reaching Google Gemini API:');
    console.error('   ', netErr.message);
    return {
      success: false,
      errorType: 'NETWORK_ERROR',
      message: netErr.message,
    };
  }
}

runDiagnostic().catch((e) => {
  console.error('Diagnostic error:', e);
  process.exit(1);
});
