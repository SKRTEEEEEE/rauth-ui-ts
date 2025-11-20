/**
 * Type declarations for optional next/headers module
 * 
 * This allows TypeScript compilation without having next as a dependency.
 * In real Next.js apps, the actual types from next will be used.
 */

declare module 'next/headers' {
  export interface ReadonlyRequestCookies {
    get(name: string): { name: string; value: string } | undefined;
    getAll(): Array<{ name: string; value: string }>;
    has(name: string): boolean;
  }

  export function cookies(): Promise<ReadonlyRequestCookies>;
  export function headers(): Promise<Headers>;
}

/**
 * Type declarations for optional next/server module
 * 
 * This allows TypeScript compilation without having next as a dependency.
 * In real Next.js apps, the actual types from next will be used.
 */

declare module 'next/server' {
  export class NextRequest extends Request {
    cookies: {
      get(name: string): { name: string; value: string } | undefined;
      getAll(): Array<{ name: string; value: string }>;
      has(name: string): boolean;
      set(name: string, value: string): void;
      delete(name: string): void;
    };
    nextUrl: {
      pathname: string;
      searchParams: URLSearchParams;
      origin: string;
      href: string;
      search: string;
      hash: string;
    };
  }

  export class NextResponse extends Response {
    static redirect(url: string | URL, init?: number | ResponseInit): NextResponse;
    static rewrite(url: string | URL, init?: ResponseInit): NextResponse;
    static next(init?: ResponseInit): NextResponse;
    static json(data: any, init?: ResponseInit): NextResponse;
    
    cookies: {
      get(name: string): { name: string; value: string } | undefined;
      getAll(): Array<{ name: string; value: string }>;
      has(name: string): boolean;
      set(name: string, value: string, options?: any): void;
      delete(name: string): void;
    };
  }

  export type NextMiddleware = (
    request: NextRequest
  ) => Promise<NextResponse | Response | void> | NextResponse | Response | void;
}
