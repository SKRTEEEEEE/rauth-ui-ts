/**
 * Mock for next/server module
 * 
 * This mock is used in tests to simulate Next.js middleware context.
 * In real Next.js apps, this module is provided by the framework.
 */

/**
 * Mock NextRequest class
 */
export class NextRequest extends Request {
  cookies = {
    getAll: () => [],
    get: () => undefined,
    has: () => false,
    set: () => {},
    delete: () => {}
  };
  
  nextUrl = {
    pathname: '/',
    searchParams: new URLSearchParams(),
    origin: 'http://localhost:3000',
    href: 'http://localhost:3000/',
    search: '',
    hash: ''
  };
}

/**
 * Mock NextResponse class
 */
export class NextResponse extends Response {
  static redirect(url: string | URL, init?: number | ResponseInit): NextResponse {
    const response = new NextResponse(null, {
      status: typeof init === 'number' ? init : init?.status || 307,
      headers: typeof init === 'object' && 'headers' in init ? init.headers : undefined
    });
    Object.defineProperty(response, 'redirected', { value: true });
    Object.defineProperty(response, 'url', { value: url.toString() });
    return response;
  }

  static rewrite(url: string | URL, init?: ResponseInit): NextResponse {
    return new NextResponse(null, init);
  }

  static next(init?: ResponseInit): NextResponse {
    return new NextResponse(null, init);
  }

  static json(data: any, init?: ResponseInit): NextResponse {
    return new NextResponse(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {})
      }
    });
  }

  cookies = {
    getAll: () => [],
    get: () => undefined,
    has: () => false,
    set: () => {},
    delete: () => {}
  };
}

export type NextMiddleware = (
  request: NextRequest
) => Promise<NextResponse | Response | void> | NextResponse | Response | void;
