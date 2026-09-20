export class ScannerError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 422,
  ) {
    super(message);
    this.name = 'ScannerError';
  }
}