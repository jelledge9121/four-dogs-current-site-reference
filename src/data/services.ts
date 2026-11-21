export type Service={slug:string;name:string;summary:string;description:string;featured?:boolean;bookingValue:string};
export const services:Service[]=[
{slug:'trivia',name:'Trivia',summary:'Hosted trivia that turns any room into a team sport.',description:'For bars, restaurants, private events, companies, organizations, and communities.',bookingValue:'Trivia'},
{slug:'music-bingo',name:'Music Bingo',summary:'Recognizable songs, themes, interaction, and a host who keeps the room moving.',description:'A social, approachable format for public and private events.',bookingValue:'Music Bingo'},
{slug:'karaoke',name:'Karaoke',summary:'Hosted karaoke built for confident singers and first-timers alike.',description:'A lively hosted experience for venues and celebrations.',bookingValue:'Karaoke'},
{slug:'weddings',name:'Weddings',summary:'Wedding DJ and entertainment shaped around your celebration.',description:'Music, hosting, and personal moments for couples in South Carolina, North Carolina, and Georgia.',bookingValue:'Wedding DJ / Entertainment'},
{slug:'photo-booth',name:'Photo Booth',summary:'Professional photo booth rentals for weddings and celebrations. Packages start at $450 for three hours.',description:'Enjoy an attended photo booth with a DSLR camera, studio flash, instant digital sharing, and an online photo gallery. Prints, props, backdrops, and keepsakes are available as add-ons. Additional hours and travel may affect pricing.',bookingValue:'Photo Booth'},
{slug:'private-corporate-events',name:'Private & Corporate Events',summary:'People remember what they participated in.',description:'Four Dogs creates interactive experiences that get guests talking, laughing, competing, participating, and celebrating together at parties, businesses, HOAs, churches, organizations, and community events.',bookingValue:'Private Event'},
{slug:'four-dogs-survey-showdown',name:'Four Dogs Survey Showdown',summary:'Guess the most popular survey answers with your team.',description:'A Four Dogs game-show-inspired experience. Not affiliated with Family Feud.',featured:true,bookingValue:'Four Dogs Survey Showdown'},
{slug:'are-you-smarter-than-a-barstool',name:'Are You Smarter Than a Barstool?',summary:'Take on school subjects in a classroom-style game for grown-ups.',description:'A Four Dogs original experience not affiliated with Are You Smarter Than a 5th Grader?',featured:true,bookingValue:'Are You Smarter Than a Barstool?'},
{slug:'almost-married-trivia-experience',name:'Almost Married Trivia Experience',summary:'Customized couple trivia for wedding weekends and pre-wedding gatherings.',description:'Questions can explore how you met, the proposal, family, friends, milestones, and favorite stories.',featured:true,bookingValue:'Almost Married Trivia Experience'}];

export type ServicePhoto = { src: string; alt: string };
const danceFloor = { src: '/images/optimized/wedding-floor-800.webp', alt: 'Guests dancing at a Four Dogs wedding reception' };
export const servicePhotos: Record<string, ServicePhoto> = {
  trivia: { src: '/images/venues/four-dogs-top-dawg-trivia-crowd-2026.webp', alt: 'Trivia teams gathered at Top Dawg Tavern in Sandhill' },
  'music-bingo': { src: '/images/gallery/music-bingo-charter-friends.webp', alt: 'Friends playing Music Bingo at Charter 803' },
  karaoke: { src: '/images/gallery/four-dogs-karaoke-wesco-host-on-mic.webp', alt: 'Four Dogs karaoke host singing on the patio at WesCo' },
  'four-dogs-survey-showdown': { src: '/images/optimized/home-crowd-960.webp', alt: 'Survey Showdown team at Boze’s with their prizes' },
  'are-you-smarter-than-a-barstool': { src: '/images/venues/four-dogs-the-mill-trivia-team-belt-2026.webp', alt: 'Two guests with the Four Dogs championship belt at The Mill in Fountain Inn' },
  'private-corporate-events': { src: '/images/gallery/four-dogs-private-event-dance-floor-02-poster.webp', alt: 'Guests at a Four Dogs private event' },
  weddings: danceFloor,
  'almost-married-trivia-experience': danceFloor,
  'photo-booth': danceFloor,
};
