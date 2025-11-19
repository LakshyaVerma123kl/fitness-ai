# 💪 AI Fitness Coach App

An AI-powered fitness assistant built with **Next.js 15** that generates **personalized workout and diet plans** using multiple LLM providers with automatic fallback.

## 🚀 Features

### ✅ Implemented Features

- **📝 Comprehensive User Profile**

  - Name, Age, Gender
  - Height & Weight (with automatic BMI calculation)
  - Fitness Goals (Weight Loss, Muscle Gain, Endurance, Flexibility)
  - Fitness Level (Beginner, Intermediate, Advanced)
  - Workout Location (Home, Gym, Outdoor)
  - Dietary Preferences (Veg, Non-Veg, Vegan, Keto, Paleo)
  - Medical History & Injuries (optional)
  - Stress Level tracking

- **🧠 AI-Powered Plan Generation**

  - Multi-provider support with automatic fallback:
    - Google Gemini (Primary)
    - Groq (Fast, 14,400 requests/day)
    - HuggingFace (Open source models)
  - Personalized workout routines with sets, reps, and rest times
  - Detailed diet plans with macros and portions
  - AI-generated motivation quotes
  - Lifestyle and recovery tips

- **🔊 Voice Features**

  - Text-to-Speech using Web Speech API (built-in, no API needed)
  - Read workout plan
  - Read diet plan
  - Read complete plan

- **🖼️ AI Image Generation**

  - Click any exercise or meal to generate visual representation
  - Multiple providers:
    - Pollinations.ai (100% FREE, no API key needed)
    - Replicate (Stable Diffusion XL)
    - HuggingFace Inference API
  - Realistic gym exercise images
  - Professional food photography

- **📄 Export & Save Features**

  - Export plan as text file (PDF-ready)
  - Save plans to localStorage
  - View saved plans history
  - Regenerate plan with same parameters

- **🎨 UI/UX Features**
  - 🌗 Dark/Light mode toggle
  - Smooth animations with Framer Motion
  - Glassmorphism design
  - Responsive layout (mobile, tablet, desktop)
  - Loading states and error handling

---

## 🛠️ Tech Stack

| Category       | Technologies                                  |
| -------------- | --------------------------------------------- |
| **Frontend**   | Next.js 15 (App Router), React 18, TypeScript |
| **Styling**    | Tailwind CSS, Glassmorphism                   |
| **Animations** | Framer Motion                                 |
| **AI APIs**    | Google Gemini, Groq, HuggingFace              |
| **Image Gen**  | Pollinations.ai, Replicate, HuggingFace       |
| **Voice**      | Web Speech API (built-in)                     |
| **Icons**      | Lucide React                                  |
| **Storage**    | localStorage                                  |
| **Deployment** | Vercel / Netlify                              |

---

## 📦 Installation

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- At least ONE of these FREE API keys:
  - [Google Gemini API Key](https://makersuite.google.com/app/apikey) (Recommended)
  - [Groq API Key](https://console.groq.com/keys)
  - [HuggingFace API Key](https://huggingface.co/settings/tokens)

### Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd fitness-ai-app
```

### Step 2: Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### Step 3: Environment Variables

Create a `.env.local` file in the root directory:

```env
# AI Plan Generation (At least ONE required)
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here
HUGGINGFACE_API_KEY=your_huggingface_api_key_here

# Image Generation (Optional - Pollinations.ai works without API key)
REPLICATE_API_KEY=your_replicate_api_key_here
```

**Getting API Keys:**

1. **Gemini (Recommended - FREE):**

   - Visit: https://makersuite.google.com/app/apikey
   - Sign in with Google
   - Click "Get API Key"

2. **Groq (Ultra-fast - FREE):**

   - Visit: https://console.groq.com
   - Sign up and go to API Keys
   - Create new API key

3. **HuggingFace (Open Source - FREE):**
   - Visit: https://huggingface.co/settings/tokens
   - Create account and generate token

### Step 4: Run Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
fitness-ai-app/
├── app/
│   ├── api/
│   │   ├── generate/
│   │   │   └── route.ts          # AI plan generation endpoint
│   │   └── generate-image/
│   │       └── route.ts          # Image generation endpoint
│   ├── globals.css               # Global styles with dark/light mode
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main page with state management
├── components/
│   ├── FitnessForm.tsx          # User input form
│   └── PlanDisplay.tsx          # Plan visualization & features
├── public/                       # Static assets
├── .env.local                   # Environment variables (create this)
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🎯 Usage Guide

### 1. Fill in Your Details

- Enter your name, age, gender, height, and weight
- Select your fitness goal (Weight Loss, Muscle Gain, etc.)
- Choose your fitness level
- Specify dietary preferences
- Add medical history if needed (optional)

### 2. Generate Your Plan

- Click "Generate My Plan"
- AI will create a personalized workout and diet plan
- View your BMI calculation
- Get motivation quotes and tips

### 3. Use Voice Features

- Click speaker icon on workout/diet sections
- Click "Read My Plan" to hear everything
- Click again to stop

### 4. View Exercise/Meal Images

- Hover over exercises in workout plan
- Click image icon to generate visual
- Click meals in diet plan for food photos

### 5. Save & Export

- Click "Save Plan" to store in localStorage
- Click "Export PDF" to download as text file
- Click "Regenerate" for a new plan with same details
- Click "Start Over" to create a new profile

### 6. Toggle Dark/Light Mode

- Click sun/moon icon in top-right corner
- Preference is saved in localStorage

---

## 🔧 Configuration

### Adding New AI Providers

Edit `app/api/generate/route.ts`:

```typescript
const PROVIDERS = [
  { provider: "gemini", model: "gemini-2.5-flash", name: "Gemini" },
  // Add your provider here
];
```

### Customizing Prompts

Modify the prompt in `app/api/generate/route.ts` to adjust:

- Workout day count
- Exercise count per day
- Meal structure
- Output format

### Image Generation Settings

Edit `app/api/generate-image/route.ts`:

- Change image dimensions
- Adjust prompt enhancement
- Add new image providers

---

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Visit [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables in project settings
5. Deploy!

### Deploy to Netlify

1. Push code to GitHub
2. Visit [netlify.com](https://netlify.com)
3. New site from Git
4. Add environment variables
5. Deploy!

---

## 🐛 Troubleshooting

### "All providers failed" Error

- Ensure at least ONE API key is set in `.env.local`
- Check API key validity
- Verify API quotas haven't been exceeded

### Images Not Generating

- Pollinations.ai works without API key (always free)
- For better quality, add Replicate or HuggingFace API keys
- Check browser console for errors

### Voice Not Working

- Web Speech API requires HTTPS in production
- Some browsers may not support it (use Chrome/Edge)

### Dark Mode Not Persisting

- Check localStorage is enabled in browser
- Clear cache and reload

---

## 📊 API Rate Limits (Free Tiers)

| Provider        | Free Tier Limit      |
| --------------- | -------------------- |
| Google Gemini   | 60 requests/minute   |
| Groq            | 14,400 requests/day  |
| HuggingFace     | 1,000 requests/month |
| Pollinations.ai | Unlimited (FREE)     |

---

## 🎥 Demo Video Checklist

Create a video showing:

1. ✅ Landing page and UI overview
2. ✅ Filling out user form with all fields
3. ✅ AI plan generation (show loading state)
4. ✅ Generated workout plan with details
5. ✅ Generated diet plan with macros
6. ✅ Voice reading feature (all sections)
7. ✅ Image generation for exercises
8. ✅ Image generation for meals
9. ✅ Export as PDF
10. ✅ Save plan feature
11. ✅ Regenerate plan feature
12. ✅ Dark/Light mode toggle
13. ✅ Mobile responsive view
14. ✅ Error handling (show what happens without API key)

---

## 📝 Submission Checklist

- [ ] Live app link (Vercel/Netlify)
- [ ] GitHub repository link (public)
- [ ] Video demo (5-10 minutes)
- [ ] README with setup instructions
- [ ] Environment variables documented
- [ ] All features working:
  - [ ] AI plan generation
  - [ ] Voice reading
  - [ ] Image generation
  - [ ] PDF export
  - [ ] Save plans
  - [ ] Dark/Light mode
  - [ ] Responsive design

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the MIT License.

---

## 🙏 Acknowledgments

- Google Gemini API
- Groq API
- HuggingFace
- Pollinations.ai (for free image generation)
- Lucide Icons
- Framer Motion

---

## 📧 Support

For issues or questions:

- Open a GitHub issue
- Check existing documentation
- Review API provider documentation

---

Time Estimate: 24-30 hours
Status: ✅ Complete & Production Ready
