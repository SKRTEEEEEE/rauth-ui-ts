/**
 * Tests for Project Setup Validation
 * Verifies that the TypeScript project is properly initialized
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

describe('Project Setup', () => {
  const projectRoot = join(__dirname, '../..');

  describe('package.json validation', () => {
    it('should have package.json file', () => {
      const packageJsonPath = join(projectRoot, 'package.json');
      expect(existsSync(packageJsonPath)).toBe(true);
    });

    it('should have correct package name "rauth"', () => {
      const packageJsonPath = join(projectRoot, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      expect(packageJson.name).toBe('rauth');
    });

    it('should have version 0.1.0', () => {
      const packageJsonPath = join(projectRoot, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      expect(packageJson.version).toBe('0.1.0');
    });

    it('should have description', () => {
      const packageJsonPath = join(projectRoot, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      expect(packageJson.description).toBeTruthy();
      expect(typeof packageJson.description).toBe('string');
    });

    it('should have main pointing to dist/index.js', () => {
      const packageJsonPath = join(projectRoot, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      expect(packageJson.main).toBe('dist/index.js');
    });

    it('should have types pointing to dist/index.d.ts', () => {
      const packageJsonPath = join(projectRoot, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      expect(packageJson.types).toBe('dist/index.d.ts');
    });

    it('should have React 18+ as peer dependency', () => {
      const packageJsonPath = join(projectRoot, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      expect(packageJson.peerDependencies).toBeDefined();
      expect(packageJson.peerDependencies.react).toMatch(/\^18\./);
    });

    it('should have React-DOM 18+ as peer dependency', () => {
      const packageJsonPath = join(projectRoot, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      expect(packageJson.peerDependencies).toBeDefined();
      expect(packageJson.peerDependencies['react-dom']).toMatch(/\^18\./);
    });

    it('should NOT have React in dependencies', () => {
      const packageJsonPath = join(projectRoot, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      if (packageJson.dependencies) {
        expect(packageJson.dependencies.react).toBeUndefined();
      }
    });

    it('should NOT have React-DOM in dependencies', () => {
      const packageJsonPath = join(projectRoot, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      if (packageJson.dependencies) {
        expect(packageJson.dependencies['react-dom']).toBeUndefined();
      }
    });

    it('should have TypeScript in devDependencies', () => {
      const packageJsonPath = join(projectRoot, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      expect(packageJson.devDependencies).toBeDefined();
      expect(packageJson.devDependencies.typescript).toBeDefined();
    });

    it('should have @types/react in devDependencies', () => {
      const packageJsonPath = join(projectRoot, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      expect(packageJson.devDependencies).toBeDefined();
      expect(packageJson.devDependencies['@types/react']).toBeDefined();
    });

    it('should have @types/react-dom in devDependencies', () => {
      const packageJsonPath = join(projectRoot, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      expect(packageJson.devDependencies).toBeDefined();
      expect(packageJson.devDependencies['@types/react-dom']).toBeDefined();
    });

    it('should have dev script', () => {
      const packageJsonPath = join(projectRoot, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      expect(packageJson.scripts).toBeDefined();
      expect(packageJson.scripts.dev).toBeDefined();
    });

    it('should have build script', () => {
      const packageJsonPath = join(projectRoot, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      expect(packageJson.scripts).toBeDefined();
      expect(packageJson.scripts.build).toBeDefined();
    });

    it('should have test script', () => {
      const packageJsonPath = join(projectRoot, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      expect(packageJson.scripts).toBeDefined();
      expect(packageJson.scripts.test).toBeDefined();
    });

    it('should have relevant keywords', () => {
      const packageJsonPath = join(projectRoot, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      expect(packageJson.keywords).toBeDefined();
      expect(Array.isArray(packageJson.keywords)).toBe(true);
      const expectedKeywords = ['auth', 'oauth', 'react', 'nextjs', 'authentication'];
      expectedKeywords.forEach(keyword => {
        expect(packageJson.keywords).toContain(keyword);
      });
    });
  });

  describe('tsconfig.json validation', () => {
    it('should have tsconfig.json file', () => {
      const tsconfigPath = join(projectRoot, 'tsconfig.json');
      expect(existsSync(tsconfigPath)).toBe(true);
    });

    it('should be valid JSON', () => {
      const tsconfigPath = join(projectRoot, 'tsconfig.json');
      expect(() => {
        JSON.parse(readFileSync(tsconfigPath, 'utf-8'));
      }).not.toThrow();
    });

    it('should have compilerOptions', () => {
      const tsconfigPath = join(projectRoot, 'tsconfig.json');
      const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf-8'));
      expect(tsconfig.compilerOptions).toBeDefined();
      expect(typeof tsconfig.compilerOptions).toBe('object');
    });
  });

  describe('.gitignore validation', () => {
    it('should have .gitignore file', () => {
      const gitignorePath = join(projectRoot, '.gitignore');
      expect(existsSync(gitignorePath)).toBe(true);
    });

    it('should ignore node_modules', () => {
      const gitignorePath = join(projectRoot, '.gitignore');
      const gitignoreContent = readFileSync(gitignorePath, 'utf-8');
      expect(gitignoreContent).toContain('node_modules');
    });

    it('should ignore dist directory', () => {
      const gitignorePath = join(projectRoot, '.gitignore');
      const gitignoreContent = readFileSync(gitignorePath, 'utf-8');
      expect(gitignoreContent).toMatch(/dist|build/);
    });

    it('should ignore .env files', () => {
      const gitignorePath = join(projectRoot, '.gitignore');
      const gitignoreContent = readFileSync(gitignorePath, 'utf-8');
      expect(gitignoreContent).toContain('.env');
    });

    it('should ignore IDE folders', () => {
      const gitignorePath = join(projectRoot, '.gitignore');
      const gitignoreContent = readFileSync(gitignorePath, 'utf-8');
      expect(gitignoreContent).toMatch(/\.vscode|\.idea/);
    });

    it('should ignore coverage directory', () => {
      const gitignorePath = join(projectRoot, '.gitignore');
      const gitignoreContent = readFileSync(gitignorePath, 'utf-8');
      expect(gitignoreContent).toContain('coverage');
    });
  });
});
