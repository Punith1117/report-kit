import fs from "node:fs/promises";
import path from "node:path";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

/*
 * --------------------------------------------------
 * Configuration
 * --------------------------------------------------
 */

const CONFIG = {
  // Include H2 entries beneath each H1.
  includeH2: true,

  // Include starting page numbers for H2 entries.
  includeH2PageNumbers: true,

  // Whether H2 headings should display their numbering.
  //
  // true  → "2.2 Background"
  // false → "Background"
  includeH2Numbering: true,

  // Convert titles to uppercase in the generated index.
  uppercaseTitles: false,

  // Maximum number of characters allowed for a chapter title.
  // Set to null to disable truncation.
  h1TitleWidth: 55,

  // Maximum number of characters allowed for H2 titles.
  // This is mostly useful for keeping the generated table tidy.
  h2TitleWidth: 55,

  // Whether the first H1 column should contain serial numbers.
  includeSerialNumbers: true,

  // Text used for the index title.
  indexTitle: "Table of Contents",

  // Custom Pandoc style applied to the index title.
  indexTitleStyle: "IndexTitle",
};


/*
 * --------------------------------------------------
 * PDF extraction
 * --------------------------------------------------
 */

async function extractIndex(pdfPath) {
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

    const chapter = {
      title: normalizeChapterTitle(item.title),
      page,
      sections: [],
    };

    /*
     * H2 headings are direct children of the H1
     * in the PDF outline.
     */
    if (CONFIG.includeH2 && item.items?.length) {
      for (const section of item.items) {
        const sectionPage = await getOutlinePage(
          pdf,
          section
        );

        if (sectionPage === null) {
          console.warn(
            `Could not resolve page for: ${section.title}`
          );
          continue;
        }

        chapter.sections.push({
          title: section.title,
          page: sectionPage,
        });
      }
    }

    chapters.push(chapter);
  }

  return chapters;
}

async function getOutlinePage(pdf, item) {
  if (!item.dest) {
    return null;
  }

  let dest = item.dest;

  // Named destination.
  if (typeof dest === "string") {
    dest = await pdf.getDestination(dest);
  }

  if (!dest || !dest[0]) {
    return null;
  }

  const pageIndex = await pdf.getPageIndex(dest[0]);

  return pageIndex + 1;
}


/*
 * --------------------------------------------------
 * Title normalization
 * --------------------------------------------------
 */

function normalizeChapterTitle(title) {
  /*
   * Remove H1 numbering.
   *
   * Examples:
   * 1. INTRODUCTION → INTRODUCTION
   * 2. LITERATURE REVIEW → LITERATURE REVIEW
   * 12. CONCLUSION → CONCLUSION
   */
  return title.replace(/^\d+(?:\.\d+)*\.\s*/, "");
}

function normalizeSectionTitle(title) {
  /*
   * Remove existing H2 numbering from the PDF outline.
   *
   * Handles:
   *
   * 1.1 Background
   * 2.2 Proposed System
   * 5.1 Hardware Implementation
   *
   * and also:
   *
   * 1 Background
   * 2 Software Configuration
   * 3 Program Code
   *
   * The script generates the correct H2 number itself.
   */
  return title
    .replace(/^\d+(?:\.\d+)*\.\s*/, "")
    .replace(/^\d+\s+/, "");
}

function formatTitle(title, width = null) {
  let formatted = CONFIG.uppercaseTitles
    ? title.toUpperCase()
    : title;

  if (width !== null) {
    formatted = formatted.slice(0, width);
  }

  return formatted;
}


/*
 * --------------------------------------------------
 * Markdown generation
 * --------------------------------------------------
 */

const INDEX_TABLE = {
  serialWidth: 8,
  titleWidth: 61,
  pageWidth: 9,

  alignment: {
    serial: "center",
    title: "left",
    page: "center",
  },
};

function generateIndexMarkdown(chapters) {
  const {
    serialWidth,
    titleWidth,
    pageWidth,
    alignment,
  } = INDEX_TABLE;

  const {
    indexTitle,
    indexTitleStyle,
  } = CONFIG;

  const makeSeparator = (character) =>
    `+${character.repeat(serialWidth)}+${character.repeat(
      titleWidth
    )}+${character.repeat(pageWidth)}+`;

  const makeAlignmentSeparator = () => {
    const cell = (width, align) => {
      if (align === "center") {
        return `:${"=".repeat(width - 2)}:`;
      }

      if (align === "right") {
        return `${"=".repeat(width - 1)}:`;
      }

      // left
      return `:${"=".repeat(width - 1)}`;
    };

    return (
      `+${cell(serialWidth, alignment.serial)}` +
      `+${cell(titleWidth, alignment.title)}` +
      `+${cell(pageWidth, alignment.page)}+`
    );
  };

  const topSeparator = makeSeparator("-");
  const headerSeparator = makeAlignmentSeparator();
  const bodySeparator = makeSeparator("-");

  const makeRow = (serial, title, page) =>
    `|${serial.padEnd(serialWidth)}|${title.padEnd(
      titleWidth
    )}|${page.padEnd(pageWidth)}|`;

  const lines = [
    `::: {custom-style="${indexTitleStyle}"}`,
    indexTitle,
    ":::",
    "",
    topSeparator,

    makeRow(
      "Sl.No.",
      "Chapter Name",
      "Page No."
    ),

    headerSeparator,
  ];

  const makeEmptyRow = () =>
    makeRow("", "", "");

  chapters.forEach((chapter, chapterIndex) => {
    const hasH2 =
      CONFIG.includeH2 &&
      chapter.sections.length > 0;

    const chapterTitle = formatTitle(
      chapter.title,
      CONFIG.h1TitleWidth
    );

    /*
     * H1 serial number.
     */
    const serialNumber = CONFIG.includeSerialNumbers
      ? String(chapterIndex + 1)
      : "";

    /*
     * H1
     */
    lines.push(
      makeRow(
        serialNumber,
        chapterTitle,
        String(chapter.page)
      )
    );

    /*
     * Empty line after H1.
     */
    lines.push(makeEmptyRow());

    /*
     * H2
     */
    if (hasH2) {
      chapter.sections.forEach(
        (section, sectionIndex) => {
          /*
           * Generate H2 numbering from the hierarchy.
           *
           * Example:
           *
           * chapterIndex = 1
           * sectionIndex = 1
           *
           * → 2.2
           */
          const h2Number = `${chapterIndex + 1}.${sectionIndex + 1}`;

          /*
           * Remove any numbering that may already exist
           * in the PDF outline.
           */
          const sectionTitle = normalizeSectionTitle(
            section.title
          );

          /*
           * Add generated numbering only when enabled.
           */
          const displaySectionTitle =
            CONFIG.includeH2Numbering
              ? `${h2Number} ${sectionTitle}`
              : sectionTitle;

          const formattedSectionTitle = formatTitle(
            displaySectionTitle,
            CONFIG.h2TitleWidth
          );

          lines.push(
            makeRow(
              "",
              `&nbsp; ${formattedSectionTitle}`,
              CONFIG.includeH2PageNumbers
                ? String(section.page)
                : ""
            )
          );

          /*
           * Empty line after H2.
           */
          lines.push(makeEmptyRow());
        }
      );
    }

    /*
     * Separator after complete H1 section.
     */
    lines.push(bodySeparator);
  });

  return lines.join("\n");
}


/*
 * --------------------------------------------------
 * Main
 * --------------------------------------------------
 */

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

  await fs.mkdir(mdDir, {
    recursive: true,
  });

  const chapters = await extractIndex(pdfPath);

  const markdown = generateIndexMarkdown(
    chapters
  );

  await fs.writeFile(
    indexPath,
    markdown,
    "utf8"
  );

  console.log(
    `Generated: ${path.relative(root, indexPath)}`
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
