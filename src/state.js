export function createInitialState() {
  return {
    email: "",
    processType: "",
    applicant: {
      company: "",
      municipalRegistration: "",
    },
    location: {
      realEstateRegistration: "",
      coordinates: "",
      address: "",
    },
    vehicle: {
      type: "",
      typeOther: "",
      faces: "",
      facesOther: "",
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
    municipalRegistration: "",
  };
  state.location = {
    realEstateRegistration: "",
    coordinates: "",
    address: "",
  };
  state.vehicle = {
    type: "",
    typeOther: "",
    faces: "",
    facesOther: "",
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
