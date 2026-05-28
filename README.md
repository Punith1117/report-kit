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
- **`template-mciot.odt`**: The reference OpenDocument template used to style the output report.
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
4. Style the document using `template-mciot.odt`.
5. Output the final report to `output/report.odt`.

## Formatting Features

- **Page Breaks**: You can force a page break in your markdown files by using the raw LaTeX command `\newpage` or `\pagebreak` on its own line. The included Lua filter handles the conversion for ODT output.
