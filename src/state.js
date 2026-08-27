export function createInitialState() {
  return {
    email: "",
    processType: "",
    applicant: {
      company: "",
      cnpj: "",
      municipalRegistration: "",
    },
    location: {
      realEstateRegistration: "",
      coordinates: "",
      address: "",
    },
    vehicle: {
      type: "",
      faces: "",
    },
    acknowledgement: false,
    requirementResponse: {
      processNumber: "",
      noticeNumber: "",
    },
    files: {
      alvaraLocalizacao: [],
      requerimentoPadrao: [],
      autorizacaoProprietario: [],
      documentoProprietario: [],
      projetoEstrutural: [],
      projetoImplantacao: [],
      artRrt: [],
      documentos: [],
    },
  };
}

export function clearNewProcessData(state) {
  state.applicant = {
    company: "",
    cnpj: "",
    municipalRegistration: "",
  };
  state.location = {
    realEstateRegistration: "",
    coordinates: "",
    address: "",
  };
  state.vehicle = {
    type: "",
    faces: "",
  };
  state.acknowledgement = false;
  state.files.alvaraLocalizacao = [];
  state.files.requerimentoPadrao = [];
  state.files.autorizacaoProprietario = [];
  state.files.documentoProprietario = [];
  state.files.projetoEstrutural = [];
  state.files.projetoImplantacao = [];
  state.files.artRrt = [];
}

export function clearRequirementResponseData(state) {
  state.requirementResponse = {
    processNumber: "",
    noticeNumber: "",
  };
  state.files.documentos = [];
}
