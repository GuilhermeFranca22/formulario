import { PROCESS_TYPES } from "../src/constants.js";
import { buildNewProcessPayload, buildRequirementResponsePayload } from "../src/payloads.js";
import { createInitialState } from "../src/state.js";
import { validateAll } from "../src/validation.js";

const pdf = { name: "documento.pdf", size: 1024, type: "application/pdf" };

const newProcess = createInitialState();
newProcess.email = "usuario@example.com";
newProcess.processType = PROCESS_TYPES.NEW;
newProcess.applicant.company = "Empresa Exemplo";
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

if (Object.keys(newProcessErrors).length > 0) {
  throw new Error(`Processo novo inválido: ${JSON.stringify(newProcessErrors)}`);
}

if (Object.keys(requirementErrors).length > 0) {
  throw new Error(`Resposta de comunicado inválida: ${JSON.stringify(requirementErrors)}`);
}

console.log(
  JSON.stringify(
    {
      newProcessPayload: buildNewProcessPayload(newProcess),
      requirementResponsePayload: buildRequirementResponsePayload(requirementResponse),
    },
    null,
    2,
  ),
);
