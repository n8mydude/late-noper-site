pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

async function renderScorePdf(container) {
  const url = container.getAttribute("data-pdf");
  container.innerHTML = `<div class="pdf-loading">Loading score…</div>`;

  try {
    const pdf = await pdfjsLib.getDocument(url).promise;
    container.innerHTML = "";
    const targetWidth = container.clientWidth || 600;

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const unscaled = page.getViewport({ scale: 1 });
      const scale = targetWidth / unscaled.width;
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      container.appendChild(canvas);

      await page.render({ canvasContext: ctx, viewport }).promise;
    }
  } catch (err) {
    container.innerHTML = `<div class="pdf-loading">Couldn't load the score. Try reloading the page.</div>`;
    console.error(err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".score-pdf-viewer").forEach(renderScorePdf);
});
