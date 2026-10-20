import { mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { loadSettings } from "../config/load-settings.js";

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    child.on("error", reject);

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited with code ${code}`));
      }
    });
  });
}

async function main() {
  const root = process.cwd();

  // Load and validate settings before any build side effects
  const settings = loadSettings(root);
  console.log(`Using reference format: ${settings.reference} (${settings.referenceRelativePath})`);

  // Format Markdown table columns before building
  await run("npm", ["run", "format:table-col"]);

  console.log("Markdown table columns formatted");

  const odtDir = join(root, "output", "odt");
  const pdfDir = join(root, "output", "pdf");

  await mkdir(odtDir, { recursive: true });
  await mkdir(pdfDir, { recursive: true });

  // Get Markdown files in deterministic alphabetical order
  const files = (await readdir(join(root, "content")))
    .filter((file) => file.endsWith(".md"))
    .sort()
    .map((file) => join("content", file));

  // Citations: only enable citeproc when both files exist,
  // so reports without a .bib keep building (manual bibliography fallback).
  const citeArgs = [];

  if (
    existsSync(join(root, "references.bib")) &&
    existsSync(join(root, "reference", "ieee.csl"))
  ) {
    citeArgs.push(
      "--citeproc",
      "--bibliography=references.bib",
      "--csl=reference/ieee.csl",
    );
  } else {
    console.warn(
      "Skipping citeproc: references.bib and/or reference/ieee.csl not found"
    );
  }

  // Generate content ODT with native numbering and cross-references
  await run("pandoc", [
    ...files,
    "-o", "output/odt/03_content.odt",
    `--reference-doc=${settings.referenceRelativePath}`,

    "--lua-filter=filters/authors.lua",
    "--lua-filter=filters/pagebreak.lua",
    "--lua-filter=filters/table-identifiers.lua",

    "--table-caption-position=below",

    "-t", "odt+native_numbering+xrefs_number",

    ...citeArgs,
  ]);

  console.log("Generated: output/odt/03_content.odt");

  // Format native table numbering
  await run("node", [
    "scripts/format-table-numbering.js",
    "output/odt/03_content.odt",
    "output/odt/03_content.odt",
    settings.tableNumbering,
  ]);

  console.log("Table numbering formatted");

  // Change native figure caption labels from "Figure" to configured label
  await run("node", [
    "scripts/format-figure-labels.js",
    "output/odt/03_content.odt",
    "",
    settings.imageLabel,
  ]);

  console.log("Figure labels formatted");

  // Format IEEE multi-column sections
  // (3-column authors, 2-column body)
  await run("node", [
    "scripts/format-sections.js",
    "output/odt/03_content.odt",
    settings.referenceRelativePath,
  ]);

  console.log("Content sections formatted");

  // Apply table borders directly to ODT XML
  await run("node", [
    "scripts/add-table-borders.js",
    "output/odt/03_content.odt",
  ]);

  console.log("Content tables formatted");

  // Convert content ODT to PDF
  await run("soffice", [
    "--headless",
    "--convert-to", "pdf",
    "output/odt/03_content.odt",
    "--outdir", "output/pdf",
  ]);

  console.log("Generated: output/pdf/03_content.pdf");

  // Generate index.md from content PDF
  await run("node", [
    "scripts/extract-index.js",
  ]);

  console.log("Generated: index.md");

  // Generate index ODT (index reference document is NOT configurable)
  await run("pandoc", [
    "output/md/index.md",
    "-o", "output/odt/02_index.odt",
    "--reference-doc=reference/index-reference.odt",
  ]);

  console.log("Generated: output/odt/02_index.odt");

  // Apply table borders to index
  await run("node", [
    "scripts/add-table-borders.js",
    "output/odt/02_index.odt",
  ]);

  console.log("Index tables formatted");

  // Convert index ODT to PDF
  await run("soffice", [
    "--headless",
    "--convert-to", "pdf",
    "output/odt/02_index.odt",
    "--outdir", "output/pdf",
  ]);

  console.log("Generated: output/pdf/02_index.pdf");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
