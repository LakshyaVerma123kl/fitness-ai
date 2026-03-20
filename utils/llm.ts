import { GoogleGenerativeAI } from "@google/generative-ai";

export const PROVIDERS = [
  {
    provider: "groq",
    model: "llama-3.3-70b-versatile",
    name: "Groq Llama 3.3 70B",
  },
  { provider: "gemini", model: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
  { provider: "gemini", model: "gemini-pro", name: "Gemini Pro" },
  {
    provider: "huggingface",
    model: "meta-llama/Llama-3.3-70B-Instruct",
    name: "HuggingFace Llama 3.3",
  },
];

async function callGroq(prompt: string, model: string, systemPrompt?: string) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not found");

  const messages = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 4000,
      }),
    },
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `Groq Error: ${error.error?.message || response.statusText}`,
    );
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callHuggingFace(prompt: string, model: string, systemPrompt?: string) {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) throw new Error("HUGGINGFACE_API_KEY not found");

  const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;

  const response = await fetch(
    `https://api-inference.huggingface.co/models/${model}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        inputs: fullPrompt,
        parameters: {
          max_new_tokens: 4000,
          temperature: 0.7,
          return_full_text: false,
        },
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HuggingFace Error: ${error}`);
  }

  const data = await response.json();
  return data[0]?.generated_text || data.generated_text;
}

export async function generateWithFallback(
  prompt: string,
  systemPrompt?: string
): Promise<{ text: string; providerName: string; model: string }> {
  let lastError = null;

  for (let i = 0; i < PROVIDERS.length; i++) {
    const { provider, model, name: providerName } = PROVIDERS[i];

    try {
      let responseText = "";

      if (provider === "gemini") {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) continue;
        const genAI = new GoogleGenerativeAI(apiKey);
        const geminiModel = genAI.getGenerativeModel({
          model,
          systemInstruction: systemPrompt,
        });
        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;
        responseText = response.text();
      } else if (provider === "groq") {
        if (!process.env.GROQ_API_KEY) continue;
        responseText = await callGroq(prompt, model, systemPrompt);
      } else if (provider === "huggingface") {
        if (!process.env.HUGGINGFACE_API_KEY) continue;
        responseText = await callHuggingFace(prompt, model, systemPrompt);
      }

      if (!responseText) throw new Error("Empty response received");

      console.log(`✅ Success using ${providerName}`);
      return { text: responseText, providerName, model };
    } catch (error: any) {
      lastError = error;
      console.warn(`⚠️ ${providerName} failed: ${error.message}`);
      if (i < PROVIDERS.length - 1)
        await new Promise((r) => setTimeout(r, 1000));
    }
  }

  console.error("❌ All AI providers failed");
  throw new Error(
    `Unable to generate content. All providers failed. Last error: ${lastError?.message}`
  );
}

async function callGroqChat(messages: { role: string; content: string }[], model: string, systemPrompt?: string) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not found");

  const preparedMessages = [];
  if (systemPrompt) preparedMessages.push({ role: "system", content: systemPrompt });
  preparedMessages.push(...messages);

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: preparedMessages,
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Groq Error: ${error.error?.message || response.statusText}`);
  }
  const data = await response.json();
  return data.choices[0].message.content;
}

async function callHuggingFaceChat(messages: { role: string; content: string }[], model: string, systemPrompt?: string) {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) throw new Error("HUGGINGFACE_API_KEY not found");

  const preparedMessages = [];
  if (systemPrompt) preparedMessages.push({ role: "system", content: systemPrompt });
  preparedMessages.push(...messages);

  const response = await fetch(`https://api-inference.huggingface.co/models/${model}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: preparedMessages,
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HuggingFace Error: ${error}`);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

export async function generateChatWithFallback(
  messages: { role: string; content: string }[],
  systemPrompt?: string
): Promise<{ text: string; providerName: string; model: string }> {
  let lastError = null;

  for (let i = 0; i < PROVIDERS.length; i++) {
    const { provider, model, name: providerName } = PROVIDERS[i];

    try {
      let responseText = "";

      if (provider === "gemini") {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) continue;
        
        const history = messages.slice(0, -1).map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));
        const lastMessage = messages[messages.length - 1];

        const body: any = {
          contents: [
            ...history,
            { role: "user", parts: [{ text: lastMessage.content }] },
          ],
          generationConfig: { maxOutputTokens: 4000, temperature: 0.7 },
        };
        
        if (systemPrompt) {
          body.system_instruction = { parts: [{ text: systemPrompt }] };
        }

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        );

        if (!res.ok) {
           const errText = await res.text();
           throw new Error(errText);
        }
        const data = await res.json();
        responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      } else if (provider === "groq") {
        if (!process.env.GROQ_API_KEY) continue;
        responseText = await callGroqChat(messages, model, systemPrompt);
      } else if (provider === "huggingface") {
        if (!process.env.HUGGINGFACE_API_KEY) continue;
        // Some HuggingFace models don't support chat format directly, but HF's Messages API does for Llama 3
        responseText = await callHuggingFaceChat(messages, model, systemPrompt);
      }

      if (!responseText) throw new Error("Empty response received");

      console.log(`✅ Success using ${providerName} for chat`);
      return { text: responseText, providerName, model };
    } catch (error: any) {
      lastError = error;
      console.warn(`⚠️ ${providerName} failed for chat: ${error.message}`);
      if (i < PROVIDERS.length - 1)
        await new Promise((r) => setTimeout(r, 1000));
    }
  }

  console.error("❌ All AI providers failed for chat");
  throw new Error(`Unable to generate chat content. Last error: ${lastError?.message}`);
}
