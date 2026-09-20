import {
  DEMO_URL,
  demoScanResponse,
} from '../mocks/scan';

import type {
  RawScanResponseDto,
} from '../types/purchase';

export interface ScanService {
  analyze(
    url: string,
  ): Promise<RawScanResponseDto>;
}

export class ScanServiceError
  extends Error {
  constructor(
    message: string,
  ) {
    super(message);

    this.name =
      'ScanServiceError';
  }
}

const wait = (
  durationMs: number,
): Promise<void> =>
  new Promise(
    (resolve) =>
      window.setTimeout(
        resolve,
        durationMs,
      ),
  );

export const demoScanService:
  ScanService = {
  async analyze(
    _url: string,
  ): Promise<RawScanResponseDto> {
    await wait(2800);

    return demoScanResponse;
  },
};

const apiBaseUrl =
  (
    import.meta.env
      .VITE_API_BASE_URL ??
    ''
  ).replace(/\/$/, '');

export const liveScanService:
  ScanService = {
  async analyze(
    url: string,
  ): Promise<RawScanResponseDto> {
    let response: Response;

    try {
      response =
        await fetch(
          `${apiBaseUrl}/api/scan`,
          {
            method: 'POST',

            headers: {
              'content-type':
                'application/json',
            },

            body:
              JSON.stringify({
                url,
              }),
          },
        );
    } catch {
      throw new ScanServiceError(
        'The Backstop scanner API is not reachable. Make sure npm run dev is running both the API and web app.',
      );
    }

    if (!response.ok) {
      const payload =
        (
          await response
            .json()
            .catch(
              () => null,
            )
        ) as {
          error?: unknown;
        } | null;

      const message =
        typeof payload?.error ===
        'string'
          ? payload.error
          : `Backstop could not analyze that page (HTTP ${response.status}).`;

      throw new ScanServiceError(
        message,
      );
    }

    return (
      await response.json()
    ) as RawScanResponseDto;
  },
};

export const scanService:
  ScanService = {
  analyze(
    url: string,
  ): Promise<RawScanResponseDto> {
    return url === DEMO_URL
      ? demoScanService.analyze(
          url,
        )
      : liveScanService.analyze(
          url,
        );
  },
};