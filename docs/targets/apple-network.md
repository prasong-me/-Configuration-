# Apple Network Configuration Evidence

## Scope

This evidence covers Apple platform networking capabilities relevant to the project. It does not claim that an arbitrary App Store application can consume every Apple configuration type.

## Verified facts

Apple documents encrypted DNS through the declarative configuration type `com.apple.configuration.network.dns-settings`. Local installs are supported for this configuration, subject to Apple's availability rules.

Source: https://developer.apple.com/documentation/devicemanagement/networkdnssettings

Apple documents VPN plugin configuration through `com.apple.configuration.network.vpn.vpn-plugin`, with local enrollment available on supported iOS/iPadOS configurations.

Source: https://developer.apple.com/documentation/devicemanagement/networkvpnvpnplugin

Per-App VPN has additional MDM and app-management requirements; it is not equivalent to simply generating a profile file.

Source: https://developer.apple.com/documentation/networkextension/netunnelprovidermanager

Apple's Network Extension framework is the supported API family for VPN applications.

Source: https://developer.apple.com/videos/play/wwdc2025/234/

## Project rule

These platform capabilities do not automatically become capabilities of a third-party App Store target. The target adapter must have separate evidence showing the target's accepted import/configuration format.

## Status

No Apple target adapter is marked SUPPORTED yet.
