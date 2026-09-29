import { CommandKind } from "../../command-model/src/index.js";

const registry=Object.freeze({
  surge:{id:"surge",commands:{
    dns:{kind:CommandKind.DNS,section:"General",key:"dns-server",listSeparator:", "},
    domain:{kind:CommandKind.RULE,operator:"DOMAIN"},
    domainSuffix:{kind:CommandKind.RULE,operator:"DOMAIN-SUFFIX"},
    ipCidr:{kind:CommandKind.RULE,operator:"IP-CIDR"},
    final:{kind:CommandKind.RULE,operator:"FINAL"},
    reject:{kind:CommandKind.RULE,operator:"REJECT"}
  }},
  mihomo:{id:"mihomo",commands:{
    dns:{kind:CommandKind.DNS,path:"dns.nameserver",listShape:"array"},
    domain:{kind:CommandKind.RULE,section:"rules",operator:"DOMAIN"},
    domainSuffix:{kind:CommandKind.RULE,section:"rules",operator:"DOMAIN-SUFFIX"},
    ipCidr:{kind:CommandKind.RULE,section:"rules",operator:"IP-CIDR"},
    final:{kind:CommandKind.RULE,section:"rules",operator:"MATCH"}
  }},
  shadowrocket:{id:"shadowrocket",commands:{
    dns:{kind:CommandKind.DNS,section:"General",key:"dns-server",listSeparator:", "},
    domain:{kind:CommandKind.RULE,operator:"DOMAIN"},
    domainSuffix:{kind:CommandKind.RULE,operator:"DOMAIN-SUFFIX"},
    ipCidr:{kind:CommandKind.RULE,operator:"IP-CIDR"},
    final:{kind:CommandKind.RULE,operator:"FINAL"}
  }},
  loon:{id:"loon",commands:{
    dns:{kind:CommandKind.DNS,section:"General"},
    domain:{kind:CommandKind.RULE,section:"Rule",operator:"DOMAIN"},
    domainSuffix:{kind:CommandKind.RULE,section:"Rule",operator:"DOMAIN-SUFFIX"},
    ipCidr:{kind:CommandKind.RULE,section:"Rule",operator:"IP-CIDR"}
  }},
  stash:{id:"stash",commands:{
    dns:{kind:CommandKind.DNS,path:"dns.nameserver",listShape:"array"},
    domain:{kind:CommandKind.RULE,section:"rules",operator:"DOMAIN"},
    domainSuffix:{kind:CommandKind.RULE,section:"rules",operator:"DOMAIN-SUFFIX"},
    ipCidr:{kind:CommandKind.RULE,section:"rules",operator:"IP-CIDR"}
  }},
  "quantumult-x":{id:"quantumult-x",commands:{
    dns:{kind:CommandKind.DNS,section:"dns"},
    domain:{kind:CommandKind.RULE,section:"filter_local",operator:"host"},
    ipCidr:{kind:CommandKind.RULE,section:"filter_local",operator:"ip-cidr"}
  }},
  "apple-mobileconfig":{id:"apple-mobileconfig",commands:{
    dns:{kind:CommandKind.DNS,payloadType:"com.apple.dnsSettings.managed"},
    webClip:{kind:CommandKind.RULE,payloadType:"com.apple.webClip.managed"},
    vpn:{kind:CommandKind.ROUTE,payloadType:"VPN"}
  }},
  wireguard:{id:"wireguard",commands:{
    dns:{kind:CommandKind.DNS,section:"Interface",key:"DNS",listSeparator:", "},
    ipCidr:{kind:CommandKind.ROUTE,key:"AllowedIPs",listSeparator:", "}
  }}
});

export function getTargetCommandRegistry(targetId){
  const value=registry[targetId];
  return value?structuredClone(value):null;
}

export function listTargetCommandRegistries(){
  return Object.values(registry).map(x=>structuredClone(x));
}

export function hasTargetCommand(targetId,commandId){
  return Boolean(registry[targetId]?.commands?.[commandId]);
}
