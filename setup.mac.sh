#!/bin/bash

set -u

# Report Kit - macOS dependency setup
# Requires Homebrew.
# Installs/verifies LibreOffice, Pandoc, and Node.js.
# Configures persistent CLI access through ~/.zprofile.

MIN_PANDOC="3.4"
MIN_NODE="22.0.0"

ZPROFILE="$HOME/.zprofile"
BREW_SHELLENV_LINE='eval "$("$BREW_BIN" shellenv zsh)"'
LIBREOFFICE_PATH="/Applications/LibreOffice.app/Contents/MacOS"

# --------------------------------------------------
# Helpers
# --------------------------------------------------

log() {
  printf '\n%s\n' "$1"
}

fail() {
  printf '\nERROR: %s\n' "$1" >&2
  exit 1
}

version_ge() {
  awk -v installed="$1" -v minimum="$2" '
        BEGIN {
            split(installed, a, ".")
            split(minimum, b, ".")

            for (i = 1; i <= 3; i++) {
                av = a[i] + 0
                bv = b[i] + 0

                if (av > bv) exit 0
                if (av < bv) exit 1
            }

            exit 0
        }
    '
}

extract_version() {
  printf '%s\n' "$1" |
    grep -Eo '[0-9]+\.[0-9]+(\.[0-9]+)?' |
    head -n 1
}

# Resolve the Homebrew executable without assuming its architecture.
find_brew() {
  if command -v brew >/dev/null 2>&1; then
    command -v brew
    return 0
  fi

  for candidate in \
    /opt/homebrew/bin/brew \
    /usr/local/bin/brew; do
    if [[ -x "$candidate" ]]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done

  return 1
}

# --------------------------------------------------
# Homebrew
# --------------------------------------------------

log "Checking Homebrew..."

BREW_BIN="$(find_brew)" || fail \
  "Homebrew is not installed or cannot be found.

Install it from the official website:
https://brew.sh/

Then open a new Terminal and rerun:
./setup.mac.sh"

# Add Homebrew's environment setup to ~/.zprofile.
# The line is idempotent and uses the discovered brew path.
if ! grep -Fq 'brew shellenv zsh' "$ZPROFILE" 2>/dev/null; then
  touch "$ZPROFILE" || fail "Cannot create $ZPROFILE"

  printf '\n# Homebrew environment (added by Report Kit)\n' \
    >>"$ZPROFILE"

  printf 'eval "$(%s shellenv zsh)"\n' "$BREW_BIN" \
    >>"$ZPROFILE"

  log "Added Homebrew environment setup to $ZPROFILE"
fi

# Make Homebrew available in this script process.
eval "$("$BREW_BIN" shellenv zsh)" ||
  fail "Unable to initialize Homebrew."

printf 'Homebrew: %s\n' "$("$BREW_BIN" --version | head -n 1)"

# --------------------------------------------------
# Dependency checks
# --------------------------------------------------

check_node() {
  local executable version

  executable="$(command -v node 2>/dev/null || true)"
  [[ -n "$executable" ]] || return 1

  version="$(extract_version "$("$executable" --version 2>/dev/null)")"
  [[ -n "$version" ]] || return 1

  if version_ge "$version" "$MIN_NODE"; then
    printf '[OK] Node.js %s (%s)\n' "$version" "$executable"
    return 0
  fi

  printf '[OUTDATED] Node.js %s; requires %s or newer (%s)\n' \
    "$version" "$MIN_NODE" "$executable"
  return 1
}

check_pandoc() {
  local executable version

  executable="$(command -v pandoc 2>/dev/null || true)"
  [[ -n "$executable" ]] || return 1

  version="$(extract_version "$("$executable" --version 2>/dev/null)")"
  [[ -n "$version" ]] || return 1

  if version_ge "$version" "$MIN_PANDOC"; then
    printf '[OK] Pandoc %s (%s)\n' "$version" "$executable"
    return 0
  fi

  printf '[OUTDATED] Pandoc %s; requires %s or newer (%s)\n' \
    "$version" "$MIN_PANDOC" "$executable"
  return 1
}

check_libreoffice() {
  local executable version

  executable="$(command -v soffice 2>/dev/null || true)"

  if [[ -z "$executable" && -x "$LIBREOFFICE_PATH/soffice" ]]; then
    executable="$LIBREOFFICE_PATH/soffice"
  fi

  [[ -n "$executable" && -x "$executable" ]] || return 1

  version="$("$executable" --version 2>/dev/null)" || return 1

  printf '[OK] LibreOffice (%s)\n' "$executable"
  return 0
}

# --------------------------------------------------
# Install missing or outdated dependencies
# --------------------------------------------------

log "Checking dependencies..."

node_ok=false
pandoc_ok=false
libreoffice_ok=false

check_node && node_ok=true
check_pandoc && pandoc_ok=true
check_libreoffice && libreoffice_ok=true

if [[ "$node_ok" != true ]]; then
  log "Installing/upgrading Node.js..."
  "$BREW_BIN" install node@22 ||
    fail "Failed to install Node.js."

  # Make the pinned Node 22 formula's executable available.
  NODE_PREFIX="$("$BREW_BIN" --prefix node@22)" ||
    fail "Cannot locate the Node.js 22 Homebrew prefix."

  if [[ -x "$NODE_PREFIX/bin/node" ]]; then
    NODE_BIN_DIR="$NODE_PREFIX/bin"
    export PATH="$NODE_BIN_DIR:$PATH"

    # Persist Node 22's bin directory in ~/.zprofile.
    if ! grep -Fq "$NODE_BIN_DIR" "$ZPROFILE" 2>/dev/null; then
      printf '\n# Report Kit: Node.js 22 CLI\nexport PATH="%s:$PATH"\n' \
        "$NODE_BIN_DIR" >>"$ZPROFILE"
    fi
  fi
fi

if [[ "$pandoc_ok" != true ]]; then
  log "Installing/upgrading Pandoc..."
  "$BREW_BIN" install pandoc ||
    fail "Failed to install Pandoc."
fi

if [[ "$libreoffice_ok" != true ]]; then
  log "Installing LibreOffice..."
  "$BREW_BIN" install --cask libreoffice ||
    fail "Failed to install LibreOffice."
fi

# --------------------------------------------------
# Configure LibreOffice CLI access
# --------------------------------------------------

log "Configuring LibreOffice CLI access..."

if [[ -x "$LIBREOFFICE_PATH/soffice" ]]; then
  if ! grep -Fq "$LIBREOFFICE_PATH" "$ZPROFILE" 2>/dev/null; then
    printf '\n# Report Kit: LibreOffice CLI\nexport PATH="%s:$PATH"\n' \
      "$LIBREOFFICE_PATH" >>"$ZPROFILE"
  fi
else
  fail "LibreOffice was installed, but soffice was not found at:
$LIBREOFFICE_PATH/soffice

Check the Homebrew cask installation before continuing."
fi

# --------------------------------------------------
# Final verification
# --------------------------------------------------

log "Verifying final installation..."

# Reload the login configuration into this process.
# shellcheck disable=SC1090
source "$ZPROFILE"

check_node || fail "Node.js verification failed."
check_pandoc || fail "Pandoc verification failed."
check_libreoffice || fail "LibreOffice verification failed."

log "Setup completed successfully."
printf '\nRun these commands in a new Terminal to verify:\n'
printf '  node --version\n'
printf '  pandoc --version\n'
printf '  soffice --version\n'
