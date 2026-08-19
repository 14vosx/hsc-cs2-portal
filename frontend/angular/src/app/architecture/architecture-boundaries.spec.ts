import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';

function getAllTsFiles(dirPath: string): string[] {
  let files: string[] = [];
  if (!fs.existsSync(dirPath)) {
    return files;
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getAllTsFiles(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.html'))) {
      files.push(fullPath);
    }
  }

  return files;
}

describe('Architecture Boundaries — Lego Angular', () => {
  const appRoot = path.resolve(__dirname, '..');

  it('no component selector should be duplicated across the application', () => {
    const allTsFiles = getAllTsFiles(appRoot).filter((f) => f.endsWith('.ts') && !f.endsWith('.spec.ts'));
    const selectorMap = new Map<string, string[]>();

    for (const file of allTsFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const match = /selector:\s*['"]([^'"]+)['"]/.exec(content);
      if (match) {
        const selector = match[1];
        const existing = selectorMap.get(selector) || [];
        existing.push(file);
        selectorMap.set(selector, existing);
      }
    }

    for (const [selector, files] of selectorMap.entries()) {
      expect(
        files.length,
        `Selector "${selector}" is defined in multiple files: ${files.join(', ')}`,
      ).toBe(1);
    }
  });

  it('shared layer should not import features', () => {
    const sharedFiles = getAllTsFiles(path.join(appRoot, 'shared')).filter((f) => f.endsWith('.ts'));

    for (const file of sharedFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const hasFeatureImport = /from\s+['"].*\/features\//.test(content);
      expect(hasFeatureImport, `File ${file} should not import features`).toBe(false);
    }
  });

  it('core layer should not import features', () => {
    const coreFiles = getAllTsFiles(path.join(appRoot, 'core')).filter((f) => f.endsWith('.ts'));

    for (const file of coreFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const hasFeatureImport = /from\s+['"].*\/features\//.test(content);
      expect(hasFeatureImport, `File ${file} should not import features`).toBe(false);
    }
  });

  it('domain modules should not import Angular, Router or DOM', () => {
    const domainFiles = getAllTsFiles(appRoot).filter(
      (f) => f.includes(`${path.sep}domain${path.sep}`) && f.endsWith('.ts') && !f.endsWith('.spec.ts'),
    );

    for (const file of domainFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const hasAngularImport = /from\s+['"]@angular\//.test(content);
      const hasDomUsage = /\b(window|document|localStorage|sessionStorage)\b/.test(content);

      expect(hasAngularImport, `Domain file ${file} should not import @angular/*`).toBe(false);
      expect(hasDomUsage, `Domain file ${file} should not reference DOM globals`).toBe(false);
    }
  });

  it('shared/components components should not import DTOs', () => {
    const sharedComponentFiles = getAllTsFiles(path.join(appRoot, 'shared', 'components')).filter((f) => f.endsWith('.ts'));

    for (const file of sharedComponentFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const hasDtoImport = /from\s+['"].*\/dto\//.test(content);
      expect(hasDtoImport, `Shared component file ${file} should not import DTOs`).toBe(false);
    }
  });

  it('layout components should not import DTOs', () => {
    const layoutFiles = getAllTsFiles(path.join(appRoot, 'layout')).filter((f) => f.endsWith('.ts'));

    for (const file of layoutFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const hasDtoImport = /from\s+['"].*\/dto\//.test(content);
      expect(hasDtoImport, `Layout file ${file} should not import DTOs`).toBe(false);
    }
  });

  it('HomePage presentation component should not import DTOs or HttpClient directly', () => {
    const homePageFile = path.join(appRoot, 'features', 'home', 'home-page.ts');
    const content = fs.readFileSync(homePageFile, 'utf-8');

    const hasDtoImport = /from\s+['"].*\/dto\//.test(content);
    const hasHttpClientImport = /HttpClient/.test(content);

    expect(hasDtoImport, 'HomePage should not import DTOs').toBe(false);
    expect(hasHttpClientImport, 'HomePage should not import HttpClient directly').toBe(false);
  });

  it('home feature should not import overview feature', () => {
    const homeFiles = getAllTsFiles(path.join(appRoot, 'features', 'home')).filter((f) => f.endsWith('.ts'));

    for (const file of homeFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const hasOverviewImport = /overview/.test(content);
      expect(hasOverviewImport, `File ${file} should not import overview`).toBe(false);
    }
  });

  it('bunker feature should not depend on Cs2ApiService', () => {
    const bunkerFiles = getAllTsFiles(path.join(appRoot, 'features', 'bunker')).filter(
      (f) => f.endsWith('.ts') && !f.endsWith('.spec.ts'),
    );

    for (const file of bunkerFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const hasCs2ApiImport = /from\s+['"].*\/cs2-api\.service['"]/.test(content);
      expect(hasCs2ApiImport, `File ${file} should not depend on Cs2ApiService`).toBe(false);
    }
  });

  it('bunker feature should not import central API DTOs', () => {
    const bunkerFiles = getAllTsFiles(path.join(appRoot, 'features', 'bunker')).filter(
      (f) => f.endsWith('.ts') && !f.endsWith('.spec.ts'),
    );

    for (const file of bunkerFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const hasDtoImport = /from\s+['"].*\/api\/dto\//.test(content);
      expect(hasDtoImport, `File ${file} should not import central API DTOs`).toBe(false);
    }
  });
});
