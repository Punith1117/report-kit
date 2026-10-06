import { mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

async function run(command, args) {
  await execFileAsync(command, args, {
    cwd: process.cwd(),
  });
}

async function main() {
  const root = process.cwd();

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

  // 1. Generate content ODT with native numbering and cross-references
  await run("pandoc", [
    ...files,
    "-o", "output/odt/03_content.odt",
    "--reference-doc=reference/content-reference.odt",

    "--lua-filter=filters/authors.lua",
    "--lua-filter=filters/pagebreak.lua",
    "--lua-filter=filters/table-identifiers.lua",

    "--table-caption-position=below",

    "-t", "odt+native_numbering+xrefs_number",

    ...citeArgs,
  ]);

  console.log("Generated: output/odt/03_content.odt");

  // 2. Format native table numbering
  await run("node", [
    "scripts/format-table-numbering.js",
    "output/odt/03_content.odt",
  ]);

  console.log("Table numbering formatted");

  // 3. Change native figure caption labels from "Figure" to "Fig."
  await run("node", [
    "scripts/format-figure-labels.js",
    "output/odt/03_content.odt",
  ]);

  console.log("Figure labels formatted");

  // 4. Format IEEE multi-column sections
  //    (3-column authors, 2-column body)
  await run("node", [
    "scripts/format-sections.js",
    "output/odt/03_content.odt",
    "reference/content-reference.odt",
  ]);

  console.log("Content sections formatted");

  // 5. Apply table borders directly to ODT XML
  await run("node", [
    "scripts/add-table-borders.js",
    "output/odt/03_content.odt",
  ]);

  console.log("Content tables formatted");

  // 6. Convert content ODT to PDF
  await run("soffice", [
    "--headless",
    "--convert-to", "pdf",
    "output/odt/03_content.odt",
    "--outdir", "output/pdf",
  ]);

  console.log("Generated: output/pdf/03_content.pdf");

  // 7. Generate index.md from content PDF
  await run("node", [
    "scripts/extract-index.js",
  ]);

  console.log("Generated: index.md");

  // 8. Generate index ODT
  await run("pandoc", [
    "output/md/index.md",
    "-o", "output/odt/02_index.odt",
    "--reference-doc=reference/index-reference.odt",
  ]);

  console.log("Generated: output/odt/02_index.odt");

  // 9. Apply table borders to index
  await run("node", [
    "scripts/add-table-borders.js",
    "output/odt/02_index.odt",
  ]);

  console.log("Index tables formatted");

  // 10. Convert index ODT to PDF
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
