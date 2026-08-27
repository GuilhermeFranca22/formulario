export const FORM_TITLE =
  "SOLICITAÇÃO DE AUTORIZAÇÃO DE VEÍCULOS DE DIVULGAÇÃO - GCP/SEMADES";

export const PROCESS_TYPES = {
  NEW: "PROCESSO_NOVO",
};

export const VEHICLE_TYPES = [
  { label: "Outdoor", value: "outdoor" },
  { label: "Painel Iluminado - Front Light", value: "front light" },
  { label: "Painel Iluminado - Triface", value: "triface" },
  { label: "Empena", value: "empena" },
  { label: "Painel Eletrônico Modular", value: "painel eletronico modular" },
  { label: "Painel Eletrônico Modular - Pequeno Porte", value: "painel de led" },
  { label: "Empena Eletrônica", value: "empena de led" },
];

export const FACE_OPTIONS = ["Uma", "Duas", "Três", "Quatro"];

export const LINKS = {
  checklist:
    "https://www.campogrande.ms.gov.br/semades/sec-downloads/checklist-veiculo-de-divulgacao/",
  seiExternalUsers:
    "https://sei.campogrande.ms.gov.br/sei/controlador_externo.php?acao=usuario_externo_logar&id_orgao_acesso_externo=0",
  requerimento:
    "https://www.campogrande.ms.gov.br/semades/sec-downloads/requerimento-veiculos-de-divulgacao-2024/",
  autorizacaoProprietario:
    "https://www.campogrande.ms.gov.br/semades/sec-downloads/autorizacao-do-proprietario-do-imovel-2025/",
  modeloPrancha:
    "https://www.campogrande.ms.gov.br/semades/sec-downloads/modelo-prancha-veiculos/",
};

export const FILE_RULES = {
  alvaraLocalizacao: {
    maxFiles: 5,
    maxSizeMB: 10,
    types: ["pdf", "image"],
    required: true,
  },
  requerimentoPadrao: {
    maxFiles: 1,
    maxSizeMB: 10,
    types: ["pdf"],
    required: true,
  },
  autorizacaoProprietario: {
    maxFiles: 5,
    maxSizeMB: 10,
    types: ["pdf", "image"],
    required: true,
  },
  documentoProprietario: {
    maxFiles: 5,
    maxSizeMB: 10,
    types: ["pdf", "image"],
    required: false,
  },
  projetoEstrutural: {
    maxFiles: 5,
    maxSizeMB: 10,
    types: ["pdf"],
    required: true,
  },
  projetoImplantacao: {
    maxFiles: 5,
    maxSizeMB: 10,
    types: ["pdf"],
    required: true,
  },
  artRrt: {
    maxFiles: 5,
    maxSizeMB: 10,
    types: ["pdf"],
    required: true,
  },
};
