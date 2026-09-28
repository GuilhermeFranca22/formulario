import { FACE_OPTIONS, PROCESS_TYPES, VEHICLE_TYPES } from "../src/constants.js";
import { buildNewProcessPayload, buildRequirementResponsePayload } from "../src/payloads.js";
import { createInitialState } from "../src/state.js";
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
newProcess.location.street = "Avenida Afonso Pena";
newProcess.location.number = "1000";
newProcess.location.district = "Centro";
newProcess.location.postalCode = "79002-000";
newProcess.vehicle.type = "outdoor";
newProcess.vehicle.faces = "Uma";
newProcess.vehicle.areaM2 = "12";
newProcess.vehicle.bottomHeightM = "4";
newProcess.files.alvaraLocalizacao = [pdf];
newProcess.files.requerimentoPadrao = [pdf];
newProcess.files.autorizacaoProprietario = [pdf];
newProcess.files.projetoEstrutural = [pdf];
newProcess.files.projetoImplantacao = [pdf];
newProcess.files.artRrt = [pdf];
newProcess.acknowledgement = true;

const newProcessErrors = validateAll(newProcess);
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
