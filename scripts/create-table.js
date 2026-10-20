import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

const INPUT_FILE = path.join(PROJECT_ROOT, "new-table.txt");
const OUTPUT_FILE = path.join(PROJECT_ROOT, "output/md/table.md");

const MIN_COLUMN_WIDTH = 3;
const CELL_PADDING = 2;

function parseInput(source) {
  const lines = source
    .split(/\r\n|\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("//") && !line.startsWith("#"));

  if (lines.length < 2) {
    throw new Error("Provide a header row and at least one content row.");
  }

  const rows = lines.map((line, index) => {
    const cells = line.split("|").map((cell) => cell.trim());

    if (cells.some((cell) => !cell)) {
      throw new Error(`Input row ${index + 1}: Empty cells are not supported.`);
    }

    return cells;
  });

  const columnCount = rows[0].length;

  for (let index = 1; index < rows.length; index++) {
    if (rows[index].length !== columnCount) {
      throw new Error(
        `Input row ${index + 1}: Expected ${columnCount} columns, ` +
        `found ${rows[index].length}.`
      );
    }
  }

  return rows;
}

function calculateWidths(rows) {
  return rows[0].map((_, columnIndex) =>
    Math.max(
      MIN_COLUMN_WIDTH + CELL_PADDING,
      ...rows.map((row) => row[columnIndex].length + CELL_PADDING)
    )
  );
}

function formatRow(row, widths) {
  return row
    .map((cell, index) => {
      const contentWidth = widths[index] - CELL_PADDING;
      return ` ${cell.padEnd(contentWidth)} `;
    })
    .join(" ");
}

function formatSeparator(widths) {
  return widths.map((width) => "-".repeat(width)).join(" ");
}

function generateTable(rows) {
  const widths = calculateWidths(rows);

  const comment =
    `<!-- col-w: ${widths.join(" ")} | align: ${rows[0].map(() => "center").join(" ")} -->`;

  const separator = formatSeparator(widths);

  const output = [
    comment,
    "",
    separator,
    formatRow(rows[0], widths),
    separator,
  ];

  for (const [index, row] of rows.slice(1).entries()) {
    if (index > 0) output.push("");
    output.push(formatRow(row, widths));
  }

  output.push(separator);

  return `${output.join("\n")}\n`;
}

function main() {
  if (!fs.existsSync(INPUT_FILE)) {
    throw new Error(`Input file not found: ${INPUT_FILE}`);
  }

  const source = fs.readFileSync(INPUT_FILE, "utf8");
  const rows = parseInput(source);
  const markdown = generateTable(rows);

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, markdown, "utf8");

  console.log("\nTable Markdown generated.");
  console.log(`Columns: ${rows[0].length}`);
  console.log(`Content rows: ${rows.length - 1}`);
  console.log(`Output: ${OUTPUT_FILE}\n`);
}

try {
  main();
} catch (error) {
  console.error(`\nTable generation failed:\n${error.message}\n`);
  process.exitCode = 1;
}
