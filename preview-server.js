import express from "express";
import chokidar from "chokidar";
import WebSocket, { WebSocketServer } from "ws";
import { exec } from "node:child_process";

const PORT = 3000;

let buildRunning = false;
let buildQueued = false;
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

function runBuild() {
  if (buildRunning) {
    buildQueued = true;
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

    if (buildQueued) {
      buildQueued = false;
      runBuild();
    }
  });
}

function scheduleBuild() {
  clearTimeout(buildTimer);

  buildTimer = setTimeout(() => {
    runBuild();
  }, 200);
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
    scheduleBuild();
  });

wss.on("connection", () => {
  console.log("Browser connected");
});

// Generate a fresh preview when the server starts.
runBuild();
