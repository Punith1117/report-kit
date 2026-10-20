// Load and validate settings from settings.yaml

import { readFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { parse } from "yaml";
import {
  DEFAULT_SETTINGS,
  SUPPORTED_REFERENCE_FORMATS,
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
      // Merge with defaults
      settings = { ...DEFAULT_SETTINGS, ...parsed };

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
  };
}
