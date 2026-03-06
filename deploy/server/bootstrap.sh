#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=deploy/server/lib.sh
source "$SCRIPT_DIR/lib.sh"

require_command git node npm npx curl systemctl caddy tar cp mkdir
load_config
ensure_base_dirs

log "Migrating any legacy state from ${APP_ROOT}/app"
migrate_legacy_state

[[ -f "$SHARED_SERVER_ENV" ]] || fail "Missing $SHARED_SERVER_ENV. Copy your server env there before bootstrap."
[[ -f "$SHARED_CLIENT_ENV" ]] || fail "Missing $SHARED_CLIENT_ENV. Copy your client env there before bootstrap."

seed_required=0
release_source="repo"
if [[ ! -f "$SHARED_DB_PATH" ]]; then
    seed_required=1
fi

log "Syncing repository"
sync_repo

log "Creating initial release"
if [[ -d "${APP_ROOT}/app/server" && -d "${APP_ROOT}/app/client" ]]; then
    release_source="legacy-app"
    release_dir="$(create_release_from_legacy_app)"
else
    release_dir="$(create_release_from_repo)"
fi
link_shared_state "$release_dir"

log "Building initial release from $release_source"
build_release "$release_dir"

if (( seed_required == 1 )); then
    log "Database did not exist. Running seed once."
    (
        cd "$release_dir/server"
        npm run db:seed
    )
    log "Rebuilding client after seed so SEO artifacts include initial content"
    (
        cd "$release_dir/client"
        npm run build
    )
fi

log "Installing runtime configuration"
install_runtime_configs

log "Activating initial release"
switch_current_release "$release_dir"
restart_runtime

log "Validating initial deployment"
retry 10 2 validate_release || fail "Initial deployment health checks failed"

log "Bootstrap complete: $release_dir"
