import {
  DnsStageResult,
  normalizeDnsPipeline,
  processDnsQuery,
} from "./dns-pipeline.js";

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeQuery(query) {
  const request = typeof query === "string" ? { name: query } : { ...(query || {}) };
  const name = cleanString(request.name).toLowerCase().replace(/\.$/, "");
  if (!name) {
    throw new TypeError("DNS query name is required.");
  }
  return { ...request, name };
}

function normalizeResolver(resolver, index) {
  if (!resolver || typeof resolver !== "object") return null;
  const id = cleanString(resolver.id) || `resolver-${index + 1}`;
  return {
    ...resolver,
    id,
    enabled: resolver.enabled !== false,
    order: Number.isFinite(resolver.order) ? resolver.order : index + 1,
  };
}

function selectResolvers(resolvers, policy = {}) {
  const source = Array.isArray(resolvers)
    ? resolvers
    : Array.isArray(policy.dnsProfiles)
      ? policy.dnsProfiles
      : [];

  return source
    .map(normalizeResolver)
    .filter(Boolean)
    .filter(resolver => resolver.enabled)
    .sort((a, b) => a.order - b.order);
}

function runResolver(query, resolver, transports) {
  const transport =
    transports?.[resolver.id] ??
    transports?.[resolver.provider] ??
    transports?.[resolver.protocol] ??
    transports?.default;

  if (typeof transport !== "function") {
    return {
      result: DnsStageResult.ERROR,
      reason: "NO_RESOLVER_TRANSPORT",
      resolverId: resolver.id,
    };
  }

  try {
    const raw = transport(query, resolver);
    if (typeof raw === "string") return { result: raw, resolverId: resolver.id };
    return { resolverId: resolver.id, ...raw };
  } catch (error) {
    return {
      result: DnsStageResult.ERROR,
      resolverId: resolver.id,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export class DnsController {
  constructor(options = {}) {
    this.handlers = options.handlers ?? {};
    this.transports = options.transports ?? {};
  }

  inspect(query, pipeline = []) {
    const request = normalizeQuery(query);
    return processDnsQuery(request, pipeline, this.handlers);
  }

  async resolve(query, options = {}) {
    const request = normalizeQuery(query);
    const stages = normalizeDnsPipeline({
      dnsPipeline: options.pipeline ?? options.policy?.dnsPipeline ?? [],
    });

    const trace = [];
    const pipelineResult = processDnsQuery(request, stages, this.handlers);
    trace.push(...pipelineResult.trace);

    if (pipelineResult.result === DnsStageResult.BLOCK ||
        pipelineResult.result === DnsStageResult.RESPOND) {
      return {
        ok: true,
        result: pipelineResult.result,
        response: pipelineResult.response,
        trace,
      };
    }

    if (pipelineResult.result === DnsStageResult.ERROR) {
      return { ok: false, result: DnsStageResult.ERROR, trace };
    }

    const resolvers = selectResolvers(options.resolvers, options.policy);
    if (!resolvers.length) {
      trace.push({ result: DnsStageResult.ERROR, reason: "NO_ENABLED_RESOLVER" });
      return { ok: false, result: DnsStageResult.ERROR, trace };
    }

    for (const resolver of resolvers) {
      const outcome = await Promise.resolve(
        runResolver(request, resolver, this.transports),
      );

      trace.push({
        result: outcome.result,
        resolverId: resolver.id,
        detail: outcome,
      });

      if (outcome.result === DnsStageResult.RESPOND) {
        return { ok: true, result: DnsStageResult.RESPOND, response: outcome.response, trace };
      }

      if (outcome.result === DnsStageResult.FORWARD ||
          outcome.result === DnsStageResult.PASS) {
        return { ok: true, result: DnsStageResult.FORWARD, response: outcome.response, trace };
      }

      if (outcome.result === DnsStageResult.BLOCK) {
        return { ok: true, result: DnsStageResult.BLOCK, response: outcome.response, trace };
      }

      if (outcome.result !== DnsStageResult.ERROR) {
        trace.push({
          result: DnsStageResult.ERROR,
          reason: "INVALID_RESOLVER_RESULT",
          resolverId: resolver.id,
        });
        return { ok: false, result: DnsStageResult.ERROR, trace };
      }
    }

    return {
      ok: false,
      result: DnsStageResult.ERROR,
      reason: "ALL_RESOLVERS_FAILED",
      trace,
    };
  }
}

export function createDnsController(options = {}) {
  return new DnsController(options);
}
