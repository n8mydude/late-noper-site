// Order sections consistently regardless of what appears in each deck
const SECTION_ORDER = ["PLANESWALKERS", "CREATURES", "ARTIFACTS", "INSTANTS", "SORCERIES", "ENCHANTMENTS", "LANDS"];

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
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

    let sectionsHtml = "";
    SECTION_ORDER.forEach(sec => {
      const cards = deck.sections[sec];
      if (!cards) return;
      const chips = cards.map(c => {
        const qtyLabel = c.qty > 1 ? `<span class="qty">${c.qty}×</span>` : "";
        const searchName = c.name.split(" // ")[0];
        return `<span class="card-name" data-card="${escapeHtml(searchName)}">${qtyLabel}${escapeHtml(c.name)}</span>`;
      }).join("");
      sectionsHtml += `
        <div class="card-section">
          <h4>${sec.charAt(0) + sec.slice(1).toLowerCase()}</h4>
          <div class="card-chips">${chips}</div>
        </div>`;
    });

    html += `
      <div class="deck-card">
        <div class="deck-head">
          <div class="deck-commanders">${cmdrImgs}</div>
          <div class="deck-title-block">
            <h3>Deck ${deck.num}: "${escapeHtml(deck.title)}"</h3>
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
    const offset = 16;
    let x = e.clientX + offset;
    let y = e.clientY + offset;
    if (x + 190 > window.innerWidth) x = e.clientX - 190 - offset;
    if (y + 260 > window.innerHeight) y = window.innerHeight - 260 - 10;
    tooltip.style.left = x + "px";
    tooltip.style.top = y + "px";
  }
}

document.addEventListener("DOMContentLoaded", renderDecks);
