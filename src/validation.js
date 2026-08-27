import { FILE_RULES, PROCESS_TYPES } from "./constants.js";
import { cleanText, onlyDigits } from "./utils.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".heic", ".heif"];

function required(value, message = "Esta pergunta é obrigatória.") {
  return cleanText(value) ? "" : message;
}

function email(value) {
  if (!cleanText(value)) {
    return "Informe um e-mail.";
  }
  return EMAIL_PATTERN.test(cleanText(value)) ? "" : "Informe um e-mail válido.";
}

function fileTypeIsAllowed(file, allowedTypes) {
  const name = file.name.toLowerCase();
  const extension = name.includes(".") ? name.slice(name.lastIndexOf(".")) : "";
  const isPdf = file.type === "application/pdf" || extension === ".pdf";
  const isImage = file.type.startsWith("image/") || IMAGE_EXTENSIONS.includes(extension);

  return (
    (allowedTypes.includes("pdf") && isPdf) ||
    (allowedTypes.includes("image") && isImage)
  );
}

export function validateFileGroup(files, rules) {
  const errors = [];

  if (rules.required && files.length === 0) {
    errors.push("Anexe pelo menos um arquivo.");
  }

  if (files.length > rules.maxFiles) {
    errors.push(`Envie no máximo ${rules.maxFiles} arquivo(s).`);
  }

  files.forEach((file) => {
    if (!fileTypeIsAllowed(file, rules.types)) {
      errors.push(`"${file.name}" não está em um formato permitido.`);
    }

    if (file.size > rules.maxSizeMB * 1024 * 1024) {
      errors.push(`"${file.name}" ultrapassa ${rules.maxSizeMB} MB.`);
    }
  });

  return errors.join(" ");
}

export function validateStep(step, state) {
  const errors = {};

  if (step === "intro") {
    const message = email(state.email);
    if (message) errors.email = message;
  }

  if (step === "processType") {
    const message = required(state.processType, "Selecione o tipo de processo.");
    if (message) errors.processType = message;
  }

  if (step === "applicant") {
    const company = required(state.applicant.company);
    const cnpj = onlyDigits(state.applicant.cnpj);
    const municipalRegistration = required(state.applicant.municipalRegistration);
    const alvara = validateFileGroup(
      state.files.alvaraLocalizacao,
      FILE_RULES.alvaraLocalizacao,
    );

    if (company) errors["applicant.company"] = company;
    if (!cnpj) {
      errors["applicant.cnpj"] = "Informe o CNPJ da empresa.";
    } else if (!/^\d{14}$/.test(cnpj)) {
      errors["applicant.cnpj"] = "O CNPJ deve conter exatamente 14 números.";
    }
    if (municipalRegistration) {
      errors["applicant.municipalRegistration"] = municipalRegistration;
    }
    if (alvara) errors["files.alvaraLocalizacao"] = alvara;
  }

  if (step === "location") {
    const registration = cleanText(state.location.realEstateRegistration);
    const coordinates = required(state.location.coordinates);
    const address = required(state.location.address);

    if (!registration) {
      errors["location.realEstateRegistration"] = "Informe a inscrição imobiliária.";
    } else if (!/^\d{11}$/.test(registration)) {
      errors["location.realEstateRegistration"] =
        "A inscrição imobiliária deve conter exatamente 11 números.";
    }

    if (coordinates) errors["location.coordinates"] = coordinates;
    if (address) errors["location.address"] = address;
  }

  if (step === "vehicle") {
    const type = required(state.vehicle.type, "Escolha o tipo de veículo.");
    if (type) errors["vehicle.type"] = type;
  }

  if (step === "documents") {
    const faces = required(state.vehicle.faces, "Informe a quantidade de faces.");
    if (faces) errors["vehicle.faces"] = faces;

    [
      "requerimentoPadrao",
      "autorizacaoProprietario",
      "documentoProprietario",
      "projetoEstrutural",
      "projetoImplantacao",
      "artRrt",
    ].forEach((key) => {
      const message = validateFileGroup(state.files[key], FILE_RULES[key]);
      if (message) errors[`files.${key}`] = message;
    });
  }

  if (step === "acknowledgement" && !state.acknowledgement) {
    errors.acknowledgement = "Marque a confirmação para enviar.";
  }

  if (step === "requirementResponse") {
    const processNumber = required(state.requirementResponse.processNumber);
    const noticeNumber = required(state.requirementResponse.noticeNumber);
    const documents = validateFileGroup(state.files.documentos, FILE_RULES.documentos);

    if (processNumber) errors["requirementResponse.processNumber"] = processNumber;
    if (noticeNumber) errors["requirementResponse.noticeNumber"] = noticeNumber;
    if (documents) errors["files.documentos"] = documents;
  }

  return errors;
}

export function validateAll(state) {
  const steps =
    state.processType === PROCESS_TYPES.REQUIREMENT_RESPONSE
      ? ["intro", "processType", "requirementResponse"]
      : [
          "intro",
          "processType",
          "applicant",
          "location",
          "vehicle",
          "documents",
          "acknowledgement",
        ];

  return steps.reduce(
    (allErrors, step) => ({ ...allErrors, ...validateStep(step, state) }),
    {},
  );
}

export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}
