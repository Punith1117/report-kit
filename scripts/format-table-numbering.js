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

/*
 * Supported modes:
 *
 *   roman  -> I, II, III, ...
 *   arabic -> 1, 2, 3, ...
 *
 * This affects TABLES ONLY.
 *
 * Figures continue to use native Arabic numbering.
 */
const TABLE_NUMBERING = "roman";

if (!INPUT_FILE) {
  console.error(
    "Usage: node scripts/format-table-numbering.js <input.odt> [output.odt]"
  );
  process.exit(1);
}

// ------------------------------------------------------------
// Namespaces
// ------------------------------------------------------------

const NS = {
  TEXT:
    "urn:oasis:names:tc:opendocument:xmlns:text:1.0",

  STYLE:
    "urn:oasis:names:tc:opendocument:xmlns:style:1.0",
};

// ------------------------------------------------------------
// Numbering formats
// ------------------------------------------------------------

const NUMBER_FORMATS = {
  roman: "I",
  arabic: "1",
};

function getNumberFormat(mode) {
  const format = NUMBER_FORMATS[mode];

  if (!format) {
    throw new Error(
      `Invalid table numbering mode: "${mode}". ` +
      `Use "roman" or "arabic".`
    );
  }

  return format;
}

// ------------------------------------------------------------
// DOM helpers
// ------------------------------------------------------------

function getAttributeNS(node, namespace, localName) {
  return node.getAttributeNS(
    namespace,
    localName
  );
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

// ------------------------------------------------------------
// Table sequence manipulation
// ------------------------------------------------------------

function isTableSequence(node) {
  if (
    node.namespaceURI !== NS.TEXT ||
    node.localName !== "sequence"
  ) {
    return false;
  }

  return (
    getAttributeNS(
      node,
      NS.TEXT,
      "name"
    ) === "Table"
  );
}

function formatTableSequence(
  sequence,
  numberFormat
) {
  setAttributeNS(
    sequence,
    NS.STYLE,
    "style:num-format",
    numberFormat
  );
}

// ------------------------------------------------------------
// Main
// ------------------------------------------------------------

async function main() {
  const inputPath =
    path.resolve(INPUT_FILE);

  const outputPath =
    path.resolve(OUTPUT_FILE);

  const numberFormat =
    getNumberFormat(
      TABLE_NUMBERING
    );

  console.log(
    `Table numbering: ${TABLE_NUMBERING} (${numberFormat})`
  );

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

  const sequences =
    Array.from(
      document.getElementsByTagNameNS(
        NS.TEXT,
        "sequence"
      )
    );

  const tableSequences =
    sequences.filter(
      isTableSequence
    );

  console.log(
    `Found ${tableSequences.length} table sequence(s)`
  );

  for (const sequence of tableSequences) {
    formatTableSequence(
      sequence,
      numberFormat
    );
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
