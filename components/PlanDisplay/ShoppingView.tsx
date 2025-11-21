"use client";
import { motion } from "framer-motion";
import { ShoppingBag, Copy, CheckSquare } from "lucide-react";
import { useState, useEffect } from "react";

export default function ShoppingView({
  shoppingList,
}: {
  shoppingList: string[];
}) {
  const [copied, setCopied] = useState(false);
  const [checkedItems, setCheckedItems] = useState<{ [key: number]: boolean }>(
    {}
  );

  // Generate a simple unique ID for this specific shopping list to isolate storage
  // This prevents checks from carrying over to a completely different plan
  const listId =
    "shopping-list-" + shoppingList.length + "-" + shoppingList[0]?.slice(0, 5);

  // 1. Load saved state from LocalStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(listId);
    if (saved) {
      try {
        setCheckedItems(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse shopping list state");
      }
    }
  }, [listId]);

  // 2. Toggle Checkbox Logic
  const toggleItem = (index: number) => {
    setCheckedItems((prev) => {
      const newState = { ...prev, [index]: !prev[index] };
      // Save to local storage immediately
      localStorage.setItem(listId, JSON.stringify(newState));
      return newState;
    });
  };

  const handleCopy = () => {
    const textToCopy = shoppingList
      .map((item, i) => (checkedItems[i] ? `[x] ${item}` : `[ ] ${item}`))
      .join("\n");

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="glass-card p-4 md:p-8 rounded-2xl border border-[var(--color-border)] max-w-2xl mx-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl md:text-2xl font-bold text-[var(--color-text)] flex items-center gap-3">
          <ShoppingBag className="text-green-400" />
          Grocery List
        </h3>
        <span className="bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-xs font-medium border border-green-500/20">
          {shoppingList.length} Items
        </span>
      </div>

      <div className="space-y-3 md:space-y-4">
        {shoppingList.length > 0 ? (
          shoppingList.map((item: string, i: number) => {
            const isChecked = !!checkedItems[i];

            return (
              <div
                key={i}
                onClick={() => toggleItem(i)} // Clicking the whole row toggles it
                className={`flex items-center gap-3 p-3 border-b border-[var(--color-border)] last:border-0 transition rounded-lg group cursor-pointer select-none ${
                  isChecked
                    ? "bg-green-500/5 hover:bg-green-500/10"
                    : "hover:bg-[var(--color-border)]/30"
                }`}
              >
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    readOnly // We handle change via the div onClick
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-400 checked:border-green-500 checked:bg-green-500 transition-all"
                  />
                  <CheckSquare
                    className={`pointer-events-none absolute left-0 top-0 h-5 w-5 text-white transition-opacity ${
                      isChecked ? "opacity-100" : "opacity-0"
                    }`}
                    size={14}
                  />
                </div>
                <span
                  className={`text-base md:text-lg transition-colors ${
                    isChecked
                      ? "text-gray-500 line-through decoration-green-500/50 decoration-2"
                      : "text-[var(--color-text-secondary)]"
                  }`}
                >
                  {item}
                </span>
              </div>
            );
          })
        ) : (
          <div className="text-center py-10">
            <ShoppingBag
              className="mx-auto text-gray-600 mb-2 opacity-50"
              size={48}
            />
            <p className="text-[var(--color-text-secondary)] italic">
              No items found in diet plan.
            </p>
          </div>
        )}
      </div>

      {shoppingList.length > 0 && (
        <button
          onClick={handleCopy}
          className="w-full mt-6 md:mt-8 py-3 bg-[var(--color-card)] border border-[var(--color-border)] hover:bg-[var(--color-border)] rounded-xl text-sm font-medium transition-all text-[var(--color-text)] flex items-center justify-center gap-2 group active:scale-95"
        >
          {copied ? (
            <>
              <CheckSquare size={16} className="text-green-500" />
              <span className="text-green-500">Copied to Clipboard!</span>
            </>
          ) : (
            <>
              <Copy
                size={16}
                className="group-hover:text-blue-400 transition-colors"
              />
              Copy List to Clipboard
            </>
          )}
        </button>
      )}
    </motion.div>
  );
}
