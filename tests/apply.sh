#!/bin/bash
# Применяет миграции по порядку к локальной базе.
# Печатает ошибку крупно — молчаливо проглоченная ошибка миграции хуже упавшей.
CT=supabase_db_bazar-mockup
DIR="$(cd "$(dirname "$0")/../supabase/migrations" && pwd)"
FAILED=0
# find+while: путь содержит пробел («рабочий стол»), for по glob его рвёт
while IFS= read -r f; do
  name=$(basename "$f")
  if out=$(docker exec -i $CT psql -U postgres -d postgres -v ON_ERROR_STOP=1 -q < "$f" 2>&1); then
    echo "✓ $name"
  else
    echo "✗ $name"
    echo "$out" | sed 's/^/    /' | head -25
    FAILED=$((FAILED+1))
    [ "$1" = "--stop" ] && exit 1
  fi
done < <(find "$DIR" -maxdepth 1 -name '*.sql' | sort)
echo "───────────────"
[ $FAILED -eq 0 ] && echo "все миграции применились" || echo "с ошибками: $FAILED"
exit $FAILED
