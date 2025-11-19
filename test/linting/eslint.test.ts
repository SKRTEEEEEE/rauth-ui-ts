import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

describe('ESLint Configuration', () => {
  it('should have .eslintrc.json file', () => {
    const eslintrcPath = resolve(process.cwd(), '.eslintrc.json');
    expect(existsSync(eslintrcPath)).toBe(true);
  });

  it('should have valid JSON in .eslintrc.json', () => {
    const eslintrcPath = resolve(process.cwd(), '.eslintrc.json');
    const content = readFileSync(eslintrcPath, 'utf-8');
    expect(() => JSON.parse(content)).not.toThrow();
  });

  it('should include TypeScript parser', () => {
    const eslintrcPath = resolve(process.cwd(), '.eslintrc.json');
    const content = JSON.parse(readFileSync(eslintrcPath, 'utf-8'));
    expect(content.parser).toBe('@typescript-eslint/parser');
  });

  it('should include React and TypeScript plugins', () => {
    const eslintrcPath = resolve(process.cwd(), '.eslintrc.json');
    const content = JSON.parse(readFileSync(eslintrcPath, 'utf-8'));
    expect(content.plugins).toContain('react');
    expect(content.plugins).toContain('@typescript-eslint');
  });

  it('should extend recommended configurations', () => {
    const eslintrcPath = resolve(process.cwd(), '.eslintrc.json');
    const content = JSON.parse(readFileSync(eslintrcPath, 'utf-8'));
    const extendsList = Array.isArray(content.extends) ? content.extends : [content.extends];
    
    expect(extendsList.some((ext: string) => ext.includes('eslint:recommended'))).toBe(true);
    expect(extendsList.some((ext: string) => ext.includes('typescript-eslint'))).toBe(true);
    expect(extendsList.some((ext: string) => ext.includes('react'))).toBe(true);
  });

  it('should include React Hooks rules', () => {
    const eslintrcPath = resolve(process.cwd(), '.eslintrc.json');
    const content = JSON.parse(readFileSync(eslintrcPath, 'utf-8'));
    const extendsList = Array.isArray(content.extends) ? content.extends : [content.extends];
    
    expect(extendsList.some((ext: string) => ext.includes('react-hooks'))).toBe(true);
  });

  it('should have prettier as last extend to avoid conflicts', () => {
    const eslintrcPath = resolve(process.cwd(), '.eslintrc.json');
    const content = JSON.parse(readFileSync(eslintrcPath, 'utf-8'));
    const extendsList = Array.isArray(content.extends) ? content.extends : [content.extends];
    
    expect(extendsList[extendsList.length - 1]).toContain('prettier');
  });

  it('should configure no-explicit-any as error', () => {
    const eslintrcPath = resolve(process.cwd(), '.eslintrc.json');
    const content = JSON.parse(readFileSync(eslintrcPath, 'utf-8'));
    
    expect(content.rules['@typescript-eslint/no-explicit-any']).toBe('error');
  });

  it('should have .eslintignore file', () => {
    const eslintignorePath = resolve(process.cwd(), '.eslintignore');
    expect(existsSync(eslintignorePath)).toBe(true);
  });

  it('should ignore dist and node_modules in .eslintignore', () => {
    const eslintignorePath = resolve(process.cwd(), '.eslintignore');
    const content = readFileSync(eslintignorePath, 'utf-8');
    
    expect(content).toContain('dist');
    expect(content).toContain('node_modules');
  });
});
