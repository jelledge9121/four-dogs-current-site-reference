export type WeeklySchedule = {
  day: string;
  time: string;
  format: string;
};

export type Venue = {
  id: string;
  slug: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  website?: string;
  mapUrl: string;
  description: string;
  image: string;
  active: boolean;
  areaSlug: string;
  weeklySchedule: WeeklySchedule[];
};

export const venues: Venue[] = [
  {
    id: 'top-dawg',
    slug: 'top-dawg-tavern-sandhills-trivia-columbia-sc',
    name: 'Top Dawg Tavern',
    address: '498 Town Center Pl',
    city: 'Columbia',
    state: 'SC',
    zip: '29229',
    website: 'https://topdawgtavern.com/columbia',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=498+Town+Center+Pl+Columbia+SC+29229',
    description: 'Tuesday trivia, Music Bingo, and rotating Four Dogs game experiences in Columbia.',
    image: '/images/hero.jpg',
    active: true,
    areaSlug: 'columbia-sc',
    weeklySchedule: [
      { day: 'Tuesday', time: '6:30 PM', format: 'Trivia, Music Bingo & rotating game experiences' },
    ],
  },
  {
    id: 'charter-803',
    slug: 'charter-803-trivia-music-bingo-lexington-sc',
    name: 'Charter 803 Bar & Grill',
    address: '269 Charter Oak Road',
    city: 'Lexington',
    state: 'SC',
    zip: '29072',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=269+Charter+Oak+Road+Lexington+SC+29072',
    description: 'Weekly Music Bingo, trivia, and specialty Four Dogs events in Lexington.',
    image: '/images/hero.jpg',
    active: true,
    areaSlug: 'lexington-sc',
    weeklySchedule: [
      { day: 'Wednesday', time: '6:30 PM', format: 'Music Bingo & special events' },
      { day: 'Thursday', time: '6:30 PM', format: 'Trivia & game nights' },
    ],
  },
  {
    id: 'bozes',
    slug: 'bozes-restaurant-bar-trivia-music-bingo-west-columbia-sc',
    name: "Boze's Restaurant & Bar",
    address: '2736 Emanuel Church Road',
    city: 'West Columbia',
    state: 'SC',
    zip: '29170',
    website: 'https://bozesrestaurantandbar.com/',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=2736+Emanuel+Church+Road+West+Columbia+SC+29170',
    description: 'Wednesday Four Dogs entertainment in West Columbia with Trivia, Music Bingo, and specialty nights.',
    image: '/images/hero.jpg',
    active: true,
    areaSlug: 'west-columbia-cayce-sc',
    weeklySchedule: [
      { day: 'Wednesday', time: '7:30 PM', format: 'Trivia, Music Bingo & specialty nights' },
    ],
  },
  {
    id: 'wesco',
    slug: 'wesco-brew-and-bowl-trivia-cayce-sc',
    name: 'WesCo Brew & Bowl',
    address: '3040 Charleston Highway',
    city: 'Cayce',
    state: 'SC',
    zip: '29172',
    website: 'https://wescobrewandbowl.com/',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=3040+Charleston+Highway+Cayce+SC+29172',
    description: 'Tuesday Four Dogs trivia and rotating game experiences in Cayce.',
    image: '/images/hero.jpg',
    active: true,
    areaSlug: 'west-columbia-cayce-sc',
    weeklySchedule: [
      { day: 'Tuesday', time: '6:30 PM', format: 'Trivia & rotating game experiences' },
    ],
  },
  {
    id: 'bubbas',
    slug: 'bubbas-biscuit-lexington-sc',
    name: "Bubba's",
    address: '269 Charter Oak Road',
    city: 'Lexington',
    state: 'SC',
    zip: '29072',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=269+Charter+Oak+Road+Lexington+SC+29072',
    description: 'Brunch and special Four Dogs bingo events in Lexington.',
    image: '/images/hero.jpg',
    active: true,
    areaSlug: 'lexington-sc',
    weeklySchedule: [],
  },
  {
    id: 'the-mill',
    slug: 'the-mill-fountain-inn-trivia-sc',
    name: 'The Mill at Fountain Inn',
    address: '100 Ellison Street',
    city: 'Fountain Inn',
    state: 'SC',
    zip: '29644',
    website: 'https://themillatfountaininn.com/',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=100+Ellison+Street+Fountain+Inn+SC+29644',
    description: 'Weekly Monday Are You Smarter Than a Barstool? with Four Dogs Entertainment in Fountain Inn.',
    image: '/images/hero.jpg',
    active: true,
    areaSlug: 'fountain-inn-sc',
    weeklySchedule: [
      { day: 'Monday', time: '7:00 PM', format: 'Are You Smarter Than a Barstool?' },
    ],
  },
];

export const venueById = (id: string) => venues.find((venue) => venue.id === id)!;
