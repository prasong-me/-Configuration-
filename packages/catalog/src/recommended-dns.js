export const recommendedDnsServices=Object.freeze([
  {
    id:"google-public-dns",
    provider:"Google Public DNS",
    free:true,
    description:"Free global resolver without intentional content filtering.",
    ipv4:["8.8.8.8","8.8.4.4"],
    ipv6:["2001:4860:4860::8888","2001:4860:4860::8844"],
    doh:"https://dns.google/dns-query",
    dot:"dns.google",
    dotPort:853,
    source:"https://developers.google.com/speed/public-dns"
  },
  {
    id:"adguard-default",
    provider:"AdGuard DNS Default",
    free:true,
    description:"Blocks ads and trackers.",
    ipv4:["94.140.14.14","94.140.15.15"],
    ipv6:["2a10:50c0::ad1:ff","2a10:50c0::ad2:ff"],
    source:"https://adguard-dns.io/en/public-dns.html"
  },
  {
    id:"adguard-nonfiltering",
    provider:"AdGuard DNS Non-filtering",
    free:true,
    description:"Public resolver without AdGuard content filtering.",
    ipv4:["94.140.14.140","94.140.14.141"],
    ipv6:["2a10:50c0::1:ff","2a10:50c0::2:ff"],
    source:"https://adguard-dns.io/en/public-dns.html"
  },
  {
    id:"adguard-family",
    provider:"AdGuard DNS Family",
    free:true,
    description:"Blocks ads, trackers and adult content with Safe Search where supported.",
    ipv4:["94.140.14.15","94.140.15.16"],
    ipv6:["2a10:50c0::bad1:ff","2a10:50c0::bad2:ff"],
    source:"https://adguard-dns.io/en/public-dns.html"
  },
  {
    id:"controld-free",
    provider:"Control D Free DNS",
    free:true,
    description:"Free public resolver profiles with optional malware, ads and social filtering.",
    ipv4:["76.76.2.0"],
    doh:"https://freedns.controld.com/p0",
    dot:"p0.freedns.controld.com",
    dotPort:853,
    source:"https://controld.com/free-dns"
  },
  {
    id:"controld-malware",
    provider:"Control D Free Malware",
    free:true,
    description:"Free profile for malware blocking.",
    ipv4:["76.76.2.1"],
    doh:"https://freedns.controld.com/p1",
    dot:"p1.freedns.controld.com",
    dotPort:853,
    source:"https://controld.com/free-dns"
  },
  {
    id:"dns-sb",
    provider:"DNS.SB",
    free:true,
    description:"Free public DNS with DNSSEC and encrypted DNS.",
    ipv4:["185.222.222.222","45.11.45.11"],
    ipv6:["2a09::","2a11::"],
    doh:"https://doh.dns.sb/dns-query",
    dot:"dot.sb",
    dotPort:853,
    source:"https://adguard-dns.io/kb/general/dns-providers/"
  },
  {
    id:"libredns",
    provider:"LibreDNS",
    free:true,
    description:"Free public encrypted DNS operated by LibreOps.",
    ipv4:["88.198.92.222"],
    doh:"https://doh.libredns.gr/dns-query",
    dot:"dot.libredns.gr",
    dotPort:853,
    source:"https://libredns.gr/"
  },
  {
    id:"bebasdns",
    provider:"BebasDNS",
    free:true,
    description:"Free neutral Indonesian public resolver with filtered and unfiltered endpoints.",
    doh:"https://dns.bebasid.com/dns-query",
    dot:"dns.bebasid.com",
    dotPort:853,
    source:"https://github.com/AdguardTeam/KnowledgeBaseDNS"
  },
  {
    id:"hurricane-electric",
    provider:"Hurricane Electric Public Recursor",
    free:true,
    description:"Free anycast public recursive DNS resolver.",
    ipv4:["74.82.42.42"],
    ipv6:["2001:470:20::2"],
    doh:"https://ordns.he.net/dns-query",
    dot:"ordns.he.net",
    dotPort:853,
    source:"https://adguard-dns.io/kb/general/dns-providers/"
  },
  {
    id:"open-name-server",
    provider:"OpenNameServer",
    free:true,
    description:"Independent free public resolver with DNSSEC, DoH and DoT.",
    ipv4:["217.160.70.42","213.202.211.221","81.169.136.222","185.181.61.24"],
    ipv6:["2a01:239:2fd:b700::1","2001:4ba0:cafe:3d2::1","2a01:238:4231:5200::1","2a03:94e0:1804::1"],
    doh:"https://ns.opennameserver.org/dns-query",
    dot:"ns.opennameserver.org",
    dotPort:853,
    source:"https://opennameserver.org/"
  },
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


export const freeProxyPresets=Object.freeze([
  {id:"none",provider:"No Proxy",free:true,description:"ไม่กำหนด proxy"},
  {id:"custom",provider:"Custom",free:false,description:"กรอกชนิด proxy และ host:port เอง"}
]);

export const freeBlocklistPresets=Object.freeze([
  {id:"oisd-small",provider:"OISD Small",free:true,description:"ads และ trackers"},
  {id:"hagezi-pro",provider:"HaGeZi Pro",free:true,description:"ads, trackers และ unwanted domains"},
  {id:"hagezi-tif",provider:"HaGeZi Threat Intelligence",free:true,description:"threat และ malware domains"},
  {id:"custom",provider:"Custom domains",free:false,description:"กรอกโดเมนเอง"}
]);

export const routingPresets=Object.freeze([
  {id:"direct",name:"Direct",action:"DIRECT"},
  {id:"proxy",name:"Proxy",action:"PROXY"},
  {id:"reject",name:"Reject / Block",action:"REJECT"},
  {id:"dns",name:"DNS",action:"DNS"},
  {id:"custom",name:"Custom",action:""}
]);
