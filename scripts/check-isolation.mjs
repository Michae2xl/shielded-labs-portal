import { existsSync, lstatSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
for (const name of ['postgres', 'drizzle-orm', '@grpc/grpc-js', 'libsodium-wrappers']) {
  if (pkg.dependencies?.[name]) errors.push(`Unrelated database/wallet dependency: ${name}`);
}
function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (['.git', '.next', 'node_modules', '__pycache__'].includes(entry)) continue;
    const path = join(dir, entry);
    const stat = lstatSync(path);
    if (stat.isSymbolicLink()) { errors.push(`External symlink: ${path}`); continue; }
    if (entry.startsWith('.env') && entry !== '.env.example') errors.push(`Environment file: ${path}`);
    if (stat.isDirectory()) { walk(path); continue; }
    if (!path.startsWith(join(root, 'src')) || !/\.(tsx?|mjs)$/.test(path)) continue;
    const code = readFileSync(path, 'utf8');
    if (/DATABASE_URL|SESSION_SECRET|\/Users\/|proposals-repo|@\/lib\/(?:db|auth)\//.test(code)) errors.push(`Source project coupling: ${path}`);
    for (const match of code.matchAll(/(?:from\s*|import\s*\()\s*['"](@\/[^'"]+)['"]/g)) {
      const target = join(root, 'src', match[1].slice(2));
      if (!['', '.ts', '.tsx', '.json', '/index.ts', '/index.tsx'].some(ext => existsSync(target + ext))) errors.push(`Unresolved local import ${match[1]} in ${path}`);
    }
  }
}
walk(root);
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log('Isolation passed: self-contained imports, no database/auth dependency, environment files or external symlinks.');
