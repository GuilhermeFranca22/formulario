import { PROCESS_TYPES } from "./constants.js";
import { cleanText } from "./utils.js";

export function buildNewProcessPayload(state) {
  const type = state.vehicle.type === "Outro" ? "Outro" : state.vehicle.type;
  const faces = state.vehicle.faces === "Outro" ? "Outro" : state.vehicle.faces;

  return {
    tipoProcesso: PROCESS_TYPES.NEW,
    email: cleanText(state.email),
    requerente: {
      empresa: cleanText(state.applicant.company),
      inscricaoMunicipal: cleanText(state.applicant.municipalRegistration),
    },
    localInstalacao: {
      inscricaoImobiliaria: cleanText(state.location.realEstateRegistration),
      coordenadas: cleanText(state.location.coordinates),
      endereco: cleanText(state.location.address),
    },
    veiculoDivulgacao: {
      tipo: type,
      tipoOutro:
        state.vehicle.type === "Outro" ? cleanText(state.vehicle.typeOther) : null,
      quantidadeFaces: faces,
      quantidadeFacesOutro:
        state.vehicle.faces === "Outro"
          ? cleanText(state.vehicle.facesOther)
          : null,
    },
  };
}

export function buildRequirementResponsePayload(state) {
  return {
    tipoProcesso: PROCESS_TYPES.REQUIREMENT_RESPONSE,
    email: cleanText(state.email),
    numeroProcesso: cleanText(state.requirementResponse.processNumber),
    numeroComunicado: cleanText(state.requirementResponse.noticeNumber),
  };
}
