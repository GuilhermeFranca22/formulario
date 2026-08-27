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
      latitude: Number(state.location.latitude),
      longitude: Number(state.location.longitude),
      rua: cleanText(state.location.street),
      numero: cleanText(state.location.number),
      bairro: cleanText(state.location.district),
      cep: cleanText(state.location.postalCode),
    },
    veiculoDivulgacao: {
      tipo: state.vehicle.type,
      quantidadeFaces: state.vehicle.faces,
      areaM2: Number(state.vehicle.areaM2),
      alturaBordaInferiorM: Number(state.vehicle.bottomHeightM),
    },
    ciente: state.acknowledgement,
    iniciadoEm: state.startedAt,
    website: cleanText(state.website),
  };
}
