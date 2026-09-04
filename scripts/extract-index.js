const fs = require("node:fs/promises");
const path = require("node:path");

async function extractIndex(pdfPath) {
  const pdfjsLib = await import(
    "pdfjs-dist/legacy/build/pdf.mjs"
  );

  const data = new Uint8Array(
    await fs.readFile(pdfPath)
  );

  const pdf = await pdfjsLib.getDocument({
    data,
    disableWorker: true,
  }).promise;

  const outline = await pdf.getOutline();

  if (!outline) {
    throw new Error("PDF does not contain an outline.");
  }

  const chapters = [];

  for (const item of outline) {
    const page = await getOutlinePage(pdf, item);

    if (page === null) {
      console.warn(
        `Could not resolve page for: ${item.title}`
      );
      continue;
    }

    chapters.push({
      title: normalizeChapterTitle(item.title),
      page,
    });
  }

  return chapters;
}

async function getOutlinePage(pdf, item) {
  if (!item.dest) {
    return null;
  }

  let dest = item.dest;

  // Named destination
  if (typeof dest === "string") {
    dest = await pdf.getDestination(dest);
  }

  if (!dest || !dest[0]) {
    return null;
  }

  const pageIndex = await pdf.getPageIndex(dest[0]);

  return pageIndex + 1;
}

function normalizeChapterTitle(title) {
  return title.replace(/^\d+(?:\.\d+)*\.\s*/, "");
}

function generateIndexMarkdown(chapters) {
  const lines = [];

  lines.push('::: {custom-style="IndexTitle"}');
  lines.push("INDEX");
  lines.push(":::");
  lines.push("");

  lines.push(
    "+--------+---------------------------------------------------------+----------+"
  );

  lines.push(
    "| Sl.No. | Chapter Name                                            | Page No. |"
  );

  lines.push(
    "+:======:+=========================================================+:========:+"
  );

  for (const [index, chapter] of chapters.entries()) {
    const serialNumber = String(index + 1);
    const title = chapter.title.toUpperCase();
    const pageNumber = String(chapter.page);

    lines.push(
      `| ${serialNumber.padEnd(6)} | ${title.padEnd(55)} | ${pageNumber.padEnd(8)} |`
    );

    lines.push(
      "+--------+---------------------------------------------------------+----------+"
    );
  }

  return lines.join("\n") + "\n";
}

async function main() {
  const root = process.cwd();

  const pdfPath = path.join(
    root,
    "output",
    "pdf",
    "03_content.pdf"
  );

  const mdDir = path.join(
    root,
    "output",
    "md"
  );

  const indexPath = path.join(
    mdDir,
    "index.md"
  );

  await fs.mkdir(mdDir, { recursive: true });

  const chapters = await extractIndex(pdfPath);

  const markdown = generateIndexMarkdown(chapters);

  await fs.writeFile(indexPath, markdown, "utf8");

  console.log(`Generated: ${path.relative(root, indexPath)}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
