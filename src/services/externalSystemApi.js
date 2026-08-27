import { buildNewProcessPayload } from "../payloads.js";

const DEFAULT_ENDPOINT = "/public/solicitacoes/veiculos-divulgacao";
const FILE_CATEGORIES = [
  "alvaraLocalizacao",
  "requerimentoPadrao",
  "autorizacaoProprietario",
  "documentoProprietario",
  "projetoEstrutural",
  "projetoImplantacao",
  "artRrt",
];

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

function buildUrl(path = "") {
  const config = getConfig();
  const baseUrl = String(config.externalSystemApiUrl ?? "").replace(/\/$/, "");
  const endpoint = config.endpoints?.newProcess ?? DEFAULT_ENDPOINT;
  if (!baseUrl) {
    throw new ApiError("A integração com o GeoMídia ainda não está configurada.");
  }
  return `${baseUrl}${endpoint}${path}`;
}

async function responseBody(response) {
  const contentType = response.headers.get("content-type") ?? "";
  return contentType.includes("application/json")
    ? response.json().catch(() => null)
    : response.text().catch(() => "");
}

async function postJson(url, body) {
  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      "Não foi possível conectar ao GeoMídia. Tente novamente em alguns instantes.",
    );
  }

  const bodyResponse = await responseBody(response);
  if (!response.ok) {
    const detail = bodyResponse?.detail;
    const message =
      (typeof detail === "string" && detail) ||
      bodyResponse?.message ||
      bodyResponse?.error ||
      "O GeoMídia recusou o envio. Revise os dados e tente novamente.";
    throw new ApiError(message, bodyResponse);
  }
  return bodyResponse;
}

function normalizedContentType(file) {
  if (file.type) return file.type;
  const extension = file.name.toLowerCase().split(".").pop();
  const types = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    bmp: "image/bmp",
    heic: "image/heic",
    heif: "image/heif",
  };
  return types[extension] ?? "application/octet-stream";
}

function collectFiles(state) {
  return FILE_CATEGORIES.flatMap((category) =>
    state.files[category].map((file, index) => ({
      clientId: `${category}:${index}`,
      category,
      file,
    })),
  );
}

async function uploadFile(signedUrl, file) {
  const data = new FormData();
  data.append("cacheControl", "3600");
  data.append("", file, file.name);
  let response;
  try {
    response = await fetch(signedUrl, {
      method: "PUT",
      headers: { "x-upsert": "false" },
      body: data,
    });
  } catch {
    throw new ApiError(`Não foi possível enviar o arquivo ${file.name}.`);
  }
  if (!response.ok) {
    throw new ApiError(`O arquivo ${file.name} foi recusado pelo armazenamento.`);
  }
}

export async function submitNewProcess(state) {
  const files = collectFiles(state);
  const initiated = await postJson(buildUrl("/iniciar"), {
    payload: buildNewProcessPayload(state),
    arquivos: files.map(({ clientId, category, file }) => ({
      idCliente: clientId,
      categoria: category,
      nome: file.name,
      tipoConteudo: normalizedContentType(file),
      tamanhoBytes: file.size,
    })),
  });

  const filesById = new Map(files.map((item) => [item.clientId, item.file]));
  await Promise.all(
    initiated.envios.map((target) => {
      const file = filesById.get(target.idCliente);
      if (!file) throw new ApiError("O GeoMídia devolveu um anexo desconhecido.");
      return uploadFile(target.urlAssinada, file);
    }),
  );

  return postJson(buildUrl(`/${encodeURIComponent(initiated.rascunhoId)}/finalizar`), {
    token: initiated.token,
  });
}
