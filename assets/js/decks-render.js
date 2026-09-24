// Order sections consistently regardless of what appears in each deck
const SECTION_ORDER = ["COMMANDER", "PLANESWALKERS", "CREATURES", "ARTIFACTS", "INSTANTS", "SORCERIES", "ENCHANTMENTS", "LANDS"];

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function scryfallSearchUrl(name) {
  return `https://scryfall.com/search?q=${encodeURIComponent(`!"${name}"`)}`;
}

function renderDecks() {
  const root = document.getElementById("decks-root");
  let html = "";

  DECKS_DATA.forEach(deck => {
    const cmdrImgs = deck.commanders.map(c => {
      let imgs = `<img src="assets/mtg/${c.img}" alt="${escapeHtml(c.name)}">`;
      if (c.img2) imgs += `<img src="assets/mtg/${c.img2}" alt="${escapeHtml(c.name)} (back)">`;
      return imgs;
    }).join("");

    const cmdrNames = deck.commanders.map(c => c.name).join(" + ");

    // Build a working copy of sections with COMMANDER synthesized from deck.commanders
    const sections = Object.assign({}, deck.sections);
    sections["COMMANDER"] = deck.commanders.map(c => ({ qty: 1, name: c.name }));

    let sectionsHtml = "";
    SECTION_ORDER.forEach(sec => {
      const cards = sections[sec];
      if (!cards) return;
      const chips = cards.map(c => {
        const qtyLabel = c.qty > 1 ? `<span class="qty">${c.qty}×</span>` : "";
        const searchName = c.name.split(" // ")[0];
        return `<a class="card-name" href="${scryfallSearchUrl(searchName)}" target="_blank" rel="noopener" data-card="${escapeHtml(searchName)}">${qtyLabel}${escapeHtml(c.name)}</a>`;
      }).join("");
      const label = sec.charAt(0) + sec.slice(1).toLowerCase();
      sectionsHtml += `
        <div class="card-section">
          <h4>${label}</h4>
          <div class="card-chips">${chips}</div>
        </div>`;
    });

    html += `
      <div class="deck-card">
        <div class="deck-head">
          <div class="deck-commanders">${cmdrImgs}</div>
          <div class="deck-title-block">
            <h3>"${escapeHtml(deck.title)}"</h3>
            <div class="deck-cmdr-names">${escapeHtml(cmdrNames)}</div>
          </div>
        </div>
        <details>
          <summary>View decklist</summary>
          <div class="deck-body">${sectionsHtml}</div>
        </details>
      </div>`;
  });

  root.innerHTML = html;
  attachHoverPreviews();
}

function attachHoverPreviews() {
  const tooltip = document.getElementById("scry-tooltip");
  const cache = {};

  document.querySelectorAll(".card-name").forEach(el => {
    el.addEventListener("mouseenter", async (e) => {
      const name = el.getAttribute("data-card");
      tooltip.style.display = "block";
      positionTooltip(e);

      if (cache[name]) {
        tooltip.innerHTML = `<img src="${cache[name]}" alt="${escapeHtml(name)}">`;
        return;
      }

      tooltip.innerHTML = `<div class="scry-loading">Loading…</div>`;
      try {
        const res = await fetch(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`);
        if (!res.ok) throw new Error("not found");
        const data = await res.json();
        let imgUrl;
        if (data.image_uris) {
          imgUrl = data.image_uris.normal;
        } else if (data.card_faces && data.card_faces[0].image_uris) {
          imgUrl = data.card_faces[0].image_uris.normal;
        }
        if (imgUrl) {
          cache[name] = imgUrl;
          tooltip.innerHTML = `<img src="${imgUrl}" alt="${escapeHtml(name)}">`;
        } else {
          tooltip.innerHTML = `<div class="scry-loading">No image found</div>`;
        }
      } catch (err) {
        tooltip.innerHTML = `<div class="scry-loading">Not found on Scryfall</div>`;
      }
    });

    el.addEventListener("mousemove", positionTooltip);

    el.addEventListener("mouseleave", () => {
      tooltip.style.display = "none";
    });
  });

  function positionTooltip(e) {
    const offset = 18;
    const tw = 280, th = 390;
    let x = e.clientX + offset;
    let y = e.clientY + offset;
    if (x + tw > window.innerWidth) x = e.clientX - tw - offset;
    if (y + th > window.innerHeight) y = window.innerHeight - th - 10;
    if (y < 10) y = 10;
    tooltip.style.left = x + "px";
    tooltip.style.top = y + "px";
  }
}

document.addEventListener("DOMContentLoaded", renderDecks);
