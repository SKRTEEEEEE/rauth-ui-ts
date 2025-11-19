import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Package.json Linting Scripts', () => {
  it('should have lint script', () => {
    const packageJsonPath = resolve(process.cwd(), 'package.json');
    const content = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    
    expect(content.scripts.lint).toBeDefined();
    expect(content.scripts.lint).toContain('eslint');
  });

  it('should have lint:fix script', () => {
    const packageJsonPath = resolve(process.cwd(), 'package.json');
    const content = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    
    expect(content.scripts['lint:fix']).toBeDefined();
    expect(content.scripts['lint:fix']).toContain('eslint');
    expect(content.scripts['lint:fix']).toContain('--fix');
  });

  it('should have format script', () => {
    const packageJsonPath = resolve(process.cwd(), 'package.json');
    const content = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    
    expect(content.scripts.format).toBeDefined();
    expect(content.scripts.format).toContain('prettier');
    expect(content.scripts.format).toContain('--write');
  });

  it('should have format:check script', () => {
    const packageJsonPath = resolve(process.cwd(), 'package.json');
    const content = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    
    expect(content.scripts['format:check']).toBeDefined();
    expect(content.scripts['format:check']).toContain('prettier');
    expect(content.scripts['format:check']).toContain('--check');
  });

  it('should have ESLint installed as devDependency', () => {
    const packageJsonPath = resolve(process.cwd(), 'package.json');
    const content = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    
    expect(content.devDependencies.eslint).toBeDefined();
  });

  it('should have Prettier installed as devDependency', () => {
    const packageJsonPath = resolve(process.cwd(), 'package.json');
    const content = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    
    expect(content.devDependencies.prettier).toBeDefined();
  });

  it('should have eslint-config-prettier installed', () => {
    const packageJsonPath = resolve(process.cwd(), 'package.json');
    const content = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    
    expect(content.devDependencies['eslint-config-prettier']).toBeDefined();
  });

  it('should have TypeScript ESLint parser installed', () => {
    const packageJsonPath = resolve(process.cwd(), 'package.json');
    const content = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    
    expect(content.devDependencies['@typescript-eslint/parser']).toBeDefined();
  });

  it('should have TypeScript ESLint plugin installed', () => {
    const packageJsonPath = resolve(process.cwd(), 'package.json');
    const content = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    
    expect(content.devDependencies['@typescript-eslint/eslint-plugin']).toBeDefined();
  });

  it('should have React ESLint plugin installed', () => {
    const packageJsonPath = resolve(process.cwd(), 'package.json');
    const content = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    
    expect(content.devDependencies['eslint-plugin-react']).toBeDefined();
  });

  it('should have React Hooks ESLint plugin installed', () => {
    const packageJsonPath = resolve(process.cwd(), 'package.json');
    const content = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    
    expect(content.devDependencies['eslint-plugin-react-hooks']).toBeDefined();
  });
});
