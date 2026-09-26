export const readyMadeDnsConfigs=Object.freeze([
  {
    id:"adguard-default",
    name:"AdGuard DNS · Default",
    provider:"AdGuard DNS",
    preset:"adguard-default",
    description:"AdGuard public default resolver for blocking ads and trackers.",
    protocol:"HTTPS",
    servers:["94.140.14.14","94.140.15.15"],
    ipv6Servers:["2a10:50c0::ad1:ff","2a10:50c0::ad2:ff"],
    endpoint:"https://dns.adguard-dns.com/dns-query",
    serverName:"dns.adguard-dns.com",
    doh:"https://dns.adguard-dns.com/dns-query",
    dot:"tls://dns.adguard-dns.com",
    role:"security",
    enabled:true,
    order:1,
    source:"https://adguard-dns.io/en/public-dns.html"
  }
]);

export function getReadyMadeDnsConfig(id){
  return readyMadeDnsConfigs.find(config=>config.id===id)||null;
}
