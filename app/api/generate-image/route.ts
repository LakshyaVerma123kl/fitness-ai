import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ==========================================
// ⚙️ CONFIGURATION & SUPABASE SETUP
// ==========================================
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const IMAGE_PROVIDERS = [
  { name: "groq", model: "flux-1.1-pro" },
  { name: "pollinations", model: "flux" },
  { name: "gemini", model: "imagen-3.0-generate-001" },
  { name: "replicate", model: "stability-ai/sdxl" },
  { name: "huggingface", model: "stabilityai/stable-diffusion-xl-base-1.0" },
];

// ==========================================
// 🔌 AI PROVIDER HELPERS
// ==========================================

// Groq - Using direct API calls
async function callGroq(prompt: string) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/images/generations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "flux-1.1-pro",
          prompt: prompt,
          response_format: "url",
          n: 1,
        }),
      },
    );

    if (!response.ok) {
      console.error("Groq API error:", response.status, await response.text());
      return null;
    }

    const data = await response.json();
    return data.data?.[0]?.url || null;
  } catch (error) {
    console.error("Groq Error:", error);
    return null;
  }
}

// Pollinations - Updated to work with current API
async function callPollinations(prompt: string) {
  try {
    const encodedPrompt = encodeURIComponent(prompt);
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}`;

    // Test if the URL is accessible
    const response = await fetch(url, { method: "HEAD" });
    if (response.ok) {
      return url;
    }
    return null;
  } catch (error) {
    console.error("Pollinations Error:", error);
    return null;
  }
}

// Google Gemini (Imagen 3)
async function callGemini(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: { sampleCount: 1 },
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    const base64Image = data.predictions?.[0]?.bytesBase64Encoded;
    return base64Image ? `data:image/png;base64,${base64Image}` : null;
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
}

// Replicate
async function callReplicate(prompt: string) {
  const apiKey = process.env.REPLICATE_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${apiKey}`,
      },
      body: JSON.stringify({
        version:
          "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        input: { prompt },
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();

    let result = data;
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds timeout

    while (
      result.status !== "succeeded" &&
      result.status !== "failed" &&
      attempts < maxAttempts
    ) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const pollResponse = await fetch(result.urls.get, {
        headers: { Authorization: `Token ${apiKey}` },
      });
      result = await pollResponse.json();
      attempts++;
    }

    return result.output?.[0] || null;
  } catch (error) {
    console.error("Replicate Error:", error);
    return null;
  }
}

// HuggingFace
async function callHuggingFace(prompt: string) {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ inputs: prompt }),
      },
    );

    if (!response.ok) return null;
    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.error("HuggingFace Error:", error);
    return null;
  }
}

// ==========================================
// 🚀 MAIN ROUTE
// ==========================================

export async function POST(req: Request) {
  try {
    const { prompt, type } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt required" }, { status: 400 });
    }

    // 1. 🔍 CHECK CACHE (Supabase)
    const cacheKey = `${type}:${prompt.toLowerCase().trim()}`;
    const { data: cachedEntry } = await supabase
      .from("image_cache")
      .select("image_url")
      .eq("prompt", cacheKey)
      .single();

    if (cachedEntry) {
      console.log("⚡️ Cache Hit! Serving from Storage.");
      return NextResponse.json({ imageUrl: cachedEntry.image_url });
    }

    // 2. 🎨 GENERATE NEW IMAGE
    console.log("🎨 Cache Miss. Generating...");

    const enhancedPrompt =
      type === "exercise"
        ? `${prompt}, fitness gym photography, 8k, cinematic lighting, highly detailed`
        : `${prompt}, professional food photography, 8k, appetizing, cinematic lighting`;

    let rawImageUrl: string | null = null;

    // Provider Loop
    for (const provider of IMAGE_PROVIDERS) {
      try {
        console.log(`Trying provider: ${provider.name}`);

        if (provider.name === "groq") {
          rawImageUrl = await callGroq(enhancedPrompt);
        } else if (provider.name === "pollinations") {
          rawImageUrl = await callPollinations(enhancedPrompt);
        } else if (provider.name === "gemini") {
          rawImageUrl = await callGemini(enhancedPrompt);
        } else if (provider.name === "replicate") {
          rawImageUrl = await callReplicate(enhancedPrompt);
        } else if (provider.name === "huggingface") {
          rawImageUrl = await callHuggingFace(enhancedPrompt);
        }

        if (rawImageUrl) {
          console.log(`✅ Success with ${provider.name}`);
          break;
        }
      } catch (e) {
        console.warn(`❌ Provider ${provider.name} failed:`, e);
      }
    }

    // Fallback if literally everything fails
    if (!rawImageUrl) {
      console.log("⚠️ All providers failed, using placeholder");
      return NextResponse.json({
        imageUrl: `https://via.placeholder.com/512?text=${encodeURIComponent(
          prompt,
        )}`,
        fallback: true,
      });
    }

    // 3. 📥 DOWNLOAD & UPLOAD TO SUPABASE STORAGE
    let imageBuffer: Buffer;
    let contentType = "image/jpeg";

    if (rawImageUrl.startsWith("data:")) {
      // Handle Base64 (Gemini/HF)
      const matches = rawImageUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        contentType = matches[1];
        imageBuffer = Buffer.from(matches[2], "base64");
      } else {
        throw new Error("Invalid base64 string");
      }
    } else {
      // Handle URL (Pollinations/Replicate/Groq)
      const res = await fetch(rawImageUrl);
      if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`);
      const blob = await res.arrayBuffer();
      imageBuffer = Buffer.from(blob);
      contentType = res.headers.get("content-type") || "image/jpeg";
    }

    const fileName = `${type}/${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}.${contentType.split("/")[1]}`;

    const { error: uploadError } = await supabase.storage
      .from("exercise-images")
      .upload(fileName, imageBuffer, { contentType: contentType });

    if (uploadError) throw uploadError;

    // 4. 🔗 GET PUBLIC URL
    const { data: publicUrlData } = supabase.storage
      .from("exercise-images")
      .getPublicUrl(fileName);

    const finalUrl = publicUrlData.publicUrl;

    // 5. 💾 SAVE TO CACHE DB
    await supabase.from("image_cache").insert({
      prompt: cacheKey,
      image_url: finalUrl,
    });

    console.log("✅ Image generated and cached successfully");
    return NextResponse.json({ imageUrl: finalUrl });
  } catch (error: any) {
    console.error("Image Logic Error:", error);
    return NextResponse.json(
      { error: "Failed to generate image", details: error.message },
      { status: 500 },
    );
  }
}
