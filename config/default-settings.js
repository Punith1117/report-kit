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
  index: {
    includeH2: true,
    includeH2PageNumbers: true,
    includeH2Numbering: true,
    uppercaseTitles: false,
    title: "Table of Contents",
    table: {
      serialWidth: 8,
      titleWidth: 61,
      pageWidth: 9,
      alignment: {
        serial: "center",
        title: "left",
        page: "center",
      },
    },
  },
  pdf: {
    combine: {
      rightHandSections: ["02_index.pdf", "03_content.pdf"],
      rightHandPageParity: "odd",
    },
  },
};

export const SUPPORTED_REFERENCE_FORMATS = ["ieee", "default"];
export const SUPPORTED_TABLE_NUMBERING = ["roman", "arabic"];
export const SUPPORTED_ALIGNMENTS = ["left", "center", "right"];
export const SUPPORTED_PAGE_PARITY = ["odd", "even"];

// Map configuration values to actual reference document files
// Per task specification: ieee -> reference/ieee.odt, default -> reference/default.odt
export const REFERENCE_FILES = {
  ieee: "reference/ieee.odt",
  default: "reference/default.odt",
};

export const SETTINGS_FILE = "config/settings.yaml";
