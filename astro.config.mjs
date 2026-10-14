import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
export default defineConfig({ site: 'https://4dogsentertainment.com', output: 'static', integrations: [sitemap({ filter: (page) => !['/thank-you/', '/404/'].includes(new URL(page).pathname) })] });
