# Usage

## Live Preview

Start the live preview:

```bash
npm run preview
```

Then open:

```text
http://localhost:3000
```

The preview watches the report source and related build files. Changes are automatically rebuilt and reflected in the browser.

The preview builds only the report content, not the Index, to keep rebuilds faster.

## Edit the Report

Write the report in the `content/` directory using any code editor.

The report can be split across multiple Markdown files. Files are combined automatically during the build based on filename.

## Build

Generate the complete report:

```bash
npm run build
```

This generates the Index and report content as editable ODT documents and PDFs in `output/`.

The Index includes heading 2 entries and their page numbers by default. This can be configured in scripts/extract-index.js.

## Combine PDFs

Additional PDFs, such as a cover page, can be placed in `output/pdf/` and given numeric filename prefixes to control their order.

For example:

```text
output/pdf/
├── 01_cover.pdf
├── 02_index.pdf
└── 03_content.pdf
```

Then run:

```bash
npm run combine
```

This produces:

```text
output/final_report.pdf
```

The PDF combiner can automatically insert blank pages when configured sections need to start on a right-hand page. This behavior can be customized in `combine_pdfs.js`.

## Finalize

Generate the complete report and combine its PDFs into the final document:

```
npm run finalize
```

This is a convenience command that runs both: `npm run build`, `npm run combine`

Use it when you want to produce the final report without running the individual build and combination steps separately.

## Customize Formatting

The report's visual formatting is controlled by the reference document:

```text
reference/content-reference.odt
```

Open this file in LibreOffice Writer to customize things such as:

* Fonts and text styles
* Heading appearance
* Paragraph spacing
* Table formatting
* Caption styles
* Page layout

Changes to the reference document are used the next time the report is built.

The Index uses a separate template:

```text
reference/index-reference.odt
```

## Customize Report Generation

Report Kit's build scripts define which transformations are applied to the Markdown.

For example, figure and table numbering with cross-references is handled by Pandoc. Table IDs from `Table: Caption {#tbl:id}` captions are assigned through `filters/table-identifiers.lua`, and the output styling is adjusted in `scripts/format-table-numbering.js` (Roman vs Arabic) and `scripts/format-figure-labels.js` (`Figure` vs `Fig.`). These can be adjusted if different numbering behavior is required.

---

## IEEE Paper Support

Report Kit natively supports standard IEEE Conference paper formatting without requiring LaTeX.

When `reference/content-reference.odt` contains IEEE multi-column section styles:
1. **Title & Subtitle**: Kept at the page level in single column across the page.
2. **Author Block**: Formatted in a 3-column section (`Sect1`) with column breaks between authors.
3. **Paper Body**: Formatted in a 2-column section (`Sect2`) flowing across all pages.

ODT sections and table borders are automatically applied directly at the XML level during `npm run build` and `npm run preview`.
