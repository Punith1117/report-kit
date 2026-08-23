#!/bin/bash
set -e

mkdir -p output

# 1. Standard Pandoc assembly
pandoc content/*.md \
  -o output/report.odt \
  --reference-doc=reference.odt \
  --lua-filter=filters/index.lua \
  --lua-filter=filters/number-h1.lua \
  --lua-filter=filters/number-h2.lua \
  --lua-filter=filters/number-tables.lua \
  --lua-filter=filters/number-images.lua \
  --lua-filter=filters/pagebreak.lua \
  --table-caption-position=below

echo "Build complete: output/report.odt"

# 2. Automated Macro Processing using official URI schema syntax
soffice --headless --norestore \
  "output/report.odt" \
  "macro://./Standard.Module1.AddBordersToAllTables"

echo "Macro completed successfully: Tables formatted"

# 3. Compile final PDF preview artifact
soffice \
  --headless \
  --convert-to pdf \
  output/report.odt \
  --outdir output

echo "Generated: output/report.pdf"
