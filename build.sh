#!/bin/bash

set -e

mkdir -p output

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

soffice \
  --headless \
  --convert-to pdf \
  output/report.odt \
  --outdir output

echo "Generated: output/report.pdf"
