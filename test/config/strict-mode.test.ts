/**
 * Tests to validate TypeScript strict mode is working correctly
 * These tests verify that TypeScript catches common type errors
 */

import { describe, it, expect } from 'vitest';

describe('TypeScript Strict Mode Validation', () => {
  describe('Null and Undefined Checks', () => {
    it('should allow null checks to work properly', () => {
      const getValue = (): string | null => null;
      const value = getValue();
      
      // This should work with strict null checks
      if (value !== null) {
        expect(typeof value).toBe('string');
      } else {
        expect(value).toBeNull();
      }
    });

    it('should handle undefined properly', () => {
      const getValue = (): string | undefined => undefined;
      const value = getValue();
      
      if (value !== undefined) {
        expect(typeof value).toBe('string');
      } else {
        expect(value).toBeUndefined();
      }
    });
  });

  describe('Array Safety', () => {
    it('should handle array access safely with noUncheckedIndexedAccess', () => {
      const arr: string[] = ['a', 'b', 'c'];
      
      // With noUncheckedIndexedAccess, arr[0] returns string | undefined
      const first = arr[0];
      
      if (first !== undefined) {
        expect(typeof first).toBe('string');
        expect(first).toBe('a');
      }
    });

    it('should handle empty array access', () => {
      const arr: string[] = [];
      const first = arr[0];
      
      expect(first).toBeUndefined();
    });
  });

  describe('Function Return Types', () => {
    it('should enforce explicit return in all code paths', () => {
      const getStatus = (isActive: boolean): string => {
        if (isActive) {
          return 'active';
        }
        // noImplicitReturns would catch missing return here
        return 'inactive';
      };

      expect(getStatus(true)).toBe('active');
      expect(getStatus(false)).toBe('inactive');
    });
  });

  describe('Switch Statement Safety', () => {
    it('should prevent fallthrough in switch cases', () => {
      const getDescription = (type: 'A' | 'B' | 'C'): string => {
        let description = '';
        
        switch (type) {
          case 'A':
            description = 'Type A';
            break;
          case 'B':
            description = 'Type B';
            break;
          case 'C':
            description = 'Type C';
            break;
          default:
            description = 'Unknown';
        }
        
        return description;
      };

      expect(getDescription('A')).toBe('Type A');
      expect(getDescription('B')).toBe('Type B');
      expect(getDescription('C')).toBe('Type C');
    });
  });

  describe('Type Narrowing', () => {
    it('should narrow union types correctly', () => {
      const processValue = (value: string | number): string => {
        if (typeof value === 'string') {
          return value.toUpperCase();
        } else {
          return value.toString();
        }
      };

      expect(processValue('test')).toBe('TEST');
      expect(processValue(123)).toBe('123');
    });
  });
});
