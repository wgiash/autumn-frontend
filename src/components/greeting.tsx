"use client";

/* The greeting follows the viewer's own clock. The server renders its
   best guess and hydration corrects it silently — suppressHydrationWarning
   because the two clocks may legitimately disagree. */
const greetingFor = (hour: number) =>
  hour >= 5 && hour < 12
    ? "Good morning"
    : hour >= 12 && hour < 17
      ? "Good afternoon"
      : "Good evening";

export function Greeting({ name }: { name: string }) {
  return (
    <p className="text-sm/5 text-ink-72" suppressHydrationWarning>
      {greetingFor(new Date().getHours())}, {name}
    </p>
  );
}
