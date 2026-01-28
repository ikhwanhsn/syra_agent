/**
 * Script to create V2 versions of all x402 routes
 * This script reads V1 routes and creates V2 versions with updated imports and resource paths
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const routesDir = path.join(__dirname, '..', 'routes');
const v2RoutesDir = path.join(__dirname, '..', 'v2', 'routes');

// Routes that need V2 conversion (excluding regular routes and prediction-game)
const routesToConvert = [
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

function convertRouteToV2(routeFile) {
  const v1Path = path.join(routesDir, routeFile);
  const v2Path = path.join(v2RoutesDir, routeFile);
  
  if (!fs.existsSync(v1Path)) {
    console.log(`Skipping ${routeFile} - file not found`);
    return;
  }

  let content = fs.readFileSync(v1Path, 'utf8');
  
  // Update imports
  content = content.replace(
    /from "\.\.\/utils\/x402Payment\.js"/g,
    'from "../utils/x402Payment.js"'
  );
  content = content.replace(
    /from "\.\.\/utils\//g,
    'from "../../utils/'
  );
  content = content.replace(
    /from "\.\.\/scripts\//g,
    'from "../../scripts/'
  );
  content = content.replace(
    /from "\.\.\/libs\//g,
    'from "../../libs/'
  );
  content = content.replace(
    /from "\.\.\/prompts\//g,
    'from "../../prompts/'
  );
  
  // Update resource paths
  const routeName = routeFile.replace('.js', '');
  content = content.replace(
    new RegExp(`resource: "/${routeName}"`, 'g'),
    `resource: "/v2/${routeName}"`
  );
  
  // Update descriptions to include (V2 API)
  content = content.replace(
    /description: "([^"]+)"/g,
    (match, desc) => {
      if (!desc.includes('(V2 API)')) {
        return `description: "${desc} (V2 API)"`;
      }
      return match;
    }
  );
  
  // Ensure v2 directory exists
  if (!fs.existsSync(v2RoutesDir)) {
    fs.mkdirSync(v2RoutesDir, { recursive: true });
  }
  
  fs.writeFileSync(v2Path, content, 'utf8');
  console.log(`Created V2 version: ${routeFile}`);
}

// Convert all routes
routesToConvert.forEach(convertRouteToV2);
console.log('V2 route conversion complete!');
