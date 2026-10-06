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
    "Usage: node scripts/format-figure-labels.js <input.odt> [output.odt]"
  );
  process.exit(1);
}

// Native Pandoc ODT figure captions use "Figure".
// Change only this literal label.
// The ODF sequence itself remains untouched.
const FIGURE_LABEL = "Fig.";

// ------------------------------------------------------------
// Namespaces
// ------------------------------------------------------------

const NS = {
  TEXT:
    "urn:oasis:names:tc:opendocument:xmlns:text:1.0",
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

// ------------------------------------------------------------
// Figure caption detection
// ------------------------------------------------------------

function isFigureCaption(node) {
  if (
    node.namespaceURI !== NS.TEXT ||
    node.localName !== "p"
  ) {
    return false;
  }

  return (
    getAttributeNS(
      node,
      NS.TEXT,
      "style-name"
    ) === "FigureCaption"
  );
}

function isIllustrationSequence(node) {
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
    ) === "Illustration"
  );
}

// ------------------------------------------------------------
// Figure label manipulation
// ------------------------------------------------------------

function formatFigureCaption(paragraph) {
  const children = Array.from(
    paragraph.childNodes || []
  );

  for (let i = 0; i < children.length; i++) {
    const node = children[i];

    if (!isIllustrationSequence(node)) {
      continue;
    }

    /*
     * Pandoc normally generates:
     *
     *   Figure <sequence>:
     *
     * The "Figure" part is just ordinary text.
     *
     * Replace only that text node.
     */
    for (let j = i - 1; j >= 0; j--) {
      const previous = children[j];

      if (previous.nodeType !== 3) {
        continue;
      }

      const text = previous.nodeValue;

      if (!text) {
        continue;
      }

      /*
       * Handle the normal Pandoc form:
       *
       *   "Figure "
       *
       * Preserve the whitespace after the label.
       */
      const match = text.match(/^Figure(\s*)$/);

      if (!match) {
        break;
      }

      previous.nodeValue =
        FIGURE_LABEL + match[1];

      return true;
    }
  }

  return false;
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
    await contentFile.async("string");

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

  const paragraphs =
    Array.from(
      document.getElementsByTagNameNS(
        NS.TEXT,
        "p"
      )
    );

  const figureCaptions =
    paragraphs.filter(
      isFigureCaption
    );

  console.log(
    `Found ${figureCaptions.length} figure caption(s)`
  );

  let changed = 0;

  for (const paragraph of figureCaptions) {
    if (
      formatFigureCaption(paragraph)
    ) {
      changed++;
    }
  }

  console.log(
    `Formatted ${changed} figure caption(s)`
  );

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
