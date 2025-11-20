"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, ChevronRight, User, Heart } from "lucide-react";

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
    stressLevel: "Medium",
  });

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
      alert("⚠️ Please fill in Name, Age, Weight, and Height");
      return;
    }
    onSubmit(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card w-full max-w-2xl p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl mx-auto"
    >
      {/* Header - Responsive */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 mb-5 sm:mb-6">
        <User className="text-primary" size={24} />
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-primary">
          Build Your Plan
        </h2>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {/* Name */}
        <div>
          <label className="block text-xs sm:text-sm text-gray-400 mb-1.5 sm:mb-2">
            Full Name *
          </label>
          <input
            type="text"
            name="name"
            placeholder="Enter your name"
            value={formData.name}
            className="w-full p-2.5 sm:p-3 bg-white/5 border border-white/10 rounded-lg focus:border-primary focus:outline-none text-white placeholder-gray-500 text-sm sm:text-base"
            onChange={handleChange}
          />
        </div>

        {/* Age, Gender, Weight - Responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm text-gray-400 mb-1.5 sm:mb-2">
              Age *
            </label>
            <input
              type="number"
              name="age"
              placeholder="Age"
              value={formData.age}
              className="w-full p-2.5 sm:p-3 bg-white/5 border border-white/10 rounded-lg focus:border-primary focus:outline-none text-white placeholder-gray-500 text-sm sm:text-base"
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm text-gray-400 mb-1.5 sm:mb-2">
              Gender
            </label>
            <select
              name="gender"
              value={formData.gender}
              className="w-full p-2.5 sm:p-3 bg-card border border-white/10 rounded-lg focus:border-primary text-white focus:outline-none text-sm sm:text-base"
              onChange={handleChange}
            >
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs sm:text-sm text-gray-400 mb-1.5 sm:mb-2">
              Weight (kg) *
            </label>
            <input
              type="number"
              name="weight"
              placeholder="Weight"
              value={formData.weight}
              className="w-full p-2.5 sm:p-3 bg-white/5 border border-white/10 rounded-lg focus:border-primary focus:outline-none text-white placeholder-gray-500 text-sm sm:text-base"
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Height */}
        <div>
          <label className="block text-xs sm:text-sm text-gray-400 mb-1.5 sm:mb-2">
            Height (cm) *
          </label>
          <input
            type="number"
            name="height"
            placeholder="Height in centimeters"
            value={formData.height}
            className="w-full p-2.5 sm:p-3 bg-white/5 border border-white/10 rounded-lg focus:border-primary focus:outline-none text-white placeholder-gray-500 text-sm sm:text-base"
            onChange={handleChange}
          />
        </div>

        {/* Goal and Level - Responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm text-gray-400 mb-1.5 sm:mb-2">
              Fitness Goal
            </label>
            <select
              name="goal"
              value={formData.goal}
              className="w-full p-2.5 sm:p-3 bg-card border border-white/10 rounded-lg focus:border-primary text-white focus:outline-none text-sm sm:text-base"
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
            <label className="block text-xs sm:text-sm text-gray-400 mb-1.5 sm:mb-2">
              Fitness Level
            </label>
            <select
              name="level"
              value={formData.level}
              className="w-full p-2.5 sm:p-3 bg-card border border-white/10 rounded-lg focus:border-primary text-white focus:outline-none text-sm sm:text-base"
              onChange={handleChange}
            >
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </div>
        </div>

        {/* Diet and Equipment - Responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm text-gray-400 mb-1.5 sm:mb-2">
              Diet Preference
            </label>
            <select
              name="diet"
              value={formData.diet}
              className="w-full p-2.5 sm:p-3 bg-card border border-white/10 rounded-lg focus:border-primary text-white focus:outline-none text-sm sm:text-base"
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
            <label className="block text-xs sm:text-sm text-gray-400 mb-1.5 sm:mb-2">
              Equipment Access
            </label>
            <select
              name="equipment"
              value={formData.equipment}
              className="w-full p-2.5 sm:p-3 bg-card border border-white/10 rounded-lg focus:border-primary text-white focus:outline-none text-sm sm:text-base"
              onChange={handleChange}
            >
              <option>Gym</option>
              <option>Home</option>
              <option>Outdoor</option>
              <option>Minimal Equipment</option>
            </select>
          </div>
        </div>

        {/* Stress Level */}
        <div>
          <label className="block text-xs sm:text-sm text-gray-400 mb-1.5 sm:mb-2">
            Current Stress Level
          </label>
          <select
            name="stressLevel"
            value={formData.stressLevel}
            className="w-full p-2.5 sm:p-3 bg-card border border-white/10 rounded-lg focus:border-primary text-white focus:outline-none text-sm sm:text-base"
            onChange={handleChange}
          >
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
        </div>

        {/* Medical History */}
        <div>
          <label className="block text-xs sm:text-sm text-gray-400 mb-1.5 sm:mb-2 flex items-center gap-2">
            <Heart size={14} className="sm:w-4 sm:h-4" />
            Medical History / Injuries (Optional)
          </label>
          <textarea
            name="medicalHistory"
            placeholder="e.g., Lower back pain, knee injury, diabetes..."
            value={formData.medicalHistory}
            rows={3}
            className="w-full p-2.5 sm:p-3 bg-white/5 border border-white/10 rounded-lg focus:border-primary focus:outline-none text-white placeholder-gray-500 resize-none text-sm sm:text-base"
            onChange={handleChange}
          />
        </div>

        {/* Submit Button - Responsive */}
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full py-3 sm:py-4 mt-3 sm:mt-4 bg-primary text-black font-bold rounded-xl hover:bg-primary-dark transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 text-sm sm:text-base"
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
  );
}
