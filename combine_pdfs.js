const fs = require("fs/promises");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

/*
 * --------------------------------------------------
 * Paths
 * --------------------------------------------------
 */

const inputDir = path.join(__dirname, "output", "pdf");
const outputFile = path.join(__dirname, "output", "final_report.pdf");

/*
 * --------------------------------------------------
 * Configuration
 * --------------------------------------------------
 */

const CONFIG = {
  /*
   * Sections that must begin on a right-hand page.
   *
   * In a conventional single-sided/recto-verso layout:
   *
   *   Odd page  = right-hand / recto
   *   Even page = left-hand / verso
   */
  rightHandSections: [
    "02_index.pdf",
    "03_content.pdf",
  ],

  /*
   * Odd-numbered pages are considered right-hand pages.
   *
   * Change to "even" if your document's page numbering/layout
   * convention treats even pages as right-hand pages.
   */
  rightHandPageParity: "odd",

  /*
   * Blank pages inherit the dimensions of the section
   * they are being inserted around.
   *
   * This prevents accidentally creating an A4 blank page
   * inside a Letter-sized document, for example.
   */
  blankPage: {
    matchSectionSize: true,

    // Fallback if there is no reference page available.
    width: 595.28,
    height: 841.89,
  },
};

/*
 * --------------------------------------------------
 * Helpers
 * --------------------------------------------------
 */

function isRightHandPage(pageNumber) {
  if (CONFIG.rightHandPageParity === "odd") {
    return pageNumber % 2 === 1;
  }

  if (CONFIG.rightHandPageParity === "even") {
    return pageNumber % 2 === 0;
  }

  throw new Error(
    `Invalid rightHandPageParity: ${CONFIG.rightHandPageParity}`
  );
}

function sectionMustStartOnRight(file) {
  return CONFIG.rightHandSections.includes(file);
}

async function loadPdf(filePath) {
  const bytes = await fs.readFile(filePath);
  return PDFDocument.load(bytes);
}

function addBlankPage(targetPdf, referencePdf = null) {
  if (
    CONFIG.blankPage.matchSectionSize &&
    referencePdf &&
    referencePdf.getPageCount() > 0
  ) {
    const referencePage = referencePdf.getPage(0);

    targetPdf.addPage([
      referencePage.getWidth(),
      referencePage.getHeight(),
    ]);

    return;
  }

  targetPdf.addPage([
    CONFIG.blankPage.width,
    CONFIG.blankPage.height,
  ]);
}

/*
 * --------------------------------------------------
 * PDF Combination
 * --------------------------------------------------
 */

async function combinePDFs() {
  const files = await fs.readdir(inputDir);

  const pdfFiles = files
    .filter((file) => file.toLowerCase().endsWith(".pdf"))
    .sort();

  if (pdfFiles.length === 0) {
    throw new Error("No PDF files found in output/pdf/");
  }

  /*
   * Validate configured sections before doing any work.
   */
  for (const section of CONFIG.rightHandSections) {
    if (!pdfFiles.includes(section)) {
      throw new Error(
        `Configured right-hand section not found: ${section}`
      );
    }
  }

  console.log("Combining PDFs:");

  const mergedPdf = await PDFDocument.create();

  let currentPageCount = 0;

  for (const file of pdfFiles) {
    console.log(`  ${file}`);

    const filePath = path.join(inputDir, file);
    const pdf = await loadPdf(filePath);

    /*
     * --------------------------------------------------
     * Right-hand page requirement
     * --------------------------------------------------
     *
     * If this section is configured to start on a
     * right-hand page, check where its first page
     * would land.
     */

    if (sectionMustStartOnRight(file)) {
      const sectionStartPage = currentPageCount + 1;

      if (!isRightHandPage(sectionStartPage)) {
        console.log(
          `    → ${file} must start on a right-hand page`
        );

        console.log(
          `    → Adding blank page before ${file}`
        );

        addBlankPage(mergedPdf, pdf);

        currentPageCount++;
      }
    }

    /*
     * --------------------------------------------------
     * Copy section pages
     * --------------------------------------------------
     */

    const pages = await mergedPdf.copyPages(
      pdf,
      pdf.getPageIndices()
    );

    for (const page of pages) {
      mergedPdf.addPage(page);
      currentPageCount++;
    }

    /*
     * No special "after index" logic is required.
     *
     * If the NEXT section is configured as a
     * right-hand section, it will be corrected
     * automatically during its own iteration.
     */
  }

  /*
   * --------------------------------------------------
   * Save
   * --------------------------------------------------
   */

  await fs.mkdir(path.dirname(outputFile), {
    recursive: true,
  });

  const mergedBytes = await mergedPdf.save();

  await fs.writeFile(outputFile, mergedBytes);

  console.log();
  console.log(`Combined PDF created: ${outputFile}`);
  console.log(`Total pages: ${currentPageCount}`);
}

/*
 * --------------------------------------------------
 * Run
 * --------------------------------------------------
 */

combinePDFs().catch((error) => {
  console.error(
    "PDF combination failed:",
    error.message
  );

  process.exit(1);
});
