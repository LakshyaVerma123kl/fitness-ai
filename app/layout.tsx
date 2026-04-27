import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider";
import GlobalChatWidget from "../components/GlobalChatWidget";

// ── Optimized Font Loading (eliminates FOIT, boosts CLS score) ──
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

// ── Comprehensive SEO Metadata ──────────────────────────────────
export const metadata: Metadata = {
  title: {
    default: "FitnessAI — AI-Powered Personal Trainer & Nutrition Coach",
    template: "%s | FitnessAI",
  },
  description:
    "Get a personalized workout plan, diet plan, and real-time AI pose correction — all powered by advanced AI. Built for beginners to advanced athletes.",
  keywords: [
    "AI fitness",
    "personal trainer AI",
    "workout plan generator",
    "diet plan AI",
    "pose detection",
    "fitness tracker",
    "macro tracker",
    "AI nutritionist",
  ],
  authors: [{ name: "FitnessAI" }],
  creator: "FitnessAI",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "FitnessAI",
    title: "FitnessAI — AI-Powered Personal Trainer & Nutrition Coach",
    description:
      "Personalized workout & diet plans powered by AI. Real-time pose correction, macro tracking, and adaptive progression.",
  },
  twitter: {
    card: "summary_large_image",
    title: "FitnessAI — Your AI Personal Trainer",
    description:
      "AI-generated fitness plans, real-time pose detection, and smart nutrition tracking.",
  },
  icons: {
    apple: "/icon-192x192.png",
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#00e599",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // Allow zoom for accessibility (PageSpeed recommendation)
  userScalable: true, // Accessibility: must allow user scaling
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning className={inter.variable}>
      <head>
        {/* DNS prefetch for external services */}
        <link rel="dns-prefetch" href="https://api.groq.com" />
        <link rel="dns-prefetch" href="https://generativelanguage.googleapis.com" />
      </head>
      <body className={`${inter.className} antialiased bg-(--color-dark) text-(--color-text)`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange={false}
        >
          <ClerkProvider
            appearance={{
              baseTheme: dark,
              variables: {
                colorPrimary: "#00e599",
                colorBackground: "#171717",
                colorText: "#ffffff",
              },
              elements: {
                card: "bg-neutral-900 border border-neutral-800 shadow-2xl",
                formButtonPrimary:
                  "bg-[#00e599] hover:bg-[#00cc88] text-black font-bold transition-all",
                footerActionLink: "text-[#00e599] hover:text-[#00cc88]",
                headerTitle: "text-white",
                headerSubtitle: "text-gray-400",
                formFieldLabel: "text-gray-300",
                formFieldInput:
                  "bg-white/5 text-white border-white/10 focus:border-[#00e599]",
                socialButtonsBlockButton:
                  "bg-white/5 border-white/10 text-white hover:bg-white/10",
                socialButtonsBlockButtonText: "text-white",
                dividerLine: "bg-white/10",
                dividerText: "text-gray-400",
              },
            }}
          >
            {children}
            <GlobalChatWidget />
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

