#!/usr/bin/env bash

set -u

echo ""
echo "========================================"
echo "  CLI Dependency Check"
echo "========================================"
echo ""

# ----------------------------------------
# Minimum supported versions
# ----------------------------------------

MIN_PANDOC="3.4"
MIN_NODE="22"

# ----------------------------------------
# Dependencies
# ----------------------------------------

dependencies=(
  "LibreOffice:soffice"
  "Pandoc:pandoc"
  "Node.js:node"
)

# ----------------------------------------
# Version comparison
# ----------------------------------------

version_ge() {
  printf '%s\n%s\n' "$2" "$1" | sort -V -C
}

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
      echo "  [OK] $name - $version"
      ;;

    pandoc)
      version=$(pandoc --version 2>&1 | head -n 1)
      installed_version=$(printf '%s' "$version" | sed -E 's/.* ([0-9]+\.[0-9]+(\.[0-9]+)?).*/\1/')

      if version_ge "$installed_version" "$MIN_PANDOC"; then
        echo "  [OK] $name - $version"
      else
        echo "  [UNSUPPORTED] $name - $version"
        echo "  Minimum required version: $MIN_PANDOC"
        failed=true
      fi
      ;;

    node)
      version=$(node --version 2>&1 | head -n 1)
      installed_version="${version#v}"

      if version_ge "$installed_version" "$MIN_NODE"; then
        echo "  [OK] $name - $version"
      else
        echo "  [UNSUPPORTED] $name - $version"
        echo "  Minimum required version: $MIN_NODE"
        failed=true
      fi
      ;;

    esac

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
  echo "Some dependencies are missing or unsupported."
  echo ""
  echo "Please install or upgrade the required tools."
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
