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

## Robô do Google Drive (montado em 20/10/2026)

Arquivos: `robo-drive.js` (o robô) e `.github/workflows/robo-drive.yml` (o agendamento, de hora em hora, no GitHub Actions, gratuito para repositório público). O robô lê a pasta **Comercial** do Drive (uma subpasta por marca, dentro dela por mês ou por material) e lança cada arquivo novo na fila de materiais com link, marca (pelo nome da subpasta) e tipo (pelo nome e pelo formato do arquivo). Arquivo trocado depois de lançado ganha uma observação na fila. Nada é apagado nem movido no Drive: a conta só lê.

Como ele reconhece a marca: nome da subpasta igual ao nome da marca na plataforma. Se a pasta tiver outro nome, preencher o campo **Pasta no Drive** na ficha da marca. Arquivo em pasta não reconhecida entra na fila sem marca, com aviso para escolher.

Para ligar (só uma vez):

1. No Firebase (console.firebase.google.com, projeto comercial-duas-rodas), em Configurações do projeto, aba Contas de serviço, clicar em **Gerar nova chave privada**. Baixa um arquivo `.json`. Essa é a chave da conta `firebase-adminsdk-fbsvc@comercial-duas-rodas.iam.gserviceaccount.com`, que já tem acesso ao Firestore.
2. No Drive, compartilhar a pasta **Comercial** com esse e-mail acima, como **Leitor**.
3. No GitHub, em Settings do repositório, Secrets and variables, Actions, criar o segredo **GOOGLE_SERVICE_ACCOUNT** colando o conteúdo inteiro do arquivo `.json`. Apagar o arquivo do computador depois.
4. (Opcional) Na aba Variables, criar **DRIVE_PASTA_ID** com o id da pasta Comercial (o trecho depois de `folders/` no endereço dela). Sem isso o robô procura uma pasta chamada Comercial entre as compartilhadas. **DIAS_INICIAIS** muda quantos dias para trás a primeira rodada olha (padrão 30).
5. Em Actions, abrir "Robô do Drive" e clicar em **Run workflow** para a primeira rodada. Depois ele roda sozinho a cada hora.

A API do Google Drive já está ativada no projeto (20/10/2026). O estado de cada rodada fica em `robo/drive` no Firestore (a plataforma mostra em Ajustes o último arquivo lançado). Aviso do GitHub: agendamento em repositório sem commit por 60 dias é pausado; basta reativar em Actions.

## Próximas etapas combinadas

- Puxar resultados do Instagram e do Facebook pelo link (API do perfil da revista), para o relatório sair sem digitar número.
- E-mail marketing pela API da Dinamize, se o plano tiver API.
- Níveis de acesso, quando o time decidir que precisa.
