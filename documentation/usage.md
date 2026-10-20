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

The Index includes heading 2 entries and their page numbers by default. See the [Configuration](#configuration) section for available options.

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

The PDF combiner can automatically insert blank pages when configured sections need to start on a right-hand page. See the [Configuration](#configuration) section for available options.

## Finalize

Generate the complete report and combine its PDFs into the final document:

```
npm run finalize
```

This is a convenience command that runs both: `npm run build`, `npm run combine`

Use it when you want to produce the final report without running the individual build and combination steps separately.

## Generate Tables from Pipe-Delimited Input

Create markdown tables with automatic column width and alignment formatting from a simple pipe-delimited text file:

```bash
npm run create:table
```

**Input format** (`new-table.txt`):

```text
Component | Specification
DHT22 | 3.3V to 5V
DHT22 | -40°C to 80°C
DHT22 | 0% to 100%
ESP32 | 3.3V
ESP32 | 802.11 b/g/n
```

**Output** (`output/md/table.md`):

A markdown table with a `<!-- col-w: ... | align: ... -->` comment and properly formatted separators. The script calculates optimal column widths from the content and centers all columns by default.

Move it into your report content and edit the formatting comment as needed.

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

## Configuration

All report generation behavior is controlled through `config/settings.yaml`. This file provides a single, centralized location for configuration without requiring script modifications.

### Complete Example

```yaml
reference: ieee

image:
  label: "Fig."

table:
  numbering: roman

heading:
  numbering:
    h1: false
    h2: false
    h3: false

index:
  includeH2: true
  includeH2PageNumbers: true
  includeH2Numbering: true
  uppercaseTitles: false
  title: "Table of Contents"
  table:
    serialWidth: 8
    titleWidth: 61
    pageWidth: 9
    alignment:
      serial: center
      title: left
      page: center

pdf:
  combine:
    rightHandSections:
      - "02_index.pdf"
      - "03_content.pdf"
    rightHandPageParity: odd
```

The example above shows the project's default configuration. Boolean options accept `true` or `false`.

### Setting Reference

| Setting | Description | Values |
| --------- | ------------- | -------- |
| `reference` | Selects the report reference template | `ieee`, `default` |
| `image.label` | Controls the figure caption label (e.g., `Fig.` or `Figure`) | string |
| `table.numbering` | Controls table numbering format | `roman`, `arabic` |
| `heading.numbering.h1` | Enable/disable H1 automatic numbering | `true`, `false` |
| `heading.numbering.h2` | Enable/disable H2 automatic numbering | `true`, `false` |
| `heading.numbering.h3` | Enable/disable H3 automatic numbering | `true`, `false` |
| `index.includeH2` | Include H2 headings in the generated Index | `true`, `false` |
| `index.includeH2PageNumbers` | Show page numbers for H2 entries in Index | `true`, `false` |
| `index.includeH2Numbering` | Include heading numbers in H2 Index entries (e.g., `2.2 Background`) | `true`, `false` |
| `index.uppercaseTitles` | Convert Index entry titles to uppercase | `true`, `false` |
| `index.title` | Sets the displayed Index title | string |
| `index.table.serialWidth` | Width of serial number column in Index table | positive integer |
| `index.table.titleWidth` | Width of title column in Index table | positive integer |
| `index.table.pageWidth` | Width of page number column in Index table | positive integer |
| `index.table.alignment.serial` | Alignment for serial column | `left`, `center`, `right` |
| `index.table.alignment.title` | Alignment for title column | `left`, `center`, `right` |
| `index.table.alignment.page` | Alignment for page column | `left`, `center`, `right` |
| `pdf.combine.rightHandSections` | List of PDF filenames that must start on a right-hand page | array of strings |
| `pdf.combine.rightHandPageParity` | Page parity considered as "right-hand" | `odd`, `even` |

## IEEE Paper Support

Report Kit natively supports standard IEEE Conference paper formatting without requiring LaTeX.

When `reference/content-reference.odt` contains IEEE multi-column section styles:
1. **Title & Subtitle**: Kept at the page level in single column across the page.
2. **Author Block**: Formatted in a 3-column section (`Sect1`) with column breaks between authors.
3. **Paper Body**: Formatted in a 2-column section (`Sect2`) flowing across all pages.

ODT sections and table borders are automatically applied directly at the XML level during `npm run build` and `npm run preview`.
