/**
 * Writes repo-root openapi.json — gateway catalog (see buildGatewayOpenApi).
 * Run: npm run openapi (from api/)
 */
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { buildGatewayOpenApi } from '../libs/gatewayOpenApi.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const outPath = path.join(repoRoot, 'openapi.json');

writeFileSync(outPath, `${JSON.stringify(buildGatewayOpenApi(), null, 2)}\n`, 'utf8');
console.log('Wrote', outPath);
