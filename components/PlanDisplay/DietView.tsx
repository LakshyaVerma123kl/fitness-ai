"use client";
import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import {
  Zap,
  Activity,
  PieChart as PieChartIcon,
  ChefHat,
  Image as ImageIcon,
  AlertCircle,
  Target,
} from "lucide-react";

const COLORS = ["#3b82f6", "#10b981", "#eab308"];
const MEAL_ORDER = [
  "breakfast",
  "mid_morning_snack",
  "lunch",
  "afternoon_snack",
  "dinner",
  "evening_snack",
];

const MEAL_LABELS: { [key: string]: string } = {
  breakfast: "Breakfast",
  mid_morning_snack: "Mid-Morning Snack",
  lunch: "Lunch",
  afternoon_snack: "Afternoon Snack",
  dinner: "Dinner",
  evening_snack: "Evening Snack",
};

export default function DietView({
  plan,
  onGenerateImage,
}: {
  plan: any;
  onGenerateImage: (prompt: string, type: string) => void;
}) {
  const mealsSource = plan.diet?.meals || plan.diet;

  const macroData = useMemo(() => {
    if (!plan.diet) return [];
    if (plan.diet.macros) {
      return [
        { name: "Protein", value: parseInt(plan.diet.macros.protein) || 0 },
        { name: "Carbs", value: parseInt(plan.diet.macros.carbs) || 0 },
        { name: "Fats", value: parseInt(plan.diet.macros.fats) || 0 },
      ];
    }
    let p = 0,
      c = 0,
      f = 0;
    if (mealsSource) {
      Object.values(mealsSource).forEach((meal: any) => {
        p += parseInt(meal.protein) || 0;
        c += parseInt(meal.carbs) || 0;
        f += parseInt(meal.fats) || 0;
      });
    }
    return [
      { name: "Protein", value: p },
      { name: "Carbs", value: c },
      { name: "Fats", value: f },
    ];
  }, [plan.diet, mealsSource]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8"
    >
      {/* Calorie Target & Explanation */}
      {plan.diet?.calorie_target && (
        <div className="lg:col-span-3 p-5 rounded-2xl bg-gradient-to-br from-green-900/10 to-blue-900/10 border border-[var(--color-border)]">
          <h4 className="text-sm font-bold text-[var(--color-text)] mb-3 flex items-center gap-2">
            <Target size={16} className="text-green-400" /> Daily Calorie Target
          </h4>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="text-3xl md:text-4xl font-bold text-[var(--color-primary)]">
              {plan.diet.calorie_target.daily}
            </div>
            {plan.diet.calorie_target.explanation && (
              <p className="text-sm text-[var(--color-text-secondary)] flex-1">
                {plan.diet.calorie_target.explanation}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Diet Strategies & Allergy Notes */}
      <div className="lg:col-span-3 grid md:grid-cols-2 gap-4">
        {plan.diet?.strategy && (
          <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-900/10 to-purple-900/10 border border-[var(--color-border)]">
            <h4 className="text-sm font-bold text-[var(--color-text)] mb-3 flex items-center gap-2">
              <Zap size={16} className="text-yellow-400" /> Weekly Strategy
            </h4>
            <div className="space-y-3">
              {plan.diet.strategy.week_1 && (
                <div>
                  <p className="text-xs text-blue-400 font-bold uppercase tracking-wider mb-1">
                    Week 1
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {plan.diet.strategy.week_1}
                  </p>
                </div>
              )}
              {plan.diet.strategy.week_2 && (
                <div className="border-t border-[var(--color-border)] pt-3">
                  <p className="text-xs text-purple-400 font-bold uppercase tracking-wider mb-1">
                    Week 2
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {plan.diet.strategy.week_2}
                  </p>
                </div>
              )}
              {plan.diet.strategy.week_3_4 && (
                <div className="border-t border-[var(--color-border)] pt-3">
                  <p className="text-xs text-green-400 font-bold uppercase tracking-wider mb-1">
                    Week 3-4
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {plan.diet.strategy.week_3_4}
                  </p>
                </div>
              )}
              {plan.diet.strategy.allergy_notes && (
                <div className="border-t border-red-500/30 pt-3 bg-red-500/5 p-3 rounded-lg">
                  <p className="text-xs text-red-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                    <AlertCircle size={14} /> Allergy Considerations
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {plan.diet.strategy.allergy_notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {plan.supplements && (
          <div className="p-5 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm">
            <h4 className="text-sm font-bold text-[var(--color-text)] mb-3 flex items-center gap-2">
              <Activity size={16} className="text-green-400" /> Recommended
              Supplements
            </h4>
            <div className="space-y-2">
              {plan.supplements.map((item: string, i: number) => (
                <div
                  key={i}
                  className="px-3 py-2 rounded-lg bg-[var(--color-green-650)] bg-opacity-10 border border-[var(--color-green-700)] border-opacity-20 text-xs text-[var(--color-text-secondary)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Macro Chart Column */}
      <div className="lg:col-span-1 glass-card p-4 md:p-6 rounded-2xl h-fit lg:sticky lg:top-4 order-1 lg:order-1 border border-[var(--color-border)]">
        <h3 className="text-base md:text-lg font-bold mb-4 flex items-center gap-2 text-[var(--color-text)]">
          <PieChartIcon size={20} className="text-blue-400" /> Macro Split
        </h3>
        <div className="h-[220px] md:h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={macroData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {macroData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "var(--color-text)",
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                wrapperStyle={{ fontSize: "12px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {plan.diet?.macros && (
          <div className="mt-4 border-t border-[var(--color-border)] pt-4">
            <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
              Daily Macros
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-blue-400">
                  {plan.diet.macros.protein}
                </p>
                <p className="text-[10px] text-[var(--color-text-secondary)]">
                  Protein
                </p>
              </div>
              <div>
                <p className="text-lg font-bold text-green-400">
                  {plan.diet.macros.carbs}
                </p>
                <p className="text-[10px] text-[var(--color-text-secondary)]">
                  Carbs
                </p>
              </div>
              <div>
                <p className="text-lg font-bold text-yellow-400">
                  {plan.diet.macros.fats}
                </p>
                <p className="text-[10px] text-[var(--color-text-secondary)]">
                  Fats
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Meals Column */}
      <div className="lg:col-span-2 space-y-4 order-2 lg:order-2">
        {mealsSource &&
          MEAL_ORDER.map((mealType) => {
            if (!mealsSource[mealType]) return null;
            const details = mealsSource[mealType];

            // Determine meal color
            const mealColors: { [key: string]: string } = {
              breakfast: "bg-yellow-500",
              mid_morning_snack: "bg-orange-500",
              lunch: "bg-green-500",
              afternoon_snack: "bg-blue-500",
              dinner: "bg-purple-500",
              evening_snack: "bg-pink-500",
            };

            const isAllergenPresent = details.allergy_safe === "No";

            return (
              <div
                key={mealType}
                className="glass-card p-4 md:p-5 rounded-2xl bg-[var(--color-card)] flex flex-col gap-3 hover:shadow-lg transition-all group relative overflow-hidden border border-[var(--color-border)]"
              >
                <div className="flex gap-3 md:gap-4 items-start">
                  <div
                    className={`w-1.5 self-stretch rounded-full shrink-0 ${
                      mealColors[mealType] || "bg-gray-500"
                    }`}
                  ></div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <h4 className="text-[var(--color-text-secondary)] text-[10px] md:text-xs font-bold tracking-wider mb-1 uppercase">
                      {MEAL_LABELS[mealType] || mealType}
                    </h4>
                    <h3 className="text-base md:text-lg font-bold text-[var(--color-text)] mb-2 wrap-break-words">
                      {details.meal}
                    </h3>

                    {/* Allergy Warning */}
                    {isAllergenPresent && (
                      <div className="mb-2 flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-2 py-1">
                        <AlertCircle size={14} />
                        <span>Contains allergen - see alternatives</span>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 text-[10px] md:text-xs text-[var(--color-text-secondary)] font-mono">
                      <span className="bg-blue-500/10 border border-blue-500/30 px-1.5 py-0.5 md:px-2 md:py-1 rounded whitespace-nowrap">
                        {details.protein} Protein
                      </span>
                      <span className="bg-green-500/10 border border-green-500/30 px-1.5 py-0.5 md:px-2 md:py-1 rounded whitespace-nowrap">
                        {details.carbs} Carbs
                      </span>
                      <span className="bg-yellow-500/10 border border-yellow-500/30 px-1.5 py-0.5 md:px-2 md:py-1 rounded whitespace-nowrap">
                        {details.fats} Fats
                      </span>
                      <span className="bg-purple-500/10 border border-purple-500/30 px-1.5 py-0.5 md:px-2 md:py-1 rounded whitespace-nowrap">
                        {details.calories} kcal
                      </span>
                    </div>

                    {details.portion && (
                      <p className="text-xs text-[var(--color-text-secondary)] mt-2 italic border-t border-[var(--color-border)] pt-2">
                        Portion: {details.portion}
                      </p>
                    )}

                    {details.prep_time && (
                      <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                        ⏱️ Prep: {details.prep_time}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full">
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(
                      "healthy recipe for " + details.meal
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors flex-1 flex justify-center items-center gap-1.5 text-xs md:text-sm"
                  >
                    <ChefHat size={16} className="md:w-[18px] md:h-[18px]" />
                    <span className="hidden xs:inline">Recipe</span>
                  </a>
                  <button
                    onClick={() =>
                      onGenerateImage(
                        `${details.meal}, professional food photography, appetizing, 4k`,
                        "food"
                      )
                    }
                    className="p-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg text-blue-400 flex items-center justify-center gap-1.5 opacity-100 transition-all hover:bg-black/5 dark:hover:bg-white/10 flex-1 text-xs md:text-sm"
                  >
                    <ImageIcon size={16} className="md:w-[18px] md:h-[18px]" />
                    <span className="hidden xs:inline">View</span>
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </motion.div>
  );
}
