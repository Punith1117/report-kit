#!/bin/bash
set -e

mkdir -p output/odt output/pdf

# 1. Generate content ODT
pandoc content/*.md \
  -o output/odt/content.odt \
  --reference-doc=reference/content-reference.odt \
  --lua-filter=filters/number-h1.lua \
  --lua-filter=filters/number-h2.lua \
  --lua-filter=filters/number-tables.lua \
  --lua-filter=filters/number-images.lua \
  --lua-filter=filters/pagebreak.lua \
  --table-caption-position=below

echo "Generated: output/odt/content.odt"

# 2. Apply table borders
soffice --headless --norestore \
  "output/odt/content.odt" \
  "macro://./Standard.Module1.AddBordersToAllTables"

echo "Content macro completed: Tables formatted"

# 3. Convert content ODT to PDF
soffice \
  --headless \
  --convert-to pdf \
  output/odt/content.odt \
  --outdir output/pdf

echo "Generated: output/pdf/content.pdf"
