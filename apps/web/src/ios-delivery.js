/**
 * iOS delivery mechanisms.
 *
 * This module deliberately contains only mechanisms that do not require
 * an unverified third-party application URL scheme.
 *
 * Application-specific URL schemes must be added only after authoritative
 * evidence confirms the scheme, payload contract, and import behavior.
 */

export const iosDeliveryMethods = Object.freeze([
  {
    id: "ios-share-sheet",
    label: "iOS Share Sheet",
    kind: "system",
    status: "SUPPORTED",
    description: "ส่งไฟล์ configuration ไปยัง application ที่ผู้ใช้เลือกผ่านระบบ Share",
    requires: ["Web Share API with file support"],
    fallback: "download",
  },
  {
    id: "ios-download",
    label: "Download / Files",
    kind: "system",
    status: "SUPPORTED",
    description: "ดาวน์โหลด artifact ให้ผู้ใช้เปิดหรือส่งต่อผ่าน Files / Share",
    requires: ["browser download"],
    fallback: null,
  },
  {
    id: "ios-webclip-mobileconfig",
    label: "Web Clip MobileConfig",
    kind: "apple-profile",
    status: "SUPPORTED",
    description: "สร้าง Apple configuration profile สำหรับติดตั้ง Web Clip",
    requires: ["Apple MobileConfig"],
    fallback: "download",
  },
]);

export function getIosDeliveryMethod(id) {
  return iosDeliveryMethods.find((method) => method.id === id) || null;
}

export function getIosDeliveryStatus() {
  return iosDeliveryMethods.map(({ id, label, status, kind }) => ({
    id,
    label,
    status,
    kind,
  }));
}

/**
 * Third-party application schemes are intentionally not listed here.
 * They require app-specific authoritative evidence before implementation.
 */
export const iosThirdPartyDelivery = Object.freeze({
  status: "UNKNOWN",
  reason: "No authoritative app-specific URL-scheme/import contract is currently pinned in the project evidence registry.",
});
