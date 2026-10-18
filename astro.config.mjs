import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import netlify from '@astrojs/netlify';
import venueData from './src/data/venues.json' with { type: 'json' };
import { localSeoPages } from './src/data/localSeoPages.ts';
const venues=venueData.venues;
const origin = 'https://4dogsentertainment.com';
const cities = ['lexington-sc','columbia-sc','west-columbia-cayce-sc','irmo-chapin-sc','fountain-inn-sc'];
export default defineConfig({
  site: origin,
  output: 'static',
  adapter: netlify(),
  integrations: [sitemap({
    customPages: [origin+'/', origin+'/events/', ...venues.map(v=>`${origin}/venues/${v.slug}/`), ...cities.map(c=>`${origin}/areas/${c}/`), ...localSeoPages.map(p=>`${origin}/${p.slug}/`)],
    customSitemaps: [origin+'/event-sitemap.xml'],
    filter: url => !url.includes('/admin/'),
  })],
});
