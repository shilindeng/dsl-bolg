#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=deploy/server/lib.sh
source "$SCRIPT_DIR/lib.sh"

require_command tar mktemp cp rm mkdir ls
load_config
ensure_base_dirs

timestamp="$(timestamp_utc)"
archive_path="${BACKUPS_DIR}/${timestamp}.tar.gz"
staging_dir="$(mktemp -d)"
trap 'rm -rf "$staging_dir"' EXIT

log "Creating backup at $archive_path"

mkdir -p "$staging_dir/shared/prisma" "$staging_dir/shared/uploads" "$staging_dir/etc/caddy" "$staging_dir/etc/systemd/system"

copy_if_missing "$SHARED_SERVER_ENV" "$staging_dir/shared/server.env"
copy_if_missing "$SHARED_CLIENT_ENV" "$staging_dir/shared/client.env.production"
copy_if_missing "$SHARED_DB_PATH" "$staging_dir/shared/prisma/blog.db"

if [[ -d "$SHARED_UPLOADS_DIR" ]]; then
    cp -a "$SHARED_UPLOADS_DIR/." "$staging_dir/shared/uploads/"
fi

copy_if_missing "/etc/caddy/Caddyfile" "$staging_dir/etc/caddy/Caddyfile"
copy_if_missing "/etc/systemd/system/${SERVICE_NAME}.service" "$staging_dir/etc/systemd/system/${SERVICE_NAME}.service"

tar -czf "$archive_path" -C "$staging_dir" .
prune_old_backups

log "Backup complete: $archive_path"
