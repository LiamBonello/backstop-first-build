import { Buffer } from "node:buffer";
import { chromium } from "playwright-chromium";
import type { FetchedHtml } from "./fetchHtml";
import { assertPublicHttpUrl } from "./urlSafety";

const BROWSER_NAVIGATION_TIMEOUT_MS = 12_000;
const BROWSER_SETTLE_MS = 1_250;
const MAX_RENDERED_HTML_BYTES = 10_000_000;
const MAX_UNIQUE_NETWORK_HOSTS = 24;

const skippableResourceTypes = new Set(["image", "media", "font"]);
const locallyHandledProtocols = new Set(["about:", "blob:", "data:"]);

export type BrowserFallbackMode = "disabled" | "conditional" | "force";

export const getBrowserFallbackMode = (): BrowserFallbackMode => {
  const configured = process.env.BACKSTOP_BROWSER_FALLBACK?.trim().toLowerCase();

  if (configured === "0" || configured === "off" || configured === "false") {
    return "disabled";
  }

  if (configured === "force") {
    return "force";
  }

  return "conditional";
};

export async function fetchRenderedHtml(
  input: URL,
): Promise<FetchedHtml | null> {
  if (getBrowserFallbackMode() === "disabled") {
    return null;
  }

  const safeInitialUrl = await assertPublicHttpUrl(input);
  const hostChecks = new Map<string, Promise<boolean>>();

  const isAllowedNetworkUrl = async (rawUrl: string): Promise<boolean> => {
    let url: URL;

    try {
      url = new URL(rawUrl);
    } catch {
      return false;
    }

    if (locallyHandledProtocols.has(url.protocol)) {
      return true;
    }

    if (
      (url.protocol !== "http:" && url.protocol !== "https:") ||
      url.username ||
      url.password
    ) {
      return false;
    }

    const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
    const cached = hostChecks.get(hostname);

    if (cached) {
      return cached;
    }

    if (hostChecks.size >= MAX_UNIQUE_NETWORK_HOSTS) {
      return false;
    }

    const check = assertPublicHttpUrl(url)
      .then(() => true)
      .catch(() => false);

    hostChecks.set(hostname, check);
    return check;
  };

  let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;

  try {
    browser = await chromium.launch({ headless: true });

    const context = await browser.newContext({
      locale: "en-GB",
      serviceWorkers: "block",
    });

    await context.routeWebSocket("**/*", (webSocket) => {
      webSocket.close({
        code: 1000,
        reason: "Backstop browser scan does not require WebSockets",
      });
    });

    await context.route("**/*", async (route) => {
      const request = route.request();

      if (skippableResourceTypes.has(request.resourceType())) {
        await route.abort("blockedbyclient");
        return;
      }

      if (!(await isAllowedNetworkUrl(request.url()))) {
        await route.abort("blockedbyclient");
        return;
      }

      await route.continue();
    });

    const page = await context.newPage();

    page.setDefaultTimeout(BROWSER_NAVIGATION_TIMEOUT_MS);
    page.setDefaultNavigationTimeout(BROWSER_NAVIGATION_TIMEOUT_MS);

    await page.goto(safeInitialUrl.toString(), {
      waitUntil: "domcontentloaded",
      timeout: BROWSER_NAVIGATION_TIMEOUT_MS,
    });

    await page.waitForTimeout(BROWSER_SETTLE_MS);

    const finalUrl = await assertPublicHttpUrl(page.url());
    const html = await page.content();

    if (Buffer.byteLength(html, "utf8") > MAX_RENDERED_HTML_BYTES) {
      return null;
    }

    return { html, finalUrl };
  } catch (error) {
    console.warn(
      "Backstop browser fallback was unavailable for this scan:",
      error instanceof Error ? error.message : error,
    );
    return null;
  } finally {
    await browser?.close();
  }
}
