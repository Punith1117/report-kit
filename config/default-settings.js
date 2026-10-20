// Built-in default configuration values

export const DEFAULT_SETTINGS = {
  reference: "ieee",
  image: {
    label: "Fig.",
  },
  table: {
    numbering: "roman",
  },
  heading: {
    numbering: {
      h1: false,
      h2: false,
      h3: false,
    },
  },
};

export const SUPPORTED_REFERENCE_FORMATS = ["ieee", "default"];
export const SUPPORTED_TABLE_NUMBERING = ["roman", "arabic"];

// Map configuration values to actual reference document files
// Per task specification: ieee -> reference/ieee.odt, default -> reference/default.odt
export const REFERENCE_FILES = {
  ieee: "reference/ieee.odt",
  default: "reference/default.odt",
};

export const SETTINGS_FILE = "config/settings.yaml";
