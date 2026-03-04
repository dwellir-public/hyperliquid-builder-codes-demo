#!/bin/bash
# Pre-commit hook: run Biome on staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx|json|css)$')

if [ -n "$STAGED_FILES" ]; then
  echo "Running Biome check on staged files..."
  echo "$STAGED_FILES" | xargs npx @biomejs/biome check --no-errors-on-unmatched --files-ignore-unknown=true
  if [ $? -ne 0 ]; then
    echo ""
    echo "Biome check failed. Run 'npm run lint:fix' to auto-fix issues."
    exit 1
  fi
fi
