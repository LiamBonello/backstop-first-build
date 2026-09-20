import { demoScanResponse } from '../mocks/scan';
import type { RawScanResponseDto } from '../types/purchase';

export interface ScanService {
  analyze(url: string): Promise<RawScanResponseDto>;
}

const wait = (durationMs: number): Promise<void> =>
  new Promise((resolve) => window.setTimeout(resolve, durationMs));

export const demoScanService: ScanService = {
  async analyze(_url: string): Promise<RawScanResponseDto> {
    await wait(2800);
    return demoScanResponse;
  },
};
