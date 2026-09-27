import { defineStepper } from "@stepperize/react";
import { configurationWizardSteps } from "./wizard-steps.js";

export const configurationWizard = defineStepper(configurationWizardSteps, {
  linear: true,
  defaultStep: "intent",
});
