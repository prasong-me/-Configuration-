// Apple DNS schema only. No WireGuard, ProxyPin, or shared-target schema definitions.
export const APPLE_DNS_DECLARATION_TYPE = "com.apple.configuration.network.dns-settings";
const isString = value => typeof value === "string" && value.trim().length > 0;

function requireHttps(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") throw new TypeError("Apple DNS ServerURL must use https:// for DNSProtocol HTTPS.");
    return url.toString();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("Apple DNS ServerURL")) throw error;
    throw new TypeError("Apple DNS ServerURL must be a valid https:// URL.");
  }
}

function validateProtocol(protocol) {
  const value = String(protocol || "").toUpperCase();
  if (value !== "HTTPS" && value !== "TLS") throw new TypeError("Apple DNSProtocol must be HTTPS or TLS.");
  return value;
}

export function compileAppleDnsSettings(commands = []) {
  if (!Array.isArray(commands)) throw new TypeError("Apple DNS commands must be an array.");
  const settings = {};
  for (const command of commands) {
    if (!command || command.target !== "apple") continue;
    switch (command.command) {
      case "DNSProtocol": settings.DNSProtocol = validateProtocol(command.value); break;
      case "ServerURL": settings.ServerURL = requireHttps(command.value); break;
      case "ServerAddresses":
        if (!Array.isArray(command.value)) throw new TypeError("Apple ServerAddresses must be an array.");
        settings.ServerAddresses = command.value.filter(isString); break;
      case "ServerName":
        if (!isString(command.value)) throw new TypeError("Apple ServerName must be a non-empty string.");
        settings.ServerName = command.value.trim(); break;
      case "SupplementalMatchDomains":
        if (!Array.isArray(command.value)) throw new TypeError("Apple SupplementalMatchDomains must be an array.");
        settings.SupplementalMatchDomains = command.value.filter(isString); break;
      case "AllowFailover":
        if (typeof command.value !== "boolean") throw new TypeError("Apple AllowFailover must be boolean.");
        settings.AllowFailover = command.value; break;
      default: throw new TypeError("Unsupported Apple DNS command: " + command.command);
    }
  }
  if (!settings.DNSProtocol) throw new TypeError("Apple DNSProtocol is required.");
  if (settings.DNSProtocol === "HTTPS" && !settings.ServerURL) throw new TypeError("Apple DNSProtocol HTTPS requires ServerURL.");
  if (settings.DNSProtocol === "TLS" && !settings.ServerName) throw new TypeError("Apple DNSProtocol TLS requires ServerName.");
  return Object.freeze(settings);
}

export function compileAppleDnsDeclaration(commands, options = {}) {
  const settings = compileAppleDnsSettings(commands);
  const visibleName = isString(options.visibleName) ? options.visibleName.trim() : "DNS Settings";
  const identifier = isString(options.identifier) ? options.identifier.trim() : crypto.randomUUID();
  const serverToken = isString(options.serverToken) ? options.serverToken.trim() : crypto.randomUUID();
  return { Type: APPLE_DNS_DECLARATION_TYPE, Identifier: identifier, ServerToken: serverToken, Payload: { VisibleName: visibleName, DNSSettings: settings } };
}
