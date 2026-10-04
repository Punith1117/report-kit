// scripts/format-sections.js

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
const REFERENCE_FILE = process.argv[3] || "reference/content-reference.odt";
const OUTPUT_FILE = process.argv[4] || INPUT_FILE;

if (!INPUT_FILE) {
  console.error(
    "Usage: node scripts/format-sections.js <input.odt> [reference.odt] [output.odt]"
  );
  process.exit(1);
}

// ------------------------------------------------------------
// Namespaces
// ------------------------------------------------------------

const NS = {
  OFFICE: "urn:oasis:names:tc:opendocument:xmlns:office:1.0",
  STYLE: "urn:oasis:names:tc:opendocument:xmlns:style:1.0",
  TEXT: "urn:oasis:names:tc:opendocument:xmlns:text:1.0",
  TABLE: "urn:oasis:names:tc:opendocument:xmlns:table:1.0",
  FO: "urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0",
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

function setAttributeNS(node, namespace, qualifiedName, value) {
  node.setAttributeNS(namespace, qualifiedName, value);
}

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

  const autoStyles = document.createElementNS(
    NS.OFFICE,
    "office:automatic-styles"
  );
  root.insertBefore(autoStyles, root.firstChild);
  return autoStyles;
}

function getStyleByName(automaticStyles, name) {
  const styles = automaticStyles.getElementsByTagNameNS(NS.STYLE, "style");
  for (const s of Array.from(styles)) {
    if (getAttributeNS(s, NS.STYLE, "name") === name) {
      return s;
    }
  }
  return null;
}

// ------------------------------------------------------------
// Section style definitions (IEEE Standard)
// ------------------------------------------------------------

function ensureSectionStyles(document, automaticStyles) {
  // 1. Sect1: 3-column section for author block
  if (!getStyleByName(automaticStyles, "Sect1")) {
    const sect1 = document.createElementNS(NS.STYLE, "style:style");
    setAttributeNS(sect1, NS.STYLE, "style:name", "Sect1");
    setAttributeNS(sect1, NS.STYLE, "style:family", "section");

    const sectProps = document.createElementNS(
      NS.STYLE,
      "style:section-properties"
    );
    setAttributeNS(sectProps, NS.STYLE, "style:editable", "false");

    const cols = document.createElementNS(NS.STYLE, "style:columns");
    setAttributeNS(cols, NS.FO, "fo:column-count", "3");
    setAttributeNS(cols, NS.FO, "fo:column-gap", "0.5in");

    // 3 balanced columns with margins matching IEEE standard template
    const colConfigs = [
      { width: "21845*", start: "0in", end: "0.25in" },
      { width: "21845*", start: "0.25in", end: "0.25in" },
      { width: "21845*", start: "0.25in", end: "0in" },
    ];

    for (const cfg of colConfigs) {
      const col = document.createElementNS(NS.STYLE, "style:column");
      setAttributeNS(col, NS.STYLE, "style:rel-width", cfg.width);
      setAttributeNS(col, NS.FO, "fo:start-indent", cfg.start);
      setAttributeNS(col, NS.FO, "fo:end-indent", cfg.end);
      cols.appendChild(col);
    }

    sectProps.appendChild(cols);
    sect1.appendChild(sectProps);
    automaticStyles.appendChild(sect1);
  }

  // 2. Sect2: 2-column section for main paper content
  let sect2 = getStyleByName(automaticStyles, "Sect2");
  if (!sect2) {
    sect2 = document.createElementNS(NS.STYLE, "style:style");
    setAttributeNS(sect2, NS.STYLE, "style:name", "Sect2");
    setAttributeNS(sect2, NS.STYLE, "style:family", "section");

    const sectProps = document.createElementNS(
      NS.STYLE,
      "style:section-properties"
    );
    setAttributeNS(sectProps, NS.STYLE, "style:editable", "false");
    setAttributeNS(
      sectProps,
      NS.TEXT,
      "text:dont-balance-text-columns",
      "true"
    );

    const cols = document.createElementNS(NS.STYLE, "style:columns");
    setAttributeNS(cols, NS.FO, "fo:column-count", "2");
    setAttributeNS(cols, NS.FO, "fo:column-gap", "0.25in");

    const colConfigs = [
      { width: "32767*", start: "0in", end: "0.1248in" },
      { width: "32768*", start: "0.1248in", end: "0in" },
    ];

    for (const cfg of colConfigs) {
      const col = document.createElementNS(NS.STYLE, "style:column");
      setAttributeNS(col, NS.STYLE, "style:rel-width", cfg.width);
      setAttributeNS(col, NS.FO, "fo:start-indent", cfg.start);
      setAttributeNS(col, NS.FO, "fo:end-indent", cfg.end);
      cols.appendChild(col);
    }

    sectProps.appendChild(cols);
    sect2.appendChild(sectProps);
    automaticStyles.appendChild(sect2);
  } else {
    // If Sect2 already exists, ensure text:dont-balance-text-columns="true" is set
    const sectPropsList = sect2.getElementsByTagNameNS(
      NS.STYLE,
      "section-properties"
    );
    if (sectPropsList.length > 0) {
      setAttributeNS(
        sectPropsList[0],
        NS.TEXT,
        "text:dont-balance-text-columns",
        "true"
      );
    }
  }

  // 3. Sect3: 1-column section (e.g. for full width elements if needed)
  if (!getStyleByName(automaticStyles, "Sect3")) {
    const sect3 = document.createElementNS(NS.STYLE, "style:style");
    setAttributeNS(sect3, NS.STYLE, "style:name", "Sect3");
    setAttributeNS(sect3, NS.STYLE, "style:family", "section");

    const sectProps = document.createElementNS(
      NS.STYLE,
      "style:section-properties"
    );
    setAttributeNS(sectProps, NS.STYLE, "style:editable", "false");

    const cols = document.createElementNS(NS.STYLE, "style:columns");
    setAttributeNS(cols, NS.FO, "fo:column-count", "1");
    setAttributeNS(cols, NS.FO, "fo:column-gap", "0in");

    sectProps.appendChild(cols);
    sect3.appendChild(sectProps);
    automaticStyles.appendChild(sect3);
  }

  // 4. AuthorColBreak: breaks author into next column
  if (!getStyleByName(automaticStyles, "AuthorColBreak")) {
    const authorCol = document.createElementNS(NS.STYLE, "style:style");
    setAttributeNS(authorCol, NS.STYLE, "style:name", "AuthorColBreak");
    setAttributeNS(authorCol, NS.STYLE, "style:family", "paragraph");
    setAttributeNS(authorCol, NS.STYLE, "style:parent-style-name", "Author");

    const paraProps = document.createElementNS(
      NS.STYLE,
      "style:paragraph-properties"
    );
    setAttributeNS(paraProps, NS.FO, "fo:margin-top", "0in");
    setAttributeNS(paraProps, NS.FO, "fo:margin-bottom", "0.028in");
    setAttributeNS(paraProps, NS.STYLE, "style:contextual-spacing", "false");
    setAttributeNS(paraProps, NS.FO, "fo:text-indent", "0in");
    setAttributeNS(paraProps, NS.STYLE, "style:auto-text-indent", "false");
    setAttributeNS(paraProps, NS.FO, "fo:break-before", "column");

    authorCol.appendChild(paraProps);
    automaticStyles.appendChild(authorCol);
  }

  // 5. AuthorNormal: author without column break
  if (!getStyleByName(automaticStyles, "AuthorNormal")) {
    const authorNorm = document.createElementNS(NS.STYLE, "style:style");
    setAttributeNS(authorNorm, NS.STYLE, "style:name", "AuthorNormal");
    setAttributeNS(authorNorm, NS.STYLE, "style:family", "paragraph");
    setAttributeNS(authorNorm, NS.STYLE, "style:parent-style-name", "Author");

    const paraProps = document.createElementNS(
      NS.STYLE,
      "style:paragraph-properties"
    );
    setAttributeNS(paraProps, NS.FO, "fo:margin-top", "0in");
    setAttributeNS(paraProps, NS.FO, "fo:margin-bottom", "0.028in");
    setAttributeNS(paraProps, NS.STYLE, "style:contextual-spacing", "false");
    setAttributeNS(paraProps, NS.FO, "fo:text-indent", "0in");
    setAttributeNS(paraProps, NS.STYLE, "style:auto-text-indent", "false");

    authorNorm.appendChild(paraProps);
    automaticStyles.appendChild(authorNorm);
  }

  // 6. Pagebreak & Columnbreak support
  if (!getStyleByName(automaticStyles, "Pagebreak")) {
    const pb = document.createElementNS(NS.STYLE, "style:style");
    setAttributeNS(pb, NS.STYLE, "style:name", "Pagebreak");
    setAttributeNS(pb, NS.STYLE, "style:family", "paragraph");
    setAttributeNS(pb, NS.STYLE, "style:parent-style-name", "Standard");
    const pbp = document.createElementNS(
      NS.STYLE,
      "style:paragraph-properties"
    );
    setAttributeNS(pbp, NS.FO, "fo:break-before", "page");
    pb.appendChild(pbp);
    automaticStyles.appendChild(pb);
  }

  if (!getStyleByName(automaticStyles, "Columnbreak")) {
    const cb = document.createElementNS(NS.STYLE, "style:style");
    setAttributeNS(cb, NS.STYLE, "style:name", "Columnbreak");
    setAttributeNS(cb, NS.STYLE, "style:family", "paragraph");
    setAttributeNS(cb, NS.STYLE, "style:parent-style-name", "Standard");
    const cbp = document.createElementNS(
      NS.STYLE,
      "style:paragraph-properties"
    );
    setAttributeNS(cbp, NS.FO, "fo:break-before", "column");
    cb.appendChild(cbp);
    automaticStyles.appendChild(cb);
  }
}

// ------------------------------------------------------------
// Check if Reference Template uses sections
// ------------------------------------------------------------

async function checkTemplateUsesSections(refPath) {
  if (!fs.existsSync(refPath)) {
    return false;
  }

  try {
    const refData = fs.readFileSync(refPath);
    const zip = await JSZip.loadAsync(refData);
    const contentXmlFile = zip.file("content.xml");
    if (!contentXmlFile) return false;
    const xml = await contentXmlFile.async("string");
    return xml.includes('style:name="Sect1"') || xml.includes('style:name="Sect2"');
  } catch {
    return false;
  }
}

// ------------------------------------------------------------
// Document Restructuring into Sections
// ------------------------------------------------------------

function formatDocumentSections(document) {
  const root = document.documentElement;
  let officeText = null;

  for (const child of elements(root)) {
    if (
      child.namespaceURI === NS.OFFICE &&
      child.localName === "body"
    ) {
      for (const bChild of elements(child)) {
        if (
          bChild.namespaceURI === NS.OFFICE &&
          bChild.localName === "text"
        ) {
          officeText = bChild;
          break;
        }
      }
    }
  }

  if (!officeText) {
    throw new Error("Could not find office:text in content.xml");
  }

  // If already sectioned into MainContentSection, skip
  for (const child of elements(officeText)) {
    if (
      child.localName === "section" &&
      getAttributeNS(child, NS.TEXT, "name") === "MainContentSection"
    ) {
      console.log("Document already has MainContentSection, skipping");
      return;
    }
  }

  const allChildren = elements(officeText);

  // Lookahead: if the first non-sequence element is a heading (localName === 'h')
  // and the second element is an author, treat that heading as the Paper Title!
  const nonSeq = allChildren.filter((el) => el.localName !== "sequence-decls");
  if (
    nonSeq.length >= 2 &&
    nonSeq[0].localName === "h" &&
    (getAttributeNS(nonSeq[1], NS.TEXT, "style-name") || "").startsWith("Author")
  ) {
    const heading = nonSeq[0];
    const titleP = document.createElementNS(NS.TEXT, "text:p");
    setAttributeNS(titleP, NS.TEXT, "text:style-name", "paper_20_title");
    while (heading.firstChild) {
      const child = heading.firstChild;
      heading.removeChild(child);
      if (child.localName !== "bookmark-start" && child.localName !== "bookmark-end") {
        titleP.appendChild(child);
      }
    }
    const idx = allChildren.indexOf(heading);
    if (idx !== -1) {
      allChildren[idx] = titleP;
    }
  }

  // Separate sequence declarations, title elements, author elements, and body content
  const seqDecls = [];
  const titleElements = [];
  const authorElements = [];
  const bodyElements = [];

  let state = "HEADER"; // HEADER -> AUTHORS -> BODY

  for (const el of allChildren) {
    if (el.localName === "sequence-decls") {
      seqDecls.push(el);
      continue;
    }

    const styleName = getAttributeNS(el, NS.TEXT, "style-name") || "";

    if (state === "HEADER") {
      if (
        styleName === "Title" ||
        styleName === "paper_20_title" ||
        styleName === "Subtitle" ||
        styleName === "paper_20_subtitle"
      ) {
        // Normalize title style to paper_20_title if it was Title
        if (styleName === "Title") {
          setAttributeNS(el, NS.TEXT, "text:style-name", "paper_20_title");
        } else if (styleName === "Subtitle") {
          setAttributeNS(el, NS.TEXT, "text:style-name", "paper_20_subtitle");
        }
        titleElements.push(el);
        continue;
      }

      // Check if this element is an author
      if (
        styleName === "Author" ||
        styleName === "Authors" ||
        styleName === "AuthorNormal" ||
        styleName === "AuthorColBreak"
      ) {
        state = "AUTHORS";
        authorElements.push(el);
        continue;
      }

      // Otherwise, we have reached the body
      state = "BODY";
      bodyElements.push(el);
    } else if (state === "AUTHORS") {
      if (
        styleName === "Author" ||
        styleName === "Authors" ||
        styleName === "AuthorNormal" ||
        styleName === "AuthorColBreak"
      ) {
        authorElements.push(el);
      } else {
        state = "BODY";
        bodyElements.push(el);
      }
    } else {
      bodyElements.push(el);
    }
  }

  // Clear office:text children
  while (officeText.firstChild) {
    officeText.removeChild(officeText.firstChild);
  }

  // 1. Re-add sequence declarations
  for (const decl of seqDecls) {
    officeText.appendChild(decl);
  }

  // 2. Add Title & Subtitle (full-width page level)
  for (const titleEl of titleElements) {
    officeText.appendChild(titleEl);
  }

  // 3. Add Author Section(s) (multi-row support)
  if (authorElements.length > 0) {
    const count = authorElements.length;

    // Partition authors into rows according to IEEE guidelines:
    // - 2 authors: 1 row of 2 (Sect2)
    // - 3 authors: 1 row of 3 (Sect1)
    // - 4 authors: 2 rows of 2 (Sect2, Sect2)
    // - 5 authors: row 1 (3 in Sect1), row 2 (2 in Sect2)
    // - 6 authors: row 1 (3 in Sect1), row 2 (3 in Sect1)
    // - 7+ authors: chunks of 3 in Sect1, remaining 2 or 4 in Sect2
    const rows = [];
    if (count <= 3) {
      if (count === 2) {
        rows.push({ authors: authorElements, style: "Sect2" });
      } else {
        rows.push({ authors: authorElements, style: "Sect1" });
      }
    } else if (count === 4) {
      rows.push({ authors: authorElements.slice(0, 2), style: "Sect2" });
      rows.push({ authors: authorElements.slice(2, 4), style: "Sect2" });
    } else {
      let rem = [...authorElements];
      while (rem.length > 0) {
        if (rem.length === 4) {
          rows.push({ authors: rem.slice(0, 2), style: "Sect2" });
          rows.push({ authors: rem.slice(2, 4), style: "Sect2" });
          break;
        }
        if (rem.length === 2) {
          rows.push({ authors: rem.slice(0, 2), style: "Sect2" });
          break;
        }
        const chunk = rem.slice(0, 3);
        rows.push({ authors: chunk, style: "Sect1" });
        rem = rem.slice(chunk.length);
      }
    }

    for (let r = 0; r < rows.length; r++) {
      const { authors: rowAuthors, style: secStyle } = rows[r];
      const authorSection = document.createElementNS(
        NS.TEXT,
        "text:section"
      );
      setAttributeNS(
        authorSection,
        NS.TEXT,
        "text:name",
        `AuthorSection_${r + 1}`
      );
      setAttributeNS(authorSection, NS.TEXT, "text:style-name", secStyle);

      for (let i = 0; i < rowAuthors.length; i++) {
        const el = rowAuthors[i];
        // The first author in any row starts at Column 1 (no break).
        // Subsequent authors in the same row break to the next column.
        const isBreak = i > 0;
        setAttributeNS(
          el,
          NS.TEXT,
          "text:style-name",
          isBreak ? "AuthorColBreak" : "AuthorNormal"
        );
        authorSection.appendChild(el);
      }

      officeText.appendChild(authorSection);
    }
  }

  // 4. Add Body Section (Sect2: 2 columns)
  if (bodyElements.length > 0) {
    const mainSection = document.createElementNS(
      NS.TEXT,
      "text:section"
    );
    setAttributeNS(mainSection, NS.TEXT, "text:name", "MainContentSection");
    setAttributeNS(mainSection, NS.TEXT, "text:style-name", "Sect2");

    for (const bodyEl of bodyElements) {
      mainSection.appendChild(bodyEl);
    }

    officeText.appendChild(mainSection);
  }
}

// ------------------------------------------------------------
// Main
// ------------------------------------------------------------

async function main() {
  const inputPath = path.resolve(INPUT_FILE);
  const refPath = path.resolve(REFERENCE_FILE);
  const outputPath = path.resolve(OUTPUT_FILE);

  const isIeeeTemplate = await checkTemplateUsesSections(refPath);

  const inputBuffer = fs.readFileSync(inputPath);
  const zip = await JSZip.loadAsync(inputBuffer);

  const contentFile = zip.file("content.xml");
  if (!contentFile) {
    throw new Error("Invalid ODT: content.xml not found");
  }

  const contentXml = await contentFile.async("string");
  const document = new DOMParser().parseFromString(contentXml, "text/xml");

  if (!document || !document.documentElement) {
    throw new Error("Could not parse content.xml");
  }

  // Check if authors exist or template uses sections
  const hasAuthors =
    contentXml.includes('text:style-name="Author"') ||
    contentXml.includes('text:style-name="Authors"') ||
    contentXml.includes('class="authors"');

  if (!isIeeeTemplate && !hasAuthors) {
    console.log(
      "Reference template is not multi-section IEEE template; skipping section formatting."
    );
    return;
  }

  console.log("Formatting IEEE sections (3-column authors, 2-column body)...");

  const automaticStyles = getAutomaticStyles(document);
  ensureSectionStyles(document, automaticStyles);
  formatDocumentSections(document);

  const serializer = new XMLSerializer();
  const newContentXml = serializer.serializeToString(document);

  zip.file("content.xml", newContentXml);

  const outputBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
  });

  fs.writeFileSync(outputPath, outputBuffer);
  console.log(`Updated sections in: ${outputPath}`);
}

main().catch((err) => {
  console.error("format-sections error:", err);
  process.exit(1);
});
