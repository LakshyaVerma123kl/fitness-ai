import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ⚙️ CONFIGURATION & SUPABASE SETUP
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const IMAGE_PROVIDERS = [
  { name: "stable-horde", model: "stable_diffusion" },
  { name: "pollinations", model: "flux" },
  { name: "gemini", model: "imagen-3.0-generate-001" },
  { name: "replicate", model: "stability-ai/sdxl" },
  { name: "huggingface", model: "stabilityai/stable-diffusion-xl-base-1.0" },
];

// 🔌 AI PROVIDER HELPERS

// Pollinations
async function callPollinations(prompt: string) {
  const encodedPrompt = encodeURIComponent(prompt);
  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true`;
  const MAX_RETRIES = 2;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`  Pollinations attempt ${attempt}/${MAX_RETRIES}...`);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000); // 12s per attempt
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const blob = await res.arrayBuffer();
        const buffer = Buffer.from(blob);
        const contentType = res.headers.get("content-type") || "image/jpeg";
        return { buffer, contentType };
      }
      console.warn(`  Pollinations attempt ${attempt} got ${res.status}`);
    } catch (err) {
      console.warn(`  Pollinations attempt ${attempt} threw:`, err);
    }
  }
  return null;
}

// Stable Horde — Free community-run AI (no API key needed, uses anonymous key)
async function callStableHorde(prompt: string) {
  const HORDE_KEY = process.env.STABLE_HORDE_API_KEY || "0000000000";
  try {
    // Step 1: Submit generation request
    const submitRes = await fetch("https://stablehorde.net/api/v2/generate/async", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: HORDE_KEY,
      },
      body: JSON.stringify({
        prompt,
        params: {
          width: 512,
          height: 512,
          steps: 20,
          n: 1,
          karras: true,
          sampler_name: "k_euler_a",
        },
        models: ["Deliberate"],
        r2: false, // return base64 directly
        nsfw: false,
      }),
    });

    if (!submitRes.ok) {
      console.warn("Stable Horde submit failed:", submitRes.status);
      return null;
    }

    const { id } = await submitRes.json();
    if (!id) return null;

    // Step 2: Poll for completion (max 60s)
    const MAX_POLLS = 30;
    for (let i = 0; i < MAX_POLLS; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const checkRes = await fetch(`https://stablehorde.net/api/v2/generate/check/${id}`);
      const check = await checkRes.json();

      if (check.done) {
        const statusRes = await fetch(`https://stablehorde.net/api/v2/generate/status/${id}`);
        const status = await statusRes.json();
        const b64 = status?.generations?.[0]?.img;
        if (b64) {
          const buffer = Buffer.from(b64, "base64");
          return { buffer, contentType: "image/webp" };
        }
        return null;
      }
      if (check.faulted) return null;
    }
    return null;
  } catch (err) {
    console.error("StableHorde Error:", err);
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

// 🚀 MAIN ROUTE

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
    let imageBuffer: Buffer | null = null;
    let contentType = "image/jpeg";

    // Provider Loop
    for (const provider of IMAGE_PROVIDERS) {
      try {
        console.log(`Trying provider: ${provider.name}`);

        if (provider.name === "stable-horde") {
          const result = await callStableHorde(enhancedPrompt);
          if (result) {
            imageBuffer = result.buffer;
            contentType = result.contentType;
            console.log(`✅ Success with stable-horde`);
            break;
          }
        } else if (provider.name === "pollinations") {
          // Pollinations does its own fetching + retry internally
          const result = await callPollinations(enhancedPrompt);
          if (result) {
            imageBuffer = result.buffer;
            contentType = result.contentType;
            console.log(`✅ Success with pollinations`);
            break;
          }
        } else {
          if (provider.name === "gemini") {
            rawImageUrl = await callGemini(enhancedPrompt);
          } else if (provider.name === "replicate") {
            rawImageUrl = await callReplicate(enhancedPrompt);
          } else if (provider.name === "huggingface") {
            rawImageUrl = await callHuggingFace(enhancedPrompt);
          }

          if (rawImageUrl) {
            // Download the image buffer
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
              // Handle URL (Replicate)
              const res = await fetch(rawImageUrl);
              if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`);
              const blob = await res.arrayBuffer();
              imageBuffer = Buffer.from(blob);
              contentType = res.headers.get("content-type") || "image/jpeg";
            }

            console.log(`✅ Success with ${provider.name}`);
            break;
          }
        }
      } catch (e) {
        console.warn(`❌ Provider ${provider.name} failed:`, e);
      }
    }

    // Fallback if literally everything fails
    if (!imageBuffer) {
      console.log("⚠️ All AI providers failed, using beautiful Flickr fallback");
      const fallbackKeyword = type === "exercise" ? "fitness,exercise" : "food,meal";
      const fallbackUrl = `https://loremflickr.com/512/512/${fallbackKeyword}?random=${Date.now()}`;
      
      try {
        const res = await fetch(fallbackUrl);
        if (res.ok) {
          const blob = await res.arrayBuffer();
          imageBuffer = Buffer.from(blob);
          contentType = res.headers.get("content-type") || "image/jpeg";
        } else {
          throw new Error("Flickr fallback failed");
        }
      } catch (err) {
        // Ultimate absolute fallback
        return NextResponse.json({
          imageUrl: `https://via.placeholder.com/512?text=${encodeURIComponent(
            prompt,
          )}`,
          fallback: true,
        });
      }
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
