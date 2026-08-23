# Markdown Report Generator

A local-first document generation system that converts Markdown into styled ODT and PDF documents, with a live browser preview.

> **Markdown defines the document content and structure; reference templates define its visual formatting.**

---

## Features

- Markdown-based report authoring
- Multiple Markdown files combined into a report
- Automatic heading, figure, and table numbering
- Automatic Index generation
- Automatic page breaks
- Template-based ODT styling
- Automatic table borders
- ODT → PDF conversion
- Live PDF preview with automatic rebuilds
- Fully local and offline-capable

---

## Requirements

- [Pandoc](https://pandoc.org/)
- LibreOffice
- Node.js

Install Node.js dependencies:

```bash
npm install
````

---

## Project Structure

```text
.
├── content/
├── assets/
├── filters/
├── scripts/
├── documentation/
├── reference/
│   ├── content-reference.odt
│   └── index-reference.odt
├── output/
│   ├── odt/
│   └── pdf/
├── viewer/
├── build.sh
├── preview-server.js
└── package.json
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
│   ├── index.odt
│   └── content.odt
└── pdf/
    ├── index.pdf
    └── content.pdf
```

The index and content are generated separately so that the Index can be edited or combined with externally provided front matter before final submission.

Both ODT files are automatically processed with the `AddBordersToAllTables` LibreOffice macro before PDF generation.

> **Note:** LibreOffice Macro Security must be set to **Low** for automated macro execution.

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

The preview watches `content/` for changes and automatically rebuilds the content PDF.

The preview intentionally skips Index generation to keep rebuilds fast.

---

## Templates

The reference ODT files control document styling such as:

* Fonts
* Headings
* Paragraph formatting
* Tables
* Captions
* Page layout

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

Additional project conventions and implementation details are documented in:

```text
documentation/
├── AddBordersToAllTables.md
└── syntax-guide.md
```

---

## Philosophy

The project deliberately uses a small local toolchain:

**Markdown → Pandoc/Lua → ODT → LibreOffice → PDF**

No database, cloud backend, AI service, or remote rendering infrastructure is required.

