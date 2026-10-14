import { PROCESS_TYPES } from "./constants.js";

export function resetAreaAnswerIfRuleChanged(error, state, clearPending, reloadRules) {
  const detail = error?.details?.detail;
  if (typeof detail !== "string" || !/(?:limite|regra) de area mudou/i.test(detail)) return false;
  clearPending();
  state.vehicle.areaRuleClassification = "";
  state.vehicleRules = [];
  state.vehicleRulesLoaded = false;
  reloadRules();
  return true;
}

export function recoverAreaAnswerIfRuleChanged(error, state, clearPending, reloadRules) {
  if (!resetAreaAnswerIfRuleChanged(error, state, clearPending, reloadRules)) return null;
  const canContinue = state.processType === PROCESS_TYPES.NEW && Boolean(state.vehicle.type);
  return canContinue
    ? { step: "vehicle", message: "A regra de área foi atualizada. Confirme novamente a resposta de área antes de enviar." }
    : { step: "intro", message: "A regra de área foi atualizada. Este envio pendente não pode ser concluído; inicie uma nova solicitação e confirme a resposta de área." };
}
