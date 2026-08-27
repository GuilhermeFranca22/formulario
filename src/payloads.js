import { PROCESS_TYPES } from "./constants.js";
import { cleanText, onlyDigits } from "./utils.js";

export function buildNewProcessPayload(state) {
  return {
    tipoProcesso: PROCESS_TYPES.NEW,
    email: cleanText(state.email),
    requerente: {
      empresa: cleanText(state.applicant.company),
      cnpj: onlyDigits(state.applicant.cnpj),
      inscricaoMunicipal: cleanText(state.applicant.municipalRegistration),
    },
    localInstalacao: {
      inscricaoImobiliaria: cleanText(state.location.realEstateRegistration),
      coordenadas: cleanText(state.location.coordinates),
      endereco: cleanText(state.location.address),
    },
    veiculoDivulgacao: {
      tipo: state.vehicle.type,
      tipoOutro: null,
      quantidadeFaces: state.vehicle.faces,
      quantidadeFacesOutro: null,
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
