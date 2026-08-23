#!/bin/bash
set -e

mkdir -p output/odt output/pdf

# 1. Generate index ODT
pandoc content/*.md \
  -o output/odt/02_index.odt \
  --reference-doc=reference/index-reference.odt \
  --lua-filter=filters/index.lua

echo "Generated: output/odt/02_index.odt"

# 2. Apply table borders to index
soffice --headless --norestore \
  "output/odt/02_index.odt" \
  "macro://./Standard.Module1.AddBordersToAllTables"

echo "Index macro completed: Tables formatted"

# 3. Generate content ODT
pandoc content/*.md \
  -o output/odt/03_content.odt \
  --reference-doc=reference/content-reference.odt \
  --lua-filter=filters/number-h1.lua \
  --lua-filter=filters/number-h2.lua \
  --lua-filter=filters/number-tables.lua \
  --lua-filter=filters/number-images.lua \
  --lua-filter=filters/pagebreak.lua \
  --table-caption-position=below

echo "Generated: output/odt/03_content.odt"

# 4. Apply table borders to content
soffice --headless --norestore \
  "output/odt/03_content.odt" \
  "macro://./Standard.Module1.AddBordersToAllTables"

echo "Content macro completed: Tables formatted"

# 5. Convert index ODT to PDF
soffice \
  --headless \
  --convert-to pdf \
  output/odt/02_index.odt \
  --outdir output/pdf

echo "Generated: output/pdf/02_index.pdf"

# 6. Convert content ODT to PDF
soffice \
  --headless \
  --convert-to pdf \
  output/odt/03_content.odt \
  --outdir output/pdf

echo "Generated: output/pdf/03_content.pdf"
