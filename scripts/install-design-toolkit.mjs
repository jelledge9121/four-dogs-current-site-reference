import { spawnSync } from 'node:child_process';
const result = spawnSync('npx', ['--yes','impeccable@4.6.0','install','--providers=codex','--scope=project','--no-hooks'], {stdio:'inherit',env:{...process.env,IMPECCABLE_NO_TELEMETRY:'1'}});
process.exit(result.status ?? 1);
