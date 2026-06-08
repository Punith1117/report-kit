const express = require("express");
const chokidar = require("chokidar");
const WebSocket = require("ws");
const { exec } = require("child_process");

const PORT = 3000;
const PDF_PATH = "output/report.pdf";

let buildRunning = false;
let buildQueued = false;
let buildTimer = null;

function runBuild() {
  if (buildRunning) {
    buildQueued = true;
    return;
  }

  buildRunning = true;

  console.log("Running build...");

  exec("npm run build", (error, stdout, stderr) => {
    if (stdout) process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);

    if (error) {
      console.error("Build failed:", error.message);
    } else {
      console.log("Build completed");
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
  }, 1000);
}

const app = express();

app.use("/output", express.static("output"));
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

let reloadTimer = null;

function scheduleReload() {
  clearTimeout(reloadTimer);

  reloadTimer = setTimeout(() => {
    console.log("PDF updated → notifying clients");
    broadcast("reload");
  }, 1000);
}

chokidar
  .watch("content", {
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 500,
      pollInterval: 100,
    },
  })
  .on("all", (event, path) => {
    console.log(`[MD ${event}] ${path}`);
    scheduleBuild();
  });

chokidar
  .watch(PDF_PATH, {
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 1000,
      pollInterval: 100,
    },
  })
  .on("all", (event, path) => {
    console.log(`[${event}] ${path}`);
    scheduleReload();
  });

wss.on("connection", () => {
  console.log("Browser connected");
});