import {
  FACE_OPTIONS,
  FILE_RULES,
  LINKS,
  PROCESS_TYPES,
  VEHICLE_TYPES,
} from "./constants.js";
import {
  renderFileUpload,
  renderInlineQuestion,
  renderQuestion,
  renderRadioGroup,
  renderSection,
  renderTextInput,
} from "./components.js";
import { formatCnpj } from "./utils.js";

const required = '<span class="required-mark">*</span>';

export function renderIntroCopy() {
  return `
    <div class="intro-copy">
      <p><strong>Bem-vindo(a) ao portal de autorizações da GCP/SEMADES.</strong></p>
      <p>Este formulário é o canal oficial para o protocolo de pedidos de <strong>AUTORIZAÇÃO DE INSTALAÇÃO DE VEÍCULOS DE DIVULGAÇÃO</strong>, emitido pela GCP/SEMADES. Para garantir que sua solicitação seja processada corretamente, siga as etapas abaixo com atenção.</p>
      <p><strong>COMO FUNCIONA O PROCESSO:</strong></p>
      <ul>
        <li><strong>PASSO 1: PREPARE SEUS DOCUMENTOS:</strong> Tenha em mãos os documentos necessários para a solicitação de abertura de processo para instalação de veículo de divulgação. A lista da documentação necessária pode ser encontrada através do link: <a href="${LINKS.checklist}" target="_blank" rel="noreferrer">checklist-veiculo-de-divulgacao</a>.</li>
        <li><strong>PASSO 2: PREENCHA O FORMULÁRIO:</strong> Você preencherá os dados solicitados a seguir. Todas as perguntas com asterisco (*) são obrigatórias.</li>
        <li><strong>PASSO 3: RECEBA SEU PROTOCOLO:</strong> Ao clicar em "Enviar", os dados serão encaminhados ao sistema responsável pelo protocolo.</li>
        <li><strong>PASSO 4: CADASTRO E ACOMPANHAMENTO:</strong> O acompanhamento será realizado pela plataforma SEI como Usuário Externo, quando aplicável. <a href="${LINKS.seiExternalUsers}" target="_blank" rel="noreferrer">Acesso para usuários externos</a>.</li>
      </ul>
      <p><strong>Para iniciar o requisito, por favor, preencha seu e-mail no campo abaixo e clique em "Avançar"</strong></p>
    </div>
  `;
}

export function renderIntroStep(state, errors) {
  return renderQuestion({
    title: `E-mail ${required}`,
    control: renderTextInput({
      path: "email",
      value: state.email,
      placeholder: "Seu e-mail",
      type: "email",
    }),
    error: errors.email,
  });
}

export function renderProcessTypeStep(state, errors) {
  return `
    ${renderSection(
      "Selecione o tipo de processo",
      renderInlineQuestion({
        title: `Selecione o tipo processo ${required}`,
        control: renderRadioGroup({
          name: "processType",
          value: state.processType,
          options: [
            { label: "Processo novo", value: PROCESS_TYPES.NEW },
            {
              label: "Resposta de comunicado de exigência",
              value: PROCESS_TYPES.REQUIREMENT_RESPONSE,
            },
          ],
        }),
        error: errors.processType,
      }),
    )}
  `;
}

export function renderApplicantStep(state, errors) {
  return `
    ${renderSection("Informações do Requerente", "")}
    ${renderQuestion({
      title: `Empresa responsável pela solicitação ${required}`,
      control: renderTextInput({
        path: "applicant.company",
        value: state.applicant.company,
      }),
      error: errors["applicant.company"],
    })}
    ${renderQuestion({
      title: `CNPJ da empresa ${required}`,
      control: renderTextInput({
        path: "applicant.cnpj",
        value: formatCnpj(state.applicant.cnpj),
        inputMode: "numeric",
        maxLength: 18,
      }),
      error: errors["applicant.cnpj"],
    })}
    ${renderQuestion({
      title: `Inscrição Municipal da empresa ${required}`,
      control: renderTextInput({
        path: "applicant.municipalRegistration",
        value: state.applicant.municipalRegistration,
      }),
      error: errors["applicant.municipalRegistration"],
    })}
    ${renderQuestion({
      title: `Anexar alvará de localização e funcionamento válido. ${required}`,
      control: renderFileUpload({
        key: "alvaraLocalizacao",
        files: state.files.alvaraLocalizacao,
        rules: FILE_RULES.alvaraLocalizacao,
        error: errors["files.alvaraLocalizacao"],
      }),
    })}
  `;
}

export function renderLocationStep(state, errors) {
  return `
    ${renderSection("Local de Instalação do veículo de divulgação", "")}
    ${renderQuestion({
      title: `Inscrição Imobiliária ${required}`,
      description:
        "Digite corretamente a inscrição imobiliária. O número da inscrição contém 11 (onze) dígitos.",
      control: renderTextInput({
        path: "location.realEstateRegistration",
        value: state.location.realEstateRegistration,
      }),
      error: errors["location.realEstateRegistration"],
    })}
    ${renderQuestion({
      title: `Coordenadas Geográficas ${required}`,
      description:
        "Insira as coordenadas no formato DMS (graus, minutos e segundos). Ex.: 20°27'28.2\"S 54°36'23.5\"W",
      control: renderTextInput({
        path: "location.coordinates",
        value: state.location.coordinates,
      }),
      error: errors["location.coordinates"],
    })}
    ${renderQuestion({
      title: `Endereço do local de instalação ${required}`,
      control: renderTextInput({
        path: "location.address",
        value: state.location.address,
      }),
      error: errors["location.address"],
    })}
  `;
}

export function renderVehicleStep(state, errors) {
  return `
    ${renderSection(
      "TIPO DE VEÍCULO DE DIVULGAÇÃO",
      `<ul class="helper-list">
        <li>Selecione o tipo de veículo de divulgação a ser instalado no local informado;</li>
        <li>É permitida a aprovação de apenas um tipo de veículo de divulgação por processo.</li>
      </ul>`,
    )}
    ${renderQuestion({
      title: `Escolha o tipo de veículo de divulgação ${required}`,
      control: renderRadioGroup({
        name: "vehicle.type",
        value: state.vehicle.type,
        options: VEHICLE_TYPES,
      }),
      error: errors["vehicle.type"],
    })}
  `;
}

export function renderDocumentsStep(state, errors) {
  return `
    ${renderSection(
      "Documentos mínimos necessários",
      renderInlineQuestion({
        title: `Quantidade de faces (painéis) ${required}`,
        description:
          "Indique o número de faces ou painéis que serão instalados no local.",
        control: renderRadioGroup({
          name: "vehicle.faces",
          value: state.vehicle.faces,
          options: FACE_OPTIONS,
        }),
        error: errors["vehicle.faces"],
      }),
    )}
    ${renderQuestion({
      title: `Requerimento padrão ${required}`,
      description: `Baixe o modelo através do link: <a href="${LINKS.requerimento}" target="_blank" rel="noreferrer">requerimento-veiculos-de-divulgacao-2024</a>. O documento deverá estar assinado digitalmente.`,
      control: renderFileUpload({
        key: "requerimentoPadrao",
        files: state.files.requerimentoPadrao,
        rules: FILE_RULES.requerimentoPadrao,
        error: errors["files.requerimentoPadrao"],
      }),
    })}
    ${renderQuestion({
      title: `Autorização do Proprietário do Imóvel ${required}`,
      description: `Baixe o modelo através do link: <a href="${LINKS.autorizacaoProprietario}" target="_blank" rel="noreferrer">autorizacao-do-proprietario-do-imovel-2025</a>. O documento deverá estar assinado digitalmente ou acompanhado de documentos oficiais para conferência interna.`,
      control: renderFileUpload({
        key: "autorizacaoProprietario",
        files: state.files.autorizacaoProprietario,
        rules: FILE_RULES.autorizacaoProprietario,
        error: errors["files.autorizacaoProprietario"],
      }),
    })}
    ${renderQuestion({
      title: "RG, CNH ou outro documento oficial",
      description:
        "Caso a autorização do proprietário seja assinada fisicamente, deverá ser apresentado documento oficial para conferência interna.",
      control: renderFileUpload({
        key: "documentoProprietario",
        files: state.files.documentoProprietario,
        rules: FILE_RULES.documentoProprietario,
        error: errors["files.documentoProprietario"],
      }),
    })}
    ${renderQuestion({
      title: `Projeto estrutural do veículo de divulgação ${required}`,
      description: `Baixe o modelo através do link: <a href="${LINKS.modeloPrancha}" target="_blank" rel="noreferrer">modelo-prancha-veiculos</a>. O documento deverá estar assinado digitalmente.`,
      control: renderFileUpload({
        key: "projetoEstrutural",
        files: state.files.projetoEstrutural,
        rules: FILE_RULES.projetoEstrutural,
        error: errors["files.projetoEstrutural"],
      }),
    })}
    ${renderQuestion({
      title: `Projeto de implantação e localização do veículo de divulgação ${required}`,
      description: `Baixe o modelo através do link: <a href="${LINKS.modeloPrancha}" target="_blank" rel="noreferrer">modelo-prancha-veiculos</a>. O documento deverá estar assinado digitalmente.`,
      control: renderFileUpload({
        key: "projetoImplantacao",
        files: state.files.projetoImplantacao,
        rules: FILE_RULES.projetoImplantacao,
        error: errors["files.projetoImplantacao"],
      }),
    })}
    ${renderQuestion({
      title: `ART/RRT de projeto estrutural e execução ${required}`,
      description: "O documento deverá estar assinado digitalmente.",
      control: renderFileUpload({
        key: "artRrt",
        files: state.files.artRrt,
        rules: FILE_RULES.artRrt,
        error: errors["files.artRrt"],
      }),
    })}
  `;
}

export function renderAcknowledgementStep(state, errors) {
  return `
    ${renderSection(
      "IMPORTANTE",
      `<p>O acompanhamento desta solicitação será feito exclusivamente pela plataforma SEI como usuário externo.</p>
      <p>Certifique-se de que seu cadastro no SEI utilize o mesmo e-mail de login informado aqui.<br />
      <a href="${LINKS.seiExternalUsers}" target="_blank" rel="noreferrer">Acesso para Usuários Externos</a></p>`,
    )}
    ${renderQuestion({
      title: required,
      control: `
        <div class="checkbox-row">
          <label>
            <input type="checkbox" data-checkbox="acknowledgement" ${state.acknowledgement ? "checked" : ""} />
            <span>Estou ciente que a comunicação será feita exclusivamente pela plataforma SEI como usuário externo.</span>
          </label>
        </div>
      `,
      error: errors.acknowledgement,
    })}
  `;
}

export function renderRequirementResponseStep(state, errors) {
  return `
    ${renderSection("Resposta de Comunicado de Exigência", "")}
    ${renderQuestion({
      title: `Informe o número do processo ${required}`,
      control: renderTextInput({
        path: "requirementResponse.processNumber",
        value: state.requirementResponse.processNumber,
      }),
      error: errors["requirementResponse.processNumber"],
    })}
    ${renderQuestion({
      title: `Informe o número do comunicado de Exigência ${required}`,
      control: renderTextInput({
        path: "requirementResponse.noticeNumber",
        value: state.requirementResponse.noticeNumber,
      }),
      error: errors["requirementResponse.noticeNumber"],
    })}
    ${renderQuestion({
      title: `Anexe os documentos ${required}`,
      control: renderFileUpload({
        key: "documentos",
        files: state.files.documentos,
        rules: FILE_RULES.documentos,
        error: errors["files.documentos"],
      }),
    })}
  `;
}
