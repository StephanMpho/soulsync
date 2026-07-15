export function daysSince(iso: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(iso + "T00:00:00").getTime()) / 864e5));
}

export function daysToNextAnniversary(iso: string) {
  const now = new Date();
  const d = new Date(iso + "T00:00:00");
  d.setFullYear(now.getFullYear());
  if (d < now) d.setFullYear(now.getFullYear() + 1);
  return Math.ceil((d.getTime() - now.getTime()) / 864e5);
}
