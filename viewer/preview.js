import * as pdfjsLib from "/pdfjs/build/pdf.mjs";
import * as pdfjsViewer from "/pdfjs/web/pdf_viewer.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "/pdfjs/build/pdf.worker.mjs";

const container = document.getElementById("viewerContainer");

const eventBus = new pdfjsViewer.EventBus();

const pdfLinkService = new pdfjsViewer.PDFLinkService({
  eventBus,
});

const pdfViewer = new pdfjsViewer.PDFViewer({
  container,
  eventBus,
  linkService: pdfLinkService,
});

pdfLinkService.setViewer(pdfViewer);

async function loadPdf() {
  console.log("Loading PDF...");

  const loadingTask = pdfjsLib.getDocument({
    url: `/output/report.pdf?t=${Date.now()}`,
    cMapUrl: "/pdfjs/cmaps/",
    cMapPacked: true,
    standardFontDataUrl: "/pdfjs/standard_fonts/",
    wasmUrl: "/pdfjs/wasm/",
  });

  const pdfDocument = await loadingTask.promise;

  pdfViewer.setDocument(pdfDocument);
  pdfLinkService.setDocument(pdfDocument, null);

  await new Promise((resolve) => {
    if (pdfViewer.pagesCount > 0) {
      resolve();
    } else {
      eventBus.on("pagesinit", resolve, { once: true });
    }
  });

  pdfViewer.currentScaleValue = "page-width";

  console.log(`PDF loaded: ${pdfDocument.numPages} pages`);
}

await loadPdf();

const protocol =
  location.protocol === "https:"
    ? "wss:"
    : "ws:";

const ws = new WebSocket(
  `${protocol}//${location.host}`
);

ws.onmessage = async (event) => {
  const message = JSON.parse(event.data);

  if (message.type === "pdf-updated") {
    console.log("PDF updated → reloading");

    try {
      await loadPdf();
    } catch (error) {
      console.error("Failed to reload PDF:", error);
    }
  }
};

ws.onclose = () => {
  console.log("WebSocket disconnected");
};
