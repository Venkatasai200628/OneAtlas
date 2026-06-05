
import { cpSync, mkdirSync, existsSync, readdirSync, rmSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const root = process.cwd();
const publicDir = join(root, 'public');
const distDir = join(root, 'dist');

console.log('▶ Building Vite frontend…');
execSync('npm run build', { stdio: 'inherit', cwd: root });

if (!existsSync(distDir)) {
  console.error('dist/ not found after vite build');
  process.exit(1);
}

console.log('▶ Copying dist/ → public/ for Next static hosting…');
if (existsSync(publicDir)) {
  for (const name of readdirSync(publicDir)) {
    if (name === '.gitkeep') continue;
    rmSync(join(publicDir, name), { recursive: true, force: true });
  }
} else {
  mkdirSync(publicDir, { recursive: true });
}
cpSync(distDir, publicDir, { recursive: true });

console.log('▶ Building Next.js API…');
execSync('npm run build:api', { stdio: 'inherit', cwd: root });

console.log('✓ Vercel build complete');
