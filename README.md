# 💪 FitnessAI — AI-Powered Personal Trainer

> A full-stack, production-ready AI fitness coach that generates personalized workout & diet plans, tracks your progress, and coaches your posture in real-time — all for free.

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js_16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)
![Clerk](https://img.shields.io/badge/Clerk-6C47FF?logo=clerk&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?logo=pwa)

</div>

---

## ✨ Features

### 🧠 AI Plan Generation

- **Multi-provider fallback:** Groq (Llama 3.3 70B) → Gemini 2.5 Flash → Gemini Pro → HuggingFace
- **RAG-enhanced plans:** Finds top-rated plans from similar users and uses them as AI context
- Personalized workout (3–5 days), diet (6 meals), macros, hydration, recovery, and supplements
- Safety warnings and health-aware modifications for injuries/conditions/allergies

### 🏋️ AI Posture Coach (Real-Time)

- TensorFlow.js MoveNet pose detection in the browser — no backend needed
- **Modularized custom `usePoseDetection` React Hook** managing the entire TensorFlow lifecycle
- Pure decoupled math physics logic in `utils/poseAnalysis.ts`
- Hardcoded biomechanics profiles for 7 common exercises (instant)
- AI-generated profiles for any other exercise via Groq/Gemini/HuggingFace
- Rep counter, joint angle overlay, live coaching cues, voice feedback

### 🖼️ AI Image Generation

- Click any exercise or meal to generate a photo
- Provider chain: Groq Flux → Pollinations.ai (free) → Gemini Imagen → Replicate → HuggingFace
- Images cached in Supabase Storage — no repeated API calls

### 📊 Progress Tracker, Macros & Gamification

- Daily check-in: weight, mood, workout completed
- **Daily Macro Logger:** Track and log your daily calories, protein, carbs, and fats
- Current & longest streak calculation
- **Gamification & Badges:** Earn dynamic badges for workout consistency, streaks, and logging meals
- Weekly consistency bar chart + 14-day weight trend line chart
- Shareable progress card (PNG download + WhatsApp share)

### 📱 PWA (Progressive Web App)

- Installable on Android, iOS, and desktop
- Offline support for static pages via service worker
- Native app feel with full-screen mode

### 🔊 Voice Features

- Web Speech API TTS — reads your full workout or diet plan aloud
- Real-time voice coaching during posture detection

### 📄 Export & Share

- Download plan as a detailed multi-page PDF (jsPDF + autotable)
- Export workout schedule as `.ics` (iCal) or add directly to Google Calendar
- Share progress card to WhatsApp

### 🌗 UI/UX

- Dark / Light mode (persisted)
- Glassmorphism design with Framer Motion animations
- Fully responsive — mobile, tablet, desktop
- Clerk authentication (Google, GitHub, email)

### 🤖 RAG System & Zero-Token Reuse

- Stores every generated plan in Supabase with full user metadata
- Users rate plans (1–5 stars) after saving — ratings drive future quality
- Postgres RPC (`get_similar_plans`) finds dimensionally similar high-rated plans
- **Tier 1 — Zero-Token Reuse:** If an exact-match plan (same goal, diet, level, gender, age bucket, BMI bucket) with 4+ stars exists AND the user has no custom medical conditions, the system **bypasses the LLM entirely**, clones the proven plan, mathematically rescales macros to the new user's TDEE, and returns it instantly (0ms latency, 0 tokens consumed)
- **Tier 2 — RAG-Enhanced LLM:** If no exact match exists (or user has medical flags), historical plan summaries are injected as few-shot examples into the LLM prompt for higher quality generation
- **Safety Gate:** Users with allergies, injuries, or chronic conditions always go through full LLM generation to ensure safe modifications

---

## 🛠️ Tech Stack

| Layer              | Technology                                                        |
| ------------------ | ----------------------------------------------------------------- |
| **Framework**      | Next.js 16 (App Router), React 19, TypeScript                     |
| **Styling**        | Tailwind CSS v4, Framer Motion, Glassmorphism                     |
| **AI (Text)**      | Google Gemini, Groq (Llama), HuggingFace                          |
| **AI (Images)**    | Groq Flux, Pollinations.ai, Gemini Imagen, Replicate, HuggingFace |
| **Pose Detection** | TensorFlow.js, MoveNet (runs entirely in browser)                 |
| **Auth**           | Clerk (Google, GitHub, email/password)                            |
| **Database**       | Supabase (PostgreSQL)                                             |
| **Storage**        | Supabase Storage (cached AI images)                               |
| **Email**          | Resend                                                            |
| **PDF Export**     | jsPDF + jspdf-autotable                                           |
| **Charts**         | Recharts                                                          |
| **Icons**          | Lucide React                                                      |
| **PWA**            | Custom Service Worker + Web App Manifest                          |
| **Deployment**     | Vercel                                                            |

---

## 📦 Installation

### Prerequisites

- **Node.js 18+**
- **At least ONE AI API key** (Groq recommended — fastest, free)
- **Supabase project** (free tier works)
- **Clerk account** (free tier works)

### 1. Clone

```bash
git clone <your-repo-url>
cd fitness-ai
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create `.env.local` in the root:

```env
# ─── AI Plan Generation (at least ONE required) ───────────────
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
HUGGINGFACE_API_KEY=your_huggingface_api_key

# ─── Image Generation (optional — Pollinations is free) ───────
REPLICATE_API_KEY=your_replicate_api_key

# ─── Supabase ─────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# ─── Clerk ────────────────────────────────────────────────────
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# ─── Email (optional) ─────────────────────────────────────────
RESEND_API_KEY=your_resend_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Getting API Keys

| Service       | URL                                      | Free Tier          |
| ------------- | ---------------------------------------- | ------------------ |
| Groq          | https://console.groq.com/keys            | 14,400 req/day     |
| Google Gemini | https://makersuite.google.com/app/apikey | 60 req/min         |
| HuggingFace   | https://huggingface.co/settings/tokens   | 1,000 req/month    |
| Replicate     | https://replicate.com/account/api-tokens | Pay-per-use        |
| Supabase      | https://app.supabase.com                 | Free tier          |
| Clerk         | https://dashboard.clerk.com              | Free tier          |
| Resend        | https://resend.com                       | 3,000 emails/month |

### 5. Supabase Database Setup

Run these SQL migrations in your Supabase SQL editor:

```sql
-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fitness plans
CREATE TABLE fitness_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_data JSONB,
  plan_data JSONB,
  bmi FLOAT,
  provider TEXT,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  feedback_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily progress
CREATE TABLE daily_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  weight FLOAT,
  mood TEXT,
  workout_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Image cache
CREATE TABLE image_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt TEXT UNIQUE NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Macros (New Features)
CREATE TABLE daily_macros (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  calories INT DEFAULT 0,
  protein INT DEFAULT 0,
  carbs INT DEFAULT 0,
  fats INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Supabase Storage bucket for images
-- Go to Storage → New Bucket → Name: "exercise-images" → Public: true
```

```sql
-- RAG: get_similar_plans RPC function
CREATE OR REPLACE FUNCTION get_similar_plans(
  p_goal TEXT,
  p_diet_type TEXT,
  p_age_range TEXT,
  p_bmi_range TEXT,
  p_level TEXT,
  p_activity_level TEXT,
  p_equipment_type TEXT,
  p_gender TEXT,
  p_has_injuries BOOLEAN,
  p_has_conditions BOOLEAN,
  p_limit INT DEFAULT 3
)
RETURNS TABLE (
  plan_data JSONB,
  user_data JSONB,
  rating INT,
  feedback_note TEXT,
  match_tier INT
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  WITH scored AS (
    SELECT
      fp.plan_data,
      fp.user_data,
      fp.rating,
      fp.feedback_note,
      CASE
        WHEN fp.user_data->>'goal' = p_goal
          AND fp.user_data->>'diet' = p_diet_type
          AND fp.user_data->>'level' = p_level
          AND fp.user_data->>'gender' = p_gender
        THEN 1
        WHEN fp.user_data->>'goal' = p_goal
          AND fp.user_data->>'diet' = p_diet_type
          AND fp.user_data->>'level' = p_level
        THEN 2
        WHEN fp.user_data->>'goal' = p_goal
          AND fp.user_data->>'diet' = p_diet_type
        THEN 3
        WHEN fp.user_data->>'goal' = p_goal
          AND fp.user_data->>'level' = p_level
        THEN 4
        ELSE 5
      END AS match_tier
    FROM fitness_plans fp
    WHERE fp.rating >= 4
      AND fp.plan_data IS NOT NULL
      AND fp.user_data->>'goal' = p_goal
  )
  SELECT s.plan_data, s.user_data, s.rating, s.feedback_note, s.match_tier
  FROM scored s
  ORDER BY s.match_tier ASC, s.rating DESC
  LIMIT p_limit;
END;
$$;
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📱 PWA Installation

After deploying:

- **Android:** Open in Chrome → tap ⋮ → "Add to Home Screen"
- **iOS:** Open in Safari → Share → "Add to Home Screen"
- **Desktop:** Click the install icon in the Chrome address bar

The app will load as a standalone app with the green `#00e599` theme color.

---

## 📁 Project Structure

```
fitness-ai/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   └── sign-up/[[...sign-up]]/page.tsx
│   ├── api/
│   │   ├── generate/route.ts          # AI plan generation + RAG
│   │   ├── generate-image/route.ts    # AI image generation + caching
│   │   ├── plans/
│   │   │   ├── route.ts               # CRUD for saved plans
│   │   │   ├── feedback/route.ts      # Star ratings
│   │   │   └── ping/route.ts          # DB keep-alive
│   │   ├── pose-profile/route.ts      # AI exercise pose profiles
│   │   ├── progress/route.ts          # Daily check-ins + streaks
│   │   ├── send-email/route.ts        # Resend email notifications
│   │   ├── badges/route.ts            # User gamification badges
│   │   └── macros/route.ts            # Daily nutritional logger
│   ├── dashboard/page.tsx             # User dashboard
│   ├── globals.css
│   ├── layout.tsx                     # Root layout + PWA + Clerk
│   └── page.tsx                       # Landing page + plan generator
├── components/
│   ├── PlanDisplay/
│   │   ├── index.tsx                  # Main plan display + tabs
│   │   ├── WorkoutView.tsx            # Workout tab
│   │   ├── DietView.tsx               # Diet + macro chart tab
│   │   ├── HealthView.tsx             # Health & recovery tab
│   │   ├── ShoppingView.tsx           # Interactive grocery list
│   │   └── ImageModal.tsx             # AI image modal
│   ├── FitnessForm.tsx                # User input form
│   ├── FeedbackWidget.tsx             # Star rating widget
│   ├── PoseDetectionModal.tsx         # Real-time posture coach
│   ├── PoseDetectionUI.tsx            # Isolated UI elements for coaching overlay
│   ├── ProgressTracker.tsx            # Dashboard progress section
│   ├── DailyMacroLogger.tsx           # Track and enter daily nutrition macros
│   ├── BadgeDisplay.tsx               # Renders earned gamification badges
│   ├── ThemeProvider.tsx
│   └── Toast.tsx
├── public/
│   ├── manifest.json                  # PWA manifest
│   ├── sw.js                          # Service worker
│   ├── icon-192x192.png
│   └── icon-512x512.png
├── utils/
│   ├── calendarExport.ts              # .ics generation
│   ├── googleCalendar.ts              # Google Calendar URL builder
│   ├── pdfExports.ts                  # jsPDF plan export
│   ├── ragContext.ts                  # RAG context builder
│   ├── poseAnalysis.ts                # Physics calculations for joint angles
│   ├── usePoseDetection.ts            # Custom React hook for TensorFlow model
│   └── mediapipe-stub.js
├── lib/supabase.ts
├── middleware.ts                      # Clerk route protection
├── next.config.ts
└── .env.local
```

---

## 🚀 Deployment (Vercel)

1. Push to GitHub
2. Import repo at [vercel.com](https://vercel.com)
3. Add all environment variables from `.env.local`
4. Deploy

The GitHub Action in `.github/workflows/ping.yml` pings your Supabase every 10 minutes to prevent cold starts on the free tier.

---



## 📊 API Rate Limits (Free Tiers)

| Provider        | Limit                 |
| --------------- | --------------------- |
| Groq            | 14,400 requests/day   |
| Google Gemini   | 60 requests/minute    |
| HuggingFace     | 1,000 requests/month  |
| Pollinations.ai | Unlimited             |
| Supabase        | 500MB DB, 1GB Storage |
| Clerk           | 10,000 MAU            |

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit your changes
4. Push and open a Pull Request

---

## 📄 License

MIT — free to use, modify, and distribute.

---

## 🙏 Credits

- [Groq](https://groq.com) — ultra-fast LLM inference
- [Google Gemini](https://deepmind.google/technologies/gemini/) — multimodal AI
- [Pollinations.ai](https://pollinations.ai) — free image generation
- [TensorFlow.js](https://www.tensorflow.org/js) — in-browser ML
- [Supabase](https://supabase.com) — open source Firebase alternative
- [Clerk](https://clerk.com) — authentication
- [Framer Motion](https://www.framer.com/motion/) — animations
- [Recharts](https://recharts.org) — charts
- [Lucide](https://lucide.dev) — icons

---
