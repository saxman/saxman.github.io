#!/bin/sh
# Render HTML documents to PDF with headless Chrome, writing each PDF next to its source.
#
# Usage: scripts/build-pdfs.sh [file.html ...]
#   With no arguments, renders resume.html and cv.html.
#   Set CHROME to override the browser binary.

set -eu

repo_root=$(cd "$(dirname "$0")/.." && pwd)

find_chrome() {
    for candidate in \
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
        "/Applications/Chromium.app/Contents/MacOS/Chromium" \
        google-chrome google-chrome-stable chromium chromium-browser; do
        if [ -x "$candidate" ] || command -v "$candidate" >/dev/null 2>&1; then
            echo "$candidate"
            return 0
        fi
    done
    return 1
}

chrome=${CHROME:-$(find_chrome)} || {
    echo "Chrome or Chromium not found. Set CHROME to the browser binary." >&2
    exit 1
}

if [ "$#" -eq 0 ]; then
    set -- "$repo_root/resume.html" "$repo_root/cv.html"
fi

for source in "$@"; do
    if [ ! -f "$source" ]; then
        echo "Not found: $source" >&2
        exit 1
    fi
    source_path=$(cd "$(dirname "$source")" && pwd)/$(basename "$source")
    output=${source_path%.html}.pdf

    # The virtual time budget gives web fonts time to load before printing.
    "$chrome" --headless --disable-gpu --no-pdf-header-footer \
        --virtual-time-budget=10000 \
        --print-to-pdf="$output" \
        "file://$source_path" 2>/dev/null

    echo "Wrote $output"
done
