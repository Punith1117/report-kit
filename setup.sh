#!/usr/bin/env bash

set -u

echo ""
echo "========================================"
echo "  CLI Dependency Check"
echo "========================================"
echo ""

# ----------------------------------------
# Dependencies
# ----------------------------------------

dependencies=(
  "LibreOffice:soffice"
  "Pandoc:pandoc"
  "Node.js:node"
)

# ----------------------------------------
# Check dependencies
# ----------------------------------------

failed=false

for dependency in "${dependencies[@]}"; do

  name="${dependency%%:*}"
  command="${dependency##*:}"

  echo "Checking $name..."

  if command -v "$command" >/dev/null 2>&1; then

    case "$command" in
    soffice)
      version=$(soffice --version 2>&1 | head -n 1)
      ;;
    pandoc)
      version=$(pandoc --version 2>&1 | head -n 1)
      ;;
    node)
      version=$(node --version 2>&1 | head -n 1)
      ;;
    esac

    echo "  [OK] $name - $version"
  else
    echo "  [MISSING] $command"
    failed=true
  fi

  echo ""
done

# ----------------------------------------
# Result
# ----------------------------------------

echo "========================================"
echo "  Dependency Check Complete"
echo "========================================"
echo ""

if $failed; then
  echo "Some dependencies are missing."
  echo ""
  echo "Install the missing tools using your"
  echo "Linux distribution's package manager."
  echo ""
  echo "Examples:"
  echo "  Fedora:  sudo dnf install nodejs pandoc libreoffice"
  echo "  Debian:  sudo apt install nodejs pandoc libreoffice"
  echo ""
  exit 1
fi

echo "All CLI dependencies are ready!"
echo ""
echo "You can now use:"
echo "  soffice --headless ..."
echo "  pandoc ..."
echo "  node ..."
echo ""

exit 0
