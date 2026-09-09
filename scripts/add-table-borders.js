// scripts/add-table-borders.js

import fs from "node:fs";
import path from "node:path";
import JSZip from "jszip";
import {
  DOMParser,
  XMLSerializer,
} from "@xmldom/xmldom";

// ------------------------------------------------------------
// Configuration
// ------------------------------------------------------------

const INPUT_FILE = process.argv[2];
const OUTPUT_FILE = process.argv[3] || INPUT_FILE;

if (!INPUT_FILE) {
  console.error(
    "Usage: node scripts/add-table-borders.js <input.odt> [output.odt]"
  );
  process.exit(1);
}

const BORDER = "1.4pt solid #000000";

// ------------------------------------------------------------
// Namespaces
// ------------------------------------------------------------

const NS = {
  OFFICE:
    "urn:oasis:names:tc:opendocument:xmlns:office:1.0",

  STYLE:
    "urn:oasis:names:tc:opendocument:xmlns:style:1.0",

  TABLE:
    "urn:oasis:names:tc:opendocument:xmlns:table:1.0",

  FO:
    "urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0",
};

// ------------------------------------------------------------
// DOM helpers
// ------------------------------------------------------------

function elements(node) {
  return Array.from(node.childNodes || []).filter(
    (child) => child.nodeType === 1
  );
}

function getAttributeNS(node, namespace, localName) {
  return node.getAttributeNS(namespace, localName);
}

function setAttributeNS(
  node,
  namespace,
  qualifiedName,
  value
) {
  node.setAttributeNS(
    namespace,
    qualifiedName,
    value
  );
}

function removeAttributeNS(
  node,
  namespace,
  localName
) {
  node.removeAttributeNS(
    namespace,
    localName
  );
}

// ------------------------------------------------------------
// Table structure
// ------------------------------------------------------------

function getDirectRows(table) {
  const rows = [];

  for (const node of elements(table)) {
    // Normal table row
    if (
      node.namespaceURI === NS.TABLE &&
      node.localName === "table-row"
    ) {
      rows.push(node);
      continue;
    }

    // Header rows
    if (
      node.namespaceURI === NS.TABLE &&
      node.localName === "table-header-rows"
    ) {
      for (const child of elements(node)) {
        if (
          child.namespaceURI === NS.TABLE &&
          child.localName === "table-row"
        ) {
          rows.push(child);
        }
      }
    }
  }

  return rows;
}

function getDirectCells(row) {
  const cells = [];

  for (const node of elements(row)) {
    if (
      node.namespaceURI !== NS.TABLE ||
      node.localName !== "table-cell"
    ) {
      continue;
    }

    let repeat = parseInt(
      getAttributeNS(
        node,
        NS.TABLE,
        "number-columns-repeated"
      ),
      10
    );

    if (!Number.isFinite(repeat) || repeat < 1) {
      repeat = 1;
    }

    for (let i = 0; i < repeat; i++) {
      cells.push(node);
    }
  }

  return cells;
}

function getColumnCount(table) {
  let count = 0;

  for (const node of elements(table)) {
    if (
      node.namespaceURI !== NS.TABLE ||
      node.localName !== "table-column"
    ) {
      continue;
    }

    let repeat = parseInt(
      getAttributeNS(
        node,
        NS.TABLE,
        "number-columns-repeated"
      ),
      10
    );

    if (!Number.isFinite(repeat) || repeat < 1) {
      repeat = 1;
    }

    count += repeat;
  }

  return count;
}

// ------------------------------------------------------------
// Styles
// ------------------------------------------------------------

function getAutomaticStyles(document) {
  const root = document.documentElement;

  for (const child of elements(root)) {
    if (
      child.namespaceURI === NS.OFFICE &&
      child.localName === "automatic-styles"
    ) {
      return child;
    }
  }

  throw new Error(
    "office:automatic-styles was not found in content.xml"
  );
}

function getCellStyles(automaticStyles) {
  return Array.from(
    automaticStyles.getElementsByTagNameNS(
      NS.STYLE,
      "style"
    )
  ).filter(
    (style) =>
      getAttributeNS(
        style,
        NS.STYLE,
        "family"
      ) === "table-cell"
  );
}

function findCellStyle(
  automaticStyles,
  styleName
) {
  if (!styleName) {
    return null;
  }

  return (
    getCellStyles(automaticStyles).find(
      (style) =>
        getAttributeNS(
          style,
          NS.STYLE,
          "name"
        ) === styleName
    ) || null
  );
}

// ------------------------------------------------------------
// Style utilities
// ------------------------------------------------------------

function sanitizeStyleName(name) {
  return String(name)
    .replace(/[^A-Za-z0-9_.-]/g, "_");
}

function getStyleName(style) {
  return style
    ? getAttributeNS(
      style,
      NS.STYLE,
      "name"
    )
    : null;
}

function getOrCreateTableCellProperties(
  document,
  style
) {
  for (const child of elements(style)) {
    if (
      child.namespaceURI === NS.STYLE &&
      child.localName ===
      "table-cell-properties"
    ) {
      return child;
    }
  }

  const properties =
    document.createElementNS(
      NS.STYLE,
      "style:table-cell-properties"
    );

  style.appendChild(properties);

  return properties;
}

// ------------------------------------------------------------
// Border manipulation
// ------------------------------------------------------------

function clearExistingBorderProperties(
  properties
) {
  // Remove the shorthand first.
  removeAttributeNS(
    properties,
    NS.FO,
    "border"
  );

  // Remove all individual border properties.
  removeAttributeNS(
    properties,
    NS.FO,
    "border-top"
  );

  removeAttributeNS(
    properties,
    NS.FO,
    "border-bottom"
  );

  removeAttributeNS(
    properties,
    NS.FO,
    "border-left"
  );

  removeAttributeNS(
    properties,
    NS.FO,
    "border-right"
  );
}

function applyBorderProperties(
  properties,
  borders
) {
  /*
   * Start from a completely known border state.
   *
   * This is important because the cloned style may already
   * contain a border definition.
   */

  clearExistingBorderProperties(
    properties
  );

  setAttributeNS(
    properties,
    NS.FO,
    "fo:border-top",
    borders.top ? BORDER : "none"
  );

  setAttributeNS(
    properties,
    NS.FO,
    "fo:border-bottom",
    borders.bottom ? BORDER : "none"
  );

  setAttributeNS(
    properties,
    NS.FO,
    "fo:border-left",
    borders.left ? BORDER : "none"
  );

  setAttributeNS(
    properties,
    NS.FO,
    "fo:border-right",
    borders.right ? BORDER : "none"
  );
}

// ------------------------------------------------------------
// Border geometry
// ------------------------------------------------------------

function getBorderDefinition(
  rowIndex,
  rowCount,
  columnIndex,
  columnCount
) {
  return {
    top: rowIndex === 0,
    bottom: true,
    left: true,
    right: columnIndex === columnCount - 1,
  };
}

// ------------------------------------------------------------
// Style cloning
// ------------------------------------------------------------

function createClonedCellStyle({
  document,
  automaticStyles,
  originalStyle,
  originalStyleName,
  generatedStyleName,
  borders,
}) {
  let style;

  if (originalStyle) {
    /*
     * This is the important part of the new approach:
     *
     * Clone the COMPLETE original style.
     *
     * This preserves:
     *   - parent style
     *   - padding
     *   - writing mode
     *   - background
     *   - text properties
     *   - borders
     *   - any future properties Pandoc/LibreOffice adds
     *
     * We then change only the border properties.
     */
    style = originalStyle.cloneNode(true);

    setAttributeNS(
      style,
      NS.STYLE,
      "style:name",
      generatedStyleName
    );
  } else {
    /*
     * A cell without a style is unusual, but handle it
     * cleanly rather than failing.
     */
    style = document.createElementNS(
      NS.STYLE,
      "style:style"
    );

    setAttributeNS(
      style,
      NS.STYLE,
      "style:name",
      generatedStyleName
    );

    setAttributeNS(
      style,
      NS.STYLE,
      "style:family",
      "table-cell"
    );
  }

  const properties =
    getOrCreateTableCellProperties(
      document,
      style
    );

  applyBorderProperties(
    properties,
    borders
  );

  setAttributeNS(
    properties,
    NS.FO,
    "fo:padding",
    "0in"
  );

  automaticStyles.appendChild(style);

  return style;
}

// ------------------------------------------------------------
// Style registry
// ------------------------------------------------------------

function createStyleRegistry(
  automaticStyles
) {
  const registry = new Map();

  for (const style of getCellStyles(
    automaticStyles
  )) {
    const name = getStyleName(style);

    if (name) {
      registry.set(name, style);
    }
  }

  return registry;
}

function createGeneratedStyleName(
  originalStyleName,
  borderKey
) {
  const baseName = originalStyleName
    ? sanitizeStyleName(
      originalStyleName
    )
    : "NoStyle";

  return [
    "ReportKitBorder",
    baseName,
    borderKey,
  ].join("_");
}

// ------------------------------------------------------------
// Border a table
// ------------------------------------------------------------

function borderTable({
  document,
  automaticStyles,
  styleRegistry,
  table,
}) {
  const rows = getDirectRows(table);

  if (rows.length === 0) {
    return;
  }

  const logicalRows =
    rows.map(getDirectCells);

  const rowCount =
    logicalRows.length;

  /*
   * Prefer the actual table-column structure.
   *
   * Fall back to the largest row if the table doesn't
   * contain usable table-column information.
   */
  const declaredColumnCount =
    getColumnCount(table);

  const rowColumnCount = Math.max(
    ...logicalRows.map(
      (cells) => cells.length
    ),
    0
  );

  const columnCount =
    Math.max(
      declaredColumnCount,
      rowColumnCount
    );

  if (columnCount === 0) {
    return;
  }

  /*
   * This cache is document-wide.
   *
   * The same:
   *
   *   original style + border configuration
   *
   * gets exactly one generated style.
   */
  const styleCache = new Map();

  for (
    let rowIndex = 0;
    rowIndex < rowCount;
    rowIndex++
  ) {
    const cells =
      logicalRows[rowIndex];

    for (
      let columnIndex = 0;
      columnIndex < cells.length;
      columnIndex++
    ) {
      const cell =
        cells[columnIndex];

      const originalStyleName =
        getAttributeNS(
          cell,
          NS.TABLE,
          "style-name"
        );

      /*
       * If the cell already uses one of our generated
       * styles, don't keep cloning our own clone.
       *
       * This makes repeated execution much safer.
       */
      let originalStyle =
        styleRegistry.get(
          originalStyleName
        );

      if (
        originalStyleName?.startsWith(
          "ReportKitBorder_"
        )
      ) {
        /*
         * The generated style itself is already the
         * effective base style.
         */
        originalStyle =
          styleRegistry.get(
            originalStyleName
          );
      }

      const borders =
        getBorderDefinition(
          rowIndex,
          rowCount,
          columnIndex,
          columnCount
        );

      const borderKey = [
        borders.top ? "T" : "-",
        borders.bottom ? "B" : "-",
        borders.left ? "L" : "-",
        borders.right ? "R" : "-",
      ].join("");

      const cacheKey = [
        originalStyleName || "none",
        borderKey,
      ].join("|");

      let generatedStyleName =
        styleCache.get(cacheKey);

      if (!generatedStyleName) {
        generatedStyleName =
          createGeneratedStyleName(
            originalStyleName,
            borderKey
          );

        /*
         * If the generated name already exists, use the
         * existing style rather than creating another one.
         */
        let existingStyle =
          styleRegistry.get(
            generatedStyleName
          );

        if (!existingStyle) {
          existingStyle =
            createClonedCellStyle({
              document,
              automaticStyles,
              originalStyle,
              originalStyleName,
              generatedStyleName,
              borders,
            });

          styleRegistry.set(
            generatedStyleName,
            existingStyle
          );
        }

        styleCache.set(
          cacheKey,
          generatedStyleName
        );
      }

      cell.setAttributeNS(
        NS.TABLE,
        "table:style-name",
        generatedStyleName
      );
    }
  }
}

// ------------------------------------------------------------
// Main
// ------------------------------------------------------------

async function main() {
  const inputPath =
    path.resolve(INPUT_FILE);

  const outputPath =
    path.resolve(OUTPUT_FILE);

  const input =
    fs.readFileSync(inputPath);

  const zip =
    await JSZip.loadAsync(input);

  const contentFile =
    zip.file("content.xml");

  if (!contentFile) {
    throw new Error(
      "Invalid ODT: content.xml not found"
    );
  }

  const contentXml =
    await contentFile.async(
      "string"
    );

  const document =
    new DOMParser().parseFromString(
      contentXml,
      "text/xml"
    );

  if (
    !document ||
    !document.documentElement
  ) {
    throw new Error(
      "Could not parse content.xml"
    );
  }

  const automaticStyles =
    getAutomaticStyles(document);

  /*
   * Build the registry BEFORE adding anything.
   *
   * This lets us find the exact original Pandoc style
   * attached to each cell.
   */
  const styleRegistry =
    createStyleRegistry(
      automaticStyles
    );

  const tables =
    Array.from(
      document.getElementsByTagNameNS(
        NS.TABLE,
        "table"
      )
    );

  console.log(
    `Found ${tables.length} table(s)`
  );

  for (const table of tables) {
    borderTable({
      document,
      automaticStyles,
      styleRegistry,
      table,
    });
  }

  const serializer =
    new XMLSerializer();

  const newContentXml =
    serializer.serializeToString(
      document
    );

  zip.file(
    "content.xml",
    newContentXml
  );

  const output =
    await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
    });

  fs.writeFileSync(
    outputPath,
    output
  );

  console.log(
    `Wrote ${outputPath}`
  );
}

main().catch((error) => {
  console.error("");
  console.error("Failed:");
  console.error(error);
  process.exit(1);
});
