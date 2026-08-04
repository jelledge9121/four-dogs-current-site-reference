export type Schedule={day:string,time:string,format:string};
export type Venue={id:string;slug:string;name:string;address:string;city:string;state:string;zip:string;website?:string;mapUrl:string;description:string;image:string;active:boolean;weeklySchedule:Schedule[]};
export const venues:Venue[]=[
{id:'top-dawg',slug:'top-dawg-tavern-sandhills-trivia-columbia-sc',name:'Top Dawg Tavern',address:'Village at Sandhill',city:'Columbia',state:'SC',zip:'',mapUrl:'https://www.google.com/maps/search/?api=1&query=Top+Dawg+Tavern+Village+at+Sandhill',description:'Tuesday trivia and rotating Four Dogs game experiences in Columbia.',image:'/images/hero.jpg',active:true,weeklySchedule:[{day:'Tuesday',time:'6:30 PM',format:'Trivia & rotating game experiences'}]},
{id:'charter-803',slug:'charter-803-trivia-music-bingo-lexington-sc',name:'Charter 803 Bar & Grill',address:'269 Charter Oak Road',city:'Lexington',state:'SC',zip:'29072',mapUrl:'https://www.google.com/maps/search/?api=1&query=269+Charter+Oak+Road+Lexington+SC+29072',description:'Weekly Music Bingo, trivia, and specialty game nights in Lexington.',image:'/images/hero.jpg',active:true,weeklySchedule:[{day:'Wednesday',time:'6:30 PM',format:'Music Bingo'},{day:'Thursday',time:'6:30 PM',format:'Trivia & game nights'}]}
];
export const venueById=(id:string)=>venues.find(v=>v.id===id)!;
