"use client";
import { SignUp } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function SignUpPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Wait for component to mount on client before showing theme toggle
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex h-screen items-center justify-center bg-(--color-dark) relative">
      {/* Theme Toggle Button - Only show after mount */}
      {mounted && (
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="absolute top-6 right-6 p-3 hover:bg-white/10 dark:hover:bg-white/10 hover:bg-black/5 rounded-full transition z-50"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="text-[#00e599]" size={24} />
          ) : (
            <Moon className="text-[#00e599]" size={24} />
          )}
        </button>
      )}

      {/* Placeholder to prevent layout shift */}
      {!mounted && <div className="absolute top-6 right-6 w-12 h-12" />}

      <SignUp />
    </div>
  );
}
