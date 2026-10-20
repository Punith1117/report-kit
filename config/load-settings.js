// Load and validate settings from settings.yaml

import { readFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { parse } from "yaml";
import {
  DEFAULT_SETTINGS,
  SUPPORTED_REFERENCE_FORMATS,
  SUPPORTED_TABLE_NUMBERING,
  SUPPORTED_ALIGNMENTS,
  SUPPORTED_PAGE_PARITY,
  REFERENCE_FILES,
  SETTINGS_FILE,
} from "./default-settings.js";

/**
 * Load and validate settings from settings.yaml
 * @param {string} projectRoot - Absolute path to the project root
 * @returns {Object} Normalized settings object with resolved reference path
 */
export function loadSettings(projectRoot) {
  const settingsPath = join(projectRoot, SETTINGS_FILE);
  let settings = { ...DEFAULT_SETTINGS };
  let usedDefaults = false;

  // Check if settings file exists
  if (!existsSync(settingsPath)) {
    console.info(
      `Configuration file '${SETTINGS_FILE}' not found. Using built-in defaults: reference=${DEFAULT_SETTINGS.reference}`
    );
    usedDefaults = true;
  } else {
    // Read and parse YAML
    let rawContent;
    try {
      rawContent = readFileSync(settingsPath, "utf8");
    } catch (error) {
      throw new Error(
        `Failed to read ${SETTINGS_FILE}: ${error.message}`
      );
    }

    let parsed;
    try {
      parsed = parse(rawContent);
    } catch (error) {
      throw new Error(
        `Malformed YAML in ${SETTINGS_FILE}: ${error.message}`
      );
    }

    // Validate root is a mapping (object)
    if (parsed === null || parsed === undefined) {
      // Empty file - use defaults
      console.info(
        `${SETTINGS_FILE} is empty. Using built-in defaults: reference=${DEFAULT_SETTINGS.reference}`
      );
      usedDefaults = true;
    } else if (typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error(
        `Invalid ${SETTINGS_FILE}: root must be a mapping (object), got ${typeof parsed}`
      );
    } else {
      // Check if reference key is explicitly provided
      const hasReferenceKey = Object.prototype.hasOwnProperty.call(parsed, "reference");
      
      // Merge with defaults (deep merge for nested objects)
      settings = {
        ...DEFAULT_SETTINGS,
        ...parsed,
        image: { ...DEFAULT_SETTINGS.image, ...(parsed.image || {}) },
        table: { ...DEFAULT_SETTINGS.table, ...(parsed.table || {}) },
        heading: { ...DEFAULT_SETTINGS.heading, ...(parsed.heading || {}),
          numbering: { ...DEFAULT_SETTINGS.heading.numbering, ...(parsed.heading?.numbering || {}) } },
        index: { ...DEFAULT_SETTINGS.index, ...(parsed.index || {}),
          table: { ...DEFAULT_SETTINGS.index.table, ...(parsed.index?.table || {}) } },
        pdf: { ...DEFAULT_SETTINGS.pdf, ...(parsed.pdf || {}),
          combine: { ...DEFAULT_SETTINGS.pdf.combine, ...(parsed.pdf?.combine || {}) } },
      };

      // Validate reference value from parsed (not merged) to detect missing key
      const referenceValue = parsed.reference;
      if (!hasReferenceKey) {
        // Key omitted - use default
        console.info(
          `'reference' key not found in ${SETTINGS_FILE}. Using built-in default: reference=${DEFAULT_SETTINGS.reference}`
        );
      } else if (referenceValue === null || referenceValue === undefined) {
        // Key present but null/undefined - use default
        console.info(
          `'reference' key is null in ${SETTINGS_FILE}. Using built-in default: reference=${DEFAULT_SETTINGS.reference}`
        );
        settings.reference = DEFAULT_SETTINGS.reference;
      } else if (typeof referenceValue !== "string") {
        throw new Error(
          `Invalid 'reference' in ${SETTINGS_FILE}: expected string, got ${typeof referenceValue} (${JSON.stringify(referenceValue)})`
        );
      } else if (!SUPPORTED_REFERENCE_FORMATS.includes(referenceValue)) {
        throw new Error(
          `Invalid 'reference' value in ${SETTINGS_FILE}: '${referenceValue}'. Supported values: ${SUPPORTED_REFERENCE_FORMATS.join(", ")}`
        );
      }

      // Validate image.label
      const imageValue = parsed.image;
      if (imageValue !== undefined && imageValue !== null) {
        if (typeof imageValue !== "object" || Array.isArray(imageValue)) {
          throw new Error(
            `Invalid 'image' in ${SETTINGS_FILE}: expected object, got ${typeof imageValue}`
          );
        }
        const labelValue = imageValue.label;
        if (labelValue !== undefined) {
          if (typeof labelValue !== "string") {
            throw new Error(
              `Invalid 'image.label' in ${SETTINGS_FILE}: expected string, got ${typeof labelValue}`
            );
          }
          const trimmedLabel = labelValue.trim();
          if (trimmedLabel === "") {
            console.info(
              `'image.label' is empty or whitespace in ${SETTINGS_FILE}. Using built-in default: image.label="${DEFAULT_SETTINGS.image.label}"`
            );
            settings.image.label = DEFAULT_SETTINGS.image.label;
          } else {
            settings.image.label = labelValue;
          }
        }
      }

      // Validate table.numbering
      const tableValue = parsed.table;
      if (tableValue !== undefined && tableValue !== null) {
        if (typeof tableValue !== "object" || Array.isArray(tableValue)) {
          throw new Error(
            `Invalid 'table' in ${SETTINGS_FILE}: expected object, got ${typeof tableValue}`
          );
        }
        const numberingValue = tableValue.numbering;
        if (numberingValue !== undefined) {
          if (typeof numberingValue !== "string") {
            throw new Error(
              `Invalid 'table.numbering' in ${SETTINGS_FILE}: expected string, got ${typeof numberingValue}`
            );
          }
          if (!SUPPORTED_TABLE_NUMBERING.includes(numberingValue)) {
            console.info(
              `Invalid 'table.numbering' value in ${SETTINGS_FILE}: '${numberingValue}'. Supported values: ${SUPPORTED_TABLE_NUMBERING.join(", ")}. Using built-in default: table.numbering="${DEFAULT_SETTINGS.table.numbering}"`
            );
            settings.table.numbering = DEFAULT_SETTINGS.table.numbering;
          } else {
            settings.table.numbering = numberingValue;
          }
        }
      }

      // Validate heading.numbering
      const headingValue = parsed.heading;
      if (headingValue !== undefined && headingValue !== null) {
        if (typeof headingValue !== "object" || Array.isArray(headingValue)) {
          throw new Error(
            `Invalid 'heading' in ${SETTINGS_FILE}: expected object, got ${typeof headingValue}`
          );
        }
        const numberingValue = headingValue.numbering;
        if (numberingValue !== undefined && numberingValue !== null) {
          if (typeof numberingValue !== "object" || Array.isArray(numberingValue)) {
            throw new Error(
              `Invalid 'heading.numbering' in ${SETTINGS_FILE}: expected object, got ${typeof numberingValue}`
            );
          }
          // Validate each heading level (h1, h2, h3)
          for (const level of ["h1", "h2", "h3"]) {
            const levelValue = numberingValue[level];
            if (levelValue !== undefined) {
              if (typeof levelValue !== "boolean") {
                console.info(
                  `Invalid 'heading.numbering.${level}' in ${SETTINGS_FILE}: expected boolean, got ${typeof levelValue}. Using built-in default: ${DEFAULT_SETTINGS.heading.numbering[level]}`
                );
                settings.heading.numbering[level] = DEFAULT_SETTINGS.heading.numbering[level];
              } else {
                settings.heading.numbering[level] = levelValue;
              }
            }
          }
        }
      }

      // Validate index settings
      const indexValue = parsed.index;
      if (indexValue !== undefined && indexValue !== null) {
        if (typeof indexValue !== "object" || Array.isArray(indexValue)) {
          throw new Error(
            `Invalid 'index' in ${SETTINGS_FILE}: expected object, got ${typeof indexValue}`
          );
        }
        // Validate boolean flags
        for (const flag of ["includeH2", "includeH2PageNumbers", "includeH2Numbering", "uppercaseTitles"]) {
          const flagValue = indexValue[flag];
          if (flagValue !== undefined) {
            if (typeof flagValue !== "boolean") {
              console.info(
                `Invalid 'index.${flag}' in ${SETTINGS_FILE}: expected boolean, got ${typeof flagValue}. Using built-in default: ${DEFAULT_SETTINGS.index[flag]}`
              );
              settings.index[flag] = DEFAULT_SETTINGS.index[flag];
            } else {
              settings.index[flag] = flagValue;
            }
          }
        }
        // Validate index.title
        const titleValue = indexValue.title;
        if (titleValue !== undefined) {
          if (typeof titleValue !== "string") {
            throw new Error(
              `Invalid 'index.title' in ${SETTINGS_FILE}: expected string, got ${typeof titleValue}`
            );
          }
          const trimmedTitle = titleValue.trim();
          if (trimmedTitle === "") {
            console.info(
              `'index.title' is empty or whitespace in ${SETTINGS_FILE}. Using built-in default: index.title="${DEFAULT_SETTINGS.index.title}"`
            );
            settings.index.title = DEFAULT_SETTINGS.index.title;
          } else {
            settings.index.title = titleValue;
          }
        }
        // Validate index.table
        const indexTableValue = indexValue.table;
        if (indexTableValue !== undefined && indexTableValue !== null) {
          if (typeof indexTableValue !== "object" || Array.isArray(indexTableValue)) {
            throw new Error(
              `Invalid 'index.table' in ${SETTINGS_FILE}: expected object, got ${typeof indexTableValue}`
            );
          }
          // Validate table widths
          for (const width of ["serialWidth", "titleWidth", "pageWidth"]) {
            const widthValue = indexTableValue[width];
            if (widthValue !== undefined) {
              if (typeof widthValue !== "number" || !Number.isInteger(widthValue) || widthValue <= 0) {
                console.info(
                  `Invalid 'index.table.${width}' in ${SETTINGS_FILE}: expected positive integer, got ${widthValue}. Using built-in default: ${DEFAULT_SETTINGS.index.table[width]}`
                );
                settings.index.table[width] = DEFAULT_SETTINGS.index.table[width];
              } else {
                settings.index.table[width] = widthValue;
              }
            }
          }
          // Validate alignment values
          const alignmentValue = indexTableValue.alignment;
          if (alignmentValue !== undefined && alignmentValue !== null) {
            if (typeof alignmentValue !== "object" || Array.isArray(alignmentValue)) {
              throw new Error(
                `Invalid 'index.table.alignment' in ${SETTINGS_FILE}: expected object, got ${typeof alignmentValue}`
              );
            }
            for (const alignKey of ["serial", "title", "page"]) {
              const alignValue = alignmentValue[alignKey];
              if (alignValue !== undefined) {
                if (typeof alignValue !== "string") {
                  console.info(
                    `Invalid 'index.table.alignment.${alignKey}' in ${SETTINGS_FILE}: expected string, got ${typeof alignValue}. Using built-in default: ${DEFAULT_SETTINGS.index.table.alignment[alignKey]}`
                  );
                  settings.index.table.alignment[alignKey] = DEFAULT_SETTINGS.index.table.alignment[alignKey];
                } else if (!SUPPORTED_ALIGNMENTS.includes(alignValue)) {
                  console.info(
                    `Invalid 'index.table.alignment.${alignKey}' value in ${SETTINGS_FILE}: '${alignValue}'. Supported values: ${SUPPORTED_ALIGNMENTS.join(", ")}. Using built-in default: ${DEFAULT_SETTINGS.index.table.alignment[alignKey]}`
                  );
                  settings.index.table.alignment[alignKey] = DEFAULT_SETTINGS.index.table.alignment[alignKey];
                } else {
                  settings.index.table.alignment[alignKey] = alignValue;
                }
              }
            }
          }
        }
      }

      // Validate pdf.combine settings
      const pdfValue = parsed.pdf;
      if (pdfValue !== undefined && pdfValue !== null) {
        if (typeof pdfValue !== "object" || Array.isArray(pdfValue)) {
          throw new Error(
            `Invalid 'pdf' in ${SETTINGS_FILE}: expected object, got ${typeof pdfValue}`
          );
        }
        const combineValue = pdfValue.combine;
        if (combineValue !== undefined && combineValue !== null) {
          if (typeof combineValue !== "object" || Array.isArray(combineValue)) {
            throw new Error(
              `Invalid 'pdf.combine' in ${SETTINGS_FILE}: expected object, got ${typeof combineValue}`
            );
          }
          // Validate rightHandSections
          const rhsValue = combineValue.rightHandSections;
          if (rhsValue !== undefined) {
            if (!Array.isArray(rhsValue)) {
              throw new Error(
                `Invalid 'pdf.combine.rightHandSections' in ${SETTINGS_FILE}: expected array, got ${typeof rhsValue}`
              );
            }
            if (!rhsValue.every(item => typeof item === "string")) {
              throw new Error(
                `Invalid 'pdf.combine.rightHandSections' in ${SETTINGS_FILE}: all items must be strings`
              );
            }
            settings.pdf.combine.rightHandSections = rhsValue;
          }
          // Validate rightHandPageParity
          const parityValue = combineValue.rightHandPageParity;
          if (parityValue !== undefined) {
            if (typeof parityValue !== "string") {
              throw new Error(
                `Invalid 'pdf.combine.rightHandPageParity' in ${SETTINGS_FILE}: expected string, got ${typeof parityValue}`
              );
            }
            if (!SUPPORTED_PAGE_PARITY.includes(parityValue)) {
              console.info(
                `Invalid 'pdf.combine.rightHandPageParity' value in ${SETTINGS_FILE}: '${parityValue}'. Supported values: ${SUPPORTED_PAGE_PARITY.join(", ")}. Using built-in default: ${DEFAULT_SETTINGS.pdf.combine.rightHandPageParity}`
              );
              settings.pdf.combine.rightHandPageParity = DEFAULT_SETTINGS.pdf.combine.rightHandPageParity;
            } else {
              settings.pdf.combine.rightHandPageParity = parityValue;
            }
          }
        }
      }
    }
  }

  // Validate reference value (for case when file doesn't exist or is empty)
  const referenceValue = settings.reference;
  if (typeof referenceValue !== "string") {
    throw new Error(
      `Invalid 'reference' in ${SETTINGS_FILE}: expected string, got ${typeof referenceValue} (${JSON.stringify(referenceValue)})`
    );
  } else if (!SUPPORTED_REFERENCE_FORMATS.includes(referenceValue)) {
    throw new Error(
      `Invalid 'reference' value in ${SETTINGS_FILE}: '${referenceValue}'. Supported values: ${SUPPORTED_REFERENCE_FORMATS.join(", ")}`
    );
  }

  // Resolve reference document path
  const relativeRefPath = REFERENCE_FILES[settings.reference];
  const absoluteRefPath = resolve(projectRoot, relativeRefPath);

  // Verify the reference document exists
  if (!existsSync(absoluteRefPath)) {
    throw new Error(
      `Reference document not found: ${relativeRefPath} (expected at ${absoluteRefPath}). ` +
      `Ensure the file exists for format '${settings.reference}'.`
    );
  }

  return {
    reference: settings.reference,
    referencePath: absoluteRefPath,
    referenceRelativePath: relativeRefPath,
    imageLabel: settings.image.label,
    tableNumbering: settings.table.numbering,
    headingNumbering: settings.heading.numbering,
    indexIncludeH2: settings.index.includeH2,
    indexIncludeH2PageNumbers: settings.index.includeH2PageNumbers,
    indexIncludeH2Numbering: settings.index.includeH2Numbering,
    indexUppercaseTitles: settings.index.uppercaseTitles,
    indexTitle: settings.index.title,
    indexTableWidths: {
      serialWidth: settings.index.table.serialWidth,
      titleWidth: settings.index.table.titleWidth,
      pageWidth: settings.index.table.pageWidth,
    },
    indexTableAlignment: {
      serial: settings.index.table.alignment.serial,
      title: settings.index.table.alignment.title,
      page: settings.index.table.alignment.page,
    },
    pdfRightHandSections: settings.pdf.combine.rightHandSections,
    pdfRightHandPageParity: settings.pdf.combine.rightHandPageParity,
  };
}
