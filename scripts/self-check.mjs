import { FACE_OPTIONS, PROCESS_TYPES, VEHICLE_TYPES } from "../src/constants.js";
import { buildNewProcessPayload, buildRequirementResponsePayload } from "../src/payloads.js";
import { createInitialState } from "../src/state.js";
import { validateAll } from "../src/validation.js";

const pdf = { name: "documento.pdf", size: 1024, type: "application/pdf" };

const newProcess = createInitialState();
newProcess.email = "usuario@example.com";
newProcess.processType = PROCESS_TYPES.NEW;
newProcess.applicant.company = "Empresa Exemplo";
newProcess.applicant.cnpj = "12345678000199";
newProcess.applicant.municipalRegistration = "123456";
newProcess.location.realEstateRegistration = "12345678901";
newProcess.location.coordinates = "20°27'28.2\"S 54°36'23.5\"W";
newProcess.location.address = "Endereço informado";
newProcess.vehicle.type = "Outdoor";
newProcess.vehicle.faces = "Uma";
newProcess.files.alvaraLocalizacao = [pdf];
newProcess.files.requerimentoPadrao = [pdf];
newProcess.files.autorizacaoProprietario = [pdf];
newProcess.files.projetoEstrutural = [pdf];
newProcess.files.projetoImplantacao = [pdf];
newProcess.files.artRrt = [pdf];
newProcess.acknowledgement = true;

const requirementResponse = createInitialState();
requirementResponse.email = "usuario@example.com";
requirementResponse.processType = PROCESS_TYPES.REQUIREMENT_RESPONSE;
requirementResponse.requirementResponse.processNumber = "12345";
requirementResponse.requirementResponse.noticeNumber = "67890";
requirementResponse.files.documentos = [pdf];

const newProcessErrors = validateAll(newProcess);
const requirementErrors = validateAll(requirementResponse);
const invalidCnpjProcess = createInitialState();
invalidCnpjProcess.email = "usuario@example.com";
invalidCnpjProcess.processType = PROCESS_TYPES.NEW;
invalidCnpjProcess.applicant.company = "Empresa Exemplo";
invalidCnpjProcess.applicant.cnpj = "123";
invalidCnpjProcess.applicant.municipalRegistration = "123456";
invalidCnpjProcess.files.alvaraLocalizacao = [pdf];
const invalidCnpjErrors = validateAll(invalidCnpjProcess);

if (Object.keys(newProcessErrors).length > 0) {
  throw new Error(`Processo novo inválido: ${JSON.stringify(newProcessErrors)}`);
}

if (Object.keys(requirementErrors).length > 0) {
  throw new Error(`Resposta de comunicado inválida: ${JSON.stringify(requirementErrors)}`);
}

if (VEHICLE_TYPES.includes("Outro") || FACE_OPTIONS.includes("Outro")) {
  throw new Error("As opcoes fixas nao devem incluir Outro.");
}

if (!invalidCnpjErrors["applicant.cnpj"]) {
  throw new Error("CNPJ invalido deveria bloquear o processo novo.");
}

const newProcessPayload = buildNewProcessPayload(newProcess);
const requirementResponsePayload = buildRequirementResponsePayload(requirementResponse);

if (newProcessPayload.requerente.cnpj !== "12345678000199") {
  throw new Error(`CNPJ ausente ou incorreto no payload: ${JSON.stringify(newProcessPayload)}`);
}

if (
  newProcessPayload.veiculoDivulgacao.tipoOutro !== null ||
  newProcessPayload.veiculoDivulgacao.quantidadeFacesOutro !== null
) {
  throw new Error(`Campos complementares devem ser nulos: ${JSON.stringify(newProcessPayload)}`);
}

if (Object.hasOwn(requirementResponsePayload, "requerente")) {
  throw new Error("Resposta de comunicado nao deve enviar dados de requerente.");
}

console.log(
  JSON.stringify(
    {
      newProcessPayload,
      requirementResponsePayload,
    },
    null,
    2,
  ),
);
