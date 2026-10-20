# Comercial Duas Rodas

Plataforma de controle das entregas comerciais da Revista Duas Rodas: marcas, autorizações (contratos), cotas por produto com barrinha de consumo e alertas, fila de materiais, linha do tempo de brand, fila de edição, calendário e relatório por cliente.

Sem build e sem servidor: é HTML, CSS e JavaScript puros. Publica direto no GitHub Pages.

## Arquivos

- `index.html` casca da página.
- `styles.css` estilos (identidade vermelho, preto e branco).
- `app.js` toda a lógica e as telas.
- `relatorio.js` gerador do relatório 16:9 no padrão visual da revista.
- `tutorial.js` passeio guiado (abre sozinho na primeira visita) e guia passo a passo do botão ? no topo.
- `logo.png` e `logo-branco.png` logo oficial, a versão branca para fundo preto.
- `dados-iniciais.js` dados importados das planilhas Branded (Fê) e Status de edições (New). A plataforma copia isto para o armazenamento na primeira abertura.
- `firebase-config.js` configuração do Firebase e a chave da YouTube Data API (`window.YOUTUBE_KEY`). Enquanto o Firebase for `null`, os dados ficam no navegador de cada pessoa.

## Publicar

Publicado em 19/10/2026 no repositório `contato-lab/duas-rodas-comercial` (GitHub Pages, branch `main`, pasta raiz). Endereço: https://contato-lab.github.io/duas-rodas-comercial/

Para atualizar: subir o arquivo alterado de novo pelo upload, que substitui o antigo. Trocar o `?v=1` dos arquivos no `index.html` quando mudar CSS ou JS, para o navegador não usar a versão guardada.

## Dados compartilhados (Firebase)

Feito em 19/10/2026. Projeto `comercial-duas-rodas` na conta Agência UnderClick (mesma dos projetos do festival), Firestore em `southamerica-east1`, login anônimo ligado, domínio `contato-lab.github.io` autorizado. A configuração está em `firebase-config.js`. Na primeira abertura com o Firestore vazio, a plataforma carregou sozinha os dados das planilhas.

Regras publicadas (o botão Publicar do console não aparecia, então foram publicadas pelo Cloud Shell com `firebase deploy --only firestore:rules`):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{colecao}/{doc} {
      allow read, write: if request.auth != null
        && colecao in ['marcas','autorizacoes','brands','entregas','fila','edicao'];
    }
  }
}
```

Para mudar as regras de novo: abrir https://shell.cloud.google.com com a conta, pasta `~/dr`, editar `firestore.rules` e rodar o mesmo comando.

## YouTube (feito em 20/10/2026)

Visualizações, curtidas e comentários dos vídeos de brand entram pelo link do campo Vídeo final (YouTube). A chave está em `firebase-config.js` (`window.YOUTUBE_KEY`), criada no Google Cloud do projeto `comercial-duas-rodas` com o nome "YouTube Comercial Duas Rodas", restrita só à YouTube Data API v3 e aos sites `https://contato-lab.github.io/*` e `http://localhost:8765/*`. Por isso ela pode ficar no código: fora desses endereços e dessa API ela não serve para nada. Os números ficam gravados no vídeo (`brand.youtube`) e atualizam sozinhos ao abrir Relatórios da marca, ou pelo botão Números do YouTube no menu Brand. Cota da API: 10.000 unidades por dia, cada consulta de até 50 vídeos gasta 1.

## Próximas etapas combinadas

- Robô do Google Drive: varrer a pasta Duas Rodas / Comercial (uma pasta por marca e mês) de hora em hora e lançar arquivos novos na fila de materiais.
- Puxar resultados do Instagram e do Facebook pelo link (API do perfil da revista), para o relatório sair sem digitar número.
- E-mail marketing pela API da Dinamize, se o plano tiver API.
- Níveis de acesso, quando o time decidir que precisa.
