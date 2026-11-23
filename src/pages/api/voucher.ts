import { allEvents } from '../../data/events';
import { voucherHandler } from '../../lib/registration-voucher';
export const prerender=false;
export const POST=voucherHandler(allEvents);
