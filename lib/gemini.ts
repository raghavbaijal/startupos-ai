/**
 * OpenRouter Adapter Service Layer
 * Translates Google Gemini SDK calls to OpenRouter's completions and embeddings API format.
 */

interface GenerateContentRequest {
  contents?: Array<{
    role: string;
    parts: Array<{ text: string }>;
  }>;
  generationConfig?: {
    responseMimeType?: string;
    maxOutputTokens?: number;
  };
}

// Global in-memory circuit breaker state for provider resiliency
let consecutiveFailures = 0;
let lastFailureTimestamp = 0;
let circuitBrokenUntil = 0;
const TRIP_THRESHOLD = 3;
const TIME_WINDOW_MS = 60000;
const COOLDOWN_MS = 60000;

function checkCircuitBreaker(): { active: boolean; modelFallback: string } {
  const now = Date.now();
  if (circuitBrokenUntil > 0) {
    if (now < circuitBrokenUntil) {
      return { active: true, modelFallback: 'google/gemini-2.5-flash-lite' };
    } else {
      // Circuit cooldown complete, reset state
      circuitBrokenUntil = 0;
      consecutiveFailures = 0;
      console.log('[Circuit Breaker] Cool-down complete. Resetting breaker to CLOSED.');
    }
  }
  return { active: false, modelFallback: '' };
}

function registerFailure() {
  const now = Date.now();
  if (now - lastFailureTimestamp > TIME_WINDOW_MS) {
    consecutiveFailures = 1;
  } else {
    consecutiveFailures++;
  }
  lastFailureTimestamp = now;
  console.warn(`[Circuit Breaker] Failure registered. Consecutive failures: ${consecutiveFailures}/${TRIP_THRESHOLD}`);

  if (consecutiveFailures >= TRIP_THRESHOLD) {
    circuitBrokenUntil = now + COOLDOWN_MS;
    console.error(`[Circuit Breaker] TRIPPED! Circuit OPEN for ${COOLDOWN_MS / 1000}s. Routing to fallback models.`);
  }
}

function registerSuccess() {
  if (consecutiveFailures > 0 && circuitBrokenUntil === 0) {
    consecutiveFailures = 0;
    console.log('[Circuit Breaker] Success registered. Resetting consecutive failures to 0.');
  }
}

export function getGenerativeModel(modelName: string) {
  // Configuration-driven model routing.
  // Checks if an override exists for the requested model name.
  // Example: gemini-1.5-pro -> MODEL_OVERRIDE_GEMINI_1_5_PRO
  const envKey = `MODEL_OVERRIDE_${modelName.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
  const openRouterModel = process.env[envKey] || process.env.DEFAULT_LLM_MODEL || 'google/gemini-2.5-flash';

  return {
    /**
     * Mimics Gemini's generateContent method
     */
    generateContent: async (request: string | GenerateContentRequest) => {
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY environment variable is not configured in .env.local.');
      }

      let prompt = '';
      let isJson = false;
      let maxTokens = 800;

      if (typeof request === 'string') {
        prompt = request;
      } else {
        if (request.contents && request.contents[0]?.parts?.[0]) {
          prompt = request.contents[0].parts[0].text;
        }
        if (request.generationConfig?.responseMimeType === 'application/json') {
          isJson = true;
        }
        if (request.generationConfig?.maxOutputTokens) {
          maxTokens = request.generationConfig.maxOutputTokens;
        }
      }

      // Check Circuit Breaker
      const cb = checkCircuitBreaker();
      let primaryModel = openRouterModel;
      if (cb.active) {
        console.warn(`[Circuit Breaker] Circuit is OPEN. Swapping primary model ${primaryModel} to fallback: ${cb.modelFallback}`);
        primaryModel = cb.modelFallback;
      }

      // Dynamic fallback list: use configured model followed by active free models to bypass credit limits and ensure reliability
      const modelsList = [
        primaryModel,
        'google/gemini-2.5-flash-lite',
        'meta-llama/llama-3.2-3b-instruct:free',
        'google/gemma-4-31b-it:free'
      ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 3);

      console.log(`[OpenRouter Adapter] Routing "${modelName}" request to OpenRouter models: ${JSON.stringify(modelsList)} (JSON Mode: ${isJson}, Max Tokens: ${maxTokens}, Circuit Breaker Active: ${cb.active})`);

      let attempts = 0;
      const maxAttempts = 4;

      while (attempts < maxAttempts) {
        attempts++;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.warn(`[OpenRouter Adapter] completions API request timed out after 30s. Aborting...`);
          controller.abort();
        }, 30000);

        try {
          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
              'HTTP-Referer': 'https://startupos.ai',
              'X-Title': 'StartupOS AI',
            },
            body: JSON.stringify({
              models: modelsList,
              messages: [{ role: 'user', content: prompt }],
              response_format: isJson ? { type: 'json_object' } : undefined,
              max_tokens: maxTokens
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            registerSuccess();
            const data = await response.json();
            const textResult = data.choices?.[0]?.message?.content || '';
            console.log(`[OpenRouter Adapter] Response received successfully from model: "${data.model}" (Attempt ${attempts}/${maxAttempts})`);
            return {
              response: {
                text: () => textResult,
              },
              usage: data.usage,
              circuitBreakerActive: cb.active,
              modelUsed: data.model || modelsList[0]
            };
          }

          // Read error output
          const errorText = await response.text();
          let isRateLimit = response.status === 429;
          let retryAfter = 15; // default wait for rate limit to clear

          try {
            const errObj = JSON.parse(errorText);
            const errCode = errObj.error?.code;
            const errMsg = errObj.error?.message?.toLowerCase() || '';
            
            if (errCode === 429 || errMsg.includes('429') || errMsg.includes('rate-limit') || errMsg.includes('rate_limit') || errMsg.includes('too many requests')) {
              isRateLimit = true;
              const retrySecs = errObj.error?.metadata?.retry_after_seconds;
              if (retrySecs && typeof retrySecs === 'number') {
                retryAfter = retrySecs;
              }
              
              // If it's a hard daily quota exhaustion or billing credit limit, do not retry
              if (errMsg.includes('free-models-per-day') || errMsg.includes('quota') || errMsg.includes('credit') || errMsg.includes('balance') || errMsg.includes('afford')) {
                isRateLimit = false;
              }
            }
          } catch (pe) {}

          if (isRateLimit && attempts < maxAttempts) {
            console.warn(`[OpenRouter Adapter] Rate limit (429) encountered. Waiting ${retryAfter + 1}s before retry attempt ${attempts + 1}/${maxAttempts}...`);
            await new Promise((resolve) => setTimeout(resolve, (retryAfter + 1) * 1000));
            continue;
          }

          throw new Error(`OpenRouter API response error (${response.status}): ${errorText}`);
        } catch (err: any) {
          clearTimeout(timeoutId);
          registerFailure();

          if (err.name === 'AbortError') {
            console.error('[OpenRouter Adapter] completions API request aborted due to 30s timeout.');
            throw new Error('OpenRouter API request timed out after 30 seconds.');
          }

          const errMsg = err.message?.toLowerCase() || '';
          const isHardLimit = errMsg.includes('free-models-per-day') || errMsg.includes('quota') || errMsg.includes('credit') || errMsg.includes('balance') || errMsg.includes('afford');
          
          if (attempts >= maxAttempts || isHardLimit) {
            console.error('[OpenRouter Adapter] completions API error:', err);
            throw err;
          }
          console.warn(`[OpenRouter Adapter] Attempt ${attempts} failed: ${err.message || err}. Retrying in 5s...`);
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }
      throw new Error(`Failed to generate content after ${maxAttempts} attempts.`);
    },

    /**
     * Mimics Gemini's embedContent method to satisfy RAG indexing / retrieval queries.
     * Queries OpenRouter's embeddings API for native 768-dimensional embeddings.
     */
    embedContent: async (text: string) => {
      console.log('[OpenRouter Adapter] Generating 768-dimensional native embedding via openai/text-embedding-3-small.');

      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY environment variable is not configured in .env.local.');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn(`[OpenRouter Adapter] Embeddings API request timed out after 30s. Aborting...`);
        controller.abort();
      }, 30000);

      try {
        const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'openai/text-embedding-3-small',
            input: text,
            dimensions: 768
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`OpenRouter Embeddings API response error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        const embeddingValues = data.data?.[0]?.embedding;
        if (!embeddingValues || !Array.isArray(embeddingValues)) {
          throw new Error('Invalid embedding response format from OpenRouter API.');
        }

        return {
          embedding: {
            values: embeddingValues,
          },
        };
      } catch (err: any) {
        clearTimeout(timeoutId);
        console.error('[OpenRouter Adapter] Native embedding API error:', err);
        if (err.name === 'AbortError') {
          throw new Error('Embedding API request timed out after 30 seconds.');
        }
        throw err;
      }
    },
  };
}
