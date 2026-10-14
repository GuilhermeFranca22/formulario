import assert from "node:assert/strict";

import { recoverAreaAnswerIfRuleChanged, resetAreaAnswerIfRuleChanged } from "../src/areaRuleChange.js";
import { PROCESS_TYPES } from "../src/constants.js";

const state = { vehicle: { areaRuleClassification: "above_limit" } };
let cleared = 0;
let reloaded = 0;
const clearPending = () => { cleared += 1; };
const reloadRules = () => { reloaded += 1; };

assert.equal(resetAreaAnswerIfRuleChanged(
  { details: { detail: "A regra de area mudou. Confira e responda novamente." } },
  state, clearPending, reloadRules,
), true);
assert.equal(state.vehicle.areaRuleClassification, "");
assert.equal(cleared, 1);
assert.equal(reloaded, 1);
assert.equal(state.vehicleRulesLoaded, false);

state.vehicle.areaRuleClassification = "within_limit";
assert.equal(resetAreaAnswerIfRuleChanged(
  { details: { detail: "Outra falha" } }, state, clearPending, reloadRules,
), false);
assert.equal(state.vehicle.areaRuleClassification, "within_limit");
assert.equal(cleared, 1);
assert.equal(reloaded, 1);

const activeState = {
  processType: PROCESS_TYPES.NEW,
  vehicle: { type: "painel de led", areaRuleClassification: "above_limit" },
  vehicleRules: [{ tipo: "painel de led", limiteAreaM2: 5 }],
  vehicleRulesLoaded: true,
  applicant: { company: "Preservada" },
  files: { requerimentoPadrao: [{ name: "arquivo.pdf" }] },
};
const changed = { details: { detail: "A regra de area mudou ou nao pode ser confirmada. Confira e responda novamente." } };
const recovery = recoverAreaAnswerIfRuleChanged(changed, activeState, clearPending, reloadRules);
assert.equal(recovery.step, "vehicle");
assert.match(recovery.message, /Confirme novamente/);
assert.equal(activeState.vehicle.areaRuleClassification, "");
assert.deepEqual(activeState.vehicleRules, []);
assert.equal(activeState.vehicleRulesLoaded, false);
assert.equal(activeState.applicant.company, "Preservada");
assert.equal(activeState.files.requerimentoPadrao[0].name, "arquivo.pdf");
assert.equal(cleared, 2);
assert.equal(reloaded, 2);

const reloadedState = { processType: "", vehicle: { type: "", areaRuleClassification: "above_limit" } };
assert.equal(recoverAreaAnswerIfRuleChanged(changed, reloadedState, clearPending, reloadRules).step, "intro");
assert.equal(cleared, 3);
assert.equal(recoverAreaAnswerIfRuleChanged({ details: { detail: "Falha de rede" } },
  activeState, clearPending, reloadRules), null);
assert.equal(cleared, 3);
