# Netlify deployment (future only)

## Safety boundary

Website 2.0 has **not** been deployed, connected, or used to modify DNS/the live domain. Review locally first. Do not create a second production site. When the owner approves launch, connect this repository/branch to the **existing Four Dogs Netlify project**.

## Safe preview now

1. Run `npm install`.
2. Run `npm run build` (builds `dist`; does not deploy).
3. Run `npm run preview` and review the printed localhost URL.
4. Optionally share a non-production artifact through the owner's approved review process, but do not run `netlify deploy --prod`.

## Approved future connection

In the existing Netlify project's Build & deploy settings, select this GitHub repository and approved production branch. Use base directory blank/repository root, build command `npm run build`, and publish directory `dist` (also recorded in `netlify.toml`). Preserve the existing production domain and form notifications. Before triggering production, compare environment variables, deploy contexts, redirects, headers, forms, analytics, DNS, and rollback deploy. Use a branch/deploy preview from the existing project for final QA. Only after written launch approval should the existing project publish Website 2.0.

## Exact deploy-preview command sequence (only after owner authorizes preview access)

A local Astro preview is the only zero-Netlify-change review method. If the owner later authorizes a Netlify Deploy Preview, first build locally, then target the **existing site ID** without changing Git integration or DNS:

```bash
npm ci
npm run build
npx netlify-cli deploy --dir=dist --site="$FOUR_DOGS_NETLIFY_SITE_ID" --alias=website-2-review
```

The command intentionally omits `--prod`; Netlify returns an isolated preview URL and does not replace the production deploy. Confirm the CLI output says “draft deploy” and that the URL is not `4dogsentertainment.com`. Never run `netlify deploy --prod`, never use `netlify sites:create`, and never change domain settings. If the site ID or authorization is unavailable, stop and use `npm run preview` locally.
