import { buildNewProcessPayload, buildRequirementResponsePayload } from "../payloads.js";

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
const PENDING_NEW_PROCESS_KEY = "geomidia:pending-new-process";
let activeNewProcess = null;
let newProcessInFlight = null;

function readPendingNewProcess() {
  try {
    const value = JSON.parse(window.sessionStorage?.getItem(PENDING_NEW_PROCESS_KEY) ?? "null");
    return typeof value?.draftId === "string" && typeof value?.token === "string"
      ? value : null;
  } catch {
    return null;
  }
}

function savePendingNewProcess(initiated) {
  try {
    window.sessionStorage?.setItem(PENDING_NEW_PROCESS_KEY, JSON.stringify({
      draftId: initiated.rascunhoId, token: initiated.token,
    }));
  } catch {
    // The in-memory draft still supports retries in this tab.
  }
}

export function hasPendingNewProcessSubmission() {
  return Boolean(readPendingNewProcess());
}

export function clearPendingNewProcessSubmission() {
  activeNewProcess = null;
  try {
    window.sessionStorage?.removeItem(PENDING_NEW_PROCESS_KEY);
  } catch {
    // Storage may be unavailable in private browsing.
  }
}

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

function buildUrl(path = "", endpointName = "newProcess") {
  const config = getConfig();
  const baseUrl = String(config.externalSystemApiUrl ?? "").replace(/\/$/, "");
  const endpoint = config.endpoints?.[endpointName] ??
    (endpointName === "requirementResponse" ? `${DEFAULT_ENDPOINT}/exigencias` : DEFAULT_ENDPOINT);
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
      (Array.isArray(detail) && detail.map((item) => item?.msg).filter(Boolean).join(" ")) ||
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

export async function fetchPublicVehicleRules() {
  let response;
  try {
    response = await fetch(buildUrl("/regras"));
  } catch {
    throw new ApiError("Não foi possível carregar as regras dos veículos.");
  }
  if (!response.ok) throw new ApiError("Não foi possível carregar as regras dos veículos.");
  const rules = await response.json();
  if (!Array.isArray(rules)) throw new ApiError("As regras dos veículos estão indisponíveis.");
  return rules;
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

async function finalizeNewProcess(draftId, token) {
  const result = await postJson(buildUrl(`/${encodeURIComponent(draftId)}/finalizar`), { token });
  clearPendingNewProcessSubmission();
  return { ...result, receiptDraftId: draftId, receiptToken: token, receiptEndpoint: "newProcess" };
}

async function submitNewProcessOnce(state) {
  const pending = readPendingNewProcess();
  if (pending) return finalizeNewProcess(pending.draftId, pending.token);

  const files = collectFiles(state);
  const payload = buildNewProcessPayload(state);
  const attachments = files.map(({ clientId, category, file }) => ({
    idCliente: clientId,
    categoria: category,
    nome: file.name,
    tipoConteudo: normalizedContentType(file),
    tamanhoBytes: file.size,
  }));
  const snapshot = JSON.stringify({ payload, attachments });
  if (activeNewProcess && activeNewProcess.snapshot !== snapshot) activeNewProcess = null;

  if (!activeNewProcess) {
    const initiated = await postJson(buildUrl("/iniciar"), {
      payload,
      arquivos: attachments,
    });
    activeNewProcess = {
      initiated, snapshot, filesById: new Map(files.map((item) => [item.clientId, item.file])), uploaded: new Set(),
    };
  }

  const { initiated, filesById, uploaded } = activeNewProcess;
  const attempts = await Promise.allSettled(initiated.envios.filter((target) => !uploaded.has(target.idCliente)).map(async (target) => {
    const file = filesById.get(target.idCliente);
    if (!file) throw new ApiError("O GeoMídia devolveu um anexo desconhecido.");
    await uploadFile(target.urlAssinada, file);
    uploaded.add(target.idCliente);
  }));
  const failed = attempts.find((attempt) => attempt.status === "rejected");
  if (failed) {
    // A PUT can reach Storage even when its response is lost. Let the backend verify every object first.
    try {
      return await finalizeNewProcess(initiated.rascunhoId, initiated.token);
    } catch {
      throw failed.reason;
    }
  }

  savePendingNewProcess(initiated);
  return finalizeNewProcess(initiated.rascunhoId, initiated.token);
}

export function submitNewProcess(state) {
  if (newProcessInFlight) return newProcessInFlight;
  newProcessInFlight = submitNewProcessOnce(state).finally(() => { newProcessInFlight = null; });
  return newProcessInFlight;
}

export function recoverNewProcessSubmission() {
  if (!hasPendingNewProcessSubmission()) return Promise.reject(new ApiError("Não há envio pendente para recuperar."));
  return submitNewProcess(null);
}

export async function submitRequirementResponse(state) {
  const files = state.files.respostaExigencia.map((file, index) => ({
    clientId: `respostaExigencia:${index}`,
    category: "respostaExigencia",
    file,
  }));
  const initiated = await postJson(buildUrl("/iniciar", "requirementResponse"), {
    payload: buildRequirementResponsePayload(state),
    arquivos: files.map(({ clientId, category, file }) => ({
      idCliente: clientId,
      categoria: category,
      nome: file.name,
      tipoConteudo: normalizedContentType(file),
      tamanhoBytes: file.size,
    })),
  });
  const filesById = new Map(files.map((item) => [item.clientId, item.file]));
  await Promise.all(initiated.envios.map((target) => {
    const file = filesById.get(target.idCliente);
    if (!file) throw new ApiError("O GeoMídia devolveu um anexo desconhecido.");
    return uploadFile(target.urlAssinada, file);
  }));
  const result = await postJson(
    buildUrl(`/${encodeURIComponent(initiated.rascunhoId)}/finalizar`, "requirementResponse"),
    { token: initiated.token },
  );
  return {
    ...result,
    receiptDraftId: initiated.rascunhoId,
    receiptToken: initiated.token,
    receiptEndpoint: "requirementResponse",
  };
}

export async function downloadReceipt(result) {
  let response;
  try {
    response = await fetch(
      buildUrl(`/${encodeURIComponent(result.receiptDraftId)}/comprovante`, result.receiptEndpoint),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: result.receiptToken }),
      },
    );
  } catch {
    throw new ApiError("Não foi possível baixar o comprovante. Tente novamente.");
  }
  if (!response.ok) {
    const body = await responseBody(response);
    throw new ApiError(body?.detail || "Não foi possível baixar o comprovante. Tente novamente.");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${result.protocolo}.pdf`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
