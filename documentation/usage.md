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

For example, the automatic heading, table, and figure numbering is enabled through Lua filters in the build scripts. These filters can be removed or changed if different numbering behavior is required.
