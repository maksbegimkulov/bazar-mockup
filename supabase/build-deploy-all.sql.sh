#!/bin/bash
# Собирает DEPLOY_ALL.sql из migrations/ по порядку имён.
#
# Бандл нужен для боевой базы: там нет psql и нет CLI — схема накатывается
# вставкой одного файла в SQL Editor. Собранный руками, он тихо устаревает
# (в июле отстал на три миграции), поэтому пересобирать только этим скриптом.
#
#   bash supabase/build-deploy-all.sql.sh
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
OUT="$DIR/DEPLOY_ALL.sql"
SRC="$DIR/migrations"

# find+while: путь содержит пробел («рабочий стол»), for по glob его рвёт
FILES=()
while IFS= read -r f; do FILES+=("$f"); done < <(find "$SRC" -maxdepth 1 -name '*.sql' | sort)

{
  echo "-- BAZAR · единый накат схемы (${#FILES[@]} миграций, автосборка). Идемпотентно, безопасно поверх боевой базы."
  echo
  for f in "${FILES[@]}"; do
    echo
    echo "-- ═══ $(basename "$f") ═══"
    echo
    cat "$f"
    echo
  done
} > "$OUT"

echo "собрано: $(basename "$OUT") — ${#FILES[@]} миграций, $(grep -c '' "$OUT") строк"
