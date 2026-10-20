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

Desde 20/10/2026 (noite) o projeto é **`comercial-duas-rodas-lime`**, na conta **performance@limeag.com** (organização limeag.com), plano **Blaze** na conta de faturamento "Minha conta de faturamento" (`012838-4D0F3E-9FEC07`), a mesma do festival-interlagos-2026, com crédito do Google Cloud. Firestore em `southamerica-east1`, login anônimo ligado, domínio `contato-lab.github.io` autorizado, número do projeto `838601584480`. A configuração está em `firebase-config.js`. Na primeira abertura com o Firestore vazio, a plataforma carregou sozinha os dados das planilhas.

O projeto anterior, `comercial-duas-rodas` (conta Agência, plano grátis), estourou a cota de leituras do dia 20/10 e ficou de backup; não recebe mais nada.

Regras publicadas pelo Cloud Shell da conta Lime (pasta `~/dr2`, `firebase deploy --only firestore:rules`):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{colecao}/{doc} {
      allow read, write: if request.auth != null
        && colecao in ['marcas','autorizacoes','brands','entregas','fila','edicao','robo'];
    }
  }
}
```

Para mudar as regras: abrir https://shell.cloud.google.com com a conta performance@limeag.com, pasta `~/dr2`, editar `firestore.rules` e rodar o mesmo comando.

## YouTube (feito em 20/10/2026)

Visualizações, curtidas e comentários dos vídeos de brand entram pelo link do campo Vídeo final (YouTube). A chave está em `firebase-config.js` (`window.YOUTUBE_KEY`), criada no Google Cloud do projeto `comercial-duas-rodas-lime` com o nome "YouTube Comercial Duas Rodas" (pelo Cloud Shell, `gcloud services api-keys create`), restrita só à YouTube Data API v3 e aos sites `https://contato-lab.github.io/*` e `http://localhost:8765/*`. Por isso ela pode ficar no código: fora desses endereços e dessa API ela não serve para nada. Os números ficam gravados no vídeo (`brand.youtube`) e atualizam sozinhos ao abrir Relatórios da marca, ou pelo botão Números do YouTube no menu Brand. Cota da API: 10.000 unidades por dia, cada consulta de até 50 vídeos gasta 1.

## Robô do Google Drive (ligado em 20/10/2026)

Arquivos: `robo-drive.js` (o robô) e `.github/workflows/robo-drive.yml` (o agendamento, de hora em hora, no GitHub Actions, gratuito para repositório público). O robô lê a pasta **MATERIAIS** do Drive da Lime (em Compartilhados comigo / 2025 / DUAS RODAS / MATERIAIS, id `1MjcOLiyJ_z5sZ8MK63YjOhwK_jGB9tLa`, guardado na variável `DRIVE_PASTA_ID` do repositório). Dentro dela, uma subpasta por marca (mesmo nome da marca na plataforma) e, dentro, o que o time quiser (por mês ou solto). Cada arquivo novo entra na fila de materiais com link, marca (pela subpasta) e tipo (pelo nome e formato). Arquivo trocado depois de lançado ganha uma observação na fila. Nada é apagado nem movido no Drive: a conta só lê.

Se a pasta de uma marca tiver outro nome, preencher o campo **Pasta no Drive** na ficha da marca. Arquivo em pasta não reconhecida entra na fila sem marca, com aviso para escolher. Na primeira rodada o robô só olha arquivos alterados nos últimos 30 dias (variável `DIAS_INICIAIS` muda isso).

Como ele entra no Google, sem chave nenhuma: a organização da conta proíbe chaves de conta de serviço, então o GitHub se identifica direto no Google Cloud (Workload Identity Federation). No projeto `comercial-duas-rodas-lime` (número 838601584480) existe o pool `github` com o provedor `github`, aceitando só o repositório `contato-lab/duas-rodas-comercial`, e esse repositório pode agir como a conta `firebase-adminsdk-fbsvc@comercial-duas-rodas-lime.iam.gserviceaccount.com` (que já tem Firestore). A pasta MATERIAIS está compartilhada com esse e-mail como leitor. Foi feito pelo Cloud Shell com `gcloud iam workload-identity-pools create`, `providers create-oidc` e `service-accounts add-iam-policy-binding`. APIs ativadas: Drive, IAM Credentials, STS.

Para rodar na hora, sem esperar a hora cheia: Actions, "Robô do Drive", Run workflow. O estado de cada rodada fica em `robo/drive` no Firestore; a plataforma mostra em Ajustes o último arquivo lançado. Aviso do GitHub: agendamento em repositório sem commit por 60 dias é pausado; basta reativar em Actions.

## Próximas etapas combinadas

- Puxar resultados do Instagram e do Facebook pelo link (API do perfil da revista), para o relatório sair sem digitar número.
- E-mail marketing pela API da Dinamize, se o plano tiver API.
- Níveis de acesso, quando o time decidir que precisa.
