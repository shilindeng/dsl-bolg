#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=deploy/server/lib.sh
source "$SCRIPT_DIR/lib.sh"

require_command git node npm npx curl systemctl caddy tar
load_config
ensure_base_dirs

if [[ ! -d "$REPO_DIR/.git" ]]; then
    fail "Repository not initialized at $REPO_DIR. Run bootstrap first."
fi

previous_release="$(current_release_target || true)"
if [[ -n "$previous_release" && -f "$previous_release/.source" ]]; then
    release_source="$(cat "$previous_release/.source")"
    if [[ "$release_source" == "legacy-app" ]]; then
        fail "Current deployment was migrated from the legacy app directory. Push the current repo state to origin/$DEPLOY_BRANCH before using update.sh."
    fi
fi

log "Running pre-deploy backup"
bash "$SCRIPT_DIR/backup.sh"

log "Syncing repository"
sync_repo

log "Creating release"
release_dir="$(create_release_from_repo)"
link_shared_state "$release_dir"

log "Building release $release_dir"
build_release "$release_dir"

log "Installing runtime configuration"
install_runtime_configs

log "Switching current release"
switch_current_release "$release_dir"

rollback() {
    if [[ -n "$previous_release" && -d "$previous_release" ]]; then
        log "Rolling back to $previous_release"
        switch_current_release "$previous_release"
        install_runtime_configs
        restart_runtime
    fi
}

log "Restarting services"
if ! restart_runtime; then
    rollback
    fail "Failed to restart runtime"
fi

log "Validating deployed release"
if ! retry 10 2 validate_release; then
    rollback
    fail "Health checks failed after deployment"
fi

log "Deployment complete: $release_dir"
