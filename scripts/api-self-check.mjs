import { strict as assert } from "node:assert";

import { PROCESS_TYPES } from "../src/constants.js";
import { submitNewProcess, submitRequirementResponse, downloadReceipt } from "../src/services/externalSystemApi.js";
import { createInitialState } from "../src/state.js";

const requests = [];
const originalFetch = globalThis.fetch;
const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;
const originalSetTimeout = globalThis.setTimeout;
const file = new File(["PDF"], "documento.pdf", { type: "application/pdf" });

globalThis.window = {
  FORMS_GEO_CONFIG: { externalSystemApiUrl: "https://api.example.test/api" },
};
globalThis.document = {
  body: { append() {} },
  createElement: () => ({ href: "", download: "", click() {}, remove() {} }),
};
URL.createObjectURL = () => "blob:comprovante";
URL.revokeObjectURL = () => {};
globalThis.setTimeout = () => 0;
globalThis.fetch = async (input, options = {}) => {
  const url = String(input);
  requests.push({ url, method: options.method ?? "GET" });
  if (url.endsWith("/iniciar")) {
    const body = JSON.parse(options.body);
    const draftId = url.includes("/exigencias/") ? "response-draft" : "process-draft";
    return Response.json({
      rascunhoId: draftId,
      token: "x".repeat(32),
      envios: body.arquivos.map((item) => ({
        idCliente: item.idCliente,
        urlAssinada: `https://upload.example.test/${draftId}/${item.idCliente}`,
      })),
    });
  }
  if (url.startsWith("https://upload.example.test/")) return new Response(null, { status: 200 });
  if (url.endsWith("/finalizar")) {
    return Response.json({
      protocolo: url.includes("/exigencias/") ? "HESP-01-2026" : "VEI-01-2026",
      message: "Recebido",
      comprovanteEnviado: false,
    });
  }
  if (url.endsWith("/comprovante")) {
    return new Response(new Uint8Array([37, 80, 68, 70]), {
      headers: { "Content-Type": "application/pdf" },
    });
  }
  throw new Error(`Rota inesperada: ${url}`);
};

try {
  const processState = createInitialState();
  processState.email = "requerente@example.com";
  processState.processType = PROCESS_TYPES.NEW;
  processState.files.requerimentoPadrao = [file];
  const processResult = await submitNewProcess(processState);
  assert.equal(processResult.protocolo, "VEI-01-2026");
  assert.equal(processResult.receiptEndpoint, "newProcess");
  await downloadReceipt(processResult);

  const responseState = createInitialState();
  responseState.email = "requerente@example.com";
  responseState.processType = PROCESS_TYPES.REQUIREMENT_RESPONSE;
  responseState.requirementResponse.processNumber = "141115/2026-09";
  responseState.requirementResponse.noticeNumber = "2143391";
  responseState.files.respostaExigencia = [file];
  const responseResult = await submitRequirementResponse(responseState);
  assert.equal(responseResult.protocolo, "HESP-01-2026");
  assert.equal(responseResult.receiptEndpoint, "requirementResponse");
  await downloadReceipt(responseResult);

  assert(requests.some(({ url }) => url.endsWith("/process-draft/comprovante")));
  assert(requests.some(({ url }) => url.endsWith("/exigencias/response-draft/comprovante")));

  globalThis.fetch = async () => Response.json({
    detail: [{ msg: "Coordenadas fora do município de Campo Grande." }],
  }, { status: 422 });
  await assert.rejects(submitNewProcess(processState), /Coordenadas fora do município/);
  console.log("Envio e download dos dois comprovantes: OK");
} finally {
  globalThis.fetch = originalFetch;
  URL.createObjectURL = originalCreateObjectURL;
  URL.revokeObjectURL = originalRevokeObjectURL;
  globalThis.setTimeout = originalSetTimeout;
  delete globalThis.window;
  delete globalThis.document;
}
