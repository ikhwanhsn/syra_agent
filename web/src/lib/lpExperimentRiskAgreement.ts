const LP_EXPERIMENT_RISK_AGREEMENT_KEY = "syra.lpExperiment.riskAck.v1";

export function hasAcceptedLpExperimentRisk(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(LP_EXPERIMENT_RISK_AGREEMENT_KEY) === "1";
  } catch {
    return false;
  }
}

export function acceptLpExperimentRisk(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LP_EXPERIMENT_RISK_AGREEMENT_KEY, "1");
  } catch {
    /* private mode */
  }
}
