# Formulário GCP/SEMADES

Implementação web estática do formulário multi-etapas de Solicitação de Autorização de Veículos de Divulgação.

## Executar localmente

Sirva a pasta por HTTP para que os módulos JavaScript funcionem corretamente:

```bash
python -m http.server 5173
```

Depois acesse `http://localhost:5173`.

## Deploy na Vercel

O projeto está configurado para gerar a pasta `dist/`:

```bash
npm run build
```

Na Vercel, use:

- Framework Preset: `Other`
- Build Command: `npm run build`
- Output Directory: `dist`

Também é possível publicar pela CLI:

```bash
npm i -g vercel
vercel login
vercel --prod
```

## Configurar API externa

A integração fica em `src/services/externalSystemApi.js`. Para configurar a URL real sem alterar os componentes, ajuste `src/config.js` ou injete `window.FORMS_GEO_CONFIG` pela aplicação hospedeira antes de `src/main.js`:

```js
window.FORMS_GEO_CONFIG = {
  externalSystemApiUrl: "https://api.seu-sistema.gov.br/api",
  endpoints: {
    newProcess: "/public/solicitacoes/veiculos-divulgacao",
  },
};
```

Nenhuma credencial sensível deve ser enviada no JavaScript do navegador.

Na Vercel, configure a variável de build abaixo e publique novamente:

```text
FORM_API_URL=https://geomidia-back.vercel.app/api
```

Essa variável deve ser configurada nos ambientes da Vercel que publicarão o formulário. O domínio público
definitivo do formulário também deve constar em `CORS_ORIGINS` e `PUBLIC_FORM_ORIGINS` no deployment do backend.

Após informar o e-mail, o usuário escolhe **Processo novo** ou **Resposta de comunicado de exigência**. O processo novo mantém as etapas existentes. A tela de resposta segue a referência `../exigencia.jpeg` e coleta número do processo, número do comunicado e até 10 anexos PDF ou imagem de 10 MB cada.

No **Processo novo**, os anexos são enviados diretamente para URLs temporárias do armazenamento privado. Após a confirmação, a API devolve um protocolo `VEI-01-ANO` (ou o próximo número daquele ano) e apresenta o botão **Baixar comprovante PDF**.

A **Resposta de comunicado de exigência** também envia os anexos ao backend e, ao concluir, apresenta um protocolo `HESP-01-ANO` (ou o próximo número daquele ano) e o botão **Baixar comprovante PDF**. O PDF segue a referência `../HESP-0272-2026.pdf`. Os dois comprovantes são oferecidos para download; o envio por e-mail está inativo. O token de download fica apenas na sessão atual da página, então o usuário deve baixar o comprovante antes de fechá-la.
