import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { ScannerError } from './scannerError';

const blockedHostnames = new Set(['localhost', 'localhost.localdomain']);

const isPrivateIpv4 = (address: string): boolean => {
  const parts = address.split('.').map(Number);

  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return true;
  }

  const [a, b] = parts;

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
};

const isPrivateIpv6 = (address: string): boolean => {
  const normalized = address.toLowerCase();

  if (normalized.startsWith('::ffff:')) {
    return isPrivateIpv4(normalized.slice('::ffff:'.length));
  }

  return (
    normalized === '::' ||
    normalized === '::1' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    /^fe[89ab]/.test(normalized)
  );
};

const isBlockedIp = (address: string): boolean => {
  const family = isIP(address);

  if (family === 4) return isPrivateIpv4(address);
  if (family === 6) return isPrivateIpv6(address);

  return true;
};

export async function assertPublicHttpUrl(
  input: string | URL,
): Promise<URL> {
  let url: URL;

  try {
    url = input instanceof URL ? input : new URL(input);
  } catch {
    throw new ScannerError('That does not look like a valid URL.', 400);
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new ScannerError(
      'Backstop can only inspect public http or https pages.',
      400,
    );
  }

  if (url.username || url.password) {
    throw new ScannerError(
      'URLs containing embedded credentials are not supported.',
      400,
    );
  }

  const hostname = url.hostname.toLowerCase().replace(/\.$/, '');

  if (
    blockedHostnames.has(hostname) ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.localhost')
  ) {
    throw new ScannerError(
      'Private or local network addresses cannot be scanned.',
      400,
    );
  }

  if (isIP(hostname)) {
    if (isBlockedIp(hostname)) {
      throw new ScannerError(
        'Private or reserved network addresses cannot be scanned.',
        400,
      );
    }

    return url;
  }

  let addresses: Array<{ address: string; family: number }>;

  try {
    addresses = await lookup(hostname, {
      all: true,
      verbatim: true,
    });
  } catch {
    throw new ScannerError(
      'Backstop could not resolve that domain.',
      422,
    );
  }

  if (
    !addresses.length ||
    addresses.some(({ address }) => isBlockedIp(address))
  ) {
    throw new ScannerError(
      'That domain does not resolve to a public internet address.',
      400,
    );
  }

  return url;
}