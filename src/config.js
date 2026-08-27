const deployedApiUrl = "__FORM_API_URL__";

window.FORMS_GEO_CONFIG = window.FORMS_GEO_CONFIG ?? {
  externalSystemApiUrl: deployedApiUrl.startsWith("__") ? "" : deployedApiUrl,
  endpoints: {
    newProcess: "/public/solicitacoes/veiculos-divulgacao",
  },
};
