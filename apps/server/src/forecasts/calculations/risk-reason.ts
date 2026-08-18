import { RiskLevel } from "@ai-oracle/shared";

import { RISK_COMPONENT_WEIGHTS } from "./risk.js";
import type { ForecastRiskResult } from "./risk.types.js";

export const RISK_REASON_CODES = {
  lowConfidence: "LOW_CONFIDENCE",
  sourceDisagreement: "SOURCE_DISAGREEMENT",
  staleData: "STALE_DATA",
  insufficientSignals: "INSUFFICIENT_SIGNALS",
} as const;

export type RiskReasonCode =
  (typeof RISK_REASON_CODES)[keyof typeof RISK_REASON_CODES];

export interface ForecastRiskReason {
  code: RiskReasonCode;
  message: string;
}

interface WeightedRiskCause {
  code: RiskReasonCode;
  contribution: number;
  message: string;
}

const createRiskCauses = (
  risk: ForecastRiskResult,
): readonly WeightedRiskCause[] => [
  {
    code: RISK_REASON_CODES.lowConfidence,
    contribution:
      risk.components.confidenceDeficit *
      RISK_COMPONENT_WEIGHTS.confidenceDeficit,
    message: "Точность прогноза недостаточно высока.",
  },
  {
    code: RISK_REASON_CODES.sourceDisagreement,
    contribution:
      risk.components.sourceDisagreement *
      RISK_COMPONENT_WEIGHTS.sourceDisagreement,
    message: "Источники данных показывают противоречивые сигналы.",
  },
  {
    code: RISK_REASON_CODES.staleData,
    contribution: risk.components.staleness * RISK_COMPONENT_WEIGHTS.staleness,
    message: "Прогноз основан на устаревших данных.",
  },
  {
    code: RISK_REASON_CODES.insufficientSignals,
    contribution:
      risk.components.dataShortage * RISK_COMPONENT_WEIGHTS.dataShortage,
    message: "Для надёжного прогноза недостаточно данных.",
  },
];

const findPrimaryCause = (
  causes: readonly WeightedRiskCause[],
): WeightedRiskCause => {
  const [firstCause, ...remainingCauses] = causes;

  if (!firstCause) {
    throw new Error("At least one risk cause is required");
  }

  return remainingCauses.reduce(
    (primaryCause, currentCause) =>
      currentCause.contribution > primaryCause.contribution
        ? currentCause
        : primaryCause,
    firstCause,
  );
};

export const createForecastRiskReason = (
  risk: ForecastRiskResult,
): ForecastRiskReason => {
  const primaryCause = findPrimaryCause(createRiskCauses(risk));

  if (risk.level === RiskLevel.Low) {
    return {
      code: primaryCause.code,
      message:
        `Риск низкий. Основной оставшийся источник неопределённости: ` +
        `${primaryCause.message.toLowerCase()}`,
    };
  }

  return {
    code: primaryCause.code,
    message: primaryCause.message,
  };
};
