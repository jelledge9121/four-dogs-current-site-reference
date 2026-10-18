# Production design refinement

Baseline production deploy: 6ad438635154bc12862388bf. Source: 9dd9c30d91ac473adf6c067b743a06f553f8afae. Backup: backup/design-upgrade-2026-10-18. Staging uses a pull-request preview on the existing Netlify project. No domain, database, or hosting replacement.

Impeccable 4.6.0 was checked against its official repository and npm integrity sha512-WPsB+B1qwJFflMjlVxugjaDLLtieIsNyS8tu4G5mnxfysFwE9NWNj2g4Sw9lhkcwcEeMK+LCTsnEGJPta1H/0A==, then installed project-locally with the documented Codex installer. Hooks were skipped for this harness; run the manual detector before release. Product facts come from the explicit user brief and verified code.

## Critique and audit priorities

- P1: The calendar's tall marketing hero and six-field phone form postpone results. Compact the heading, expose date shortcuts, and use accessible filter disclosure. Keep selected range and result count visible.
- P1: The song section precedes homepage events. Move current events directly after a balanced hero and retain the player later.
- P1: Required booking fields lack visible instruction. Clarify requirements and next steps while retaining form names, endpoints, service preselection, and holiday logic.
- P2: Repeated equal-weight cards and uppercase metadata compete with practical information. Introduce readable event rows, clear type roles, quieter grouping, and concise actions.
- P2: The timed pack modal interrupts attendance and inquiry tasks. Preserve the SMS destination and dialog, but make opening deliberate.
- P2: The hero downloads a large JPEG under a dark overlay. Use optimized responsive versions of the same approved photo and explicit dimensions.

## Release gates

Preserve catalog, schema, canonicals, crawler rules, recurrence limits, and integrations. Capture actual baseline phone/desktop pages. Apply typeset/layout/clarify/adapt/optimize/harden/polish guidance. Pass existing 27 event tests, Astro check/build, static/SSR QA, hosted functional/responsive checks, and Impeccable detector. Verify preview before production merge. Recovery uses a revert commit and Git deployment, not an unrelated deploy restore.
