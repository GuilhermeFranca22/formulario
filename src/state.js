export function createInitialState() {
  return {
    email: "",
    processType: "PROCESSO_NOVO",
    startedAt: new Date().toISOString(),
    website: "",
    applicant: {
      company: "",
      municipalRegistration: "",
    },
    location: {
      realEstateRegistration: "",
      latitude: "",
      longitude: "",
      street: "",
      number: "",
      district: "",
      postalCode: "",
    },
    vehicle: {
      type: "",
      faces: "",
      facesOther: "",
      areaM2: "",
      bottomHeightM: "",
    },
    acknowledgement: false,
    files: {
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
    municipalRegistration: "",
  };
  state.location = {
    realEstateRegistration: "",
    latitude: "",
    longitude: "",
    street: "",
    number: "",
    district: "",
    postalCode: "",
  };
  state.vehicle = {
    type: "",
    faces: "",
    facesOther: "",
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
