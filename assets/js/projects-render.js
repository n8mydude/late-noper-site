function escapeHtmlP(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function buildProjectPanel(p) {
  if (p.slug === "the-akward-cello-book") {
    return `
      <div class="project-panel" id="panel-${p.slug}" data-panel="${p.slug}">
        <h2>${escapeHtmlP(p.title)}</h2>
        <div class="book-viewer" data-pdf="assets/projects/${p.pdf}">
          <div class="book-page-wrap">
            <div class="book-zone book-zone-prev" aria-label="Previous page"></div>
            <canvas class="book-canvas"></canvas>
            <div class="book-zone book-zone-next" aria-label="Next page"></div>
            <div class="book-loading">Loading book…</div>
          </div>
          <div class="book-controls">
            <button type="button" class="book-btn book-prev" aria-label="Previous page">&#8249;</button>
            <span class="book-page-num">Page 1</span>
            <button type="button" class="book-btn book-next" aria-label="Next page">&#8250;</button>
          </div>
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
    if (slug === "the-akward-cello-book" && typeof window.__redrawBookViewer === "function") {
      requestAnimationFrame(() => window.__redrawBookViewer());
    }
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
  initBookViewer();
  if (typeof renderDecks === "function") renderDecks();
}

function initBookViewer() {
  const root = document.querySelector(".book-viewer");
  if (!root) return;

  const url = root.getAttribute("data-pdf");
  const canvas = root.querySelector(".book-canvas");
  const ctx = canvas.getContext("2d");
  const loading = root.querySelector(".book-loading");
  const pageNumEl = root.querySelector(".book-page-num");
  const prevBtn = root.querySelector(".book-prev");
  const nextBtn = root.querySelector(".book-next");
  const prevZone = root.querySelector(".book-zone-prev");
  const nextZone = root.querySelector(".book-zone-next");

  let pdfDoc = null;
  let currentPage = 1;
  let rendering = false;

  function showPage(num) {
    if (!pdfDoc || rendering) return;
    if (num < 1 || num > pdfDoc.numPages) return;
    rendering = true;
    currentPage = num;

    pdfDoc.getPage(num).then(page => {
      const wrapWidth = root.querySelector(".book-page-wrap").clientWidth;
      const unscaled = page.getViewport({ scale: 1 });
      const scale = Math.min(wrapWidth / unscaled.width, 1.6);
      const viewport = page.getViewport({ scale });
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      page.render({ canvasContext: ctx, viewport }).promise.then(() => {
        rendering = false;
        pageNumEl.textContent = `Page ${currentPage} of ${pdfDoc.numPages}`;
        prevBtn.disabled = currentPage <= 1;
        nextBtn.disabled = currentPage >= pdfDoc.numPages;
      });
    });
  }

  if (typeof pdfjsLib === "undefined") {
    loading.textContent = "Couldn't load the book viewer. Try the download link below.";
    return;
  }

  pdfjsLib.getDocument(url).promise.then(pdf => {
    pdfDoc = pdf;
    loading.style.display = "none";
    // only render once the panel actually has width (i.e. is visible)
    if (root.closest(".project-panel").classList.contains("open")) {
      showPage(1);
    } else {
      currentPage = 1;
    }
  }).catch(err => {
    loading.textContent = "Couldn't load the book. Try the download link below.";
    console.error(err);
  });

  prevBtn.addEventListener("click", () => showPage(currentPage - 1));
  nextBtn.addEventListener("click", () => showPage(currentPage + 1));
  prevZone.addEventListener("click", () => showPage(currentPage - 1));
  nextZone.addEventListener("click", () => showPage(currentPage + 1));

  document.addEventListener("keydown", e => {
    if (!root.closest(".project-panel").classList.contains("open")) return;
    if (e.key === "ArrowLeft") showPage(currentPage - 1);
    if (e.key === "ArrowRight") showPage(currentPage + 1);
  });

  window.addEventListener("resize", () => { if (pdfDoc) showPage(currentPage); });

  window.__redrawBookViewer = () => { if (pdfDoc) showPage(currentPage); };
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
