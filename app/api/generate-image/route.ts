import { NextResponse } from "next/server";

// 🎨 Image Generation API Route
// Supports multiple FREE image generation providers

const IMAGE_PROVIDERS = [
  // 1. Pollinations.ai (100% FREE, no API key) - Kept as first priority
  { name: "pollinations", model: "flux" },

  // 2. Google Gemini (Imagen 3) - High Quality & Free Tier available
  { name: "gemini", model: "imagen-3.0-generate-001" },

  // 3. Replicate (Free tier available)
  { name: "replicate", model: "stability-ai/sdxl" },

  // 4. HuggingFace (Free)
  { name: "huggingface", model: "stabilityai/stable-diffusion-xl-base-1.0" },
];

// Helper: Call Google Gemini (Imagen 3)
async function callGemini(prompt: string) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_API_KEY not found");

  // Using the REST API to avoid adding heavy SDK dependencies
  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      instances: [{ prompt: prompt }],
      parameters: {
        sampleCount: 1,
        // You can add aspectRatio: "1:1", "16:9", etc. here if needed
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API failed: ${errorText}`);
  }

  const data = await response.json();

  // Gemini returns raw base64 string in data.predictions[0].bytesBase64Encoded
  const base64Image = data.predictions?.[0]?.bytesBase64Encoded;

  if (!base64Image) throw new Error("No image returned from Gemini");

  // Return formatted as data URL
  return `data:image/png;base64,${base64Image}`;
}

// Helper: Call Replicate API
async function callReplicate(prompt: string) {
  const apiKey = process.env.REPLICATE_API_KEY;
  if (!apiKey) throw new Error("REPLICATE_API_KEY not found");

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

  if (!response.ok) throw new Error("Replicate API failed");

  const data = await response.json();

  // Poll for result
  let result = data;
  while (result.status !== "succeeded" && result.status !== "failed") {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const pollResponse = await fetch(data.urls.get, {
      headers: { Authorization: `Token ${apiKey}` },
    });
    result = await pollResponse.json();
  }

  return result.output?.[0] || null;
}

// Helper: Call HuggingFace API
async function callHuggingFace(prompt: string) {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) throw new Error("HUGGINGFACE_API_KEY not found");

  const response = await fetch(
    "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ inputs: prompt }),
    }
  );

  if (!response.ok) throw new Error("HuggingFace API failed");

  const blob = await response.blob();
  const buffer = await blob.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  return `data:image/png;base64,${base64}`;
}

// Helper: Call Pollinations.ai (100% FREE!)
async function callPollinations(prompt: string) {
  const encodedPrompt = encodeURIComponent(prompt);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true`;
  return imageUrl;
}

export async function POST(req: Request) {
  try {
    const { prompt, type } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Enhanced prompts
    const enhancedPrompt =
      type === "exercise"
        ? `${prompt}, professional gym photography, high quality, detailed`
        : `${prompt}, professional food photography, high quality, appetizing`;

    let imageUrl = null;

    // Iterate through providers
    // We try Pollinations first (easiest/cheapest), then Gemini (high quality), then others
    for (const provider of IMAGE_PROVIDERS) {
      try {
        if (provider.name === "pollinations") {
          imageUrl = await callPollinations(enhancedPrompt);
        } else if (provider.name === "gemini" && process.env.GOOGLE_API_KEY) {
          imageUrl = await callGemini(enhancedPrompt);
        } else if (
          provider.name === "replicate" &&
          process.env.REPLICATE_API_KEY
        ) {
          imageUrl = await callReplicate(enhancedPrompt);
        } else if (
          provider.name === "huggingface" &&
          process.env.HUGGINGFACE_API_KEY
        ) {
          imageUrl = await callHuggingFace(enhancedPrompt);
        }

        if (imageUrl) {
          return NextResponse.json({ imageUrl });
        }
      } catch (error: any) {
        // Continue to next provider loop
      }
    }

    // If all providers fail, return placeholder

    return NextResponse.json({
      imageUrl: `https://via.placeholder.com/512x512/1a1a1a/00e599?text=${encodeURIComponent(
        type === "exercise" ? "Exercise" : "Meal"
      )}`,
      fallback: true,
    });
  } catch (error: any) {
    console.error("❌ Image generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate image", details: error.message },
      { status: 500 }
    );
  }
}
