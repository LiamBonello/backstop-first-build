import type { RawThreatIntelligenceDto } from "../src/types/purchase";

const WEB_RISK_ENDPOINT = "https://webrisk.googleapis.com/v1/uris:search";
const REQUEST_TIMEOUT_MS = 6_000;

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

export async function inspectThreatIntelligence(
  url: URL,
): Promise<RawThreatIntelligenceDto> {
  const apiKey = process.env.GOOGLE_WEB_RISK_API_KEY?.trim();

  if (!apiKey) {
    return {
      provider: "GOOGLE_WEB_RISK",
      status: "NOT_CONFIGURED",
      threatTypes: [],
      errorLabel: null,
    };
  }

  const requestUrl = new URL(WEB_RISK_ENDPOINT);

  requestUrl.searchParams.set("uri", url.toString());
  requestUrl.searchParams.set("key", apiKey);

  for (const threatType of [
    "MALWARE",
    "SOCIAL_ENGINEERING",
    "UNWANTED_SOFTWARE",
  ]) {
    requestUrl.searchParams.append("threatTypes", threatType);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(requestUrl, {
      signal: controller.signal,
      headers: {
        accept: "application/json",
      },
    });

    if (!response.ok) {
      let providerMessage: string | null = null;

      try {
        const errorPayload = asRecord((await response.json()) as unknown);
        const errorRecord = errorPayload ? asRecord(errorPayload.error) : null;
        const rawMessage = errorRecord?.message;

        if (typeof rawMessage === "string") {
          providerMessage = rawMessage.replace(/\s+/g, " ").trim().slice(0, 260);
        }
      } catch {
        // Some Google errors do not include a JSON response body.
      }

      return {
        provider: "GOOGLE_WEB_RISK",
        status: "UNAVAILABLE",
        threatTypes: [],
        errorLabel: providerMessage
          ? `Web Risk HTTP ${response.status}: ${providerMessage}`
          : `Web Risk returned HTTP ${response.status}`,
      };
    }

    const payload = asRecord((await response.json()) as unknown);
    const threat = payload ? asRecord(payload.threat) : null;

    const threatTypes = Array.isArray(threat?.threatTypes)
      ? threat.threatTypes.filter(
          (value): value is string => typeof value === "string",
        )
      : [];

    return {
      provider: "GOOGLE_WEB_RISK",
      status: threatTypes.length > 0 ? "FLAGGED" : "CLEAR",
      threatTypes,
      errorLabel: null,
    };
  } catch (error) {
    const errorLabel =
      error instanceof Error && error.name === "AbortError"
        ? "Web Risk lookup timed out"
        : "Web Risk lookup failed";

    return {
      provider: "GOOGLE_WEB_RISK",
      status: "UNAVAILABLE",
      threatTypes: [],
      errorLabel,
    };
  } finally {
    clearTimeout(timeout);
  }
}
