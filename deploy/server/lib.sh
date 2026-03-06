#!/usr/bin/env bash
set -Eeuo pipefail

DEPLOY_CONFIG="${DEPLOY_CONFIG:-/opt/dsl-blog/config/deploy.env}"

log() {
    printf '[%s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"
}

fail() {
    printf 'ERROR: %s\n' "$*" >&2
    exit 1
}

require_command() {
    local cmd
    for cmd in "$@"; do
        command -v "$cmd" >/dev/null 2>&1 || fail "Missing required command: $cmd"
    done
}

require_file() {
    [[ -f "$1" ]] || fail "Missing required file: $1"
}

load_config() {
    require_file "$DEPLOY_CONFIG"
    # shellcheck disable=SC1090
    set -a && source "$DEPLOY_CONFIG" && set +a

    : "${REPO_URL:?REPO_URL is required}"
    : "${DEPLOY_BRANCH:?DEPLOY_BRANCH is required}"
    : "${APP_ROOT:?APP_ROOT is required}"
    : "${SERVICE_NAME:?SERVICE_NAME is required}"
    : "${SITE_URL:?SITE_URL is required}"
    : "${BLOG_HOST:?BLOG_HOST is required}"
    : "${BACKUP_KEEP:?BACKUP_KEEP is required}"

    CONFIG_DIR="$APP_ROOT/config"
    BIN_DIR="$APP_ROOT/bin"
    REPO_DIR="$APP_ROOT/repo"
    RELEASES_DIR="$APP_ROOT/releases"
    CURRENT_LINK="$APP_ROOT/current"
    SHARED_DIR="$APP_ROOT/shared"
    BACKUPS_DIR="$APP_ROOT/backups"

    SHARED_SERVER_ENV="$SHARED_DIR/server.env"
    SHARED_CLIENT_ENV="$SHARED_DIR/client.env.production"
    SHARED_DB_DIR="$SHARED_DIR/prisma"
    SHARED_DB_PATH="$SHARED_DB_DIR/blog.db"
    SHARED_UPLOADS_DIR="$SHARED_DIR/uploads"
}

ensure_base_dirs() {
    mkdir -p \
        "$CONFIG_DIR" \
        "$BIN_DIR" \
        "$REPO_DIR" \
        "$RELEASES_DIR" \
        "$BACKUPS_DIR" \
        "$SHARED_DB_DIR" \
        "$SHARED_UPLOADS_DIR"
}

sync_repo() {
    if [[ ! -d "$REPO_DIR/.git" ]]; then
        log "Cloning repository into $REPO_DIR"
        rm -rf "$REPO_DIR"
        git clone "$REPO_URL" "$REPO_DIR"
    fi

    git -C "$REPO_DIR" fetch --prune origin
    git -C "$REPO_DIR" checkout -f "$DEPLOY_BRANCH"
    git -C "$REPO_DIR" reset --hard "origin/$DEPLOY_BRANCH"
}

current_release_target() {
    if [[ -L "$CURRENT_LINK" ]]; then
        readlink -f "$CURRENT_LINK"
    fi
}

timestamp_utc() {
    date -u +%Y%m%d-%H%M%S
}

create_release_from_repo() {
    local release_dir="$RELEASES_DIR/$(timestamp_utc)"
    local commit_sha

    mkdir -p "$release_dir"
    commit_sha="$(git -C "$REPO_DIR" rev-parse --verify HEAD)"
    git -C "$REPO_DIR" archive "$commit_sha" | tar -xf - -C "$release_dir"
    printf '%s\n' "$commit_sha" > "$release_dir/.commit"
    printf '%s\n' "$DEPLOY_BRANCH" > "$release_dir/.branch"
    printf '%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$release_dir/.built-at"

    printf '%s\n' "$release_dir"
}

create_release_from_legacy_app() {
    local legacy_root="${APP_ROOT}/app"
    local release_dir="$RELEASES_DIR/$(timestamp_utc)"

    [[ -d "$legacy_root" ]] || fail "Legacy app directory not found: $legacy_root"

    mkdir -p "$release_dir"
    tar \
        --exclude='client/node_modules' \
        --exclude='server/node_modules' \
        --exclude='client/dist' \
        --exclude='server/dist' \
        -C "$legacy_root" \
        -cf - . | tar -xf - -C "$release_dir"

    printf '%s\n' "legacy-app" > "$release_dir/.source"
    printf '%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$release_dir/.built-at"

    printf '%s\n' "$release_dir"
}

link_shared_state() {
    local release_dir="$1"

    mkdir -p "$release_dir/server/prisma"
    rm -f "$release_dir/server/.env"
    ln -sfn "$SHARED_SERVER_ENV" "$release_dir/server/.env"

    rm -f "$release_dir/client/.env.production"
    ln -sfn "$SHARED_CLIENT_ENV" "$release_dir/client/.env.production"

    rm -f "$release_dir/server/prisma/blog.db"
    ln -sfn "$SHARED_DB_PATH" "$release_dir/server/prisma/blog.db"

    rm -rf "$release_dir/server/uploads"
    ln -sfn "$SHARED_UPLOADS_DIR" "$release_dir/server/uploads"
}

render_systemd_unit() {
    cat > "/etc/systemd/system/${SERVICE_NAME}.service" <<EOF
[Unit]
Description=DSL Blog API
After=network.target

[Service]
Type=simple
WorkingDirectory=${CURRENT_LINK}/server
ExecStart=/usr/bin/node dist/src/index.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF
}

render_caddyfile() {
    {
        if [[ -n "${ROOT_DOMAIN:-}" && -n "${ROOT_PROXY_TARGET:-}" ]]; then
            cat <<EOF
${ROOT_DOMAIN} {
    encode gzip zstd
    reverse_proxy ${ROOT_PROXY_TARGET}
}

EOF
        fi

        cat <<EOF
${BLOG_HOST} {
    encode gzip zstd

    handle /api* {
        reverse_proxy 127.0.0.1:3001
    }

    handle /uploads* {
        reverse_proxy 127.0.0.1:3001
    }

    handle {
        root * ${CURRENT_LINK}/client/dist

        header {
            X-Frame-Options "DENY"
            X-Content-Type-Options "nosniff"
            Referrer-Policy "strict-origin-when-cross-origin"
            Cross-Origin-Opener-Policy "same-origin"
            Cross-Origin-Resource-Policy "same-site"
            Permissions-Policy "camera=(), microphone=(), geolocation=(self)"
        }

        @assets path /assets/*
        header @assets Cache-Control "public, max-age=31536000, immutable"

        @icons path /favicon.svg /site.webmanifest
        header @icons Cache-Control "public, max-age=86400"

        @seo path /robots.txt /sitemap.xml /rss.xml
        header @seo Cache-Control "public, max-age=3600"

        try_files {path} /index.html
        file_server
    }
}
EOF
    } > /etc/caddy/Caddyfile
}

install_runtime_configs() {
    render_systemd_unit
    render_caddyfile

    systemctl daemon-reload
    systemctl enable "$SERVICE_NAME" >/dev/null 2>&1 || true
    caddy validate --config /etc/caddy/Caddyfile >/dev/null
}

restart_runtime() {
    systemctl restart "$SERVICE_NAME"
    systemctl reload caddy
}

switch_current_release() {
    local release_dir="$1"
    local temp_link="${CURRENT_LINK}.tmp"

    rm -f "$temp_link"
    ln -s "$release_dir" "$temp_link"
    mv -Tf "$temp_link" "$CURRENT_LINK"
}

retry() {
    local attempts="$1"
    local delay_seconds="$2"
    shift 2

    local index
    for ((index = 1; index <= attempts; index += 1)); do
        if "$@"; then
            return 0
        fi

        if (( index < attempts )); then
            sleep "$delay_seconds"
        fi
    done

    return 1
}

validate_release() {
    curl --fail --silent --show-error "http://127.0.0.1:3001/api/health" >/dev/null
    curl --fail --silent --show-error --resolve "${BLOG_HOST}:443:127.0.0.1" "https://${BLOG_HOST}/robots.txt" -k | grep -F "${SITE_URL}/sitemap.xml" >/dev/null
    curl --fail --silent --show-error --resolve "${BLOG_HOST}:443:127.0.0.1" "https://${BLOG_HOST}/sitemap.xml" -k | grep -F "${SITE_URL}" >/dev/null
    curl --fail --silent --show-error --resolve "${BLOG_HOST}:443:127.0.0.1" "https://${BLOG_HOST}/rss.xml" -k | grep -F "${SITE_URL}" >/dev/null
}

build_release() {
    local release_dir="$1"

    log "Installing server dependencies"
    (
        cd "$release_dir/server"
        npm ci
        npm run db:generate
        npx prisma db push
    )

    log "Installing client dependencies"
    (
        cd "$release_dir/client"
        npm ci
    )

    log "Building server"
    (
        cd "$release_dir/server"
        npm run build
    )

    log "Building client"
    (
        cd "$release_dir/client"
        npm run build
    )
}

prune_old_backups() {
    local backups
    local backup_file
    local index=0

    shopt -s nullglob
    backups=("$BACKUPS_DIR"/*.tar.gz)
    shopt -u nullglob

    if (( ${#backups[@]} <= BACKUP_KEEP )); then
        return 0
    fi

    IFS=$'\n' backups=($(ls -1dt "${backups[@]}"))
    unset IFS

    for backup_file in "${backups[@]}"; do
        index=$((index + 1))
        if (( index > BACKUP_KEEP )); then
            rm -f "$backup_file"
        fi
    done
}

copy_if_missing() {
    local source_path="$1"
    local target_path="$2"

    if [[ -f "$source_path" && ! -f "$target_path" ]]; then
        mkdir -p "$(dirname "$target_path")"
        cp "$source_path" "$target_path"
    fi
}

migrate_legacy_state() {
    local legacy_root="${APP_ROOT}/app"

    copy_if_missing "${legacy_root}/server/.env" "$SHARED_SERVER_ENV"
    copy_if_missing "${legacy_root}/client/.env.production" "$SHARED_CLIENT_ENV"
    copy_if_missing "${legacy_root}/server/prisma/blog.db" "$SHARED_DB_PATH"

    if [[ -d "${legacy_root}/server/uploads" && -z "$(ls -A "$SHARED_UPLOADS_DIR" 2>/dev/null)" ]]; then
        cp -a "${legacy_root}/server/uploads/." "$SHARED_UPLOADS_DIR/"
    fi
}
