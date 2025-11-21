"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  ChevronRight,
  User,
  Heart,
  AlertCircle,
  ChevronDown,
  Mail,
} from "lucide-react";
import Toast from "./Toast";

interface FitnessFormProps {
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

export default function FitnessForm({ onSubmit, isLoading }: FitnessFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "Male",
    weight: "",
    height: "",
    goal: "Weight Loss",
    level: "Beginner",
    diet: "Non-Veg",
    equipment: "Gym",
    medicalHistory: "",
    allergies: "",
    medications: "",
    injuries: "",
    chronicConditions: "",
    sleepHours: "7-8",
    waterIntake: "2-3",
    stressLevel: "Medium",
    activityLevel: "Sedentary",
    emailNotifications: false, // New Field for Email Opt-in
  });

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "warning";
  } | null>(null);

  const [showLifestyleSection, setShowLifestyleSection] = useState(false);
  const [showHealthSection, setShowHealthSection] = useState(false);

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    if (
      !formData.name ||
      !formData.age ||
      !formData.weight ||
      !formData.height
    ) {
      setToast({
        show: true,
        message: "⚠️ Please fill in Name, Age, Weight, and Height",
        type: "warning",
      });
      return;
    }

    // Show login prompt if email notifications are enabled
    if (formData.emailNotifications) {
      setToast({
        show: true,
        message: "📧 Please log in to receive email notifications",
        type: "warning",
      });
    }

    onSubmit(formData);
  };

  // 🎨 Standardized Styles for Light/Dark Mode Compatibility
  const inputClass =
    "w-full p-2.5 sm:p-3 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg focus:border-primary focus:outline-none text-[var(--color-text)] placeholder-[var(--color-text-secondary)] text-sm sm:text-base transition-colors";

  const labelClass =
    "block text-xs sm:text-sm text-[var(--color-text-secondary)] mb-1.5 sm:mb-2 font-medium";

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-2xl p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl mx-auto relative"
      >
        {/* Header */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-5 sm:mb-6">
          <User className="text-primary" size={24} />
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-primary">
            Build Your Plan
          </h2>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {/* Name */}
          <div>
            <label className={labelClass}>Full Name *</label>
            <input
              type="text"
              name="name"
              placeholder="Enter your name"
              value={formData.name}
              className={inputClass}
              onChange={handleChange}
            />
          </div>

          {/* Age, Gender, Weight */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className={labelClass}>Age *</label>
              <input
                type="number"
                name="age"
                placeholder="Age"
                value={formData.age}
                className={inputClass}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className={labelClass}>Gender</label>
              <select
                name="gender"
                value={formData.gender}
                className={inputClass}
                onChange={handleChange}
              >
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Weight (kg) *</label>
              <input
                type="number"
                name="weight"
                placeholder="Weight"
                value={formData.weight}
                className={inputClass}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Height */}
          <div>
            <label className={labelClass}>Height (cm) *</label>
            <input
              type="number"
              name="height"
              placeholder="Height in centimeters"
              value={formData.height}
              className={inputClass}
              onChange={handleChange}
            />
          </div>

          {/* Goal and Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className={labelClass}>Fitness Goal</label>
              <select
                name="goal"
                value={formData.goal}
                className={inputClass}
                onChange={handleChange}
              >
                <option>Weight Loss</option>
                <option>Muscle Gain</option>
                <option>Endurance</option>
                <option>Flexibility</option>
                <option>General Fitness</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Fitness Level</label>
              <select
                name="level"
                value={formData.level}
                className={inputClass}
                onChange={handleChange}
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>
          </div>

          {/* Diet and Equipment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className={labelClass}>Diet Preference</label>
              <select
                name="diet"
                value={formData.diet}
                className={inputClass}
                onChange={handleChange}
              >
                <option>Non-Veg</option>
                <option>Vegetarian</option>
                <option>Vegan</option>
                <option>Keto</option>
                <option>Paleo</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Equipment Access</label>
              <select
                name="equipment"
                value={formData.equipment}
                className={inputClass}
                onChange={handleChange}
              >
                <option>Gym</option>
                <option>Home</option>
                <option>Outdoor</option>
                <option>Minimal Equipment</option>
              </select>
            </div>
          </div>

          {/* Lifestyle Factors Section - Collapsible */}
          <div className="pt-3 sm:pt-4 border-t border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => setShowLifestyleSection(!showLifestyleSection)}
              className="w-full flex items-center justify-between p-3 hover:bg-[var(--color-card)]/50 rounded-lg transition-all group"
            >
              <div className="flex items-center gap-2">
                <Heart size={18} className="text-primary" />
                <h3 className="text-sm sm:text-base font-semibold text-[var(--color-text)]">
                  Lifestyle Factors (Optional)
                </h3>
              </div>
              <ChevronDown
                size={20}
                className={`text-primary transition-transform duration-300 ${
                  showLifestyleSection ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {showLifestyleSection && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      <div>
                        <label className={labelClass}>
                          Daily Activity Level
                        </label>
                        <select
                          name="activityLevel"
                          value={formData.activityLevel}
                          className={inputClass}
                          onChange={handleChange}
                        >
                          <option>Sedentary</option>
                          <option>Lightly Active</option>
                          <option>Moderately Active</option>
                          <option>Very Active</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>
                          Sleep (hours/night)
                        </label>
                        <select
                          name="sleepHours"
                          value={formData.sleepHours}
                          className={inputClass}
                          onChange={handleChange}
                        >
                          <option>Less than 5</option>
                          <option>5-6</option>
                          <option>7-8</option>
                          <option>More than 8</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>
                          Water Intake (L/day)
                        </label>
                        <select
                          name="waterIntake"
                          value={formData.waterIntake}
                          className={inputClass}
                          onChange={handleChange}
                        >
                          <option>Less than 1</option>
                          <option>1-2</option>
                          <option>2-3</option>
                          <option>3-4</option>
                          <option>More than 4</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Current Stress Level</label>
                      <select
                        name="stressLevel"
                        value={formData.stressLevel}
                        className={inputClass}
                        onChange={handleChange}
                      >
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Health Information Section - Collapsible */}
          <div className="pt-3 sm:pt-4 border-t border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => setShowHealthSection(!showHealthSection)}
              className="w-full flex items-center justify-between p-3 hover:bg-[var(--color-card)]/50 rounded-lg transition-all group"
            >
              <div className="flex items-center gap-2">
                <AlertCircle size={18} className="text-primary" />
                <h3 className="text-sm sm:text-base font-semibold text-[var(--color-text)]">
                  Health Information (Optional)
                </h3>
              </div>
              <ChevronDown
                size={20}
                className={`text-primary transition-transform duration-300 ${
                  showHealthSection ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {showHealthSection && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4">
                    {/* Allergies */}
                    <div>
                      <label
                        className={`${labelClass} flex items-center gap-2`}
                      >
                        <AlertCircle size={14} className="sm:w-4 sm:h-4" />
                        Food Allergies / Intolerances
                      </label>
                      <textarea
                        name="allergies"
                        placeholder="e.g., Lactose intolerant, peanut allergy, gluten sensitivity..."
                        value={formData.allergies}
                        rows={2}
                        className={`${inputClass} resize-none`}
                        onChange={handleChange}
                      />
                    </div>

                    {/* Chronic Conditions */}
                    <div>
                      <label className={labelClass}>
                        Chronic Conditions / Diseases
                      </label>
                      <textarea
                        name="chronicConditions"
                        placeholder="e.g., Diabetes, hypertension, thyroid issues, PCOS, asthma..."
                        value={formData.chronicConditions}
                        rows={2}
                        className={`${inputClass} resize-none`}
                        onChange={handleChange}
                      />
                    </div>

                    {/* Injuries */}
                    <div>
                      <label className={labelClass}>
                        Current / Past Injuries
                      </label>
                      <textarea
                        name="injuries"
                        placeholder="e.g., Lower back pain, knee injury, shoulder impingement, ACL tear..."
                        value={formData.injuries}
                        rows={2}
                        className={`${inputClass} resize-none`}
                        onChange={handleChange}
                      />
                    </div>

                    {/* Medications */}
                    <div>
                      <label className={labelClass}>
                        Current Medications / Supplements
                      </label>
                      <textarea
                        name="medications"
                        placeholder="e.g., Blood pressure medication, insulin, birth control, protein powder..."
                        value={formData.medications}
                        rows={2}
                        className={`${inputClass} resize-none`}
                        onChange={handleChange}
                      />
                    </div>

                    {/* General Medical History */}
                    <div>
                      <label className={labelClass}>
                        Additional Medical Notes
                      </label>
                      <textarea
                        name="medicalHistory"
                        placeholder="Any other health concerns, family history, or relevant medical information..."
                        value={formData.medicalHistory}
                        rows={2}
                        className={`${inputClass} resize-none`}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* --- EMAIL OPT-IN SECTION (NEW) --- */}
          <div className="mt-6 mb-4">
            <div
              onClick={() =>
                setFormData({
                  ...formData,
                  emailNotifications: !formData.emailNotifications,
                })
              }
              className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all ${
                formData.emailNotifications
                  ? "bg-primary/10 border-primary"
                  : "bg-[var(--color-card)] border-[var(--color-border)] hover:bg-[var(--color-card)]/80"
              }`}
            >
              <div
                className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                  formData.emailNotifications
                    ? "bg-primary border-primary"
                    : "border-gray-400 bg-transparent"
                }`}
              >
                {formData.emailNotifications && (
                  <ChevronRight
                    size={14}
                    className="text-black rotate-90"
                    strokeWidth={4}
                  />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-text)]">
                  <Mail size={16} className="text-primary" />
                  Enable Weekly Progress Updates
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">
                  Receive weekly summaries of your progress and get notified
                  when your next Level Up plan is ready. (No spam, we promise!)
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full py-3 sm:py-4 bg-primary text-black font-bold rounded-xl hover:bg-primary-dark transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 text-sm sm:text-base active:scale-[0.99]"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span className="hidden sm:inline">Generating AI Plan...</span>
                <span className="inline sm:hidden">Generating...</span>
              </>
            ) : (
              <>
                Generate My Plan <ChevronRight size={18} />
              </>
            )}
          </button>
        </div>
      </motion.div>
      {/* Toast Notification */}
      {toast?.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={3000}
        />
      )}
    </div>
  );
}
