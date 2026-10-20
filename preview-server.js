import express from "express";
import chokidar from "chokidar";
import WebSocket, { WebSocketServer } from "ws";
import { exec } from "node:child_process";

const PORT = 3000;

const FORMAT_DEBOUNCE_MS = 500;
const BUILD_DEBOUNCE_MS = 300;

let formattingRunning = false;
let buildRunning = false;
let formattingQueued = false;

let formatTimer = null;
let buildTimer = null;

const PDF_URL = "/output/pdf/03_content.pdf";

function openBrowser(url) {
  const command =
    process.platform === "win32"
      ? `start "" "${url}"`
      : process.platform === "darwin"
        ? `open "${url}"`
        : `xdg-open "${url}"`;

  exec(command, (error) => {
    if (error) {
      console.log(`Open ${url} in your browser.`);
    }
  });
}

function runFormatter() {
  if (formattingRunning || buildRunning) {
    formattingQueued = true;
    return;
  }

  formattingRunning = true;

  console.log("Running table formatter...");

  exec("npm run format:table-col", (error, stdout, stderr) => {
    if (stdout) process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);

    formattingRunning = false;

    if (error) {
      console.error("Table formatting failed:", error.message);

      if (formattingQueued) {
        formattingQueued = false;
        scheduleFormatting();
      }

      return;
    }

    console.log("Table formatting completed");

    // If another formatting pass was requested while formatting,
    // settle the source files before starting the preview build.
    if (formattingQueued) {
      formattingQueued = false;
      scheduleFormatting();
      return;
    }

    scheduleBuild();
  });
}

function scheduleFormatting() {
  // New changes invalidate any pending preview build.
  clearTimeout(buildTimer);

  clearTimeout(formatTimer);

  formatTimer = setTimeout(() => {
    formatTimer = null;
    runFormatter();
  }, FORMAT_DEBOUNCE_MS);
}

function runBuild() {
  if (buildRunning || formattingRunning) {
    formattingQueued = true;
    return;
  }

  buildRunning = true;

  console.log("Running preview build...");

  exec("npm run preview-build", (error, stdout, stderr) => {
    if (stdout) process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);

    if (error) {
      console.error("Preview Build failed:", error.message);
    } else {
      console.log("Preview Build completed");

      broadcast(JSON.stringify({
        type: "pdf-updated",
      }));
    }

    buildRunning = false;

    // Preserve changes that arrived while the build was running.
    if (formattingQueued) {
      formattingQueued = false;
      scheduleFormatting();
    }
  });
}

function scheduleBuild() {
  clearTimeout(buildTimer);

  buildTimer = setTimeout(() => {
    buildTimer = null;
    runBuild();
  }, BUILD_DEBOUNCE_MS);
}

const app = express();

app.use("/output", express.static("output"));

app.use(
  "/pdfjs",
  express.static("viewer/pdfjs")
);

app.use(
  "/pdfjs_adapter.js",
  express.static("viewer/pdfjs_adapter.js")
);

app.get("/", (req, res) => {
  res.redirect(
    `/pdfjs/web/viewer.html?file=${PDF_URL}`
  );
});

const server = app.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;

  console.log(`Preview server running at ${url}`);

  openBrowser(url);
});

const wss = new WebSocketServer({ server });

function broadcast(message) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

chokidar
  .watch([
    "content",
    "assets",
    "filters",
    "references.bib",
    "reference/ieee.csl",
    "scripts/preview_build.js",
    "reference/content-reference.odt",
  ], {
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 300,
      pollInterval: 50,
    },
  })
  .on("all", (event, path) => {
    console.log(`[WATCH ${event}] ${path}`);
    scheduleFormatting();
  });

wss.on("connection", () => {
  console.log("Browser connected");
});

// Format first, then generate the initial preview.
scheduleFormatting();
