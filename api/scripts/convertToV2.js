import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const routesDir = path.join(__dirname, '..', 'routes');
const v2RoutesDir = path.join(__dirname, '..', 'v2', 'routes');
const v2PartnerDir = path.join(v2RoutesDir, 'partner');

// Ensure v2 directories exist
if (!fs.existsSync(v2RoutesDir)) {
  fs.mkdirSync(v2RoutesDir, { recursive: true });
}
if (!fs.existsSync(v2PartnerDir)) {
  fs.mkdirSync(v2PartnerDir, { recursive: true });
}

function convertFile(sourcePath, targetPath, routeName, depth = 0) {
  if (!fs.existsSync(sourcePath)) {
    console.log(`Skipping ${sourcePath} - file not found`);
    return;
  }

  let content = fs.readFileSync(sourcePath, 'utf8');
  
  // Calculate relative path depth (how many ../ needed)
  // For routes/: depth = 0, for routes/partner/: depth = 1, etc.
  const relativeDepth = depth;
  const utilsPath = '../'.repeat(relativeDepth + 1) + 'utils';
  const scriptsPath = '../'.repeat(relativeDepth + 1) + 'scripts';
  const libsPath = '../'.repeat(relativeDepth + 1) + 'libs';
  const promptsPath = '../'.repeat(relativeDepth + 1) + 'prompts';
  const requestPath = '../'.repeat(relativeDepth + 1) + 'request';

  // Update imports - adjust based on depth
  if (depth === 0) {
    // routes/ -> v2/routes/ (needs one more ../)
    content = content.replace(/from "\.\.\/utils\//g, 'from "../../utils/');
    content = content.replace(/from "\.\.\/scripts\//g, 'from "../../scripts/');
    content = content.replace(/from "\.\.\/libs\//g, 'from "../../libs/');
    content = content.replace(/from "\.\.\/prompts\//g, 'from "../../prompts/');
    content = content.replace(/from "\.\.\/request\//g, 'from "../../request/');
  } else if (depth === 1) {
    // routes/partner/ -> v2/routes/partner/ (needs one more ../)
    content = content.replace(/from "\.\.\/\.\.\/\.\.\/utils\//g, 'from "../../../../utils/');
    content = content.replace(/from "\.\.\/\.\.\/\.\.\/scripts\//g, 'from "../../../../scripts/');
    content = content.replace(/from "\.\.\/\.\.\/\.\.\/libs\//g, 'from "../../../../libs/');
    content = content.replace(/from "\.\.\/\.\.\/\.\.\/prompts\//g, 'from "../../../../prompts/');
    content = content.replace(/from "\.\.\/\.\.\/\.\.\/request\//g, 'from "../../../../request/');
  } else if (depth === 2) {
    // routes/partner/nansen/ -> v2/routes/partner/nansen/ (needs one more ../)
    content = content.replace(/from "\.\.\/\.\.\/\.\.\/\.\.\/utils\//g, 'from "../../../../../utils/');
    content = content.replace(/from "\.\.\/\.\.\/\.\.\/\.\.\/scripts\//g, 'from "../../../../../scripts/');
    content = content.replace(/from "\.\.\/\.\.\/\.\.\/\.\.\/libs\//g, 'from "../../../../../libs/');
    content = content.replace(/from "\.\.\/\.\.\/\.\.\/\.\.\/prompts\//g, 'from "../../../../../prompts/');
    content = content.replace(/from "\.\.\/\.\.\/\.\.\/\.\.\/request\//g, 'from "../../../../../request/');
  }
  
  // Update resource paths to include /v2/
  const routePath = routeName.replace(/\\/g, '/').replace(/^v2\//, '');
  const cleanRoutePath = routePath.replace(/\.js$/, '');
  content = content.replace(
    new RegExp(`resource: "/${cleanRoutePath}"`, 'g'),
    `resource: "/v2/${cleanRoutePath}"`
  );
  
  // Update descriptions to include (V2 API) if not already present
  content = content.replace(
    /description: "([^"]+)"(?![^"]*\(V2 API\))/g,
    (match, desc) => {
      if (!desc.includes('(V2 API)')) {
        return `description: "${desc} (V2 API)"`;
      }
      return match;
    }
  );
  
  // Ensure target directory exists
  const targetDir = path.dirname(targetPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  fs.writeFileSync(targetPath, content, 'utf8');
  console.log(`✓ Created V2: ${routeName}`);
}

// Convert core routes (depth 0)
const coreRoutes = [
  'sentiment.js',
  'event.js',
  'browse.js',
  'xSearch.js',
  'research.js',
  'gems.js',
  'kol.js',
  'crypto-kol.js',
  'check-status.js',
  'trending-headline.js',
  'sundown-digest.js',
];

coreRoutes.forEach(route => {
  const sourcePath = path.join(routesDir, route);
  const targetPath = path.join(v2RoutesDir, route);
  const routeName = route.replace('.js', '');
  convertFile(sourcePath, targetPath, routeName, 0);
});

// Convert partner routes
const partnerRoutes = [
  { file: 'dexscreener.js', depth: 1 },
  { file: 'smart-money.js', subdir: 'nansen', depth: 2 },
  { file: 'token-god-mode.js', subdir: 'nansen', depth: 2 },
  { file: 'pump.js', subdir: 'workfun', depth: 2 },
  { file: 'trending.js', subdir: 'jupiter', depth: 2 },
  { file: 'token-report.js', subdir: 'rugcheck', depth: 2 },
  { file: 'token-statistic.js', subdir: 'rugcheck', depth: 2 },
  { file: 'maps.js', subdir: 'bubblemaps', depth: 2 },
  { file: 'correlation.js', subdir: 'binance', depth: 2 },
];

partnerRoutes.forEach(({ file, subdir, depth }) => {
  const sourceSubdir = subdir ? path.join('partner', subdir) : 'partner';
  const targetSubdir = subdir ? path.join('partner', subdir) : 'partner';
  const sourcePath = path.join(routesDir, sourceSubdir, file);
  const targetPath = path.join(v2RoutesDir, targetSubdir, file);
  const routeName = subdir ? `${subdir}/${file}` : `partner/${file}`;
  
  // Ensure subdirectory exists
  const targetDir = path.dirname(targetPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  convertFile(sourcePath, targetPath, routeName, depth);
});

// Convert memecoin routes
const memecoinDir = path.join(routesDir, 'memecoin');
const v2MemecoinDir = path.join(v2RoutesDir, 'memecoin');
if (fs.existsSync(memecoinDir)) {
  if (!fs.existsSync(v2MemecoinDir)) {
    fs.mkdirSync(v2MemecoinDir, { recursive: true });
  }
  
  const memecoinFiles = fs.readdirSync(memecoinDir).filter(f => f.endsWith('.js'));
  memecoinFiles.forEach(file => {
    const sourcePath = path.join(memecoinDir, file);
    const targetPath = path.join(v2MemecoinDir, file);
    const routeName = `memecoin/${file}`;
    convertFile(sourcePath, targetPath, routeName, 1);
  });
}

console.log('\n✅ V2 route conversion complete!');
