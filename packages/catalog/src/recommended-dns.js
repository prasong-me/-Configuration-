export const recommendedDnsServices=Object.freeze([
  {
    id:"cloudflare-standard",
    provider:"Cloudflare 1.1.1.1",
    free:true,
    description:"Public resolver without content filtering.",
    ipv4:["1.1.1.1","1.0.0.1"],
    ipv6:["2606:4700:4700::1111","2606:4700:4700::1001"],
    doh:"https://cloudflare-dns.com/dns-query",
    dot:"one.one.one.one",
    dotPort:853,
    source:"https://developers.cloudflare.com/1.1.1.1/"
  },
  {
    id:"cloudflare-malware",
    provider:"Cloudflare 1.1.1.1 for Families",
    free:true,
    description:"Resolver with malware and phishing filtering.",
    ipv4:["1.1.1.2","1.0.0.2"],
    ipv6:["2606:4700:4700::1112","2606:4700:4700::1002"],
    doh:"https://security.cloudflare-dns.com/dns-query",
    dot:"security.cloudflare-dns.com",
    dotPort:853,
    source:"https://developers.cloudflare.com/1.1.1.1/ip-addresses/"
  },
  {
    id:"cloudflare-family",
    provider:"Cloudflare 1.1.1.1 for Families",
    free:true,
    description:"Resolver with malware and adult-content filtering.",
    ipv4:["1.1.1.3","1.0.0.3"],
    ipv6:["2606:4700:4700::1113","2606:4700:4700::1003"],
    doh:"https://family.cloudflare-dns.com/dns-query",
    dot:"family.cloudflare-dns.com",
    dotPort:853,
    source:"https://developers.cloudflare.com/1.1.1.1/ip-addresses/"
  },
  {
    id:"quad9-secure",
    provider:"Quad9 Secure",
    free:true,
    description:"Threat-blocking recursive DNS with DNSSEC validation.",
    ipv4:["9.9.9.9","149.112.112.112"],
    ipv6:["2620:fe::fe","2620:fe::9"],
    doh:"https://dns.quad9.net/dns-query",
    dot:"dns.quad9.net",
    dotPort:853,
    source:"https://quad9.net/service/service-addresses-and-features/"
  },
  {
    id:"quad9-no-blocking",
    provider:"Quad9 No Threat Blocking",
    free:true,
    description:"Privacy-focused recursive DNS without threat blocking.",
    ipv4:["9.9.9.10","149.112.112.10"],
    ipv6:["2620:fe::10","2620:fe::fe:10"],
    doh:"https://dns10.quad9.net/dns-query",
    dot:"dns10.quad9.net",
    dotPort:853,
    source:"https://docs.quad9.net/services/"
  },
  {
    id:"quad9-ecs",
    provider:"Quad9 Secure + ECS",
    free:true,
    description:"Threat-blocking resolver with ECS for CDN routing use cases.",
    ipv4:["9.9.9.11","149.112.112.11"],
    ipv6:["2620:fe::11","2620:fe::fe:11"],
    doh:"https://dns11.quad9.net/dns-query",
    dot:"dns11.quad9.net",
    dotPort:853,
    source:"https://docs.quad9.net/services/"
  }
]);

export function getRecommendedDns(id){
  return recommendedDnsServices.find(service=>service.id===id)||null;
}
