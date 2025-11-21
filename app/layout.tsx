import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider";

export const metadata: Metadata = {
  title: "FitnessAI - Your AI Personal Trainer",
  description: "AI-powered personalized fitness and diet plans",
  manifest: "/manifest.json", // Link to the manifest
  icons: {
    apple: "/icon-192x192.png", // iOS Icon
  },
};
export const viewport: Viewport = {
  themeColor: "#00e599",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevents zooming like a native app
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-(--color-dark) text-(--color-text)">
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
                colorBackground: "#171717", // Matches glass-card dark bg
                colorText: "#ffffff",
              },
              elements: {
                card: "bg-neutral-900 border border-neutral-800 shadow-2xl",
                formButtonPrimary:
                  "bg-[#00e599] hover:bg-[#00cc88] text-black font-bold transition-all",
                footerActionLink: "text-[#00e599] hover:text-[#00cc88]",

                // Fix text & visibility in dark mode inputs
                headerTitle: "text-white",
                headerSubtitle: "text-gray-400",
                formFieldLabel: "text-gray-300",
                formFieldInput:
                  "bg-white/5 text-white border-white/10 focus:border-[#00e599]",

                // Social buttons styling
                socialButtonsBlockButton:
                  "bg-white/5 border-white/10 text-white hover:bg-white/10",
                socialButtonsBlockButtonText: "text-white",

                // Dividers
                dividerLine: "bg-white/10",
                dividerText: "text-gray-400",
              },
            }}
          >
            {children}
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
