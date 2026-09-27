export const configurationWizardSteps = Object.freeze([
  { id: "intent", title: "Intent", description: "กำหนดเป้าหมายและชื่อโปรไฟล์", skippable: false },
  { id: "source", title: "Source", description: "เลือก building blocks ของ configuration", skippable: true },
  { id: "dns", title: "DNS / Policy", description: "กำหนด DNS profiles และ policy", skippable: true },
  { id: "target", title: "Target", description: "เลือกปลายทางและ payload", skippable: false },
  { id: "compatibility", title: "Compatibility", description: "ตรวจ capability และข้อจำกัด", skippable: true },
  { id: "review", title: "Review / Export", description: "ตรวจผลลัพธ์และส่งออก", skippable: false },
]);

export function nextStepId(id) {
  const index = configurationWizardSteps.findIndex((step) => step.id === id);
  return index >= 0 && index < configurationWizardSteps.length - 1
    ? configurationWizardSteps[index + 1].id
    : null;
}
