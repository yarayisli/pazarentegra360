// Demo mode keeps the mock dataset (src/data/mockData.ts) while screens move to the real API (#24-#28).
// Enabled with `?demo=1` in the URL or the VITE_DEMO_MODE=true build variable.
export function isDemoMode(search: string = window.location.search): boolean {
  if (new URLSearchParams(search).get("demo") === "1") return true;
  return import.meta.env.VITE_DEMO_MODE === "true";
}
