// Configuração do Firebase (Firestore) desta plataforma.
// Projeto comercial-duas-rodas-lime (conta performance@limeag.com, organização limeag.com, plano Blaze
// na mesma conta de faturamento do festival-interlagos-2026). Firestore em southamerica-east1,
// entrada anônima. Enquanto este objeto existir, os dados são compartilhados por todo mundo que
// abrir a página; sem ele, ficam só no navegador.
// O projeto antigo comercial-duas-rodas (conta Agência, plano grátis) ficou de backup até 21/10/2026.
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyA9Frfju6O3BKt8q3i3FZ31IwKPK4BYns4",
  authDomain: "comercial-duas-rodas-lime.firebaseapp.com",
  projectId: "comercial-duas-rodas-lime",
  storageBucket: "comercial-duas-rodas-lime.firebasestorage.app",
  messagingSenderId: "838601584480",
  appId: "1:838601584480:web:fb5af33a1ef17fb5e17805"
};

// Chave da YouTube Data API v3 (mesmo projeto Google Cloud), restrita ao endereço do site.
// Serve só para LER visualizações, curtidas e comentários de vídeos públicos ou não listados.
// Enquanto for null, os números do YouTube ficam para digitar à mão.
window.YOUTUBE_KEY = "AIzaSyArSyfERbErUj2fY0gjEoN9kW8tHS3QtxQ";
