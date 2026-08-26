import { FORM_TITLE } from "./constants.js";
import { cloudIcon, escapeHtml, formatBytes, uploadIcon } from "./utils.js";

export function renderHeader(state, introHtml = "") {
  const email = state.email || "E-mail ainda não informado";

  return `
    <section class="form-header">
      <div class="form-header__content">
        <h1 class="form-title">${FORM_TITLE}</h1>
        ${introHtml}
      </div>
      <div class="account-row">
        <span><span class="account-row__email">${escapeHtml(email)}</span> <a href="#" aria-label="Mudar conta">Mudar de conta</a></span>
        ${cloudIcon()}
      </div>
      <div class="upload-note">
        O nome, a foto e o e-mail associados à sua Conta do Google serão registrados quando você fizer upload de arquivos e enviar este formulário.
      </div>
      <div class="required-note">* Indica uma pergunta obrigatória</div>
    </section>
  `;
}

export function renderSection(title, content) {
  return `
    <section class="section-card">
      <h2 class="section-title">${escapeHtml(title)}</h2>
      ${content ? `<div class="section-body">${content}</div>` : ""}
    </section>
  `;
}

export function renderQuestion({ title, description = "", control, error = "" }) {
  return `
    <section class="question-card">
      <label class="question-title">${title}</label>
      ${description ? `<p class="field-description">${description}</p>` : ""}
      ${control}
      ${error ? `<p class="error-text">${escapeHtml(error)}</p>` : ""}
    </section>
  `;
}

export function renderInlineQuestion({ title, description = "", control, error = "" }) {
  return `
    <div class="inline-question">
      <label class="question-title">${title}</label>
      ${description ? `<p class="field-description">${description}</p>` : ""}
      ${control}
      ${error ? `<p class="error-text">${escapeHtml(error)}</p>` : ""}
    </div>
  `;
}

export function renderTextInput({ path, value, placeholder = "Sua resposta", type = "text" }) {
  return `
    <input
      class="text-input"
      type="${type}"
      value="${escapeHtml(value)}"
      placeholder="${escapeHtml(placeholder)}"
      data-field="${escapeHtml(path)}"
    />
  `;
}

export function renderRadioGroup({ name, value, options, otherPath, otherValue = "" }) {
  const radios = options
    .map((option) => {
      const optionLabel = typeof option === "object" ? option.label : option;
      const optionValue = typeof option === "object" ? option.value : option;
      const checked = value === optionValue ? "checked" : "";
      const otherInput =
        optionLabel === "Outro" && otherPath
          ? `<input class="other-input" type="text" value="${escapeHtml(otherValue)}" aria-label="Outro" data-field="${escapeHtml(otherPath)}" />`
          : "";
      return `
        <label class="radio-option ${optionLabel === "Outro" ? "radio-option--other" : ""}">
          <input type="radio" name="${escapeHtml(name)}" value="${escapeHtml(optionValue)}" data-radio="${escapeHtml(name)}" ${checked} />
          <span>${escapeHtml(optionLabel)}${optionLabel === "Outro" && otherPath ? ":" : ""}</span>
          ${otherInput}
        </label>
      `;
    })
    .join("");

  return `<div class="radio-group">${radios}</div>`;
}

export function renderFileUpload({ key, files, rules, error = "" }) {
  const acceptedTypes = rules.types.includes("image")
    ? "PDF ou imagem"
    : "PDF";
  const help =
    rules.maxFiles === 1
      ? `Faça upload de 1 arquivo aceito: ${acceptedTypes}. O tamanho máximo é de ${rules.maxSizeMB} MB.`
      : `Faça upload de até ${rules.maxFiles} arquivos aceitos: ${acceptedTypes}. O tamanho máximo é de ${rules.maxSizeMB} MB por item.`;
  const accept = rules.types.includes("image") ? ".pdf,image/*" : ".pdf,application/pdf";
  const multiple = rules.maxFiles > 1 ? "multiple" : "";
  const list = files
    .map(
      (file, index) => `
        <li class="file-item">
          <span class="file-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)} (${formatBytes(file.size)})</span>
          <button class="icon-button" type="button" data-remove-file="${escapeHtml(key)}" data-file-index="${index}" aria-label="Remover ${escapeHtml(file.name)}">
            <span aria-hidden="true">×</span>
          </button>
        </li>
      `,
    )
    .join("");

  return `
    <div class="file-upload">
      <span class="file-help">${help}</span>
      <input class="file-input" id="file-${escapeHtml(key)}" type="file" accept="${accept}" data-file="${escapeHtml(key)}" ${multiple} />
      <label class="file-button" for="file-${escapeHtml(key)}">${uploadIcon()} Adicionar arquivo</label>
      ${files.length ? `<ul class="file-list">${list}</ul>` : ""}
      ${error ? `<p class="error-text">${escapeHtml(error)}</p>` : ""}
    </div>
  `;
}

export function renderNavigation({ canGoBack, isFinal, isSubmitting, submitDisabled }) {
  return `
    <nav class="navigation" aria-label="Navegação do formulário">
      <div class="navigation__left">
        ${
          canGoBack
            ? `<button class="nav-button" type="button" data-action="back">Voltar</button>`
            : ""
        }
        <button
          class="nav-button nav-button--primary"
          type="button"
          data-action="${isFinal ? "submit" : "next"}"
          ${isSubmitting || submitDisabled ? "disabled" : ""}
        >
          ${isSubmitting ? "Enviando..." : isFinal ? "Enviar" : "Avançar"}
        </button>
      </div>
      <button class="link-button" type="button" data-action="clear">Limpar formulário</button>
    </nav>
  `;
}
