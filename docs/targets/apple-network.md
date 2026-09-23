# Apple Network Configuration Evidence

## Scope

This evidence covers Apple platform networking capabilities relevant to the project. It does not claim that an arbitrary App Store application can consume every Apple configuration type.

## Verified facts

Apple documents encrypted DNS through the declarative configuration type `com.apple.configuration.network.dns-settings`. Local installs are supported for this configuration, subject to the availability rules documented by Apple. citeturn0search9

Apple documents VPN plugin configuration through `com.apple.configuration.network.vpn.vpn-plugin`, with local enrollment available on iOS/iPadOS for supported configurations. citeturn0search11

Per-App VPN has additional MDM and app-management requirements; it is not equivalent to simply generating a profile file. citeturn0search3

Apple's Network Extension framework is the supported API family for VPN applications. citeturn0search13

## Project rule

These platform capabilities do not automatically become capabilities of a third-party App Store target. The target adapter must have separate evidence showing the target's accepted import/configuration format.

## Status

No Apple target adapter is marked SUPPORTED yet.
