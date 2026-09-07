# Report Kit

A local-first report automation toolkit that turns Markdown into polished, repeatable documents.

Write your report in the code editor you already use. Split large reports into manageable Markdown files, keep your formatting rules in reusable templates, and let Report Kit handle the repetitive work — numbering headings, figures, and tables, applying consistent styling, generating the Index, converting to editable Word-compatible documents and PDFs, and rebuilding a live browser preview.

No formatting by hand. No cloud service. No special writing application. 

*Keep content and design separate. Automate the repetitive work. Produce consistent reports every time.*

---

## Features

- Markdown-based report authoring
- Multiple Markdown files combined into a report
- Automatic heading, figure, and table numbering
- Automatic Index generation
- Template-based ODT styling
- ODT → PDF conversion
- Live PDF preview with automatic rebuilds
- Combine PDFs to get a final report
- Fully local and offline-capable

---

## Installation

See [Installation](documentation/installation.md) for platform-specific setup instructions.

---

## Usage

See [Usage](documentation/usage.md) for instructions on editing, building, previewing, customizing templates, and generating the final report.

---

## Project Structure

```text
.
├── assets/             # Images and other assets
├── content/            # Report Markdown files
├── documentation/      # Guides and documentation
├── filters/            # Pandoc Lua filters
├── output/             # Generated ODT, PDF, and Markdown files
├── reference/          # ODT formatting templates
├── scripts/            # Build and processing scripts
├── viewer/             # Live preview UI
├── preview-server.js   # Preview server
├── setup.sh            # Checks required system dependencies
├── setup.ps1           # Checks and installs required system dependencies
├── package.json
└── README.md
```

---

## Building the Report

Run:

```bash
npm run build
```

This generates:

```text
output/
├── odt/
│   ├── 02_index.odt
│   └── 03_content.odt
└── pdf/
    ├── 02_index.pdf
    └── 03_content.pdf
```

The Index and report content are generated separately so they can be combined with externally provided PDFs, such as a cover page, in a controlled order.

Both ODT files are automatically processed with the `AddBordersToAllTables` LibreOffice macro before PDF generation.

> **Note:** Add the project directory to LibreOffice's **Trusted Sources** in the Macro Security settings so that the automated macro can run. See [Issue #1](https://github.com/Punith1117/report-kit/issues/1) for a demonstration.

---

## Combining PDFs

The final submission PDF is assembled from the files in:

```text
output/pdf/
```

Files are combined in alphabetical filename order.

The default generated files are: `02_index.pdf`, `03_content.pdf`

Additional PDFs can be added using numeric prefixes. For example: `01_cover.pdf`

Run:

```
npm run combine
```

This generates:

`output/final_report.pdf`

---

## Finalizing the Report

To generate the complete report and produce the final submission PDF in one command, run:

`npm run finalize`

This runs the build and PDF combination steps in sequence:

Build -> Generate ODT + PDF -> Combine -> final_report.pdf

Use `npm run build` and `npm run combine` separately when you need to work with the individual stages. Use `npm run finalize` when you simply want to generate the final report.

---

## Live Preview

Run:

```bash
npm run preview
```

Then open:

```text
http://localhost:3000
```

The preview automatically rebuilds the content PDF when any of its dependencies change:

- content/
- assets/
- filters/
- scripts/preview_build.js
- reference/content-reference.odt

The preview intentionally skips Index generation to keep rebuilds fast.

---

## Templates

The reference ODT files control document styling such as:

- Fonts
- Headings
- Paragraph formatting
- Tables
- Captions
- Page layout

The two templates are:

```text
reference/content-reference.odt
reference/index-reference.odt
```

The source of the automated table-border macro is documented in:

```text
documentation/AddBordersToAllTables.md
```

> Table captions use the TableCaption paragraph style, which must exist in the reference ODT.

---

## Documentation

- [Installation](documentation/installation.md) — setup instructions for Linux and Windows
- [Syntax Guide](documentation/syntax-guide.md) — Markdown conventions and supported report syntax
- [AddBordersToAllTables](documentation/AddBordersToAllTables.md) — implementation details of the automated table-border macro

---

## Philosophy

The project deliberately uses a small local toolchain:

**Markdown → Pandoc/Lua → ODT → LibreOffice → PDF**

No database, cloud backend, AI service, or remote rendering infrastructure is required.

---

Copyright (C) 2026 Punith

This project is licensed under the GNU General Public License v3.0.
See the [LICENSE](LICENSE) file for details.
