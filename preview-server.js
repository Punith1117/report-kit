import express from "express";
import chokidar from "chokidar";
import WebSocket, { WebSocketServer } from "ws";
import { exec } from "node:child_process";
import path, { resolve } from "node:path";
import { loadSettings } from "./config/load-settings.js";

const PORT = 3000;
const ROOT = process.cwd();

const FORMAT_DEBOUNCE_MS = 500;
const BUILD_DEBOUNCE_MS = 300;
const SETTINGS_DEBOUNCE_MS = 200;

const SETTINGS_FILE = "config/settings.yaml";
const SETTINGS_PATH = resolve(ROOT, SETTINGS_FILE);

let formattingRunning = false;
let buildRunning = false;
let formattingQueued = false;

let formatTimer = null;
let buildTimer = null;
let settingsTimer = null;

let watcher = null;
let activeReferenceFile = null;

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

// --------------------------------------------------
// Formatting and build queue
// --------------------------------------------------

function runFormatter() {
  if (formattingRunning || buildRunning) {
    formattingQueued = true;
    return;
  }

  formattingRunning = true;

  console.log("Running table formatter...");

  exec(
    "npm run format:table-col",
    { cwd: ROOT },
    (error, stdout, stderr) => {
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

      // Changes received during formatting must settle first.
      if (formattingQueued) {
        formattingQueued = false;
        scheduleFormatting();
        return;
      }

      scheduleBuild();
    }
  );
}

function scheduleFormatting() {
  // A new source change invalidates a pending build timer.
  clearTimeout(buildTimer);
  buildTimer = null;

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

  exec(
    "npm run preview-build",
    { cwd: ROOT },
    (error, stdout, stderr) => {
      if (stdout) process.stdout.write(stdout);
      if (stderr) process.stderr.write(stderr);

      if (error) {
        console.error("Preview build failed:", error.message);
      } else {
        console.log("Preview build completed");

        broadcast(
          JSON.stringify({
            type: "pdf-updated",
          })
        );
      }

      buildRunning = false;

      // Changes received during the build require another pass.
      if (formattingQueued) {
        formattingQueued = false;
        scheduleFormatting();
      }
    }
  );
}

function scheduleBuild() {
  clearTimeout(buildTimer);

  buildTimer = setTimeout(() => {
    buildTimer = null;
    runBuild();
  }, BUILD_DEBOUNCE_MS);
}

// --------------------------------------------------
// Dynamic settings and reference-file watching
// --------------------------------------------------

function reloadSettingsAndWatcher() {
  // Read and validate the current settings file.
  const settings = loadSettings(ROOT);
  const nextReferenceFile = path.resolve(
    ROOT,
    settings.referencePath
  );

  if (nextReferenceFile === activeReferenceFile) {
    // Other settings may have changed, so refresh the preview.
    scheduleFormatting();
    return;
  }

  const previousReferenceFile = activeReferenceFile;

  // Update state before switching the watched path.
  activeReferenceFile = nextReferenceFile;

  if (previousReferenceFile) {
    watcher.unwatch(previousReferenceFile);
  }

  watcher.add(nextReferenceFile);

  scheduleFormatting();
}

function scheduleSettingsReload() {
  // Editors can generate multiple filesystem events for one save.
  clearTimeout(settingsTimer);

  settingsTimer = setTimeout(() => {
    settingsTimer = null;

    try {
      reloadSettingsAndWatcher();
    } catch (error) {
      console.error(
        "[CONFIG] Could not reload settings; preview build not scheduled:",
        error.message
      );
    }
  }, SETTINGS_DEBOUNCE_MS);
}

// --------------------------------------------------
// Filesystem watchers
// --------------------------------------------------

function createWatcher() {
  // Fail early if initial settings or the selected ODT are invalid.
  const settings = loadSettings(ROOT);

  activeReferenceFile = path.resolve(
    ROOT,
    settings.referencePath
  );

  const watchPaths = [
    resolve(ROOT, "content"),
    resolve(ROOT, "assets"),
    resolve(ROOT, "filters"),
    resolve(ROOT, "references.bib"),
    resolve(ROOT, "reference/ieee.csl"),
    resolve(ROOT, "scripts/preview_build.js"),
    activeReferenceFile,
  ];

  // Watch only the immediate entries of config/.
  // Do not filter out the directory itself with `ignored`.
  const configWatcher = chokidar.watch(
    resolve(ROOT, "config"),
    {
      depth: 0,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 50,
      },
    }
  );

  // Watch project inputs and the active reference document.
  const fileWatcher = chokidar.watch(watchPaths, {
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 300,
      pollInterval: 50,
    },
  });

  const handleFileEvent = (event, changedPath) => {
    const absolutePath = path.resolve(changedPath);

    console.log(`[WATCH ${event}] ${absolutePath}`);

    scheduleFormatting();
  };

  const handleConfigEvent = (event, changedPath) => {
    const absolutePath = path.resolve(changedPath);

    // Ignore all config entries except settings.yaml.
    if (absolutePath !== SETTINGS_PATH) {
      return;
    }

    // An atomic save may produce unlink followed by add.
    // Debounce the events so settings are read after the save settles.
    if (event === "add" || event === "change" || event === "unlink") {
      scheduleSettingsReload();
    }
  };

  fileWatcher.on("all", handleFileEvent);
  configWatcher.on("all", handleConfigEvent);

  fileWatcher.on("error", (error) => {
    console.error("[WATCHER] Error:", error.message);
  });

  configWatcher.on("error", (error) => {
    console.error("[CONFIG WATCHER] Error:", error.message);
  });

  // Expose the operations needed by the dynamic reference watcher.
  // Keep settingsWatcher separate from this combined interface.
  return {
    unwatch: (p) => fileWatcher.unwatch(p),
    add: (p) => fileWatcher.add(p),
    close: async () => {
      await Promise.all([
        fileWatcher.close(),
        configWatcher.close(),
      ]);
    },
    getWatched: () => ({
      ...fileWatcher.getWatched(),
      ...configWatcher.getWatched(),
    }),
  };
}

// --------------------------------------------------
// Express PDF viewer
// --------------------------------------------------

const app = express();

app.use("/output", express.static(resolve(ROOT, "output")));

app.use(
  "/pdfjs",
  express.static(resolve(ROOT, "viewer/pdfjs"))
);

app.use(
  "/pdfjs_adapter.js",
  express.static(resolve(ROOT, "viewer/pdfjs_adapter.js"))
);

app.get("/", (req, res) => {
  res.redirect(`/pdfjs/web/viewer.html?file=${PDF_URL}`);
});

const server = app.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;

  console.log(`Preview server running at ${url}`);

  openBrowser(url);
});

// --------------------------------------------------
// WebSocket PDF refresh notifications
// --------------------------------------------------

const wss = new WebSocketServer({ server });

function broadcast(message) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

wss.on("connection", () => {
  console.log("Browser connected");
});

// --------------------------------------------------
// Initialization
// --------------------------------------------------

watcher = createWatcher();

// Format first, then generate the initial preview.
scheduleFormatting();
