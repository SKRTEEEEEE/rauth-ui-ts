import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

describe('Prettier Configuration', () => {
  it('should have .prettierrc file', () => {
    const prettierrcPath = resolve(process.cwd(), '.prettierrc');
    expect(existsSync(prettierrcPath)).toBe(true);
  });

  it('should have valid JSON in .prettierrc', () => {
    const prettierrcPath = resolve(process.cwd(), '.prettierrc');
    const content = readFileSync(prettierrcPath, 'utf-8');
    expect(() => JSON.parse(content)).not.toThrow();
  });

  it('should configure single quotes', () => {
    const prettierrcPath = resolve(process.cwd(), '.prettierrc');
    const content = JSON.parse(readFileSync(prettierrcPath, 'utf-8'));
    expect(content.singleQuote).toBe(true);
  });

  it('should configure semicolons', () => {
    const prettierrcPath = resolve(process.cwd(), '.prettierrc');
    const content = JSON.parse(readFileSync(prettierrcPath, 'utf-8'));
    expect(content.semi).toBe(true);
  });

  it('should configure print width to 100', () => {
    const prettierrcPath = resolve(process.cwd(), '.prettierrc');
    const content = JSON.parse(readFileSync(prettierrcPath, 'utf-8'));
    expect(content.printWidth).toBe(100);
  });

  it('should configure tab width to 2', () => {
    const prettierrcPath = resolve(process.cwd(), '.prettierrc');
    const content = JSON.parse(readFileSync(prettierrcPath, 'utf-8'));
    expect(content.tabWidth).toBe(2);
  });

  it('should configure trailing comma to es5', () => {
    const prettierrcPath = resolve(process.cwd(), '.prettierrc');
    const content = JSON.parse(readFileSync(prettierrcPath, 'utf-8'));
    expect(content.trailingComma).toBe('es5');
  });

  it('should have .prettierignore file', () => {
    const prettierignorePath = resolve(process.cwd(), '.prettierignore');
    expect(existsSync(prettierignorePath)).toBe(true);
  });

  it('should ignore dist and node_modules in .prettierignore', () => {
    const prettierignorePath = resolve(process.cwd(), '.prettierignore');
    const content = readFileSync(prettierignorePath, 'utf-8');
    
    expect(content).toContain('dist');
    expect(content).toContain('node_modules');
  });
});
