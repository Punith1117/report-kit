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
- **`filters/`**: Contains Pandoc Lua filters. Includes `pagebreak.lua` which translates LaTeX-style `\newpage` or `\pagebreak` commands into proper ODT/Word page breaks.
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

## Markdown Syntax Guide (PROJECT STANDARD)

This project uses Pandoc-compatible Markdown only.

### 1. Headings (Template-driven)
Level	Style
# Heading 1	16pt Bold
## Heading 2	14pt Bold
### Heading 3	12pt Bold

Rules:

Heading 1 → major chapters
Heading 2 → sections
Heading 3 → subsections

### 2. Paragraph Styling (Template controlled)

Template enforces:

- Body text: justified
- First paragraph: bold + justified (section intro style)

### 3. Page Breaks, Enter and Spaces

Use: `\newpage` or `\pagebreak` for new page - Handled by: filters/pagebreak.lua

Use: `&nbsp` for space and `&emsp` for tab space.

Use: `\` for Enter.

### 4. Images (Centered with Caption)
Correct syntax:
`![Figure 4.1: System Architecture](assets/images/architecture.png)`

Requirements:

Must be alone in paragraph
Caption is auto-derived from alt text
Centering is handled by template styling

### 5. Tables (IMPORTANT RULE)

Mandatory constraint:

Pandoc-generated tables DO NOT include borders automatically.

Recommended table format:

```
-------- --------------------- -------------------------------------------
 Sl. No   Software              Purpose
-------- --------------------- -------------------------------------------
 1        Arduino IDE           Writing and uploading program code
 
 2        Embedded C            Programming language used for coding
 
 3        ESP32 Board Package   Supports ESP32 programming in Arduino IDE
 
 4        DHT Sensor Library    Enables communication with DHT22 sensor
 
 5        Serial Monitor        Displays real-time temperature readings
-------- --------------------- -------------------------------------------
```

> **IMPORTANT NOTE** : Table borders are NOT automatically applied by Pandoc or ODT templates. Borders must be manually added

### 6. Column Width of Table Behavior

Use hyphens between header and first content row in the table to increase/decrease column width.

## 7. Template (ODT Styling System)

Your `template.odt` controls all document styling rules.

---

### 📄 Heading Styles

- Heading 1 -> 16pt bold  
- Heading 2 -> 14pt bold  
- Heading 3 -> 12pt bold  

---

### 📄 Paragraph Styles

- Body text → justified  
- First paragraph → bold + justified  

---

### 📄 Tables

- Cell padding is configured via LibreOffice table styles  
- Table borders are **not automatically generated**  
- Borders must be manually enabled in the table style editor  

---

### 📄 Figures

- Center alignment is enforced via template paragraph styles  
- Captions inherit normal paragraph styling  

---

## 🔄 Convert ODT → DOCX

After generating the `.odt` file:

```bash
libreoffice --headless --convert-to docx output/report.odt --outdir output
```

## 🚀 Design Philosophy

This system is built with a focus on reliable and predictable document generation.

It prioritizes:

- Deterministic output across all builds  
- Reproducible formatting regardless of environment  
- Template-driven styling for consistent visual structure  
- Minimal runtime complexity and dependencies  
- Offline-first workflow with no cloud service reliance  
