// Load and validate settings from settings.yaml

import { readFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { parse } from "yaml";
import {
  DEFAULT_SETTINGS,
  SUPPORTED_REFERENCE_FORMATS,
  SUPPORTED_TABLE_NUMBERING,
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
  };
}
