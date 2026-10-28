// Lógica da loja: catálogo, detalhe do produto e pedido por WhatsApp.

const WHATSAPP = "244929005501";
const MIN_REVENDA = 10;       // unidades do mesmo perfume
// Desconto de revenda por unidade, conforme o preço do perfume.
const descontoRevenda = (p) => (p.preco <= 30000 ? 5000 : p.preco <= 40000 ? 6000 : 8000);

// Perfumes com stock neste momento. Os restantes aparecem como "Esgotado" e podem ser encomendados.
const EM_STOCK = ["malbec-flame", "sevilla-dorada-masculino", "egeo-dolce", "malbec-black", "malbec-gold", "nativa-spa-quinoa"];
const emStock = (p) => EM_STOCK.includes(p.id);
const AVISO_ENCOMENDA = "Por encomenda: cerca de 1 mês, com 50% pago antes.";

const GENEROS = { feminino: "Feminino", masculino: "Masculino", corpo: "Cuidados do corpo" };

const kz = (v) => v.toLocaleString("pt-PT").replace(/\s/g, ".") + " Kz";
// A regra de revenda aplica-se só a perfumes, não a produtos de corpo.
const temRevenda = (p) => p.genero !== "corpo";
const precoUnitario = (p, qtd) => (temRevenda(p) && qtd >= MIN_REVENDA ? p.preco - descontoRevenda(p) : p.preco);
const porId = (id) => PRODUTOS.find((p) => p.id === id);

// ---------- Catálogo ----------
const grelha = document.getElementById("grelha");

let filtroAtual = "todos";
let termoPesquisa = "";

// Pesquisa sem distinguir maiúsculas nem acentos.
const normalizar = (t) => (t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const textoPesquisavel = (p) =>
  normalizar([p.nome, p.marca, p.tipo, p.familia, p.descricao, p.notas && Object.values(p.notas).join(" ")].join(" "));

function desenharCatalogo() {
  const palavras = normalizar(termoPesquisa).split(/\s+/).filter(Boolean);
  const lista = PRODUTOS.filter(
    (p) =>
      (filtroAtual === "todos" || p.genero === filtroAtual) &&
      palavras.every((w) => textoPesquisavel(p).includes(w))
  ).sort((a, b) => emStock(b) - emStock(a)); // disponíveis primeiro
  if (!lista.length) {
    grelha.innerHTML = `<p class="sem-resultados">Nenhum produto encontrado. Não encontrou o perfume que procura? <a href="https://wa.me/244929005501" target="_blank" rel="noopener">Fale connosco pelo WhatsApp</a>: faremos o possível para trazer até si o perfume que deseja.</p>`;
    return;
  }
  grelha.innerHTML = lista
    .map(
      (p) => `
    <article class="cartao${emStock(p) ? "" : " esgotado"}">
      <button class="cartao-img" data-ver="${p.id}" aria-label="Ver detalhes de ${p.nome}">
        <img src="${p.imagem}" alt="${p.nome}" loading="lazy">
        <span class="selo ${emStock(p) ? "selo-disponivel" : "selo-esgotado"}">${emStock(p) ? "Disponível" : "Esgotado"}</span>
      </button>
      <div class="cartao-corpo">
        <span class="cartao-marca">${p.marca}</span>
        <h3>${p.nome}</h3>
        <span class="etiqueta">${p.genero ? GENEROS[p.genero] : "Género por confirmar"}${p.tamanho ? ` · ${p.tamanho}` : ""}</span>
        <span class="preco">${kz(p.preco)}</span>
        ${temRevenda(p) ? `<span class="preco-revenda">Revenda (10+ un.): ${kz(p.preco - descontoRevenda(p))}</span>` : ""}
        ${emStock(p) ? "" : `<span class="por-encomenda">${AVISO_ENCOMENDA}</span>`}
        <div class="cartao-acoes">
          <button data-ver="${p.id}">Detalhes</button>
          <button class="adicionar" data-adicionar="${p.id}">${emStock(p) ? "Adicionar" : "Encomendar"}</button>
        </div>
      </div>
    </article>`
    )
    .join("");
}

document.querySelector(".filtros").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  document.querySelectorAll(".filtros button").forEach((x) => x.classList.toggle("ativo", x === b));
  filtroAtual = b.dataset.filtro;
  desenharCatalogo();
});

grelha.addEventListener("click", (e) => {
  const ver = e.target.closest("[data-ver]");
  const add = e.target.closest("[data-adicionar]");
  if (ver) abrirDetalhe(ver.dataset.ver);
  if (add) { adicionar(add.dataset.adicionar, 1); abrirPainel(); }
});

// ---------- Detalhe ----------
const dialogo = document.getElementById("detalhe");

function abrirDetalhe(id) {
  const p = porId(id);
  const linhas = [];
  if (p.tipo) linhas.push(`<dt>Tipo</dt><dd>${p.tipo}</dd>`);
  linhas.push(`<dt>Tamanho</dt><dd>${p.tamanho || "Por confirmar"}</dd>`);
  linhas.push(`<dt>Categoria</dt><dd>${p.genero ? GENEROS[p.genero] : "Por confirmar"}</dd>`);
  if (p.familia) linhas.push(`<dt>Família olfativa</dt><dd>${p.familia}</dd>`);
  if (p.notas) {
    linhas.push(`<dt>Notas de topo</dt><dd>${p.notas.topo}</dd>`);
    linhas.push(`<dt>Notas de coração</dt><dd>${p.notas.coracao}</dd>`);
    linhas.push(`<dt>Notas de fundo</dt><dd>${p.notas.fundo}</dd>`);
  }
  const descricao = p.descricao
    ? `<p>${p.descricao}</p>`
    : `<p class="aviso">Ainda não temos a descrição confirmada deste produto. Fale connosco pelo WhatsApp para mais informações.</p>`;

  dialogo.innerHTML = `
    <div class="detalhe">
      <img src="${p.imagem}" alt="${p.nome}">
      <div class="detalhe-texto">
        <button class="fechar" aria-label="Fechar">✕</button>
        <span class="cartao-marca">${p.marca}</span>
        <h3>${p.nome}</h3>
        ${descricao}
        <dl>${linhas.join("")}</dl>
        <p class="${emStock(p) ? "disponivel" : "aviso"}">${emStock(p) ? "Disponível" : `<strong>Esgotado.</strong> ${AVISO_ENCOMENDA}`}</p>
        <p class="preco">${kz(p.preco)}</p>
        ${temRevenda(p) ? `<p class="preco-revenda">Revenda (10 ou mais unidades): ${kz(p.preco - descontoRevenda(p))} por unidade</p>` : ""}
        <div class="cartao-acoes"><button class="adicionar" data-adicionar="${p.id}">${emStock(p) ? "Adicionar ao pedido" : "Encomendar"}</button></div>
        ${p.fonte ? `<p class="fonte">Fonte da descrição: <a href="${p.fonte}" target="_blank" rel="noopener">${new URL(p.fonte).hostname}</a></p>` : ""}
      </div>
    </div>`;
  dialogo.showModal();
}

dialogo.addEventListener("click", (e) => {
  if (e.target === dialogo || e.target.closest(".fechar")) dialogo.close();
  const add = e.target.closest("[data-adicionar]");
  if (add) { adicionar(add.dataset.adicionar, 1); dialogo.close(); abrirPainel(); }
});

// ---------- Pedido ----------
let pedido = {};
try { pedido = JSON.parse(localStorage.getItem("europafashion-pedido")) || {}; } catch { pedido = {}; }

function guardar() {
  try { localStorage.setItem("europafashion-pedido", JSON.stringify(pedido)); } catch {}
  desenharPedido();
}

function adicionar(id, n) {
  pedido[id] = Math.max(0, (pedido[id] || 0) + n);
  if (!pedido[id]) delete pedido[id];
  guardar();
}

function definir(id, n) {
  n = Math.max(0, parseInt(n, 10) || 0);
  if (n) pedido[id] = n; else delete pedido[id];
  guardar();
}

function desenharPedido() {
  const itens = document.getElementById("itens");
  const ids = Object.keys(pedido).filter(porId);
  let total = 0, unidades = 0;
  itens.innerHTML = ids.length
    ? ids
        .map((id) => {
          const p = porId(id), q = pedido[id], u = precoUnitario(p, q);
          total += u * q; unidades += q;
          const faltam = MIN_REVENDA - q;
          return `
      <div class="item">
        <img src="${p.imagem}" alt="">
        <div>
          <div class="item-nome">${p.nome}</div>
          ${emStock(p) ? "" : `<div class="item-preco">Esgotado · por encomenda (cerca de 1 mês)</div>`}
          <div class="item-preco">${kz(u)} × ${q} = ${kz(u * q)}</div>
          ${!temRevenda(p) ? "" : q >= MIN_REVENDA
            ? `<div class="item-revenda">Preço de revendedor aplicado (−${kz(descontoRevenda(p))}/un.)</div>`
            : `<div class="item-preco">Faltam ${faltam} un. para o preço de revendedor</div>`}
          <div class="qtd">
            <button data-menos="${id}" aria-label="Menos">−</button>
            <input type="number" min="0" value="${q}" data-qtd="${id}" aria-label="Quantidade">
            <button data-mais="${id}" aria-label="Mais">+</button>
            <button class="remover" data-remover="${id}">Remover</button>
          </div>
        </div>
      </div>`;
        })
        .join("")
    : `<p class="vazio">O seu pedido está vazio.</p>`;
  document.getElementById("total").textContent = kz(total);
  document.getElementById("contador").textContent = unidades;
}

document.getElementById("itens").addEventListener("click", (e) => {
  const t = e.target;
  if (t.dataset.menos) adicionar(t.dataset.menos, -1);
  if (t.dataset.mais) adicionar(t.dataset.mais, 1);
  if (t.dataset.remover) definir(t.dataset.remover, 0);
});
document.getElementById("itens").addEventListener("change", (e) => {
  if (e.target.dataset.qtd) definir(e.target.dataset.qtd, e.target.value);
});

document.getElementById("enviarPedido").addEventListener("click", () => {
  const ids = Object.keys(pedido).filter(porId);
  if (!ids.length) return;
  let total = 0;
  const linhas = ids.map((id) => {
    const p = porId(id), q = pedido[id], u = precoUnitario(p, q);
    total += u * q;
    return `• ${q} × ${p.nome} (${p.marca}) — ${kz(u)}/un.${u < p.preco ? " [revendedor]" : ""}${emStock(p) ? "" : " [por encomenda]"} = ${kz(u * q)}`;
  });
  const texto = `Olá EuropaFashion! Gostaria de fazer este pedido:\n\n${linhas.join("\n")}\n\nTotal: ${kz(total)}`;
  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`, "_blank");
});

const painel = document.getElementById("painel");
const sombra = document.getElementById("sombra");
function abrirPainel() { painel.classList.add("aberto"); sombra.classList.add("ativa"); painel.setAttribute("aria-hidden", "false"); }
function fecharPainel() { painel.classList.remove("aberto"); sombra.classList.remove("ativa"); painel.setAttribute("aria-hidden", "true"); }
document.getElementById("abrirCarrinho").addEventListener("click", abrirPainel);
document.getElementById("fecharCarrinho").addEventListener("click", fecharPainel);
sombra.addEventListener("click", fecharPainel);

document.getElementById("pesquisa").addEventListener("input", (e) => {
  termoPesquisa = e.target.value;
  desenharCatalogo();
});

desenharCatalogo();
desenharPedido();
