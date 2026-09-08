import { PDFViewerApplication } from "/pdfjs/web/viewer.mjs";

const PDF_URL = "/output/pdf/03_content.pdf";

console.log(
  "Report-kit adapter loaded",
  PDFViewerApplication
);

await PDFViewerApplication.initializedPromise;

async function reloadPdf() {
  const history = PDFViewerApplication.pdfHistory;

  // Preserve PDF.js's current destination before replacing
  // the document. The new PDF has a different fingerprint,
  // so PDF.js won't restore the old destination automatically.
  history.pushCurrentPosition();

  const destination = window.history.state?.destination;

  await PDFViewerApplication.open({
    url: `${PDF_URL}?t=${Date.now()}`,
  });

  // `open()` resolves before the new pages are initialized.
  // Wait until the viewer is ready before applying the destination.
  await new Promise((resolve) => {
    PDFViewerApplication.eventBus.on(
      "pagesinit",
      resolve,
      { once: true }
    );
  });

  if (destination?.hash) {
    PDFViewerApplication.pdfLinkService.setHash(
      destination.hash
    );
  }
}

const protocol =
  location.protocol === "https:"
    ? "wss:"
    : "ws:";

const ws = new WebSocket(
  `${protocol}//${location.host}`
);

ws.onopen = () => {
  console.log("Report-kit WebSocket connected");
};

ws.onmessage = async (event) => {
  const message = JSON.parse(event.data);

  if (message.type !== "pdf-updated") {
    return;
  }

  console.log("PDF updated → reloading");

  try {
    await reloadPdf();

    console.log("PDF reloaded");
  } catch (error) {
    console.error(
      "Failed to reload PDF:",
      error
    );
  }
};

ws.onclose = () => {
  console.log("Report-kit WebSocket disconnected");
};
