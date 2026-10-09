if (typeof pdfjsLib !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

async function loadScorePdf(container) {
  const url = container.getAttribute("data-pdf");
  const pdf = await pdfjsLib.getDocument(url).promise;
  container._pdfDoc = pdf;
  return pdf;
}

async function drawScorePages(container, heightRatio) {
  const pdf = container._pdfDoc;
  if (!pdf) return;

  container.innerHTML = "";
  const targetWidth = container.clientWidth || 600;
  const targetHeight = window.innerHeight * heightRatio;

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const unscaled = page.getViewport({ scale: 1 });
    const scaleW = targetWidth / unscaled.width;
    const scaleH = targetHeight / unscaled.height;
    const scale = Math.min(scaleW, scaleH, 2.5);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    container.appendChild(canvas);

    await page.render({ canvasContext: ctx, viewport }).promise;
  }
}

async function renderScorePdf(container, heightRatio) {
  container.innerHTML = `<div class="pdf-loading">Loading score…</div>`;

  if (typeof pdfjsLib === "undefined") {
    container.innerHTML = `<div class="pdf-loading">Couldn't load the score viewer. Try reloading the page.</div>`;
    return;
  }

  try {
    await loadScorePdf(container);
    await drawScorePages(container, heightRatio);
  } catch (err) {
    container.innerHTML = `<div class="pdf-loading">Couldn't load the score. Try reloading the page.</div>`;
    console.error(err);
  }
}

function setScoreBodyHeight(item, body) {
  if (item.classList.contains("open")) {
    body.style.maxHeight = body.scrollHeight + "px";
  }
}

function isFullscreenElement(el) {
  const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
  return fsEl === el;
}

function requestFs(el) {
  if (el.requestFullscreen) return el.requestFullscreen();
  if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen();
}

function exitFs() {
  if (document.exitFullscreen) return document.exitFullscreen();
  if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".score-item").forEach(item => {
    const toggle = item.querySelector(".score-toggle");
    const body = item.querySelector(".score-body");
    const pdfViewer = item.querySelector(".score-pdf-viewer");
    const fsWrap = item.querySelector(".score-fullscreen-wrap");
    const fsBtn = item.querySelector(".score-fullscreen-btn");
    let rendered = false;

    toggle.addEventListener("click", () => {
      const isOpen = item.classList.toggle("open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");

      if (isOpen) {
        if (!rendered && pdfViewer) {
          rendered = true;
          renderScorePdf(pdfViewer, 0.8).then(() => {
            requestAnimationFrame(() => setScoreBodyHeight(item, body));
          });
        }
        body.style.maxHeight = body.scrollHeight + "px";
      } else {
        body.style.maxHeight = "0px";
      }
    });

    window.addEventListener("resize", () => {
      setScoreBodyHeight(item, body);
    });

    if (fsBtn && fsWrap) {
      fsBtn.addEventListener("click", () => {
        if (isFullscreenElement(fsWrap)) {
          exitFs();
        } else {
          requestFs(fsWrap);
        }
      });

      const onFsChange = () => {
        const label = fsBtn.querySelector("span");
        if (isFullscreenElement(fsWrap)) {
          if (label) label.textContent = "Exit fullscreen";
          drawScorePages(pdfViewer, 0.86).then(() => setScoreBodyHeight(item, body));
        } else {
          if (label) label.textContent = "Fullscreen";
          drawScorePages(pdfViewer, 0.8).then(() => setScoreBodyHeight(item, body));
        }
      };
      document.addEventListener("fullscreenchange", () => {
        if (document.fullscreenElement === fsWrap || (!document.fullscreenElement)) onFsChange();
      });
      document.addEventListener("webkitfullscreenchange", () => {
        if (document.webkitFullscreenElement === fsWrap || (!document.webkitFullscreenElement)) onFsChange();
      });
    }
  });
});
