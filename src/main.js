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
import { createInitialState } from "./state.js";
import { PROCESS_TYPES } from "./constants.js";
import { buildNewProcessPayload } from "./payloads.js";
import { downloadReceipt, fetchPublicVehicleRules, submitNewProcess, submitRequirementResponse } from "./services/externalSystemApi.js";
import { escapeHtml, formatCnpj, getByPath, onlyDigits, setByPath } from "./utils.js";
import { hasErrors, validateAll, validateStep } from "./validation.js";
import { parseCoordinates } from "./location.js";

const app = document.querySelector("#app");

let state = createInitialState();
let currentStep = "intro";
let errors = {};
let submitError = "";
let success = null;
let isSubmitting = false;

function getFlow() {
  if (state.processType === PROCESS_TYPES.REQUIREMENT_RESPONSE) {
    return ["intro", "processType", "requirementResponse"];
  }
  return ["intro", "processType", "applicant", "location", "vehicle", "documents", "acknowledgement"];
}

function stepContent(step) {
  if (step === "intro") return renderIntroStep(state, errors);
  if (step === "processType") return renderProcessTypeStep(state, errors);
  if (step === "requirementResponse") return renderRequirementResponseStep(state, errors);
  if (step === "applicant") return renderApplicantStep(state, errors);
  if (step === "location") return renderLocationStep(state, errors);
  if (step === "vehicle") return renderVehicleStep(state, errors);
  if (step === "documents") return renderDocumentsStep(state, errors);
  if (step === "acknowledgement") return renderAcknowledgementStep(state, errors);
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
      ${success?.receiptDraftId ? '<button class="nav-button nav-button--primary" type="button" data-action="download-receipt">Baixar comprovante PDF</button>' : ""}
      <button class="nav-button nav-button--primary" type="button" data-action="new-request">Nova solicitação</button>
    </section>
  `;
}

function currentSubmitDisabled() {
  if (currentStep !== "acknowledgement" && currentStep !== "requirementResponse") return false;
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
    success = state.processType === PROCESS_TYPES.REQUIREMENT_RESPONSE
      ? await submitRequirementResponse(state)
      : await submitNewProcess(state);
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
  loadVehicleRules();
}

function loadVehicleRules() {
  fetchPublicVehicleRules().then((rules) => {
    state.vehicleRules = rules;
    state.vehicleRulesLoaded = true;
    if (currentStep === "vehicle") render();
  }).catch((error) => {
    submitError = error.message;
    render();
  });
}

function captureLocation() {
  if (!navigator.geolocation) {
    submitError = "Este navegador não permite captar a localização.";
    render();
    return;
  }
  submitError = "Aguardando a localização do dispositivo...";
  render();
  navigator.geolocation.getCurrentPosition(
    (position) => {
      state.location.latitude = position.coords.latitude.toFixed(6);
      state.location.longitude = position.coords.longitude.toFixed(6);
      state.location.mapVisible = true;
      state.location.confirmed = false;
      state.location.gpsAccuracy = Number.isFinite(position.coords.accuracy)
        ? Math.round(position.coords.accuracy) : null;
      submitError = "";
      delete errors["location.latitude"];
      delete errors["location.longitude"];
      render();
    },
    (error) => {
      submitError = `Não foi possível captar a localização: ${error.message}`;
      render();
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
  );
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
      if (path.startsWith("location.")) {
        state.location.mapVisible = false;
        state.location.confirmed = false;
        state.location.gpsAccuracy = null;
        app.querySelector("[data-location-preview]")?.remove();
        const confirmation = app.querySelector('[data-checkbox="location.confirmed"]');
        if (confirmation) {
          confirmation.checked = false;
          confirmation.disabled = true;
        }
      }
      delete errors[path];
      submitError = "";
    });
  });

  app.querySelectorAll("[data-radio]").forEach((input) => {
    input.addEventListener("change", (event) => {
      const path = event.currentTarget.dataset.radio;
      const value = event.currentTarget.value;
      setByPath(state, path, value);
      if (path === "vehicle.type") state.vehicle.areaRuleClassification = "";

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
      if (action === "capture-location") captureLocation();
      if (action === "show-location-map") {
        if (!parseCoordinates(state.location)) {
          submitError = "Informe latitude e longitude válidas antes de abrir o mapa.";
        } else {
          state.location.mapVisible = true;
          submitError = "";
        }
        render();
      }
      if (action === "new-request") resetForm();
      if (action === "download-receipt") {
        downloadReceipt(success).catch((error) => {
          const card = app.querySelector(".success-card");
          const banner = document.createElement("div");
          banner.className = "error-banner";
          banner.textContent = error.message;
          card?.append(banner);
        });
      }
      if (action === "clear" && window.confirm("Limpar todas as respostas?")) {
        resetForm();
      }
    });
  });
}

window.FORMS_GEO_DEBUG = {
  getState: () => state,
  buildNewProcessPayload: () => buildNewProcessPayload(state),
};

render();
loadVehicleRules();
