#!/bin/bash

mkdir -p output

pandoc content/*.md \
  -o output/report.odt \
  --reference-doc=reference.odt \
  --lua-filter=filters/pagebreak.lua

echo "Build complete: output/report.odt"