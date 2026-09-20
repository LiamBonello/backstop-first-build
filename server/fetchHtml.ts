import { ScannerError } from './scannerError';
import { assertPublicHttpUrl } from './urlSafety';

const MAX_HTML_BYTES = 1_500_000;
const MAX_REDIRECTS = 4;
const REQUEST_TIMEOUT_MS = 9_000;

export interface FetchedHtml {
  html: string;
  finalUrl: URL;
}

async function readLimitedBody(response: Response): Promise<string> {
  if (!response.body) return '';

  const contentLength = Number(
    response.headers.get('content-length') ?? 0,
  );

  if (contentLength > MAX_HTML_BYTES) {
    throw new ScannerError(
      'That page is too large for the current scanner.',
      422,
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let received = 0;
  let output = '';

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    received += value.byteLength;

    if (received > MAX_HTML_BYTES) {
      await reader.cancel();

      throw new ScannerError(
        'That page is too large for the current scanner.',
        422,
      );
    }

    output += decoder.decode(value, {
      stream: true,
    });
  }

  output += decoder.decode();

  return output;
}

export async function fetchHtml(
  input: string | URL,
): Promise<FetchedHtml> {
  let currentUrl = await assertPublicHttpUrl(input);

  for (
    let redirectCount = 0;
    redirectCount <= MAX_REDIRECTS;
    redirectCount += 1
  ) {
    const controller = new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),
      REQUEST_TIMEOUT_MS,
    );

    let response: Response;

    try {
      response = await fetch(currentUrl, {
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'user-agent':
            'BackstopBot/0.2 (+https://backstop.local; purchase-intelligence prototype)',
          accept:
            'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
          'accept-language': 'en-GB,en;q=0.8',
        },
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === 'AbortError'
      ) {
        throw new ScannerError(
          'The site took too long to respond.',
          504,
        );
      }

      throw new ScannerError(
        'Backstop could not reach that page.',
        422,
      );
    } finally {
      clearTimeout(timeout);
    }

    if (
      response.status >= 300 &&
      response.status < 400
    ) {
      const location = response.headers.get('location');

      if (!location) {
        throw new ScannerError(
          'The site returned an incomplete redirect.',
          422,
        );
      }

      currentUrl = await assertPublicHttpUrl(
        new URL(location, currentUrl),
      );

      continue;
    }

    if (!response.ok) {
      throw new ScannerError(
        `The site returned HTTP ${response.status}. Backstop could not inspect the page.`,
        422,
      );
    }

    const contentType =
      response.headers
        .get('content-type')
        ?.toLowerCase() ?? '';

    if (
      !contentType.includes('text/html') &&
      !contentType.includes('application/xhtml+xml')
    ) {
      throw new ScannerError(
        'That URL does not appear to be an HTML shopping page.',
        422,
      );
    }

    return {
      html: await readLimitedBody(response),
      finalUrl: currentUrl,
    };
  }

  throw new ScannerError(
    'The page redirected too many times.',
    422,
  );
}