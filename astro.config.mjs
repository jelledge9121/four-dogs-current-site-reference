import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
export default defineConfig({ site: 'https://4dogsentertainment.com', output: 'static', integrations: [sitemap()] });
