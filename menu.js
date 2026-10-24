// Menu do telemóvel: abre e fecha a lista de opções.
(() => {
  const botao = document.getElementById("botaoMenu");
  const menu = document.getElementById("menuPrincipal");
  if (!botao || !menu) return;
  const definir = (aberto) => {
    menu.classList.toggle("aberto", aberto);
    botao.setAttribute("aria-expanded", String(aberto));
    botao.textContent = aberto ? "✕ Fechar" : "☰ Menu";
  };
  botao.addEventListener("click", () => definir(!menu.classList.contains("aberto")));
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) definir(false); });
  document.addEventListener("click", (e) => {
    if (!menu.contains(e.target) && e.target !== botao) definir(false);
  });
})();
