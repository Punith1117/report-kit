// Built-in default configuration values

export const DEFAULT_SETTINGS = {
  reference: "ieee",
};

export const SUPPORTED_REFERENCE_FORMATS = ["ieee", "default"];

// Map configuration values to actual reference document files
// Per task specification: ieee -> reference/ieee.odt, default -> reference/default.odt
export const REFERENCE_FILES = {
  ieee: "reference/ieee.odt",
  default: "reference/default.odt",
};

export const SETTINGS_FILE = "config/settings.yaml";
