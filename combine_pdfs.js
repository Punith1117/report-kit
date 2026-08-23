const fs = require("fs/promises");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

const inputDir = path.join(__dirname, "output", "pdf");
const outputFile = path.join(__dirname, "output", "final_report.pdf");

async function combinePDFs() {
  const files = await fs.readdir(inputDir);

  const pdfFiles = files
    .filter((file) => file.toLowerCase().endsWith(".pdf"))
    .sort();

  if (pdfFiles.length === 0) {
    throw new Error("No PDF files found in output/pdf/");
  }

  console.log("Combining PDFs:");

  const mergedPdf = await PDFDocument.create();

  for (const file of pdfFiles) {
    console.log(`  ${file}`);

    const filePath = path.join(inputDir, file);
    const pdfBytes = await fs.readFile(filePath);

    const pdf = await PDFDocument.load(pdfBytes);

    const pages = await mergedPdf.copyPages(
      pdf,
      pdf.getPageIndices()
    );

    for (const page of pages) {
      mergedPdf.addPage(page);
    }
  }

  await fs.mkdir(path.dirname(outputFile), {
    recursive: true
  });

  const mergedBytes = await mergedPdf.save();

  await fs.writeFile(outputFile, mergedBytes);

  console.log(`Combined PDF created: ${outputFile}`);
}

combinePDFs().catch((error) => {
  console.error("PDF combination failed:", error.message);
  process.exit(1);
});
