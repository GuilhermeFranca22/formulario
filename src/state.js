export function createInitialState() {
  return {
    email: "",
    processType: "",
    startedAt: new Date().toISOString(),
    website: "",
    applicant: {
      company: "",
      cnpj: "",
      municipalRegistration: "",
    },
    location: {
      realEstateRegistration: "",
      latitude: "",
      longitude: "",
      mapVisible: false,
      confirmed: false,
      gpsAccuracy: null,
      street: "",
      number: "",
      district: "",
      postalCode: "",
    },
    vehicle: {
      type: "",
      faces: "",
      areaM2: "",
      bottomHeightM: "",
    },
    acknowledgement: false,
    requirementResponse: {
      processNumber: "",
      noticeNumber: "",
    },
    files: {
      respostaExigencia: [],
      alvaraLocalizacao: [],
      requerimentoPadrao: [],
      autorizacaoProprietario: [],
      documentoProprietario: [],
      projetoEstrutural: [],
      projetoImplantacao: [],
      artRrt: [],
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
    latitude: "",
    longitude: "",
    mapVisible: false,
    confirmed: false,
    gpsAccuracy: null,
    street: "",
    number: "",
    district: "",
    postalCode: "",
  };
  state.vehicle = {
    type: "",
    faces: "",
    areaM2: "",
    bottomHeightM: "",
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
