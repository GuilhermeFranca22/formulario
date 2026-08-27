import { PROCESS_TYPES } from "./constants.js";
import { renderHeader, renderNavigation } from "./components.js";
import {
  renderAcknowledgementStep,
  renderApplicantStep,
  renderDocumentsStep,
  renderIntroCopy,
  renderIntroStep,
  renderLocationStep,
  renderProcessTypeStep,
  renderRequirementResponseStep,
  renderVehicleStep,
} from "./steps.js";
import {
  clearNewProcessData,
  clearRequirementResponseData,
  createInitialState,
} from "./state.js";
import { buildNewProcessPayload, buildRequirementResponsePayload } from "./payloads.js";
import {
  submitNewProcess,
  submitRequirementResponse,
} from "./services/externalSystemApi.js";
import { escapeHtml, formatCnpj, getByPath, onlyDigits, setByPath } from "./utils.js";
import { hasErrors, validateAll, validateStep } from "./validation.js";

const app = document.querySelector("#app");

let state = createInitialState();
let currentStep = "intro";
let errors = {};
let submitError = "";
let success = null;
let isSubmitting = false;

function getFlow() {
  if (state.processType === PROCESS_TYPES.NEW) {
    return [
      "intro",
      "processType",
      "applicant",
      "location",
      "vehicle",
      "documents",
      "acknowledgement",
    ];
  }

  if (state.processType === PROCESS_TYPES.REQUIREMENT_RESPONSE) {
    return ["intro", "processType", "requirementResponse"];
  }

  return ["intro", "processType"];
}

function stepContent(step) {
  if (step === "intro") return renderIntroStep(state, errors);
  if (step === "processType") return renderProcessTypeStep(state, errors);
  if (step === "applicant") return renderApplicantStep(state, errors);
  if (step === "location") return renderLocationStep(state, errors);
  if (step === "vehicle") return renderVehicleStep(state, errors);
  if (step === "documents") return renderDocumentsStep(state, errors);
  if (step === "acknowledgement") return renderAcknowledgementStep(state, errors);
  if (step === "requirementResponse") {
    return renderRequirementResponseStep(state, errors);
  }
  return "";
}

function renderSuccess() {
  const protocol = success?.protocolo
    ? `<p class="success-protocol">Protocolo: ${escapeHtml(success.protocolo)}</p>`
    : "";
  const message = success?.message || "Solicitação enviada com sucesso.";

  app.innerHTML = `
    ${renderHeader(state)}
    <section class="success-card">
      <h2>Solicitação enviada com sucesso</h2>
      ${protocol}
      <p>${escapeHtml(message)}</p>
      <button class="nav-button nav-button--primary" type="button" data-action="new-request">Nova solicitação</button>
    </section>
  `;
}

function currentSubmitDisabled() {
  if (currentStep !== "acknowledgement") return false;
  return hasErrors(validateAll(state));
}

function render() {
  if (success) {
    renderSuccess();
    bindEvents();
    return;
  }

  const flow = getFlow();
  const stepIndex = flow.indexOf(currentStep);
  const isFinal = stepIndex === flow.length - 1 && currentStep !== "intro";
  const introHtml = currentStep === "intro" ? renderIntroCopy() : "";
  const content =
    currentStep === "intro"
      ? `${renderHeader(state, introHtml)}${stepContent(currentStep)}`
      : `${renderHeader(state)}${stepContent(currentStep)}`;

  app.innerHTML = `
    ${content}
    ${submitError ? `<div class="error-banner">${escapeHtml(submitError)}</div>` : ""}
    ${renderNavigation({
      canGoBack: stepIndex > 0,
      isFinal,
      isSubmitting,
      submitDisabled: currentSubmitDisabled(),
    })}
  `;
  bindEvents();
}

function markStepErrors(step = currentStep) {
  errors = validateStep(step, state);
  return hasErrors(errors);
}

function goNext() {
  submitError = "";
  if (markStepErrors()) {
    render();
    return;
  }

  const flow = getFlow();
  const stepIndex = flow.indexOf(currentStep);
  currentStep = flow[Math.min(stepIndex + 1, flow.length - 1)];
  errors = {};
  render();
}

function goBack() {
  submitError = "";
  const flow = getFlow();
  const stepIndex = flow.indexOf(currentStep);
  currentStep = flow[Math.max(stepIndex - 1, 0)];
  errors = {};
  render();
}

async function submit() {
  submitError = "";
  errors = validateAll(state);

  if (hasErrors(errors)) {
    render();
    return;
  }

  isSubmitting = true;
  render();

  try {
    success =
      state.processType === PROCESS_TYPES.NEW
        ? await submitNewProcess(state)
        : await submitRequirementResponse(state);
  } catch (error) {
    submitError =
      error?.message ||
      "Não foi possível enviar a solicitação. Tente novamente em alguns instantes.";
  } finally {
    isSubmitting = false;
    render();
  }
}

function resetForm() {
  state = createInitialState();
  currentStep = "intro";
  errors = {};
  submitError = "";
  success = null;
  isSubmitting = false;
  render();
}

function bindEvents() {
  app.querySelectorAll("[data-field]").forEach((input) => {
    input.addEventListener("input", (event) => {
      const path = event.currentTarget.dataset.field;
      let value = event.currentTarget.value;

      if (path === "location.realEstateRegistration") {
        value = value.replace(/\D/g, "").slice(0, 11);
        event.currentTarget.value = value;
      }

      if (path === "applicant.cnpj") {
        value = onlyDigits(value).slice(0, 14);
        event.currentTarget.value = formatCnpj(value);
      }

      setByPath(state, path, value);
      delete errors[path];
      submitError = "";
    });
  });

  app.querySelectorAll("[data-radio]").forEach((input) => {
    input.addEventListener("change", (event) => {
      const path = event.currentTarget.dataset.radio;
      const value = event.currentTarget.value;
      const previousProcessType = state.processType;

      setByPath(state, path, value);

      if (path === "processType" && value !== previousProcessType) {
        if (value === PROCESS_TYPES.NEW) clearRequirementResponseData(state);
        if (value === PROCESS_TYPES.REQUIREMENT_RESPONSE) clearNewProcessData(state);
      }

      delete errors[path];
      submitError = "";
      render();
    });
  });

  app.querySelectorAll("[data-checkbox]").forEach((input) => {
    input.addEventListener("change", (event) => {
      const path = event.currentTarget.dataset.checkbox;
      setByPath(state, path, event.currentTarget.checked);
      delete errors[path];
      submitError = "";
      render();
    });
  });

  app.querySelectorAll("[data-file]").forEach((input) => {
    input.addEventListener("change", (event) => {
      const key = event.currentTarget.dataset.file;
      const currentFiles = getByPath(state, `files.${key}`);
      setByPath(state, `files.${key}`, [
        ...currentFiles,
        ...Array.from(event.currentTarget.files),
      ]);
      delete errors[`files.${key}`];
      submitError = "";
      render();
    });
  });

  app.querySelectorAll("[data-remove-file]").forEach((button) => {
    button.addEventListener("click", (event) => {
      const key = event.currentTarget.dataset.removeFile;
      const index = Number(event.currentTarget.dataset.fileIndex);
      const files = [...getByPath(state, `files.${key}`)];
      files.splice(index, 1);
      setByPath(state, `files.${key}`, files);
      delete errors[`files.${key}`];
      submitError = "";
      render();
    });
  });

  app.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", (event) => {
      const action = event.currentTarget.dataset.action;
      if (action === "next") goNext();
      if (action === "back") goBack();
      if (action === "submit") submit();
      if (action === "new-request") resetForm();
      if (action === "clear" && window.confirm("Limpar todas as respostas?")) {
        resetForm();
      }
    });
  });
}

window.FORMS_GEO_DEBUG = {
  getState: () => state,
  buildNewProcessPayload: () => buildNewProcessPayload(state),
  buildRequirementResponsePayload: () => buildRequirementResponsePayload(state),
};

render();
