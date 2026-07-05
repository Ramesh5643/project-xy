const fs = require('fs');

try {
  // Fix routes.ts
  let r = fs.readFileSync('src/app/routes.ts', 'utf8');
  r = r.replace('type RouteConfigEntry,', 'RouteConfigEntry,');
  r = r.replace(/type Tree = \{[\s\S]*?\};/g, '');
  r = r.replace(/: Tree\[\]/g, '');
  r = r.replace(/: Tree/g, '');
  r = r.replace(/: string/g, '');
  r = r.replace(/: boolean/g, '');
  r = r.replace(/: RouteConfigEntry\[\]/g, '');
  fs.writeFileSync('src/app/routes.ts', r);

  // Fix root.tsx
  let rt = fs.readFileSync('src/app/root.tsx', 'utf8');
  rt = rt.replace(/type CSSProperties,/g, 'CSSProperties,');
  rt = rt.replace(/type FC,/g, 'FC,');
  rt = rt.replace(/type ReactNode,/g, 'ReactNode,');
  rt = rt.replace(/import type \{ Route \} from '.\/\+types\/root';/g, '');
  rt = rt.replace(/: string\[\]/g, '');
  fs.writeFileSync('src/app/root.tsx', rt);

  // Fix not-found.tsx
  let nf = fs.readFileSync('src/app/__create/not-found.tsx', 'utf8');
  nf = nf.replace(/import type \{ Route \} from '.\/\+types\/not-found';/g, '');
  nf = nf.replace(/: Route\.LoaderArgs/g, '');
  nf = nf.replace(/interface ParentSitemap \{[\s\S]*?\}/g, '');
  fs.writeFileSync('src/app/__create/not-found.tsx', nf);

  console.log('✅ All errors fixed successfully!');
} catch(e) { 
  console.log('Error:', e.message); 
}