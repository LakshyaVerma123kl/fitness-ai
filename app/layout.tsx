import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider";

export const metadata: Metadata = {
  title: "FitnessAI - Your AI Personal Trainer",
  description: "AI-powered personalized fitness and diet plans",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange={false}
        >
          <ClerkProvider
            appearance={{
              baseTheme: dark,
              variables: { colorPrimary: "#00e599" },
              elements: {
                card: "bg-neutral-900 border border-neutral-800",
                formButtonPrimary: "bg-[#00e599] hover:bg-[#00cc88] text-black",
                footerActionLink: "text-[#00e599] hover:text-[#00cc88]",
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
