import { FACE_OPTIONS, PROCESS_TYPES, VEHICLE_TYPES } from "../src/constants.js";
import { buildNewProcessPayload } from "../src/payloads.js";
import { createInitialState } from "../src/state.js";
import { validateAll } from "../src/validation.js";

const pdf = { name: "documento.pdf", size: 1024, type: "application/pdf" };

const newProcess = createInitialState();
newProcess.email = "usuario@example.com";
newProcess.processType = PROCESS_TYPES.NEW;
newProcess.startedAt = new Date(Date.now() - 60_000).toISOString();
newProcess.applicant.company = "Empresa Exemplo";
newProcess.applicant.cnpj = "12345678000199";
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
invalidCnpjProcess.email = "usuario@example.com";
invalidCnpjProcess.applicant.company = "Empresa Exemplo";
invalidCnpjProcess.applicant.cnpj = "123";
invalidCnpjProcess.applicant.municipalRegistration = "123456";
invalidCnpjProcess.files.alvaraLocalizacao = [pdf];
const invalidCnpjErrors = validateAll(invalidCnpjProcess);

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

const newProcessPayload = buildNewProcessPayload(newProcess);

if (newProcessPayload.requerente.cnpj !== "12345678000199") {
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
