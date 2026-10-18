import records from './venues.json';
export type WeeklySchedule = { day: string; time: string; format: string };
export type Venue = {
  id: string; slug: string; name: string; address: string; city: string; state: string;
  zip: string; website?: string; mapUrl: string; description: string; image: string;
  active: boolean; areaSlug: string; weeklySchedule: WeeklySchedule[]; addressVerified: boolean;
};
export const venues = records.venues as Venue[];
export const venueById = (id: string): Venue => {
  const venue = venues.find(v => v.id === id);
  if (!venue) throw new Error(`Unknown venue: ${id}`);
  return venue;
};
