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
- `firebase-config.js` configuração do Firebase. Enquanto for `null`, os dados ficam no navegador de cada pessoa.

## Publicar

1. Criar o repositório `contato-lab/duas-rodas-comercial` no GitHub (público).
2. Subir todos os arquivos desta pasta pela opção "Add file > Upload files".
3. Em Settings > Pages, escolher a branch `main` e a pasta raiz.
4. O endereço fica `https://contato-lab.github.io/duas-rodas-comercial/`.

Para atualizar: subir o arquivo alterado de novo pelo upload, que substitui o antigo. Trocar o `?v=1` dos arquivos no `index.html` quando mudar CSS ou JS, para o navegador não usar a versão guardada.

## Dados compartilhados (Firebase)

Hoje cada pessoa tem a própria cópia no navegador. Para o time inteiro ver a mesma coisa:

1. No console do Firebase, criar o projeto `comercial-duas-rodas` na mesma conta de faturamento dos outros projetos.
2. Ativar o Firestore (região `southamerica-east1`) e, em Authentication, o método "Anônimo".
3. Colar a configuração web em `firebase-config.js` e publicar.
4. Regras do Firestore para esta etapa (sem login, só quem abre a página escreve):

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

5. Abrir a plataforma, ir em Ajustes e usar "Importar dados" com o JSON exportado do navegador que tem os dados certos.

## Próximas etapas combinadas

- Robô do Google Drive: varrer a pasta Duas Rodas / Comercial (uma pasta por marca e mês) de hora em hora e lançar arquivos novos na fila de materiais.
- Puxar resultados do Instagram e do YouTube pelo link, para o relatório sair sem digitar número.
- Níveis de acesso, quando o time decidir que precisa.
