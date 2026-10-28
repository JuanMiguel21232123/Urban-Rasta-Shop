// Página de una colección: categoria.html?c=esenciales | vapers | ropa
const CAT = new URLSearchParams(location.search).get("c");
if (!CATEGORIES[CAT]) location.replace("index.html#colecciones");
const INFO = CATEGORIES[CAT] || CATEGORIES.esenciales;

document.body.dataset.cat = CAT;
document.title = `${INFO.title} | Urban Rasta Shop`;
$("#cat-eyebrow").textContent = `${INFO.num} · COLECCIÓN`;
// data-s hace que Personalización (textos del admin) también aplique aquí
$("#cat-title").dataset.s = CAT + "_title";
$("#cat-title").textContent = INFO.title;
$("#cat-text").dataset.s = CAT + "_text";
$("#cat-text").textContent = INFO.text;

$("#cat-switch").innerHTML = Object.entries(CATEGORIES).map(([key, c]) =>
  `<a class="tab" href="categoria.html?c=${key}" aria-current="${key === CAT}">${esc(c.title)}</a>`).join("");

const optionsWord = (n) => CAT === "vapers" ? (n === 1 ? "sabor" : "sabores") : (n === 1 ? "opción" : "opciones");

function priceLabel(p, vid) {
  const opts = variantsOf(p);
  if (!opts.length) return money(p.price);
  const chosen = opts.find((o) => String(o.id) === String(vid));
  if (chosen) return money(unitPrice(p, chosen));
  const prices = opts.map((o) => unitPrice(p, o));
  const min = Math.min(...prices);
  return min === Math.max(...prices) ? money(min) : "Desde " + money(min);
}

function card(p) {
  const opts = variantsOf(p);
  const out = soldOut(p);
  const img = /^https?:\/\//.test(p.image_url || "")
    ? `<img src="${esc(p.image_url)}" alt="${esc(p.name)}" loading="lazy">` : "UR";
  const select = opts.length ? `
    <p class="meta">${opts.length} ${optionsWord(opts.length)}</p>
    <div class="variant-field">
      <label for="v-${p.id}">${esc(INFO.variant)}</label>
      <select id="v-${p.id}" class="variant">
        <option value="">Selecciona ${esc(INFO.variant.toLowerCase())}</option>
        ${opts.map((o) => `<option value="${o.id}"${o.sold_out ? " disabled" : ""}>${esc(o.name)}${o.price != null && o.price !== p.price ? " · " + money(o.price) : ""}${o.sold_out ? " · Agotado" : ""}</option>`).join("")}
      </select>
    </div>` : "";
  return `
    <article class="card${out ? " soldout" : ""}" data-id="${p.id}">
      <div class="img">${img}</div>
      <div class="body">
        <h4>${esc(p.name)}</h4>
        <p class="desc">${esc(p.description)}</p>
        ${select}
        <span class="price">${priceLabel(p, null)}</span>
        ${out ? `<button class="add" type="button" disabled>Agotado</button>` : `<button class="add" type="button">Agregar al pedido</button>`}
      </div>
    </article>`;
}

let loaded = false;

function render() {
  const q = $("#search").value.trim().toLowerCase();
  const inCat = products.filter((p) => p.category === CAT);
  const list = inCat.filter((p) => !q ||
    [p.name, p.description, ...variantsOf(p).map((v) => v.name)].join(" ").toLowerCase().includes(q));
  $("#products").innerHTML = list.length ? list.map(card).join("")
    : `<p class="empty">${inCat.length ? "No encontramos nada con esa búsqueda." : "Estamos preparando esta colección. Muy pronto verás aquí nuestros productos."}</p>`;
}

$("#search").addEventListener("input", () => { if (loaded) render(); });

$("#products").addEventListener("change", (e) => {
  const sel = e.target.closest("select.variant");
  if (!sel) return;
  sel.classList.remove("invalid");
  const c = sel.closest(".card"), p = products.find((x) => String(x.id) === c.dataset.id);
  c.querySelector(".price").textContent = priceLabel(p, sel.value);
});

$("#products").addEventListener("click", (e) => {
  const btn = e.target.closest("button.add");
  if (!btn) return;
  const c = btn.closest(".card"), p = products.find((x) => String(x.id) === c.dataset.id);
  if (!p || soldOut(p)) return;
  const sel = c.querySelector("select.variant");
  if (sel && !sel.value) { sel.classList.add("invalid"); sel.focus(); return; }
  addToCart(p.id, sel ? sel.value : null);
  btn.textContent = "Agregado ✓";
  setTimeout(() => (btn.textContent = "Agregar al pedido"), 1200);
});

startShop().then((ok) => {
  if (!ok) {
    $("#products").innerHTML = `<p class="empty">No se pudo cargar el catálogo. Intenta más tarde.</p>`;
    return;
  }
  loaded = true;
  render();
});
