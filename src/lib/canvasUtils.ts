/**
 * Utility functions for safe canvas operations that handle browser extension interference
 */

export interface CanvasRenderOptions {
  scale?: number;
  useCORS?: boolean;
  allowTaint?: boolean;
  foreignObjectRendering?: boolean;
  backgroundColor?: string;
  timeout?: number;
  maxAttempts?: number;
}

export interface BrowserExtensionInfo {
  detected: boolean;
  chromeExtensions: number;
  firefoxExtensions: number;
  edgeExtensions: number;
  details: string[];
}

/**
 * Detects browser extensions that might interfere with canvas operations
 */
export const detectBrowserExtensions = (): BrowserExtensionInfo => {
  const details: string[] = [];

  // Chrome extensions
  let chromeExtensions = 0;
  if (typeof window !== 'undefined') {
    if (window.chrome && window.chrome.runtime && window.chrome.runtime.onMessage) {
      chromeExtensions++;
      details.push('Chrome extension API detected');
    }

    // Count extension scripts
    const extensionScripts = document.querySelectorAll('script[src*="chrome-extension"]');
    chromeExtensions += extensionScripts.length;
    if (extensionScripts.length > 0) {
      details.push(`${extensionScripts.length} Chrome extension scripts detected`);
    }

    // Firefox extensions
    let firefoxExtensions = 0;
    if (window.browser && window.browser.runtime) {
      firefoxExtensions++;
      details.push('Firefox extension API detected');
    }

    // Edge extensions
    let edgeExtensions = 0;
    if (window.chrome && !window.chrome.runtime.onMessage && window.navigator.userAgent.includes('Edg')) {
      edgeExtensions++;
      details.push('Edge browser detected');
    }

    return {
      detected: chromeExtensions + firefoxExtensions + edgeExtensions > 0,
      chromeExtensions,
      firefoxExtensions,
      edgeExtensions,
      details
    };
  }

  return {
    detected: false,
    chromeExtensions: 0,
    firefoxExtensions: 0,
    edgeExtensions: 0,
    details: []
  };
};

/**
 * Safely renders HTML to canvas with retry logic and browser extension handling
 */
export const safeHtml2Canvas = async (
  element: HTMLElement,
  options: CanvasRenderOptions = {}
): Promise<HTMLCanvasElement> => {
  const {
    timeout = 30000,
    maxAttempts = 3,
    ...html2canvasOptions
  } = options;

  // Detect extensions before attempting render
  const extensionInfo = detectBrowserExtensions();
  if (extensionInfo.detected) {
    console.warn('⚠️ Browser extensions detected that may interfere with canvas rendering:', extensionInfo.details);
  }

  const attemptRender = async (attempt: number): Promise<HTMLCanvasElement> => {
    const attemptOptions = {
      ...html2canvasOptions,
      // Adjust options based on attempt number
      scale: attempt === 1 ? (html2canvasOptions.scale || 2) : 1, // Lower quality on retries
      allowTaint: attempt > 1 || html2canvasOptions.allowTaint,
      foreignObjectRendering: attempt > 1 || html2canvasOptions.foreignObjectRendering,
    };

    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Canvas rendering timeout')), timeout);
      });

      // Import html2canvas dynamically to avoid issues
      const html2canvas = (await import('html2canvas')).default;
      const canvasPromise = html2canvas(element, attemptOptions);

      return await Promise.race([canvasPromise, timeoutPromise]);
    } catch (error) {
      if (attempt < maxAttempts) {
        console.warn(`Canvas rendering attempt ${attempt} failed, retrying...`, error);
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        return attemptRender(attempt + 1);
      }
      throw error;
    }
  };

  return attemptRender(1);
};

/**
 * Gets a user-friendly error message based on the error type
 */
export const getCanvasErrorMessage = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return 'Error desconocido al renderizar el canvas.';
  }

  const message = error.message.toLowerCase();

  if (message.includes('message channel') || message.includes('listener') || message.includes('asynchronous response')) {
    return 'Error de comunicación con el navegador. Puede que una extensión esté interfiriendo. Intente deshabilitar extensiones de navegador y recargar la página.';
  }

  if (message.includes('timeout')) {
    return 'El renderizado tardó demasiado tiempo. Intente con un documento más pequeño o recargue la página.';
  }

  if (message.includes('cors') || message.includes('cross-origin')) {
    return 'Error de seguridad del navegador. Algunos recursos externos no se pudieron cargar.';
  }

  if (message.includes('canvas') && message.includes('context')) {
    return 'Error en el contexto del canvas. Su navegador puede no ser compatible con esta función.';
  }

  if (message.includes('memory') || message.includes('out of memory')) {
    return 'Error de memoria. El documento es demasiado grande para renderizar. Intente con un documento más pequeño.';
  }

  return 'Error al renderizar el documento. Por favor, inténtelo de nuevo.';
};

/**
 * Checks if the browser supports the required canvas features
 */
export const checkCanvasSupport = (): {
  canvas2d: boolean;
  webgl: boolean;
  offscreenCanvas: boolean;
  supported: boolean;
} => {
  if (typeof document === 'undefined') {
    return { canvas2d: false, webgl: false, offscreenCanvas: false, supported: false };
  }

  const canvas = document.createElement('canvas');
  const canvas2d = !!canvas.getContext('2d');
  const webgl = !!canvas.getContext('webgl') || !!canvas.getContext('experimental-webgl');
  const offscreenCanvas = typeof OffscreenCanvas !== 'undefined';

  return {
    canvas2d,
    webgl,
    offscreenCanvas,
    supported: canvas2d // At minimum, we need 2D canvas support
  };
};
