export type GalleryItem =
  | {
      type: 'image';
      src: string;
      alt: string;
      category: string;
      width: number;
      height: number;
    }
  | {
      type: 'video';
      src: string;
      videoSrc: string;
      poster: string;
      alt: string;
      category: string;
      width: number;
      height: number;
    };

export const gallery: GalleryItem[] = [
  {
    type: 'image',
    src: '/images/gallery/four-dogs-wedding-ceremony-crowd.webp',
    alt: 'Wedding ceremony inside a bright reception venue with guests seated on both sides of the aisle',
    category: 'Weddings',
    width: 1080,
    height: 1440,
  },
  {
    type: 'image',
    src: '/images/gallery/four-dogs-trivia-first-place-winner.webp',
    alt: 'Four Dogs Entertainment trivia winner holding a first-place envelope and championship trophy at a venue event',
    category: 'Trivia',
    width: 1080,
    height: 1440,
  },
  {
    type: 'video',
    src: '/images/gallery/four-dogs-wedding-dance-floor-crowd-poster.webp',
    videoSrc: '/videos/gallery/four-dogs-wedding-dance-floor-crowd.mp4',
    poster: '/images/gallery/four-dogs-wedding-dance-floor-crowd-poster.webp',
    alt: 'Guests dancing together on a crowded wedding dance floor during a Four Dogs Entertainment DJ event',
    category: 'Weddings',
    width: 1280,
    height: 720,
  },
  {
    type: 'image',
    src: '/images/gallery/four-dogs-private-event-dance-floor-02-poster.webp',
    alt: 'Guests gathered at a Four Dogs private event',
    category: 'Private Events',
    width: 800,
    height: 600,
  },
  {
    type: 'image',
    src: '/images/gallery/four-dogs-entertainment-event-photo-34.webp',
    alt: 'Guests celebrating together at a Four Dogs wedding',
    category: 'Weddings',
    width: 800,
    height: 600,
  },
  {
    type: 'image',
    src: '/images/gallery/four-dogs-entertainment-event-photo-19.webp',
    alt: 'Guests playing together at a Four Dogs trivia night',
    category: 'Trivia',
    width: 800,
    height: 600,
  },
  {
    type: 'image',
    src: '/images/gallery/four-dogs-entertainment-event-photo-37.webp',
    alt: 'A Four Dogs Music Bingo winner celebrating with a prize',
    category: 'Music Bingo',
    width: 800,
    height: 600,
  },
  {
    type: 'image',
    src: '/images/gallery/four-dogs-private-event-dance-floor-01-poster.webp',
    alt: 'A lively Four Dogs crowd celebrating together',
    category: 'Crowds & Winners',
    width: 800,
    height: 600,
  },
  {
    type: 'image',
    src: '/images/gallery/four-dogs-entertainment-event-photo-29.webp',
    alt: 'Guests gathered inside a Four Dogs partner venue',
    category: 'Venue Events',
    width: 800,
    height: 600,
  },
];
