#!/bin/bash

mkdir -p output

pandoc content/*.md \
  -o output/report.odt \
  --reference-doc=template-mciot.odt \
  --lua-filter=filters/pagebreak.lua

echo "Build complete: output/report.odt"