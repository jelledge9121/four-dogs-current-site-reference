import {services} from '../data/services';
export const bookingServices = [
  ...services.map(s => s.bookingValue), 'DJ', 'Corporate Event', 'Venue Entertainment',
  'Community Awareness Night', 'Christmas / Holiday Entertainment', 'Other entertainment inquiry',
];
export const channels = ['organic search','paid','campaign','referral','direct or unknown'] as const;
export const bookingActions = ['booking_form_open','booking_submission_accepted'] as const;
export const publicHost = (host: string) => host === '4dogsentertainment.com';
export const isInquiryId = (value: unknown): value is string =>
  typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
