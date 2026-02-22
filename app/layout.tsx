import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider";

export const metadata: Metadata = {
  title: "FitnessAI - Your AI Personal Trainer",
  description: "AI-powered personalized fitness and diet plans",
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
  maximumScale: 1,
  userScalable: false,
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
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
