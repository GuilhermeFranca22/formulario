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
FORM_API_URL=https://URL-DA-API.vercel.app/api
```

O fluxo implementado nesta versão contempla somente **Processo novo**. Os anexos são enviados diretamente para URLs temporárias do armazenamento privado e, após a confirmação, a API devolve o protocolo criado no GeoMídia.
