import * as pdfjsLib from "/pdfjs/build/pdf.mjs";
import * as pdfjsViewer from "/pdfjs/web/pdf_viewer.mjs";
import { createPageNavigation } from "/navigation.js";

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

let currentPage = 1;

const navigation = createPageNavigation({
  onNavigate(page) {
    pdfViewer.currentPageNumber = page;
  },
});

eventBus.on("updateviewarea", (event) => {
  currentPage = event.location.pageNumber;

  navigation.setPage(currentPage);
});

async function loadPdf(pageToRestore = 1) {
  console.log("Loading PDF...");

  const loadingTask = pdfjsLib.getDocument({
    url: `/output/pdf/03_content.pdf?t=${Date.now()}`,
    cMapUrl: "/pdfjs/cmaps/",
    cMapPacked: true,
    standardFontDataUrl: "/pdfjs/standard_fonts/",
    wasmUrl: "/pdfjs/wasm/",
  });

  const pdfDocument = await loadingTask.promise;

  pdfViewer.setDocument(pdfDocument);
  pdfLinkService.setDocument(pdfDocument, null);

  navigation.setTotalPages(pdfDocument.numPages);

  await new Promise((resolve) => {
    if (pdfViewer.pagesCount > 0) {
      resolve();
    } else {
      eventBus.on("pagesinit", resolve, { once: true });
    }
  });

  const page = Math.max(
    1,
    Math.min(pageToRestore, pdfDocument.numPages)
  );

  pdfViewer.currentPageNumber = page;
  currentPage = page;

  navigation.setPage(page);

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

    const pageToRestore = currentPage;

    try {
      await loadPdf(pageToRestore);
    } catch (error) {
      console.error("Failed to reload PDF:", error);
    }
  }
};

ws.onclose = () => {
  console.log("WebSocket disconnected");
};
