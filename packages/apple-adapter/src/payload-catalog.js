// Apple configuration-profile capability catalog.
// This catalog separates:
// 1) legacy/manual configuration profiles (.mobileconfig),
// 2) modern declarative management declarations,
// 3) payloads that require MDM, supervision, an app, or an extension.
//
// Source of truth: Apple Device Management documentation.
// Availability is intentionally expressed as metadata instead of being inferred by the compiler.

export const APPLE_PROFILE_STRUCTURE = {
  root: {
    PayloadType: "Configuration",
    required: ["PayloadContent","PayloadIdentifier","PayloadUUID","PayloadVersion"],
    common: ["PayloadDisplayName","PayloadDescription","PayloadOrganization","PayloadRemovalDisallowed","PayloadScope","TargetDeviceType","PayloadExpirationDate"]
  },
  child: {
    required: ["PayloadType","PayloadIdentifier","PayloadUUID","PayloadVersion"],
    common: ["PayloadDisplayName","PayloadDescription","PayloadOrganization"]
  }
};

export const APPLE_IOS_PROFILE_PAYLOADS = [
  {type:"com.apple.wifi.managed",name:"Wi-Fi",category:"network",manual:true,multiple:true},
  {type:"com.apple.dnsSettings.managed",name:"Encrypted DNS",category:"network",manual:true,multiple:true,deprecatedFrom:"iOS 27",replacement:"declarative:com.apple.configuration.network.dns-settings"},
  {type:"com.apple.proxy.http.global",name:"Global HTTP Proxy",category:"network",manual:true,multiple:false,supervision:"required"},
  {type:"com.apple.vpn.managed",name:"VPN",category:"network",manual:true,multiple:true},
  {type:"com.apple.vpn.managed.alwayson",name:"Always On VPN",category:"network",manual:false,multiple:false,supervision:"required"},
  {type:"com.apple.networkusagerules",name:"Network Usage Rules",category:"network",manual:false,multiple:false},
  {type:"com.apple.cellular",name:"Cellular / APN",category:"network",manual:true,multiple:false},
  {type:"com.apple.webClip.managed",name:"Web Clip / Web App",category:"web",manual:true,multiple:true},
  {type:"com.apple.webContentFilter.managed",name:"Web Content Filter",category:"content",manual:false,multiple:false},
  {type:"com.apple.dnsProxy.managed",name:"DNS Proxy",category:"extension",manual:false,multiple:false,requiresExtension:true,deprecatedFrom:"iOS 27",replacement:"declarative:com.apple.configuration.network.dns-proxy"},
  {type:"com.apple.vpn.managed.plugin",name:"VPN Plugin",category:"extension",manual:false,multiple:true,requiresExtension:true},
  {type:"com.apple.networkrelay.managed",name:"Network Relay",category:"network",manual:false,multiple:false},
  {type:"com.apple.security.pkcs12",name:"PKCS#12 Identity",category:"security",manual:true,multiple:true},
  {type:"com.apple.security.root",name:"Root Certificate",category:"security",manual:true,multiple:true},
  {type:"com.apple.security.scep",name:"SCEP",category:"security",manual:true,multiple:true},
  {type:"com.apple.security.acme",name:"ACME",category:"security",manual:true,multiple:true},
  {type:"com.apple.security.certificaterevocation",name:"Certificate Revocation",category:"security",manual:true,multiple:true},
  {type:"com.apple.passcode.managed",name:"Passcode",category:"security",manual:true,multiple:false},
  {type:"com.apple.applicationaccess",name:"Restrictions / Application Access",category:"restrictions",manual:true,multiple:false},
  {type:"com.apple.app.lock",name:"Single App / App Lock",category:"restrictions",manual:false,multiple:false,supervision:"required"},
  {type:"com.apple.applicationsettings",name:"Managed App Settings",category:"apps",manual:false,multiple:true},
  {type:"com.apple.appstore",name:"App Store",category:"apps",manual:true,multiple:false},
  {type:"com.apple.appmanaged",name:"Managed App",category:"apps",manual:false,multiple:true},
  {type:"com.apple.mail.managed",name:"Mail",category:"accounts",manual:true,multiple:true},
  {type:"com.apple.google.account.managed",name:"Google Account",category:"accounts",manual:true,multiple:true},
  {type:"com.apple.ldap.account.managed",name:"LDAP",category:"accounts",manual:true,multiple:true},
  {type:"com.apple.carddav.account",name:"CardDAV",category:"accounts",manual:true,multiple:true},
  {type:"com.apple.caldav.account",name:"CalDAV",category:"accounts",manual:true,multiple:true},
  {type:"com.apple.subscribedcalendar.account",name:"Subscribed Calendar",category:"accounts",manual:true,multiple:true},
  {type:"com.apple.exchange",name:"Exchange",category:"accounts",manual:true,multiple:true},
  {type:"com.apple.sso",name:"Legacy Single Sign-On",category:"identity",manual:true,multiple:false,deprecatedFrom:"iOS 26",replacement:"Extensible Single Sign-On"},
  {type:"com.apple.extensiblesso",name:"Extensible Single Sign-On",category:"identity",manual:true,multiple:true},
  {type:"com.apple.font",name:"Font",category:"system",manual:true,multiple:true},
  {type:"com.apple.security.firewall",name:"Firewall",category:"system",manual:false,multiple:false},
  {type:"com.apple.system.logging",name:"System Logging",category:"diagnostics",manual:false,multiple:false},
  {type:"com.apple.systemextension.policy",name:"System Extension Policy",category:"extension",manual:false,multiple:false},
  {type:"com.apple.syspolicy.kernel-extension-policy",name:"Kernel Extension Policy",category:"extension",manual:false,multiple:false},
  {type:"com.apple.configurationprofile.settings",name:"Configuration Profile Settings",category:"management",manual:false,multiple:false},
  {type:"com.apple.declarations",name:"Declarative Management Container",category:"management",manual:true,multiple:true}
];

export const APPLE_DECLARATIVE_CONFIGURATIONS = [
  "AccessibilitySettings","AccountCalDAV","AccountCardDAV","AccountExchange","AccountGoogle","AccountLDAP","AccountMail","AccountSubscribedCalendar",
  "AppManaged","AppSettings","AudioAccessorySettings","ContentCaching","DiskManagementSettings","ExtensibleSSO","ExternalIntelligenceSettings","IntelligenceSettings",
  "KeyboardSettings","LegacyInteractiveProfile","LegacyProfile","ManagementStatusSubscriptions","ManagementTest","MathSettings","MigrationAssistantSettings",
  "NetworkDNSProxy","NetworkDNSSettings","NetworkRelay","NetworkVPNAlwaysOn","NetworkVPNIKEV2","NetworkVPNIPSec","NetworkVPNVPNPlugin","Package",
  "PasscodeSettings","SafariBookmarks","SafariExtensionSettings","SafariSettings","ScreenSharingConnection","ScreenSharingConnectionGroup","ScreenSharingHostSettings",
  "SecurityCertificate","SecurityIdentity","SecurityPasskeyAttestation","ServicesBackgroundTasks","ServicesConfigurationFiles","SiriSettings",
  "SoftwareUpdateEnforcementSpecific","SoftwareUpdateSettings","WatchEnrollment","WebContentFilterPlugin"
];

export const APPLE_DECLARATIVE_ASSETS = [
  "AssetCredentialACME","AssetCredentialCertificate","AssetCredentialIdentity","AssetCredentialSCEP","AssetCredentialUserNameAndPassword","AssetData","AssetUserIdentity"
];

export const APPLE_DECLARATIVE_CREDENTIALS = [
  "ACMECredential","IdentityCredential","SCEPCredential","UserNameAndPasswordCredential"
];

export const APPLE_DECLARATIVE_MANAGEMENT = [
  "ManagementOrganizationInformation","ManagementProperties","ManagementServerCapabilities"
];

export const APPLE_DEPRECATED_OR_MIGRATING = [
  {type:"com.apple.dnsSettings.managed",replacement:"com.apple.configuration.network.dns-settings",from:"iOS 27"},
  {type:"com.apple.dnsProxy.managed",replacement:"com.apple.configuration.network.dns-proxy",from:"iOS 27"},
  {type:"com.apple.sso",replacement:"Extensible Single Sign-On",from:"iOS 26"}
];

export const APPLE_SIGNING_MODEL = {
  unsignedProfile:true,
  cmsSignedProfile:"application/x-apple-aspen-config",
  note:"Signing is separate from plist generation. Private keys/certificates must never be embedded in the browser bundle or committed to the repository.",
  signingTransport:"CMS/PKCS#7 SignedData",
  signaturePurpose:"authenticity/integrity of the configuration profile; it does not replace payload validation"
};
