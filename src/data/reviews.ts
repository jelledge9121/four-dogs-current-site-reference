export type Review = {
  id: string;
  quote: string;
  excerpts: {
    homepage: string;
    forVenues: string;
  };
  name: string;
  title: string;
  source: string;
  location: string;
  eventType?: string;
  venue?: string;
  featured: boolean;
  approved: boolean;
};

export const reviews: Review[] = [
  {
    id: 'arif-charter-803-business-owner',
    quote: 'It is my pleasure to wholeheartedly recommend Four Dogs Entertainment and DJ Joey. Over the years, we have built an outstanding working relationship based on professionalism, trust, and a shared commitment to providing the very best entertainment for our community. At Charter 803, we don’t simply schedule events together, we collaborate, exchange ideas, and continuously work as partners to create fun, engaging, and memorable experiences for our guests.\n\nDJ Joey is dependable, organized, easy to work with, and genuinely passionate about what he does. Whether it’s Music Bingo, Trivia, or any special event, Four Dogs Entertainment consistently delivers a first-class experience with enthusiasm and professionalism. Their dedication to excellence has made them an invaluable business partner, and I am grateful for the relationship we have built together. I highly recommend Four Dogs Entertainment to any business or organization looking for exceptional entertainment and a true partner who cares about serving their community.',
    excerpts: {
      homepage: 'Four Dogs Entertainment consistently delivers a first-class experience with enthusiasm and professionalism.',
      forVenues: 'We don’t simply schedule events together, we collaborate, exchange ideas, and continuously work as partners to create fun, engaging, and memorable experiences for our guests.',
    },
    name: 'Arif',
    title: 'Owner, Charter 803 Bar & Grill',
    source: 'Verified business-owner testimonial',
    location: 'Lexington, South Carolina',
    eventType: 'Venue Entertainment',
    venue: 'Charter 803 Bar & Grill',
    featured: true,
    approved: true,
  },
];

export const featuredReviews = reviews.filter((review) => review.featured && review.approved);
