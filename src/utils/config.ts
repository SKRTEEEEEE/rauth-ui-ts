/**
 * Global configuration management for RAuth SDK
 * 
 * This module handles initialization and validation of SDK configuration,
 * providing a centralized way to access configuration throughout the SDK.
 */

import type { RAuthConfig } from './types';
import { DEFAULT_BASE_URL, DEFAULT_STORAGE_PREFIX, SUPPORTED_PROVIDERS } from './constants';

/**
 * Internal global configuration storage
 * Only accessible through getConfig() function
 */
let globalConfig: RAuthConfig | null = null;

/**
 * Flag to track if initRauth has been called before
 */
let hasBeenInitialized = false;

/**
 * Initialize the RAuth SDK with configuration
 * 
 * This function must be called once at the start of your application,
 * before using any RAuth components or hooks. It validates the configuration
 * and applies sensible defaults where values are not provided.
 * 
 * @param config - Configuration object for the SDK
 * @returns The complete configuration with defaults applied
 * @throws Error if apiKey is missing or empty
 * @throws Error if providers array is empty
 * @throws Error if any provider is not supported
 * 
 * @example
 * ```typescript
 * // Minimal configuration
 * initRauth({
 *   apiKey: 'pk_test_123456',
 *   providers: ['google', 'github']
 * });
 * 
 * // Full configuration
 * initRauth({
 *   apiKey: 'pk_live_123456',
 *   baseUrl: 'https://api.rauth.dev',
 *   providers: ['google', 'github', 'facebook'],
 *   redirectUrl: 'https://myapp.com/auth/callback',
 *   logoutRedirectUrl: 'https://myapp.com',
 *   storage: {
 *     type: 'localStorage',
 *     prefix: 'myapp_'
 *   },
 *   debug: false
 * });
 * ```
 */
export function initRauth(config: RAuthConfig): RAuthConfig {
  // Warn if called multiple times
  if (hasBeenInitialized) {
    console.warn(
      '[RAuth SDK] Warning: initRauth called multiple times. ' +
      'Previous configuration will be overwritten. ' +
      'It is recommended to call initRauth only once at application startup.'
    );
  }

  // Validate apiKey
  if (!config.apiKey || config.apiKey.trim() === '') {
    throw new Error(
      'RAuth SDK Error: apiKey is required. ' +
      'Get your API key from the RAuth dashboard at https://dashboard.rauth.dev'
    );
  }

  // Validate appId
  if (!config.appId || config.appId.trim() === '') {
    throw new Error(
      'RAuth SDK Error: appId is required. ' +
      'Get your Application ID from the RAuth dashboard at https://dashboard.rauth.dev'
    );
  }

  // Validate providers if explicitly set
  if (config.providers !== undefined) {
    if (config.providers.length === 0) {
      throw new Error(
        'RAuth SDK Error: At least one provider must be configured. ' +
        `Supported providers: ${SUPPORTED_PROVIDERS.join(', ')}`
      );
    }

    // Validate each provider
    for (const provider of config.providers) {
      if (!SUPPORTED_PROVIDERS.includes(provider)) {
        throw new Error(
          `RAuth SDK Error: Invalid provider: ${provider}. ` +
          `Supported providers are: ${SUPPORTED_PROVIDERS.join(', ')}`
        );
      }
    }
  }

  // Apply defaults
  const normalizedConfig: RAuthConfig = {
    ...config,
    baseUrl: config.baseUrl || DEFAULT_BASE_URL,
    storage: {
      type: config.storage?.type || 'localStorage',
      prefix: config.storage?.prefix || DEFAULT_STORAGE_PREFIX,
      cookieOptions: config.storage?.cookieOptions,
    },
    debug: config.debug ?? false,
  };

  // Normalize baseUrl - remove trailing slash
  if (normalizedConfig.baseUrl?.endsWith('/')) {
    normalizedConfig.baseUrl = normalizedConfig.baseUrl.slice(0, -1);
  }

  // Validate baseUrl format if custom
  if (config.baseUrl && config.baseUrl !== DEFAULT_BASE_URL) {
    if (!config.baseUrl.startsWith('http://') && !config.baseUrl.startsWith('https://')) {
      throw new Error(
        'RAuth SDK Error: baseUrl must start with http:// or https://'
      );
    }

    // Warn if not using HTTPS
    if (!config.baseUrl.startsWith('https://')) {
      console.warn(
        '[RAuth SDK] Warning: baseUrl should use HTTPS in production for security. ' +
        'HTTP is only recommended for local development.'
      );
    }
  }

  // Store config globally
  globalConfig = normalizedConfig;
  hasBeenInitialized = true;

  // Log config in debug mode (without exposing full apiKey)
  if (normalizedConfig.debug) {
    const safeConfig = {
      ...normalizedConfig,
      apiKey: maskApiKey(normalizedConfig.apiKey),
    };
    console.log('[RAuth SDK] Configuration initialized:', safeConfig);
  }

  return normalizedConfig;
}

/**
 * Get the current SDK configuration
 * 
 * Returns the configuration that was set by initRauth().
 * Throws an error if the SDK has not been initialized.
 * 
 * @returns The current configuration
 * @throws Error if SDK has not been initialized
 * 
 * @example
 * ```typescript
 * const config = getConfig();
 * console.log(config.baseUrl);
 * ```
 */
export function getConfig(): RAuthConfig {
  if (!globalConfig) {
    throw new Error(
      'RAuth SDK Error: SDK not initialized. ' +
      'Please call initRauth() with your configuration before using the SDK. ' +
      'See documentation: https://docs.rauth.dev/getting-started'
    );
  }

  return globalConfig;
}

/**
 * Check if the SDK has been configured
 * 
 * Returns true if initRauth() has been called successfully.
 * Useful for conditional logic or validations.
 * 
 * @returns true if SDK is configured, false otherwise
 * 
 * @example
 * ```typescript
 * if (!isConfigured()) {
 *   console.warn('SDK not initialized yet');
 * }
 * ```
 */
export function isConfigured(): boolean {
  return globalConfig !== null;
}

/**
 * Reset the configuration (mainly for testing)
 * 
 * Clears the global configuration state.
 * This should generally not be used in production code.
 * 
 * @internal
 */
export function resetConfig(): void {
  globalConfig = null;
  hasBeenInitialized = false;
}

/**
 * Mask API key for safe logging
 * Shows first few characters and masks the rest
 * 
 * @param apiKey - The API key to mask
 * @returns Masked API key
 * @internal
 */
function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 10) {
    return apiKey.substring(0, 3) + '***';
  }
  
  const prefix = apiKey.substring(0, apiKey.indexOf('_') + 1);
  const visible = apiKey.substring(prefix.length, prefix.length + 4);
  return prefix + visible + '******';
}
