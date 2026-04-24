#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';

/**
 * ATLAS — Architecture Boundary Enforcement
 *
 * Rule: No package may import across a layer boundary without going through
 * the shared-kernel interface. Direct cross-layer imports are violations.
 *
 * Canonical layers:
 *   packages/safekrypte   — Security Spine (keys)
 *   packages/safestakes   — Security Spine (capital)
 *   packages/underwriting — Risk Layer
 *   packages/mainframe    — Observability Layer
 *   packages/ubuntu-pools — Application Layer
 *   packages/platform     — Shared Kernel (allowed everywhere)
 *   contracts/            — Shared Schemas (allowed everywhere)
 *   tools/                — CLI & Dev Tools (allowed everywhere)
 */

const LAYER_MAP: Record<string, string> = {
  'packages/safekrypte': 'spine',
  'packages/safestakes': 'spine',
  'packages/underwriting': 'risk',
  'packages/mainframe': 'observability',
  'packages/ubuntu-pools': 'application',
};

const ALLOWED_IMPORTS: Record<string, string[]> = {
  spine: ['shared', 'contracts', 'tools'],
  risk: ['shared', 'contracts', 'spine', 'tools'],
  observability: ['shared', 'contracts', 'tools'],
  application: ['shared', 'contracts', 'tools'],
};

function getLayer(filePath: string): string | null {
  for (const [prefix, layer] of Object.entries(LAYER_MAP)) {
    if (filePath.startsWith(prefix)) return layer;
  }
  return null;
}

function getImportLayer(importPath: string): string | null {
  // Handle relative imports within same package
  if (importPath.startsWith('.')) return null; // relative, skip

  for (const [prefix, layer] of Object.entries(LAYER_MAP)) {
    if (importPath.includes(prefix)) return layer;
  }

  if (importPath.includes('@contracts') || importPath.includes('contracts/')) return 'contracts';
  if (importPath.includes('@vv-monorepo/platform') || importPath.includes('packages/platform')) return 'shared';
  if (importPath.includes('tools/')) return 'tools';

  return 'external'; // node_modules or unknown
}

interface Violation {
  file: string;
  importPath: string;
  sourceLayer: string;
  targetLayer: string;
}

async function main() {
  const violations: Violation[] = [];

  // Scan all TypeScript files in packages
  const packagesDir = 'packages';
  const packages = fs.readdirSync(packagesDir);

  for (const pkg of packages) {
    const pkgPath = path.join(packagesDir, pkg, 'src');
    if (!fs.existsSync(pkgPath)) continue;

    const files = walkDir(pkgPath, '.ts');

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const importRegex = /from\s+['"]([^'"]+)['"]/g;
      let match;

      const sourceLayer = getLayer(file);
      if (!sourceLayer) continue;

      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        const targetLayer = getImportLayer(importPath);
        if (!targetLayer || targetLayer === 'external') continue;

        // Check if this cross-layer import is allowed
        const allowed = ALLOWED_IMPORTS[sourceLayer];
        if (allowed && !allowed.includes(targetLayer)) {
          // Special case: spine can import from spine (safekrypte ↔ safestakes)
          if (sourceLayer === 'spine' && targetLayer === 'spine') continue;

          violations.push({
            file,
            importPath,
            sourceLayer,
            targetLayer,
          });
        }
      }
    }
  }

  if (violations.length > 0) {
    console.error('❌ ATLAS architecture boundary violations detected:');
    for (const v of violations) {
      console.error(`  ${v.file}`);
      console.error(`    imports ${v.importPath}`);
      console.error(`    ${v.sourceLayer} → ${v.targetLayer} (not allowed)`);
    }
    console.error(`\nTotal violations: ${violations.length}`);
    process.exit(1);
  }

  console.log('✅ ATLAS: No architecture boundary violations.');
  console.log('   All cross-package imports respect shared-kernel interface.');
}

function walkDir(dir: string, ext: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(fullPath, ext));
    } else if (entry.name.endsWith(ext)) {
      results.push(fullPath);
    }
  }
  return results;
}

main().catch(console.error);</content>
<parameter name="filePath">tools/atlas/src/check.ts