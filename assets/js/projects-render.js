function escapeHtmlP(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function buildProjectPanel(p) {
  if (p.slug === "the-akward-cello-book") {
    return `
      <div class="project-panel" id="panel-${p.slug}" data-panel="${p.slug}">
        <h2>${escapeHtmlP(p.title)}</h2>
        <div class="pdf-feature">
          <a class="btn btn-primary" href="assets/projects/${p.pdf}" target="_blank" rel="noopener">Read the book (PDF)</a>
          <a class="btn btn-ghost" href="assets/projects/${p.pdf}" download>Download</a>
        </div>
      </div>`;
  }
  const cards = p.items.map(it => {
    if (it.type === "video") {
      return `<div class="photo-card" data-full="assets/projects/${p.slug}/${it.src}">
        <video src="assets/projects/${p.slug}/${it.src}" poster="assets/projects/${p.slug}/${it.poster}" muted loop playsinline preload="metadata"></video>
      </div>`;
    }
    return `<div class="photo-card" data-full="assets/projects/${p.slug}/${it.src}">
        <img src="assets/projects/${p.slug}/${it.src}" alt="${escapeHtmlP(it.alt)}" loading="lazy">
      </div>`;
  }).join("");
  return `
    <div class="project-panel" id="panel-${p.slug}" data-panel="${p.slug}">
      <h2>${escapeHtmlP(p.title)}</h2>
      <div class="gallery project-grid">${cards}</div>
    </div>`;
}

function renderProjects() {
  const tabsRoot = document.getElementById("project-tabs");
  const panelsRoot = document.getElementById("project-panels");

  let tabsHtml = "";
  let panelsHtml = "";

  PROJECTS_DATA.forEach((p, i) => {
    tabsHtml += `<button class="tab-btn" data-tab="${p.slug}" role="tab" aria-selected="false">${escapeHtmlP(p.title)}</button>`;
    panelsHtml += buildProjectPanel(p);
  });

  // Decks tab goes last
  tabsHtml += `<button class="tab-btn" data-tab="decks" role="tab" aria-selected="false">Decks</button>`;
  panelsHtml += `
    <div class="project-panel" id="panel-decks" data-panel="decks">
      <h2>Decks</h2>
      <p class="project-blurb">Hover over a card to see it. Click on it to open its Scryfall page. Message me with suggestions. Challenge me if you dare!</p>
      <div id="decks-root"><p style="color:var(--birch-dim);">Loading decks…</p></div>
    </div>`;

  tabsRoot.innerHTML = tabsHtml;
  panelsRoot.innerHTML = panelsHtml;

  const tabBtns = Array.from(tabsRoot.querySelectorAll(".tab-btn"));
  const panels = Array.from(panelsRoot.querySelectorAll(".project-panel"));

  function activate(slug, pushHash) {
    tabBtns.forEach(b => {
      const on = b.getAttribute("data-tab") === slug;
      b.classList.toggle("active", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
    panels.forEach(p => p.classList.toggle("open", p.getAttribute("data-panel") === slug));
    if (pushHash) history.replaceState(null, "", "#" + slug);
  }

  tabBtns.forEach(b => {
    b.addEventListener("click", () => {
      activate(b.getAttribute("data-tab"), true);
      b.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    });
  });

  const initial = (location.hash || "").replace("#", "");
  const initialSlug = tabBtns.some(b => b.getAttribute("data-tab") === initial) ? initial : PROJECTS_DATA[0].slug;
  activate(initialSlug, false);

  attachProjectLightbox();
  if (typeof renderDecks === "function") renderDecks();
}

function attachProjectLightbox() {
  const lightbox = document.getElementById("lightbox");
  const previewVideos = document.querySelectorAll(".project-grid video");
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.play().catch(() => {});
      else entry.target.pause();
    });
  }, { threshold: 0.4 });
  previewVideos.forEach(v => io.observe(v));

  document.querySelectorAll(".project-grid .photo-card").forEach(card => {
    card.addEventListener("click", () => {
      const src = card.getAttribute("data-full");
      const isVideo = /\.(mp4|webm|mov)$/i.test(src);
      lightbox.innerHTML = isVideo
        ? `<video src="${src}" controls autoplay playsinline></video>`
        : `<img src="${src}" alt="">`;
      requestAnimationFrame(() => lightbox.classList.add("open"));
    });
  });
  lightbox.addEventListener("click", () => {
    lightbox.classList.remove("open");
    setTimeout(() => { lightbox.innerHTML = ""; }, 280);
  });
}

document.addEventListener("DOMContentLoaded", renderProjects);
