const { mkdir, readdir } = require("node:fs/promises");
const { join } = require("node:path");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");

const execFileAsync = promisify(execFile);

async function run(command, args, cwd) {
  await execFileAsync(command, args, {
    cwd,
    stdio: "inherit"
  });
}

async function main() {
  const root = process.cwd();

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

  // 1. Generate content ODT
  await run("pandoc", [
    ...files,
    "-o", "output/odt/03_content.odt",
    "--reference-doc=reference/content-reference.odt",
    "--lua-filter=filters/number-h1.lua",
    "--lua-filter=filters/number-h2.lua",
    "--lua-filter=filters/number-tables.lua",
    "--lua-filter=filters/number-images.lua",
    "--lua-filter=filters/pagebreak.lua",
    "--table-caption-position=below"
  ], root);

  console.log("Generated: output/odt/03_content.odt");

  // 2. Apply table borders
  await run("soffice", [
    "--headless",
    "--norestore",
    "output/odt/03_content.odt",
    "macro://./Standard.Module1.AddBordersToAllTables"
  ], root);

  console.log("Content macro completed: Tables formatted");

  // 3. Convert content ODT to PDF
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
