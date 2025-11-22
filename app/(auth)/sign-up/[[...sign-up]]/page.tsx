"use client";
import { SignUp } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function SignUpPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[--color-dark] px-4 py-8 sm:px-6 lg:px-8 relative">
      {/* Theme Toggle Button */}
      {mounted && (
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="fixed top-4 right-4 sm:top-6 sm:right-6 p-2 sm:p-3 hover:bg-white/10 dark:hover:bg-white/10 hover:bg-black/5 rounded-full transition z-50"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="text-[#00e599]" size={20} />
          ) : (
            <Moon className="text-[#00e599]" size={20} />
          )}
        </button>
      )}

      {/* Placeholder to prevent layout shift */}
      {!mounted && (
        <div className="fixed top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 sm:w-12 sm:h-12" />
      )}

      {/* Sign Up Component with responsive wrapper */}
      <div className="w-full max-w-md">
        <SignUp />
      </div>
    </div>
  );
}
