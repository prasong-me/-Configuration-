export const freeVpnPresets = Object.freeze([
  {
    id: "vpngate-l2tp-japan",
    provider: "VPN Gate Public Relay",
    protocol: "L2TP",
    free: true,
    volatile: true,
    server: "219.100.37.123",
    username: "vpn",
    password: "vpn",
    sharedSecret: "vpn",
    description: "Free public L2TP/IPsec relay for test use. Server availability changes.",
    source: "https://www.vpngate.net/en/"
  }
]);

export const freeProxyPresets = Object.freeze([
  {
    id: "proxmint-https-test",
    provider: "Proxmint checked public proxy",
    protocol: "HTTPS",
    free: true,
    volatile: true,
    server: "103.237.102.191:11111",
    description: "Public proxy reported as live by the source. Do not send credentials or sensitive traffic through public proxies.",
    source: "https://github.com/proxmint/free-proxy-list"
  }
]);

export const blocklistPresets = Object.freeze([
  {
    id: "oisd-small",
    provider: "OISD Small",
    format: "domains",
    free: true,
    source: "https://small.oisd.nl/domainswild2",
    description: "Ads-focused domain blocklist."
  },
  {
    id: "oisd-big",
    provider: "OISD Big",
    format: "domains",
    free: true,
    source: "https://big.oisd.nl/domainswild2",
    description: "Ads, phishing, malvertising, malware, spyware, ransomware, cryptojacking and tracking."
  },
  {
    id: "hagezi-pro",
    provider: "HaGeZi Pro",
    format: "adblock",
    free: true,
    source: "https://raw.githubusercontent.com/hagezi/dns-blocklists/main/adblock/pro.txt",
    description: "Balanced ad, tracker and unwanted-domain blocking."
  },
  {
    id: "hagezi-tif",
    provider: "HaGeZi Threat Intelligence Feeds",
    format: "adblock",
    free: true,
    source: "https://raw.githubusercontent.com/hagezi/dns-blocklists/main/adblock/tif.txt",
    description: "Threat-focused malware and phishing domains."
  }
]);
