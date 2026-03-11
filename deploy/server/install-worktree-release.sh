#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=deploy/server/lib.sh
source "$SCRIPT_DIR/lib.sh"

require_command tar git node npm npx curl systemctl caddy mktemp rm mkdir

archive_path="${1:-}"
[[ -n "$archive_path" ]] || fail "Usage: install-worktree-release.sh /tmp/archive.tar.gz"
require_file "$archive_path"

load_config
ensure_base_dirs

previous_release="$(current_release_target || true)"
branch_name="${WORKTREE_BRANCH:-workspace}"
commit_sha="${WORKTREE_COMMIT:-}"

log "Running pre-deploy backup"
bash "$SCRIPT_DIR/backup.sh"

log "Creating release from uploaded workspace archive"
release_dir="$(create_release_from_archive "$archive_path" "workspace-upload" "$branch_name" "$commit_sha")"
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

log "Workspace deployment complete: $release_dir"
