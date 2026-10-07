import { FACE_OPTIONS, PROCESS_TYPES, VEHICLE_TYPES } from "../src/constants.js";
import { buildNewProcessPayload, buildRequirementResponsePayload } from "../src/payloads.js";
import { createInitialState } from "../src/state.js";
import { locationMapUrls } from "../src/location.js";
import { renderLocationStep, renderVehicleStep } from "../src/steps.js";
import { validateAll } from "../src/validation.js";

const pdf = { name: "documento.pdf", size: 1024, type: "application/pdf" };

const newProcess = createInitialState();
newProcess.email = "usuario@example.com";
newProcess.processType = PROCESS_TYPES.NEW;
newProcess.startedAt = new Date(Date.now() - 60_000).toISOString();
newProcess.applicant.company = "Empresa Exemplo";
newProcess.applicant.cnpj = "11222333000181";
newProcess.applicant.municipalRegistration = "123456";
newProcess.location.realEstateRegistration = "12345678901";
newProcess.location.latitude = "-20.457833";
newProcess.location.longitude = "-54.606528";
newProcess.location.mapVisible = true;
newProcess.location.confirmed = true;
newProcess.location.street = "Avenida Afonso Pena";
newProcess.location.number = "1000";
newProcess.location.district = "Centro";
newProcess.location.postalCode = "79002-000";
newProcess.vehicle.type = "outdoor";
newProcess.vehicle.faces = "Uma";
newProcess.vehicleRules = VEHICLE_TYPES.map(({ value }) => ({
  tipo: value, limiteAreaM2: value === "painel de led" ? 5 : null,
}));
newProcess.vehicleRulesLoaded = true;
newProcess.files.alvaraLocalizacao = [pdf];
newProcess.files.requerimentoPadrao = [pdf];
newProcess.files.autorizacaoProprietario = [pdf];
newProcess.files.projetoEstrutural = [pdf];
newProcess.files.projetoImplantacao = [pdf];
newProcess.files.artRrt = [pdf];
newProcess.acknowledgement = true;

const newProcessErrors = validateAll(newProcess);
const unconfirmedProcess = structuredClone(newProcess);
unconfirmedProcess.location.confirmed = false;
if (!validateAll(unconfirmedProcess)["location.confirmed"]) {
  throw new Error("O ponto precisa ser conferido no mapa antes do envio.");
}

const municipalEdgeProcess = structuredClone(newProcess);
municipalEdgeProcess.location.latitude = "-20.7408";
municipalEdgeProcess.location.longitude = "-54.8163";
if (Object.keys(validateAll(municipalEdgeProcess)).length > 0) {
  throw new Error("Um ponto válido do município não pode ser bloqueado pelo formulário.");
}

const invalidCoordinatesProcess = structuredClone(newProcess);
invalidCoordinatesProcess.location.latitude = "Infinity";
invalidCoordinatesProcess.location.longitude = "abc";
const coordinateErrors = validateAll(invalidCoordinatesProcess);
if (!coordinateErrors["location.latitude"] || !coordinateErrors["location.longitude"]) {
  throw new Error("Coordenadas inválidas precisam ser recusadas.");
}

const mapUrls = locationMapUrls(newProcess.location);
if (!mapUrls?.page.includes("mlat=-20.457833&mlon=-54.606528") ||
    !mapUrls.embed.includes("marker=-20.457833%2C-54.606528")) {
  throw new Error("O mapa deve receber latitude e longitude na ordem correta.");
}
const previewHtml = renderLocationStep(newProcess, {});
if (!previewHtml.includes(`src="${mapUrls.embed}"`) ||
    !previewHtml.includes('data-checkbox="location.confirmed" checked')) {
  throw new Error("A conferência do ponto deve mostrar o marcador e permitir confirmação.");
}
const hiddenPreviewProcess = structuredClone(newProcess);
hiddenPreviewProcess.location.mapVisible = false;
hiddenPreviewProcess.location.confirmed = false;
const hiddenPreviewHtml = renderLocationStep(hiddenPreviewProcess, {});
if (hiddenPreviewHtml.includes('class="location-map-frame"') ||
    !/data-checkbox="location.confirmed"[^>]*disabled/.test(hiddenPreviewHtml)) {
  throw new Error("A confirmação deve ficar indisponível antes de abrir o mapa.");
}
const invalidCnpjProcess = createInitialState();
invalidCnpjProcess.processType = PROCESS_TYPES.NEW;
invalidCnpjProcess.email = "usuario@example.com";
invalidCnpjProcess.applicant.company = "Empresa Exemplo";
invalidCnpjProcess.applicant.cnpj = "123";
invalidCnpjProcess.applicant.municipalRegistration = "123456";
invalidCnpjProcess.files.alvaraLocalizacao = [pdf];
const invalidCnpjErrors = validateAll(invalidCnpjProcess);
const wrongCheckDigitsProcess = createInitialState();
wrongCheckDigitsProcess.processType = PROCESS_TYPES.NEW;
wrongCheckDigitsProcess.applicant.cnpj = "11222333000182";
const wrongCheckDigitsErrors = validateAll(wrongCheckDigitsProcess);
const repeatedDigitsProcess = createInitialState();
repeatedDigitsProcess.processType = PROCESS_TYPES.NEW;
repeatedDigitsProcess.applicant.cnpj = "00000000000000";
const repeatedDigitsErrors = validateAll(repeatedDigitsProcess);
const requirementResponse = createInitialState();
requirementResponse.email = "usuario@example.com";
requirementResponse.processType = PROCESS_TYPES.REQUIREMENT_RESPONSE;
requirementResponse.requirementResponse.processNumber = "VEI-0044-2026";
requirementResponse.requirementResponse.noticeNumber = "1";
requirementResponse.files.respostaExigencia = [pdf];
requirementResponse.acknowledgement = true;

const responsePayload = buildRequirementResponsePayload(requirementResponse);
if (responsePayload.numeroProcesso !== "VEI-0044-2026" || responsePayload.numeroComunicado !== "1") {
  throw new Error("Os números da resposta de exigência não chegaram ao payload.");
}

if (Object.keys(validateAll(requirementResponse)).length > 0) {
  throw new Error("Resposta de exigência válida não deveria ter erros.");
}

requirementResponse.files.respostaExigencia = [];
if (!validateAll(requirementResponse)["files.respostaExigencia"]) {
  throw new Error("Resposta de exigência sem documentos deveria ser recusada.");
}

if (Object.keys(newProcessErrors).length > 0) {
  throw new Error(`Processo novo inválido: ${JSON.stringify(newProcessErrors)}`);
}

if (
  FACE_OPTIONS.includes("Outro") ||
  VEHICLE_TYPES.some((option) => option.label === "Outro" || option.value === "Outro")
) {
  throw new Error("As opcoes fixas nao devem incluir Outro.");
}

if (!invalidCnpjErrors["applicant.cnpj"]) {
  throw new Error("CNPJ invalido deveria bloquear o processo novo.");
}

if (
  !wrongCheckDigitsErrors["applicant.cnpj"] ||
  !repeatedDigitsErrors["applicant.cnpj"]
) {
  throw new Error("CNPJ com digitos de controle invalidos deveria ser recusado.");
}

const newProcessPayload = buildNewProcessPayload(newProcess);
const fixedTypeHtml = renderVehicleStep(newProcess, {});
if (fixedTypeHtml.includes("Área do veículo") || fixedTypeHtml.includes("Altura da borda inferior") ||
    fixedTypeHtml.includes("areaRuleClassification")) {
  throw new Error("Tipo com raio fixo não deve pedir medidas nem classificação.");
}
if ("areaM2" in newProcessPayload.veiculoDivulgacao ||
    "alturaBordaInferiorM" in newProcessPayload.veiculoDivulgacao) {
  throw new Error("Medidas numéricas não devem ser enviadas.");
}
const smallPanel = structuredClone(newProcess);
smallPanel.vehicle.type = "painel de led";
smallPanel.vehicleRules.find((item) => item.tipo === "painel de led").limiteAreaM2 = 7;
const smallPanelHtml = renderVehicleStep(smallPanel, {});
if (!smallPanelHtml.includes("limite de 7 m²") || !smallPanelHtml.includes("within_limit") ||
    !smallPanelHtml.includes("above_limit")) {
  throw new Error("A pergunta deve usar o limite carregado da regra ativa.");
}
if (!validateAll(smallPanel)["vehicle.areaRuleClassification"]) {
  throw new Error("A classificação deve ser obrigatória para regra por área.");
}
for (const classification of ["within_limit", "above_limit"]) {
  smallPanel.vehicle.areaRuleClassification = classification;
  if (Object.keys(validateAll(smallPanel)).length ||
      buildNewProcessPayload(smallPanel).veiculoDivulgacao.areaRuleClassification !== classification) {
    throw new Error("A classificação escolhida deve ser validada e enviada.");
  }
}

if (newProcessPayload.requerente.cnpj !== "11222333000181") {
  throw new Error(`CNPJ ausente ou incorreto no payload: ${JSON.stringify(newProcessPayload)}`);
}

if ("facesOther" in newProcess.vehicle || newProcessPayload.veiculoDivulgacao.quantidadeFaces === "Outro") {
  throw new Error(`Outro nao deve ser usado para quantidade de faces: ${JSON.stringify(newProcessPayload)}`);
}

console.log(
  JSON.stringify(
    {
      newProcessPayload,
    },
    null,
    2,
  ),
);
