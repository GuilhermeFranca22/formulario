import {
  buildNewProcessPayload,
  buildRequirementResponsePayload,
} from "../payloads.js";

const DEFAULT_ENDPOINTS = {
  newProcess: "/solicitacoes/veiculos-divulgacao",
  requirementResponse: "/solicitacoes/veiculos-divulgacao/respostas-comunicado",
};

class ApiError extends Error {
  constructor(message, details) {
    super(message);
    this.name = "ApiError";
    this.details = details;
  }
}

function getConfig() {
  return window.FORMS_GEO_CONFIG ?? {};
}

function buildUrl(pathKey) {
  const config = getConfig();
  const path = config.endpoints?.[pathKey] ?? DEFAULT_ENDPOINTS[pathKey];
  const baseUrl = config.externalSystemApiUrl ?? "";

  if (!baseUrl && window.location.protocol === "file:") {
    throw new ApiError(
      "A URL da API externa não está configurada. Abra a página via servidor web ou configure FORMS_GEO_CONFIG.externalSystemApiUrl.",
    );
  }

  return `${baseUrl}${path}`;
}

function appendPayload(formData, payload) {
  formData.append(
    "payload",
    new Blob([JSON.stringify(payload)], { type: "application/json" }),
  );
}

function appendFiles(formData, field, files) {
  files.forEach((file) => {
    formData.append(field, file, file.name);
  });
}

async function postMultipart(url, formData) {
  let response;

  try {
    response = await fetch(url, {
      method: "POST",
      body: formData,
    });
  } catch {
    throw new ApiError(
      "Não foi possível conectar ao sistema externo. Tente novamente em alguns instantes.",
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => "");

  if (!response.ok) {
    const message =
      body?.message ||
      body?.error ||
      "O sistema externo recusou o envio. Revise os dados e tente novamente.";
    throw new ApiError(message, body);
  }

  return typeof body === "object" && body !== null
    ? body
    : { success: true, message: body || "Solicitação enviada com sucesso." };
}

export async function submitNewProcess(state) {
  const formData = new FormData();
  appendPayload(formData, buildNewProcessPayload(state));
  appendFiles(formData, "alvaraLocalizacao", state.files.alvaraLocalizacao);
  appendFiles(formData, "requerimentoPadrao", state.files.requerimentoPadrao);
  appendFiles(
    formData,
    "autorizacaoProprietario",
    state.files.autorizacaoProprietario,
  );
  appendFiles(formData, "documentoProprietario", state.files.documentoProprietario);
  appendFiles(formData, "projetoEstrutural", state.files.projetoEstrutural);
  appendFiles(formData, "projetoImplantacao", state.files.projetoImplantacao);
  appendFiles(formData, "artRrt", state.files.artRrt);

  return postMultipart(buildUrl("newProcess"), formData);
}

export async function submitRequirementResponse(state) {
  const formData = new FormData();
  appendPayload(formData, buildRequirementResponsePayload(state));
  appendFiles(formData, "documentos", state.files.documentos);

  return postMultipart(buildUrl("requirementResponse"), formData);
}
