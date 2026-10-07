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

function validCnpj(cnpj) {
  if (!/^\d{14}$/.test(cnpj) || /^(\d)\1{13}$/.test(cnpj)) return false;

  const checkDigit = (length, weights) => {
    const sum = weights.reduce(
      (total, weight, index) => total + Number(cnpj[index]) * weight,
      0,
    );
    const remainder = sum % 11;
    return Number(cnpj[length]) === (remainder < 2 ? 0 : 11 - remainder);
  };

  return (
    checkDigit(12, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) &&
    checkDigit(13, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  );
}

function fileTypeIsAllowed(file, allowedTypes) {
  const name = file.name.toLowerCase();
  const extension = name.includes(".") ? name.slice(name.lastIndexOf(".")) : "";
  const isPdf = file.type === "application/pdf" || extension === ".pdf";
  const isImage =
    IMAGE_EXTENSIONS.includes(extension) &&
    (file.type.startsWith("image/") || !file.type);

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

  if (step === "processType" && !Object.values(PROCESS_TYPES).includes(state.processType)) {
    errors.processType = "Escolha o tipo de solicitação.";
  }

  if (step === "requirementResponse") {
    const processNumber = required(state.requirementResponse.processNumber);
    const noticeNumber = required(state.requirementResponse.noticeNumber);
    const files = validateFileGroup(state.files.respostaExigencia, FILE_RULES.respostaExigencia);
    if (processNumber) errors["requirementResponse.processNumber"] = processNumber;
    if (noticeNumber) errors["requirementResponse.noticeNumber"] = noticeNumber;
    if (files) errors["files.respostaExigencia"] = files;
    if (!state.acknowledgement) errors.acknowledgement = "Marque a confirmação para enviar.";
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
    } else if (!validCnpj(cnpj)) {
      errors["applicant.cnpj"] = "Informe um CNPJ válido.";
    }
    if (municipalRegistration) {
      errors["applicant.municipalRegistration"] = municipalRegistration;
    }
    if (alvara) errors["files.alvaraLocalizacao"] = alvara;
  }

  if (step === "location") {
    const registration = cleanText(state.location.realEstateRegistration);
    const latitudeText = cleanText(state.location.latitude);
    const longitudeText = cleanText(state.location.longitude);
    const latitude = Number(latitudeText);
    const longitude = Number(longitudeText);

    if (!registration) {
      errors["location.realEstateRegistration"] = "Informe a inscrição imobiliária.";
    } else if (!/^\d{11}$/.test(registration)) {
      errors["location.realEstateRegistration"] =
        "A inscrição imobiliária deve conter exatamente 11 números.";
    }

    if (!latitudeText || !Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      errors["location.latitude"] = "Informe uma latitude válida em graus decimais.";
    }
    if (!longitudeText || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      errors["location.longitude"] = "Informe uma longitude válida em graus decimais.";
    }
    ["street", "number", "district", "postalCode"].forEach((field) => {
      const message = required(state.location[field]);
      if (message) errors[`location.${field}`] = message;
    });
    if (
      cleanText(state.location.postalCode) &&
      !/^\d{5}-?\d{3}$/.test(cleanText(state.location.postalCode))
    ) {
      errors["location.postalCode"] = "Informe um CEP válido.";
    }
    if (!state.location.mapVisible || !state.location.confirmed) {
      errors["location.confirmed"] = "Confira o ponto no mapa e confirme o local de instalação.";
    }
  }

  if (step === "vehicle") {
    const type = required(state.vehicle.type, "Escolha o tipo de veículo.");
    if (type) errors["vehicle.type"] = type;
    const rule = state.vehicleRules.find((item) => item.tipo === state.vehicle.type);
    if (!state.vehicleRulesLoaded || (state.vehicle.type && !rule)) {
      errors["vehicle.rules"] = "Não foi possível carregar a regra do veículo. Recarregue a página.";
    } else if (rule?.limiteAreaM2 != null &&
      !["within_limit", "above_limit"].includes(state.vehicle.areaRuleClassification)) {
      errors["vehicle.areaRuleClassification"] = "Informe se a área supera o limite indicado.";
    }
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

  return errors;
}

export function validateAll(state) {
  const steps = ["intro", "processType"];
  if (state.processType === PROCESS_TYPES.NEW) {
    steps.push("applicant", "location", "vehicle", "documents", "acknowledgement");
  } else if (state.processType === PROCESS_TYPES.REQUIREMENT_RESPONSE) {
    steps.push("requirementResponse");
  }

  return steps.reduce(
    (allErrors, step) => ({ ...allErrors, ...validateStep(step, state) }),
    {},
  );
}

export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}
