import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.resolve(__dirname, "../content");

const CONFIG_PREFIX = /^\s*<!--\s*col-w:/;
const CONFIG_PATTERN =
  /^\s*<!--\s*col-w:\s*(\d+(?:\s+\d+)*)\s*\|\s*align:\s*(left|center|right)(?:\s+(?:left|center|right))*\s*-->\s*$/;

const MIN_SEPARATOR_WIDTH = 3;
const MIN_CELL_PADDING = 2;
const VALID_ALIGNMENTS = new Set(["left", "center", "right"]);

class TableFormatError extends Error {
  constructor(message) {
    super(message);
    this.name = "TableFormatError";
  }
}

function fail(context, message) {
  throw new TableFormatError(`${context}: ${message}`);
}

function parseConfig(line, context) {
  const match = line.match(CONFIG_PATTERN);

  if (!match) {
    fail(
      context,
      "Invalid configuration comment. Expected:\n" +
      "<!-- col-w: 20 31 23 | align: left center right -->"
    );
  }

  const widths = match[1].trim().split(/\s+/).map(Number);
  const alignmentText = line.match(/\|\s*align:\s*([^>]*?)\s*-->/)?.[1];
  const alignments = alignmentText?.trim().split(/\s+/) ?? [];

  if (widths.some(
    (width) =>
      !Number.isSafeInteger(width) || width < MIN_SEPARATOR_WIDTH
  )) {
    fail(
      context,
      `Every column width must be an integer of at least ${MIN_SEPARATOR_WIDTH}.`
    );
  }

  if (alignments.length !== widths.length) {
    fail(
      context,
      `Found ${widths.length} column widths but ${alignments.length} alignments.`
    );
  }

  if (alignments.some((alignment) => !VALID_ALIGNMENTS.has(alignment))) {
    fail(context, "Alignments must be left, center, or right.");
  }

  return { widths, alignments };
}

/**
 * Extract dash-run widths and starting positions.
 * Spaces between runs are delimiters, not part of a column.
 */
function parseSeparator(line, context) {
  if (!/^\s*-{3,}(?: +-{3,})+\s*$/.test(line)) {
    fail(context, "Malformed separator line.");
  }

  const runs = [...line.matchAll(/-{3,}/g)].map((match) => ({
    start: match.index,
    width: match[0].length,
  }));

  for (let i = 1; i < runs.length; i++) {
    const previous = runs[i - 1];
    const current = runs[i];
    const gap = line.slice(
      previous.start + previous.width,
      current.start
    );

    if (!/^ +$/.test(gap)) {
      fail(context, "Columns must be separated by spaces.");
    }
  }

  return runs;
}

function validateSeparatorCount(runs, widths, context) {
  if (runs.length !== widths.length) {
    fail(
      context,
      `Separator defines ${runs.length} columns; configuration defines ${widths.length}.`
    );
  }
}

/**
 * Extract cells using fixed positions derived from separator runs.
 * Never split rows by whitespace.
 */
function parseRow(line, runs, context) {
  const cells = [];
  const expectedEnd =
    runs[runs.length - 1].start + runs[runs.length - 1].width;

  if (line.length > expectedEnd && line.slice(expectedEnd).trim()) {
    fail(
      context,
      "Non-space content extends beyond the final column boundary."
    );
  }

  for (let i = 0; i < runs.length; i++) {
    const { start, width } = runs[i];
    const end = start + width;

    if (i > 0) {
      const previousEnd = runs[i - 1].start + runs[i - 1].width;
      const gap = line.slice(previousEnd, start);

      if (gap.trim()) {
        fail(
          context,
          `Non-space character found between columns ${i} and ${i + 1}.`
        );
      }
    }

    const rawCell = line.slice(start, end).padEnd(width, " ");

    cells.push(rawCell.trim());
  }

  return cells;
}

function formatCell(cell, width, alignment, context, columnIndex) {
  const requiredWidth = cell.length + MIN_CELL_PADDING;

  if (requiredWidth > width) {
    fail(
      context,
      `Column ${columnIndex + 1} overflows its configured width.\n` +
      `Content: "${cell}"\n` +
      `Content length: ${cell.length}\n` +
      `Minimum required width: ${requiredWidth}\n` +
      `Configured width: ${width}.\n` +
      "Increase the column width or shorten the content."
    );
  }

  const padding = width - cell.length;

  switch (alignment) {
    case "left":
      // No leading padding; all padding follows the content.
      return cell + " ".repeat(padding);

    case "center":
      // Exactly one leading space; remaining padding follows.
      return " " + cell + " ".repeat(padding - 1);

    case "right":
      // All padding precedes the content; none follows it.
      return " ".repeat(padding) + cell;

    default:
      fail(context, `Unsupported alignment "${alignment}".`);
  }
}

function formatRow(cells, widths, alignments, context) {
  return cells
    .map((cell, index) =>
      formatCell(cell, widths[index], alignments[index], context, index)
    )
    .join(" ");
}

function formatSeparator(widths) {
  return widths.map((width) => "-".repeat(width)).join(" ");
}

function findNextNonBlank(lines, start) {
  let index = start;

  while (index < lines.length && !lines[index].trim()) {
    index++;
  }

  return index;
}

/**
 * Parse, validate and format a complete table.
 * No source lines are modified here.
 */
function formatTable(lines, commentIndex, config, file) {
  const commentContext = `${file}:${commentIndex + 1}`;
  const { widths, alignments } = config;

  const topIndex = findNextNonBlank(lines, commentIndex + 1);

  if (topIndex >= lines.length) {
    fail(commentContext, "Configuration comment is not followed by a table.");
  }

  const topRuns = parseSeparator(
    lines[topIndex],
    `${file}:${topIndex + 1}`
  );

  validateSeparatorCount(topRuns, widths, `${file}:${topIndex + 1}`);

  const headerIndex = topIndex + 1;
  const middleIndex = topIndex + 2;

  if (
    headerIndex >= lines.length ||
    middleIndex >= lines.length ||
    !lines[headerIndex].trim()
  ) {
    fail(commentContext, "Incomplete table header.");
  }

  const middleRuns = parseSeparator(
    lines[middleIndex],
    `${file}:${middleIndex + 1}`
  );

  validateSeparatorCount(middleRuns, widths, `${file}:${middleIndex + 1}`);

  // Every separator must have the same column boundaries.
  for (let i = 0; i < topRuns.length; i++) {
    if (
      topRuns[i].start !== middleRuns[i].start ||
      topRuns[i].width !== middleRuns[i].width
    ) {
      fail(
        `${file}:${middleIndex + 1}`,
        `Separator column ${i + 1} does not match the top separator boundaries.`
      );
    }
  }

  const output = [];
  const canonicalSeparator = formatSeparator(widths);

  const headerContext = `${file}:${headerIndex + 1}`;
  const headerCells = parseRow(lines[headerIndex], topRuns, headerContext);

  validateMinimumWidths(headerCells, widths, headerContext);

  output.push(
    canonicalSeparator,
    formatRow(headerCells, widths, alignments, headerContext),
    canonicalSeparator
  );

  let closingIndex = -1;

  for (let index = middleIndex + 1; index < lines.length; index++) {
    const line = lines[index];
    const context = `${file}:${index + 1}`;

    if (isSeparatorCandidate(line)) {
      const closingRuns = parseSeparator(line, context);
      validateSeparatorCount(closingRuns, widths, context);

      for (let i = 0; i < topRuns.length; i++) {
        if (
          closingRuns[i].start !== topRuns[i].start ||
          closingRuns[i].width !== topRuns[i].width
        ) {
          fail(
            context,
            `Closing separator column ${i + 1} does not match the top separator boundaries.`
          );
        }
      }

      closingIndex = index;
      break;
    }

    if (!line.trim()) {
      output.push("");
      continue;
    }

    const cells = parseRow(line, topRuns, context);
    validateMinimumWidths(cells, widths, context);
    output.push(formatRow(cells, widths, alignments, context));
  }

  if (closingIndex === -1) {
    fail(commentContext, "Table has no closing separator.");
  }

  output.push(canonicalSeparator);

  return {
    start: topIndex,
    end: closingIndex,
    lines: output,
  };
}

function isSeparatorCandidate(line) {
  return /^\s*-/.test(line);
}

function validateMinimumWidths(cells, widths, context) {
  for (let i = 0; i < cells.length; i++) {
    const requiredWidth = cells[i].length + MIN_CELL_PADDING;

    if (requiredWidth > widths[i]) {
      fail(
        context,
        `Column ${i + 1} requires at least ${requiredWidth} characters ` +
        `including padding, but col-w specifies ${widths[i]}.\n` +
        `Content: "${cells[i]}"`
      );
    }
  }
}

function formatMarkdown(source, file) {
  const newline = source.includes("\r\n") ? "\r\n" : "\n";
  const lines = source.split(/\r\n|\n/);
  const replacements = [];
  const diagnostics = [];
  const coveredRanges = [];

  for (let index = 0; index < lines.length; index++) {
    if (!CONFIG_PREFIX.test(lines[index])) continue;

    if (coveredRanges.some(({ start, end }) => index >= start && index <= end)) {
      continue;
    }

    try {
      const context = `${file}:${index + 1}`;
      const config = parseConfig(lines[index], context);
      const table = formatTable(lines, index, config, file);

      replacements.push(table);
      coveredRanges.push({ start: index, end: table.end });
      index = table.end;
    } catch (error) {
      diagnostics.push(error.message);

      // Do not modify this table when validation fails.
      // Continue searching for other configured tables.
    }
  }

  for (const replacement of [...replacements].reverse()) {
    lines.splice(
      replacement.start,
      replacement.end - replacement.start + 1,
      ...replacement.lines
    );
  }

  return {
    formatted: lines.join(newline),
    diagnostics,
    tablesProcessed: replacements.length,
  };
}

function main() {
  if (!fs.existsSync(CONTENT_DIR)) {
    throw new Error(`Content directory not found: ${CONTENT_DIR}`);
  }

  const files = fs
    .readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isFile() && entry.name.toLowerCase().endsWith(".md")
    )
    .map((entry) => path.join(CONTENT_DIR, entry.name))
    .sort();

  const changes = [];
  const diagnostics = [];
  let tablesProcessed = 0;

  // Validate all files before writing any changes.
  for (const filePath of files) {
    const file = path.basename(filePath);
    const original = fs.readFileSync(filePath, "utf8");
    const result = formatMarkdown(original, file);

    tablesProcessed += result.tablesProcessed;
    diagnostics.push(...result.diagnostics);

    if (result.formatted !== original) {
      changes.push({ filePath, formatted: result.formatted });
    }
  }

  for (const change of changes) {
    fs.writeFileSync(change.filePath, change.formatted, "utf8");
  }

  console.log("\nTable formatting completed.");
  console.log(`Markdown files scanned: ${files.length}`);
  console.log(`Tables formatted:       ${tablesProcessed}`);
  console.log(`Files updated:          ${changes.length}`);

  if (diagnostics.length) {
    console.error(`\nWarnings/errors (${diagnostics.length}):`);

    for (const diagnostic of diagnostics) {
      console.error(`\n- ${diagnostic}`);
    }

    console.error("\nTables with errors were left unchanged.");
  }

  console.log("");
}

try {
  main();
} catch (error) {
  console.error("\nTable formatting failed.");
  console.error(error.message);
  console.error("");
  process.exitCode = 1;
}
