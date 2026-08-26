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
  externalSystemApiUrl: "https://api.seu-sistema.gov.br",
  endpoints: {
    newProcess: "/solicitacoes/veiculos-divulgacao",
    requirementResponse: "/solicitacoes/veiculos-divulgacao/respostas-comunicado",
  },
};
```

Nenhuma credencial sensível deve ser enviada no JavaScript do navegador.
