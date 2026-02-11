/**
 * Development Tools - Network Request Monitoring
 *
 * Automatically logs all fetch requests in development mode with:
 * - Request details (method, URL, headers, body)
 * - Response status and timing
 * - Error highlighting
 * - Sanitized auth headers for debugging
 */

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const originalFetch = window.fetch;

  window.fetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
    const [url, options] = args;
    const startTime = performance.now();

    // Parse URL for cleaner logging
    const urlString = typeof url === 'string' ? url : url.toString();
    const method = options?.method || 'GET';

    // Sanitize headers for logging (hide sensitive tokens)
    const sanitizedHeaders = options?.headers ?
      Object.entries(options.headers).reduce((acc, [key, value]) => {
        if (key.toLowerCase() === 'authorization') {
          acc[key] = `Bearer [${String(value).slice(7, 15)}...]`;
        } else {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, string>) : undefined;

    // Log request
    console.log(
      `%c🌐 ${method} %c${urlString}`,
      'color: #60a5fa; font-weight: bold',
      'color: #94a3b8',
      {
        headers: sanitizedHeaders,
        body: options?.body ? (() => {
          try {
            return JSON.parse(options.body as string);
          } catch {
            return options.body;
          }
        })() : undefined,
      }
    );

    try {
      const response = await originalFetch(...args);
      const duration = performance.now() - startTime;

      if (response.ok) {
        console.log(
          `%c✅ ${response.status} %c${urlString} %c(${duration.toFixed(0)}ms)`,
          'color: #22c55e; font-weight: bold',
          'color: #94a3b8',
          'color: #64748b; font-style: italic'
        );
      } else {
        console.error(
          `%c❌ ${response.status} ${response.statusText} %c${urlString} %c(${duration.toFixed(0)}ms)`,
          'color: #ef4444; font-weight: bold',
          'color: #94a3b8',
          'color: #64748b; font-style: italic'
        );

        // Try to log error body
        try {
          const errorBody = await response.clone().json();
          console.error('Error details:', errorBody);
        } catch {
          try {
            const errorText = await response.clone().text();
            console.error('Error details:', errorText);
          } catch {
            // Can't read response body
          }
        }
      }

      return response;
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(
        `%c💥 Network error %c${urlString} %c(${duration.toFixed(0)}ms)`,
        'color: #dc2626; font-weight: bold',
        'color: #94a3b8',
        'color: #64748b; font-style: italic',
        error
      );
      throw error;
    }
  };

  console.log(
    '%c🔧 Dev Tools Loaded',
    'color: #8b5cf6; font-weight: bold; font-size: 12px',
    '- Network monitoring active'
  );
}

// Export empty object to make this a valid ES module
export {};
