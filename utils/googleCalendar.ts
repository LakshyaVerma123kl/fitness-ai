// utils/googleCalendar.ts

export const generateGoogleCalendarUrl = (plan: any) => {
  if (!plan?.workout || !plan.workout.length) return null;

  // Assume the plan starts "Tomorrow"
  const startDay = new Date();
  startDay.setDate(startDay.getDate() + 1);

  // Create a detailed description summarizing the whole plan
  let description = "Fitness AI Weekly Plan Summary:\n\n";

  const planSummary = plan.workout
    .map((day: any) => {
      // Format the exercises list for clean display in the description
      const exercises = day.exercises
        ?.map((ex: any) => `  - ${ex.name} (${ex.sets}x${ex.reps})`)
        .join("\\n");

      // Add the day and focus
      return `${day.day || "Rest Day"}: ${day.focus || "Active Recovery"}${
        exercises ? "\\n" + exercises : ""
      }`;
    })
    .join("\\n\\n");

  description += planSummary;

  // Format Dates for Google (YYYYMMDD) - Event spans the next 7 days
  const eventStart = startDay.toISOString().split("T")[0].replace(/-/g, "");
  const eventEnd = new Date(startDay.getTime() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0]
    .replace(/-/g, "");

  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set(
    "text",
    `💪 Fitness AI Weekly Plan - ${plan.user_data?.goal || "Goal"}`
  );
  url.searchParams.set("dates", `${eventStart}/${eventEnd}`);
  url.searchParams.set("details", description);
  url.searchParams.set("sf", "true");
  url.searchParams.set("output", "xml");

  return url.toString();
};
