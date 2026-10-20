import { mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { loadSettings } from "../config/load-settings.js";

const execFileAsync = promisify(execFile);

async function run(command, args, cwd) {
  const { stdout, stderr } = await execFileAsync(command, args, { cwd });

  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);
}

async function main() {
  const root = process.cwd();

  // Load and validate settings before any build side effects
  const settings = loadSettings(root);
  console.log(`Using reference format: ${settings.reference} (${settings.referenceRelativePath})`);

  const odtDir = join(root, "output", "odt");
  const pdfDir = join(root, "output", "pdf");

  // Create output directories
  await mkdir(odtDir, { recursive: true });
  await mkdir(pdfDir, { recursive: true });

  // Get Markdown files in deterministic alphabetical order
  const files = (await readdir(join(root, "content")))
    .filter(file => file.endsWith(".md"))
    .sort()
    .map(file => join("content", file));

  // Build conditional heading numbering filters
  const headingFilters = [];
  if (settings.headingNumbering.h1) {
    headingFilters.push("--lua-filter=filters/number-h1.lua");
  }
  if (settings.headingNumbering.h2) {
    headingFilters.push("--lua-filter=filters/number-h2.lua");
  }
  if (settings.headingNumbering.h3) {
    headingFilters.push("--lua-filter=filters/number-h3.lua");
  }

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

  // Generate content ODT with native figure numbering and cross-references
  await run("pandoc", [
    ...files,
    "-o", "output/odt/03_content.odt",
    `--reference-doc=${settings.referenceRelativePath}`,
    "--lua-filter=filters/authors.lua",
    "--lua-filter=filters/pagebreak.lua",
    "--lua-filter=filters/table-identifiers.lua",
    ...headingFilters,
    "--table-caption-position=below",
    "-t", "odt+native_numbering+xrefs_number",
    ...citeArgs
  ], root);

  console.log("Generated: output/odt/03_content.odt");

  // Format native table numbering
  await run("node", [
    "scripts/format-table-numbering.js",
    "output/odt/03_content.odt",
    "output/odt/03_content.odt",
    settings.tableNumbering
  ], root);

  console.log("Table numbering formatted");

  // Change native figure caption labels from "Figure" to configured label
  await run("node", [
    "scripts/format-figure-labels.js",
    "output/odt/03_content.odt",
    "",
    settings.imageLabel
  ], root);

  console.log("Figure labels formatted");

  // Format IEEE multi-column sections
  // (3-column authors, 2-column body)
  await run("node", [
    "scripts/format-sections.js",
    "output/odt/03_content.odt",
    settings.referenceRelativePath
  ], root);

  console.log("Content sections formatted");

  // Apply table borders directly to ODT XML
  await run("node", [
    "scripts/add-table-borders.js",
    "output/odt/03_content.odt"
  ], root);

  console.log(
    "Content ODT post-processing completed: Tables formatted"
  );

  // Convert content ODT to PDF
  await run("soffice", [
    "--headless",
    "--convert-to", "pdf",
    "output/odt/03_content.odt",
    "--outdir", "output/pdf"
  ], root);

  console.log("Generated: output/pdf/03_content.pdf");
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
