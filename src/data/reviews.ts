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
  location?: string;
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
  {
    id: 'angela-music-bingo-guest',
    quote: 'Recently we checked out music bingo at another restaurant in Lexington with a different entertainment group, and it was so boring. You guys are doing awesome and blow your competition out of the water!',
    excerpts: {
      homepage: 'You guys are doing awesome and blow your competition out of the water!',
      forVenues: 'You guys are doing awesome and blow your competition out of the water!',
    },
    name: 'Angela',
    title: 'Four Dogs Guest',
    source: 'Guest feedback provided by Four Dogs Entertainment',
    eventType: 'Music Bingo',
    featured: true,
    approved: true,
  },
  {
    id: 'sparky-superfan-facebook',
    quote: 'We first came out for Sports Trivia Night at The Yard and had so much fun that we’ve kept coming back. Joey puts tremendous effort into making each themed night unique and engaging for all involved.',
    excerpts: {
      homepage: 'We first came out for Sports Trivia Night at The Yard and had so much fun that we’ve kept coming back.',
      forVenues: 'Joey puts tremendous effort into making each themed night unique and engaging for all involved.',
    },
    name: 'Sparky Superfan',
    title: 'Facebook Recommendation',
    source: 'Facebook recommendation provided by Four Dogs Entertainment',
    eventType: 'Trivia',
    featured: true,
    approved: true,
  },
  {
    id: 'jordan-anderson-facebook',
    quote: 'We couldn’t have asked for a better DJ for our Spring Formal! Joey brought the perfect mix of current hits, timeless throwbacks, and crowd favorites that kept everyone on the dance floor all night long. Not only was the music great, but the DJ’s setup was professional, with great lighting and sound quality that elevated the entire event.',
    excerpts: {
      homepage: 'We couldn’t have asked for a better DJ for our Spring Formal! Joey brought the perfect mix of current hits, timeless throwbacks, and crowd favorites that kept everyone on the dance floor all night long.',
      forVenues: 'The DJ’s setup was professional, with great lighting and sound quality that elevated the entire event.',
    },
    name: 'Jordan Anderson',
    title: 'Spring Formal Client',
    source: 'Facebook recommendation provided by Four Dogs Entertainment',
    eventType: 'DJ Event',
    featured: true,
    approved: true,
  },
  {
    id: 'susan-leonard-facebook',
    quote: 'Joey is such a nice person with excellent communication skills! He would answer all of my text and calls and concerns almost immediately! We hired him to play at our son’s engagement party and I’m so glad we did!',
    excerpts: {
      homepage: 'Joey is such a nice person with excellent communication skills! We hired him to play at our son’s engagement party and I’m so glad we did!',
      forVenues: 'Joey is such a nice person with excellent communication skills!',
    },
    name: 'Susan Leonard',
    title: 'Engagement Party Client',
    source: 'Facebook recommendation provided by Four Dogs Entertainment',
    eventType: 'Private Event',
    featured: true,
    approved: true,
  },
  {
    id: 'adrian-blessed-mejia-guest',
    quote: 'Very family oriented! I can’t wait to visit again with some friends!',
    excerpts: {
      homepage: 'Very family oriented! I can’t wait to visit again with some friends!',
      forVenues: 'Very family oriented! I can’t wait to visit again with some friends!',
    },
    name: 'Adrian Blessed Mejia',
    title: 'Four Dogs Guest',
    source: 'Guest feedback provided by Four Dogs Entertainment',
    featured: true,
    approved: true,
  },
];

export const featuredReviews = reviews.filter((review) => review.featured && review.approved);
export const guestReviews = featuredReviews.filter((review) => review.id !== 'arif-charter-803-business-owner');
export const venueOwnerReview = reviews.find((review) => review.id === 'arif-charter-803-business-owner');
