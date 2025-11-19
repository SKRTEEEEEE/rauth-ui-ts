/**
 * Tests for TypeScript configuration
 * Validates tsconfig.json settings and compilation behavior
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('TypeScript Configuration', () => {
  describe('tsconfig.json', () => {
    it('should exist in root directory', () => {
      const tsconfigPath = path.resolve(process.cwd(), 'tsconfig.json');
      expect(fs.existsSync(tsconfigPath)).toBe(true);
    });

    it('should be valid JSON', () => {
      const tsconfigPath = path.resolve(process.cwd(), 'tsconfig.json');
      const content = fs.readFileSync(tsconfigPath, 'utf-8');
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it('should have strict mode enabled', () => {
      const tsconfigPath = path.resolve(process.cwd(), 'tsconfig.json');
      const content = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
      expect(content.compilerOptions.strict).toBe(true);
    });

    it('should have noUnusedLocals enabled', () => {
      const tsconfigPath = path.resolve(process.cwd(), 'tsconfig.json');
      const content = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
      expect(content.compilerOptions.noUnusedLocals).toBe(true);
    });

    it('should have noUnusedParameters enabled', () => {
      const tsconfigPath = path.resolve(process.cwd(), 'tsconfig.json');
      const content = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
      expect(content.compilerOptions.noUnusedParameters).toBe(true);
    });

    it('should have noFallthroughCasesInSwitch enabled', () => {
      const tsconfigPath = path.resolve(process.cwd(), 'tsconfig.json');
      const content = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
      expect(content.compilerOptions.noFallthroughCasesInSwitch).toBe(true);
    });

    it('should have noImplicitReturns enabled', () => {
      const tsconfigPath = path.resolve(process.cwd(), 'tsconfig.json');
      const content = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
      expect(content.compilerOptions.noImplicitReturns).toBe(true);
    });

    it('should have noUncheckedIndexedAccess enabled for array safety', () => {
      const tsconfigPath = path.resolve(process.cwd(), 'tsconfig.json');
      const content = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
      expect(content.compilerOptions.noUncheckedIndexedAccess).toBe(true);
    });

    it('should use ES2020 target', () => {
      const tsconfigPath = path.resolve(process.cwd(), 'tsconfig.json');
      const content = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
      expect(content.compilerOptions.target).toBe('ES2020');
    });

    it('should include ES2020, DOM, and DOM.Iterable libs', () => {
      const tsconfigPath = path.resolve(process.cwd(), 'tsconfig.json');
      const content = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
      expect(content.compilerOptions.lib).toContain('ES2020');
      expect(content.compilerOptions.lib).toContain('DOM');
      expect(content.compilerOptions.lib).toContain('DOM.Iterable');
    });

    it('should use react-jsx for JSX transform', () => {
      const tsconfigPath = path.resolve(process.cwd(), 'tsconfig.json');
      const content = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
      expect(content.compilerOptions.jsx).toBe('react-jsx');
    });

    it('should use bundler module resolution', () => {
      const tsconfigPath = path.resolve(process.cwd(), 'tsconfig.json');
      const content = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
      expect(content.compilerOptions.moduleResolution).toBe('bundler');
    });

    it('should have paths alias configured', () => {
      const tsconfigPath = path.resolve(process.cwd(), 'tsconfig.json');
      const content = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
      expect(content.compilerOptions.baseUrl).toBe('.');
      expect(content.compilerOptions.paths).toBeDefined();
      expect(content.compilerOptions.paths['@/*']).toEqual(['src/*']);
    });

    it('should have declaration enabled', () => {
      const tsconfigPath = path.resolve(process.cwd(), 'tsconfig.json');
      const content = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
      expect(content.compilerOptions.declaration).toBe(true);
    });

    it('should have declarationMap enabled', () => {
      const tsconfigPath = path.resolve(process.cwd(), 'tsconfig.json');
      const content = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
      expect(content.compilerOptions.declarationMap).toBe(true);
    });

    it('should have sourceMap enabled', () => {
      const tsconfigPath = path.resolve(process.cwd(), 'tsconfig.json');
      const content = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
      expect(content.compilerOptions.sourceMap).toBe(true);
    });

    it('should have incremental compilation enabled', () => {
      const tsconfigPath = path.resolve(process.cwd(), 'tsconfig.json');
      const content = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
      expect(content.compilerOptions.incremental).toBe(true);
    });

    it('should include src directory', () => {
      const tsconfigPath = path.resolve(process.cwd(), 'tsconfig.json');
      const content = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
      expect(content.include).toContain('src/**/*');
    });

    it('should exclude node_modules, dist, and coverage', () => {
      const tsconfigPath = path.resolve(process.cwd(), 'tsconfig.json');
      const content = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
      expect(content.exclude).toContain('node_modules');
      expect(content.exclude).toContain('dist');
      expect(content.exclude).toContain('coverage');
    });
  });

  describe('tsconfig.build.json', () => {
    it('should exist in root directory', () => {
      const tsconfigPath = path.resolve(process.cwd(), 'tsconfig.build.json');
      expect(fs.existsSync(tsconfigPath)).toBe(true);
    });

    it('should extend from tsconfig.json', () => {
      const tsconfigPath = path.resolve(process.cwd(), 'tsconfig.build.json');
      const content = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
      expect(content.extends).toBe('./tsconfig.json');
    });

    it('should have noEmit set to false for build', () => {
      const tsconfigPath = path.resolve(process.cwd(), 'tsconfig.build.json');
      const content = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
      expect(content.compilerOptions.noEmit).toBe(false);
    });

    it('should only include src directory', () => {
      const tsconfigPath = path.resolve(process.cwd(), 'tsconfig.build.json');
      const content = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
      expect(content.include).toEqual(['src/**/*']);
    });
  });

  describe('tsconfig.test.json', () => {
    it('should exist in root directory', () => {
      const tsconfigPath = path.resolve(process.cwd(), 'tsconfig.test.json');
      expect(fs.existsSync(tsconfigPath)).toBe(true);
    });

    it('should extend from tsconfig.json', () => {
      const tsconfigPath = path.resolve(process.cwd(), 'tsconfig.test.json');
      const content = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
      expect(content.extends).toBe('./tsconfig.json');
    });

    it('should include vitest types', () => {
      const tsconfigPath = path.resolve(process.cwd(), 'tsconfig.test.json');
      const content = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
      expect(content.compilerOptions.types).toContain('vitest/globals');
      expect(content.compilerOptions.types).toContain('node');
    });

    it('should include src and test directories', () => {
      const tsconfigPath = path.resolve(process.cwd(), 'tsconfig.test.json');
      const content = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
      expect(content.include).toContain('src/**/*');
      expect(content.include).toContain('test/**/*');
    });
  });
});
