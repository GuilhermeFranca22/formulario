import { PROCESS_TYPES } from "../src/constants.js";
import { buildNewProcessPayload } from "../src/payloads.js";
import { createInitialState } from "../src/state.js";
import { validateAll } from "../src/validation.js";

const pdf = { name: "documento.pdf", size: 1024, type: "application/pdf" };

const newProcess = createInitialState();
newProcess.email = "usuario@example.com";
newProcess.processType = PROCESS_TYPES.NEW;
newProcess.startedAt = new Date(Date.now() - 60_000).toISOString();
newProcess.applicant.company = "Empresa Exemplo";
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

if (Object.keys(newProcessErrors).length > 0) {
  throw new Error(`Processo novo inválido: ${JSON.stringify(newProcessErrors)}`);
}

console.log(
  JSON.stringify(
    {
      newProcessPayload: buildNewProcessPayload(newProcess),
    },
    null,
    2,
  ),
);
