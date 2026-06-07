# Markdown Report Generator

A simple document generation setup that uses [Pandoc](https://pandoc.org/) to convert Markdown files into a styled OpenDocument Text (.odt) report.

## Prerequisites

- **Pandoc**: The core document conversion engine.
  - Ubuntu/Debian/WSL: `sudo apt-get update && sudo apt-get install pandoc`
  - MacOS: `brew install pandoc`
  
- **LibreOffice**: Used for viewing the generated `.odt` files or for headless conversion to PDF.
  - Ubuntu/Debian/WSL: `sudo apt-get install libreoffice`
  - Windows: [Download and install LibreOffice natively](https://www.libreoffice.org/download/download-libreoffice/)
  - MacOS: `brew install --cask libreoffice`

> **Note for Windows/WSL Users**: The recommended workflow is to run the `./build.sh` generation script inside your WSL environment (where Pandoc is installed), and then open the generated `output/report.odt` using the LibreOffice app installed on your host Windows system.

## Project Structure

- **`build.sh`**: The main build script that runs the Pandoc command.
- **`content/`**: Directory containing the Markdown source files for the report. Files are typically numbered to enforce a specific ordering during concatenation (e.g., `01_introduction.md`).
- **`assets/`**: Directory for storing static assets like images used in the Markdown files.
- **`filters/`**: Pandoc Lua filters that automate document structure.

  These filters remove the need for manual formatting tasks such as numbering and index creation.

  Includes:
  - `pagebreak.lua` → converts `\newpage` / `\pagebreak` into real ODT page breaks  
  - `number-h1.lua` → automatically generates chapter numbering (1, 2, 3...)  
  - `number-h2.lua` → automatically generates hierarchical section numbering (1.1, 1.2...)  
  - `index.lua` → generates Index table automatically from Heading 1 structure
- **`reference.odt`**: The reference OpenDocument template used to style the output report.
- **`output/`**: The generated report (`report.odt`) will be saved here.

## Usage

To generate the report, simply execute the build script:

```bash
./build.sh
```

This script will:
1. Create the `output` directory if it doesn't exist.
2. Concatenate all `.md` files in the `content/` directory.
3. Apply the `pagebreak.lua` filter.
4. Style the document using `reference.odt`.
5. Output the final report to `output/report.odt`.

This pipeline ensures that document structure is always derived from content, not manually maintained formatting.

## 📘 Writing Guide

All document writing rules are defined in: `syntax-guide.md`

## 🧠 Automated Document Structure

This system eliminates manual document maintenance by deriving structure from Markdown content.

Previously, users had to:

- manually number chapters and sections
- update numbering after adding/removing content
- maintain index tables separately from content

Now:

- numbering is generated automatically (`1. `, `2. ` for `Heading 1` and  `1.1 `, `1.2 ` for `Heading 2`)
- index is derived directly from document structure
- formatting is handled by template and filters
- content remains the only source of truth

## 📘 Index Generation

The Index is automatically generated from all Heading 1 elements in the document.

This removes the need to manually maintain:

- chapter ordering
- serial numbers
- index table updates after edits

The only manual input required is page numbers (as per academic formatting requirements).

---

## ⚙️ Design Tradeoffs

This system is intentionally built around deterministic, local-first document generation using Pandoc and LibreOffice. The design choices below explain why certain tools were selected over more complex or “modern” alternatives.

### 🧩 Why Pandoc instead of a custom renderer

Pandoc is used as the core conversion engine instead of building a custom Markdown-to-ODT pipeline.

**Reasoning:**
- Pandoc already implements a battle-tested Markdown AST parser
- Handles edge cases (tables, lists, nested structures) that are easy to get wrong in custom parsers
- Supports multiple output formats (ODT, DOCX, PDF) without rewriting logic
- Maintains deterministic conversion behavior across environments

**Tradeoff:**
- Less low-level control over final document internals
- Requires working within Pandoc’s abstraction layer instead of full custom formatting logic

---

### 🧠 Why Lua filters instead of post-processing scripts

All structural transformations (numbering, index generation, page breaks) are implemented as Pandoc Lua filters.

**Reasoning:**
- Operate directly on Pandoc’s AST (structured, not string-based)
- Avoid brittle regex-based Markdown parsing
- Execute during compilation, not after rendering
- Keep transformation logic declarative and modular

**Tradeoff:**
- Requires understanding Pandoc AST model
- Debugging is less intuitive than plain Node.js scripts
- Limited ecosystem compared to general-purpose scripting

---

### 📄 Why ODT instead of DOCX-first

The output format is OpenDocument Text (.odt) instead of directly targeting Microsoft Word formats.

**Reasoning:**
- LibreOffice provides reliable headless conversion tooling
- ODT is more stable for template-driven styling in open-source workflows
- Easier to embed consistent style templates (`reference.odt`)
- Avoids Microsoft Office-specific formatting inconsistencies

**Tradeoff:**
- DOCX is more widely used in corporate environments
- Some styling parity differences may exist when converting ODT -> DOCX later

---

### 🔧 Why LibreOffice macro is tolerated (table borders limitation)

Pandoc does not generate reliable table borders in ODT output, so a LibreOffice macro is used as a post-processing step.

**Reasoning:**
- Ensures consistent table styling without modifying Pandoc internals
- Keeps Markdown clean and focused on content, not presentation hacks
- Applies uniform styling after document generation in a controlled environment

**Tradeoff:**
- Requires macro security configuration on user systems
- Adds dependency on LibreOffice runtime behavior
- Breaks full portability if macros are disabled or restricted

---

## Template (ODT Styling System)

Your `template.odt` controls all document styling rules.

---

### 📄 Heading Styles

- Heading 1 -> 16pt bold  
- Heading 2 -> 14pt bold  
- Heading 3 -> 12pt bold  

---

### 📄 Paragraph Styles

- Body text -> justified  
- First paragraph -> justified  

---

### 📄 Tables

- Tables are written using Pandoc-compatible Markdown
- Column alignment and structure are handled by Pandoc + ODT template
- Table borders should be applied using a LibreOffice macro after generation manually

This avoids manual table formatting inside Markdown files and keeps content focused on data rather than styling.

---

### 📄 Figures

- Center alignment is enforced via template paragraph styles  
- Captions inherit normal paragraph styling  

---

## 🧩 LibreOffice Macro Support (Table Borders Automation)

This project optionally uses a LibreOffice macro to automatically apply borders to all tables in the generated `.odt` file.

---

## ⚙️ Macro Purpose

Pandoc does not generate table borders in ODT output.

To fix this, a LibreOffice macro is used to:

- Detect all tables in the document  
- Apply consistent border styling  
- Ensure uniform report formatting  

---

## 📜 Macro Code Location

The macro is stored in:
```
reference.odt -> LibreOffice Basic -> Module1
```

Macro name:
```
AddBordersToAllTables
```

---

## ▶️ How to Run Manually

Inside LibreOffice Writer:

```
Tools -> Macros -> Run Macro ->
My Macros -> Standard -> Module1 -> AddBordersToAllTables
```

---

## 🔐 IMPORTANT: Enable Macros (Security Settings)

By default, LibreOffice disables macros for safety.
You must enable them for this project.

---

## ✔️ Steps

Navigate to:

```
Tools -> Options -> LibreOffice -> Security -> Macro Security
```

Set to:

```
MEDIUM (recommended for local development)
```

OR:

```
LOW (not recommended, but enables fully automated execution)
```

---

## 🔄 Convert ODT -> DOCX

After generating the `.odt` file:

```bash
libreoffice --headless --convert-to docx output/report.odt --outdir output
```

## 🚀 Design Philosophy

This system treats Markdown as structured input rather than formatted text.

The build pipeline transforms raw content into a fully structured document by:

- deriving numbering from document hierarchy for heading 1 and heading 2
- generating Index automatically
- enforcing consistency between sections and references
- eliminating manual synchronization tasks

This allows authors to focus entirely on content creation while formatting and structure are handled deterministically during build time.
