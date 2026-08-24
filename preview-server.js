const express = require("express");
const chokidar = require("chokidar");
const WebSocket = require("ws");
const { exec } = require("child_process");

const PORT = 3000;

let buildRunning = false;
let buildQueued = false;
let buildTimer = null;

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
  "/pdfjs/build",
  express.static("node_modules/pdfjs-dist/build")
);

app.use(
  "/pdfjs/web",
  express.static("node_modules/pdfjs-dist/web")
);

app.use(
  "/pdfjs/cmaps",
  express.static("node_modules/pdfjs-dist/cmaps")
);

app.use(
  "/pdfjs/standard_fonts",
  express.static("node_modules/pdfjs-dist/standard_fonts")
);

app.use(
  "/pdfjs/wasm",
  express.static("node_modules/pdfjs-dist/wasm")
);

app.use("/", express.static("viewer"));

const server = app.listen(PORT, () => {
  console.log(`Preview server running at http://localhost:${PORT}`);
});

const wss = new WebSocket.Server({ server });

function broadcast(message) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

chokidar
  .watch("content", {
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 300,
      pollInterval: 50,
    },
  })
  .on("all", (event, path) => {
    console.log(`[MD ${event}] ${path}`);
    scheduleBuild();
  });

wss.on("connection", () => {
  console.log("Browser connected");
});

// Generate a fresh preview when the server starts.
runBuild();
