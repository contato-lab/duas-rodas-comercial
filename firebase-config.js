// Configuração do Firebase (Firestore) desta plataforma.
// Projeto comercial-duas-rodas (conta Agência UnderClick, mesma dos projetos do festival).
// Firestore em southamerica-east1, entrada anônima. Enquanto este objeto existir, os dados
// são compartilhados por todo mundo que abrir a página; sem ele, ficam só no navegador.
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyAYftYfuru6ZptdCsZ_sUn_uT6aPKdwQF8",
  authDomain: "comercial-duas-rodas.firebaseapp.com",
  projectId: "comercial-duas-rodas",
  storageBucket: "comercial-duas-rodas.firebasestorage.app",
  messagingSenderId: "742696232796",
  appId: "1:742696232796:web:e11f03c92fda3fa14b8399"
};

// Chave da YouTube Data API v3 (mesmo projeto Google Cloud), restrita ao endereço do site.
// Serve só para LER visualizações, curtidas e comentários de vídeos públicos ou não listados.
// Enquanto for null, os números do YouTube ficam para digitar à mão.
window.YOUTUBE_KEY = "AIzaSyB5E_FvsTnVvqn5vfwTFLG0HC1q-zclll8";
