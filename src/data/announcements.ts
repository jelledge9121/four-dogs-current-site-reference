import { localToday } from '../lib/event-system';

export const wescoThursdayNotice = "Thursday Karaoke at WesCo Brew & Bowl is on hold during the colder months. Check the calendar for confirmed Thursday Music Bingo nights.";

// Display window for the approved notice. The event series owns the schedule.
export const showWescoNotice = (today = localToday()) =>
  today >= '2026-11-19' && today <= '2026-12-17';
export const wescoBingoUrl = '/events/?venue=wesco&category=Music+Bingo';
