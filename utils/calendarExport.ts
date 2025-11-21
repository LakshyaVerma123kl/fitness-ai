export const downloadCalendar = (plan: any) => {
  if (!plan?.workout || !Array.isArray(plan.workout)) return;

  // ICS File Header
  let icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FitnessAI//Workout Plan//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  // Start the plan from "Tomorrow"
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 1);

  plan.workout.forEach((day: any, index: number) => {
    // Skip rest days if they don't have exercises
    if (!day.exercises || day.exercises.length === 0) return;

    // Calculate date: Start Date + Index (Day 1, Day 2, etc.)
    const eventDate = new Date(startDate);
    eventDate.setDate(startDate.getDate() + index);

    // Format date to YYYYMMDD for ICS format
    const dateStr = eventDate
      .toISOString()
      .replace(/-|:|\.\d\d\d/g, "")
      .split("T")[0];

    // Create Description text from exercises
    const exerciseList = day.exercises
      .map((ex: any) => `\\n- ${ex.name}: ${ex.sets} sets x ${ex.reps}`)
      .join("");

    // Construct the Event
    icsContent.push(
      "BEGIN:VEVENT",
      `UID:${Date.now()}_${index}@fitnessai.com`, // Unique ID
      `DTSTAMP:${new Date().toISOString().replace(/-|:|\.\d\d\d/g, "")}`,
      `DTSTART;VALUE=DATE:${dateStr}`, // All-day event
      `SUMMARY:💪 FitnessAI: ${day.focus || day.day}`,
      `DESCRIPTION:Focus: ${day.focus}\\nDuration: ${
        day.duration || "45 mins"
      }${exerciseList}`,
      "END:VEVENT"
    );
  });

  icsContent.push("END:VCALENDAR");

  // Create Blob and trigger download
  const blob = new Blob([icsContent.join("\r\n")], {
    type: "text/calendar;charset=utf-8",
  });
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute("download", "FitnessAI_Plan.ics");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
