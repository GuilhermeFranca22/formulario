import { strict as assert } from "node:assert";

import { PROCESS_TYPES } from "../src/constants.js";
import { recoverAreaAnswerIfRuleChanged } from "../src/areaRuleChange.js";
import { createInitialState } from "../src/state.js";
import {
  clearPendingNewProcessSubmission, hasPendingNewProcessSubmission, submitNewProcess,
} from "../src/services/externalSystemApi.js";

const entries = new Map();
const storage = {
  getItem: (key) => entries.get(key) ?? null,
  setItem: (key, value) => entries.set(key, value),
  removeItem: (key) => entries.delete(key),
};
globalThis.window = {
  FORMS_GEO_CONFIG: { externalSystemApiUrl: "https://api.example.test/api" },
  sessionStorage: storage,
};

const file = new File(["PDF"], "documento.pdf", { type: "application/pdf" });
function state() {
  const value = createInitialState();
  value.email = "requerente@example.com";
  value.processType = PROCESS_TYPES.NEW;
  value.files.requerimentoPadrao = [file];
  return value;
}

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

function initiated(id = "draft-1") {
  return Response.json({
    rascunhoId: id, token: "x".repeat(32),
    envios: [{ idCliente: "requerimentoPadrao:0", urlAssinada: `https://upload.example.test/${id}` }],
  });
}

try {
  let starts = 0;
  let uploads = 0;
  let finals = 0;
  const startResponse = deferred();
  globalThis.fetch = async (url) => {
    if (url.endsWith("/iniciar")) { starts++; return startResponse.promise; }
    if (url.startsWith("https://upload.example.test/")) { uploads++; return new Response(null, { status: 200 }); }
    if (url.endsWith("/finalizar")) { finals++; return Response.json({ protocolo: "VEI-01-2026", message: "Recebido" }); }
    throw new Error(`Rota inesperada: ${url}`);
  };
  const first = submitNewProcess(state());
  const second = submitNewProcess(state());
  assert.equal(first, second, "duplo clique deve compartilhar a mesma tentativa");
  assert.equal(starts, 1);
  startResponse.resolve(initiated());
  const result = await first;
  assert.equal(result.protocolo, "VEI-01-2026");
  assert.deepEqual([starts, uploads, finals], [1, 1, 1]);
  assert.equal(hasPendingNewProcessSubmission(), false);

  starts = uploads = finals = 0;
  globalThis.fetch = async (url) => {
    if (url.endsWith("/iniciar")) { starts++; return initiated("draft-timeout"); }
    if (url.startsWith("https://upload.example.test/")) { uploads++; return new Response(null, { status: 200 }); }
    if (url.endsWith("/finalizar")) {
      finals++;
      if (finals === 1) throw new Error("response lost after commit");
      return Response.json({ protocolo: "VEI-02-2026", message: "Recebido" });
    }
    throw new Error(`Rota inesperada: ${url}`);
  };
  await assert.rejects(submitNewProcess(state()), /Não foi possível conectar/);
  assert.equal(hasPendingNewProcessSubmission(), true);
  assert.deepEqual(JSON.parse(entries.get("geomidia:pending-new-process")), {
    draftId: "draft-timeout", token: "x".repeat(32),
  });
  const retry = await submitNewProcess(state());
  assert.equal(retry.protocolo, "VEI-02-2026");
  assert.deepEqual([starts, uploads, finals], [1, 1, 2]);
  assert.equal(hasPendingNewProcessSubmission(), false);

  starts = uploads = finals = 0;
  const twoFiles = state();
  twoFiles.files.alvaraLocalizacao = [file];
  globalThis.fetch = async (url) => {
    if (url.endsWith("/iniciar")) {
      starts++;
      return Response.json({
        rascunhoId: "draft-upload", token: "x".repeat(32),
        envios: ["alvaraLocalizacao:0", "requerimentoPadrao:0"].map((id) => ({
          idCliente: id, urlAssinada: `https://upload.example.test/${id}`,
        })),
      });
    }
    if (url.startsWith("https://upload.example.test/")) {
      uploads++;
      return new Response(null, { status: url.endsWith("requerimentoPadrao:0") && uploads === 2 ? 503 : 200 });
    }
    if (url.endsWith("/finalizar")) {
      finals++;
      return uploads < 3
        ? Response.json({ detail: "Anexo não enviado." }, { status: 409 })
        : Response.json({ protocolo: "VEI-03-2026" });
    }
    throw new Error(`Rota inesperada: ${url}`);
  };
  await assert.rejects(submitNewProcess(twoFiles), /recusado pelo armazenamento/);
  assert.equal(hasPendingNewProcessSubmission(), false);
  await submitNewProcess(twoFiles);
  assert.deepEqual([starts, uploads, finals], [1, 3, 2]);

  starts = uploads = finals = 0;
  globalThis.fetch = async (url) => {
    if (url.endsWith("/iniciar")) { starts++; return initiated("draft-lost-upload-response"); }
    if (url.startsWith("https://upload.example.test/")) { uploads++; throw new Error("PUT response lost"); }
    if (url.endsWith("/finalizar")) { finals++; return Response.json({ protocolo: "VEI-05-2026" }); }
    throw new Error(`Rota inesperada: ${url}`);
  };
  assert.equal((await submitNewProcess(state())).protocolo, "VEI-05-2026");
  assert.deepEqual([starts, uploads, finals], [1, 1, 1]);

  entries.set("geomidia:pending-new-process", JSON.stringify({
    draftId: "draft-reload", token: "x".repeat(32),
  }));
  starts = uploads = finals = 0;
  globalThis.fetch = async (url) => {
    if (url.endsWith("/finalizar")) {
      finals++;
      return Response.json({ protocolo: "VEI-04-2026", message: "Recebido" });
    }
    if (url.endsWith("/iniciar")) starts++;
    if (url.startsWith("https://upload.example.test/")) uploads++;
    throw new Error(`Rota inesperada durante recuperação: ${url}`);
  };
  const reloaded = await import(`../src/services/externalSystemApi.js?reload=${Date.now()}`);
  assert.equal(reloaded.hasPendingNewProcessSubmission(), true);
  const recovered = await reloaded.recoverNewProcessSubmission();
  assert.equal(recovered.protocolo, "VEI-04-2026");
  assert.deepEqual([starts, uploads, finals], [0, 0, 1]);
  assert.equal(reloaded.hasPendingNewProcessSubmission(), false);

  entries.set("geomidia:pending-new-process", JSON.stringify({
    draftId: "draft-old-rule", token: "x".repeat(32),
  }));
  finals = 0;
  globalThis.fetch = async (url) => {
    if (url.endsWith("/finalizar")) {
      finals++;
      return Response.json({ detail: "A regra de area mudou. Confira e responda novamente." }, { status: 409 });
    }
    throw new Error(`Rota inesperada: ${url}`);
  };
  const recoveredState = createInitialState();
  const changedError = await reloaded.recoverNewProcessSubmission().then(
    () => { throw new Error("O draft incompatível não pode finalizar."); },
    (error) => error,
  );
  const recovery = recoverAreaAnswerIfRuleChanged(
    changedError, recoveredState, reloaded.clearPendingNewProcessSubmission, () => {},
  );
  assert.equal(recovery.step, "intro");
  assert.equal(reloaded.hasPendingNewProcessSubmission(), false);
  await assert.rejects(reloaded.recoverNewProcessSubmission(), /Não há envio pendente/);
  assert.equal(finals, 1, "o mesmo draft incompatível não deve entrar em loop");
  clearPendingNewProcessSubmission();
  console.log("Idempotência, retry e recuperação do Forms: OK");
} finally {
  delete globalThis.fetch;
  delete globalThis.window;
}
