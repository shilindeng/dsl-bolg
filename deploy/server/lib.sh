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

sync_runtime_scripts() {
    if [[ -d "$REPO_DIR/deploy/server" ]]; then
        cp -f "$REPO_DIR"/deploy/server/*.sh "$BIN_DIR"/
        chmod +x "$BIN_DIR"/*.sh
    fi
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

create_release_from_archive() {
    local archive_path="$1"
    local release_source="${2:-workspace-upload}"
    local branch_name="${3:-}"
    local commit_sha="${4:-}"
    local release_dir="$RELEASES_DIR/$(timestamp_utc)"

    require_file "$archive_path"

    mkdir -p "$release_dir"
    tar -xzf "$archive_path" -C "$release_dir"

    [[ -d "$release_dir/server" ]] || fail "Archive did not contain server/"
    [[ -d "$release_dir/client" ]] || fail "Archive did not contain client/"

    printf '%s\n' "$release_source" > "$release_dir/.source"
    if [[ -n "$branch_name" ]]; then
        printf '%s\n' "$branch_name" > "$release_dir/.branch"
    fi
    if [[ -n "$commit_sha" ]]; then
        printf '%s\n' "$commit_sha" > "$release_dir/.commit"
    fi
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

        try_files {path} {path}/index.html /index.html
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

    # Raw HTML SEO checks: validate that the prerendered HTML head changes per-route.
    # This catches regressions where the SPA fallback index.html is served everywhere.
    assert_contains() {
        local body="$1"
        local needle="$2"
        local label="$3"

        if ! printf '%s' "$body" | grep -F "$needle" >/dev/null; then
            echo "SEO check failed ($label): missing $needle" >&2
            return 1
        fi
    }

    fetch_html() {
        local path="$1"
        curl --fail --silent --show-error --resolve "${BLOG_HOST}:443:127.0.0.1" "https://${BLOG_HOST}${path}" -k
    }

    pick_slug() {
        local json="$1"
        local expr="$2"

        node -e "const fs=require('fs');const raw=fs.readFileSync(0,'utf8');const data=JSON.parse(raw||'{}');const value=(${expr}); if(!value){process.exit(1)}; process.stdout.write(String(value));" <<<"$json"
    }

    home_html="$(fetch_html "/")"
    blog_html="$(fetch_html "/blog")"
    series_list_html="$(fetch_html "/series")"
    projects_list_html="$(fetch_html "/projects")"

    assert_contains "$home_html" "<link rel=\"canonical\" href=\"${SITE_URL}/\"" "home canonical"
    assert_contains "$blog_html" "<link rel=\"canonical\" href=\"${SITE_URL}/blog\"" "blog canonical"
    assert_contains "$series_list_html" "<link rel=\"canonical\" href=\"${SITE_URL}/series\"" "series list canonical"
    assert_contains "$projects_list_html" "<link rel=\"canonical\" href=\"${SITE_URL}/projects\"" "projects list canonical"

    posts_json="$(curl --fail --silent --show-error "http://127.0.0.1:3001/api/posts?limit=1")"
    post_slug="$(pick_slug "$posts_json" "data.data && data.data[0] && data.data[0].slug")" || {
        echo "SEO check failed: could not pick a post slug" >&2
        return 1
    }
    post_html="$(fetch_html "/blog/${post_slug}")"
    assert_contains "$post_html" "<link rel=\"canonical\" href=\"${SITE_URL}/blog/${post_slug}\"" "post canonical"
    assert_contains "$post_html" "article:published_time" "post article meta"

    projects_json="$(curl --fail --silent --show-error "http://127.0.0.1:3001/api/projects")"
    project_slug="$(pick_slug "$projects_json" "Array.isArray(data) && data[0] && data[0].slug")" || {
        echo "SEO check failed: could not pick a project slug" >&2
        return 1
    }
    project_html="$(fetch_html "/projects/${project_slug}")"
    assert_contains "$project_html" "<link rel=\"canonical\" href=\"${SITE_URL}/projects/${project_slug}\"" "project canonical"
    assert_contains "$project_html" "CreativeWork" "project json-ld"

    series_json="$(curl --fail --silent --show-error "http://127.0.0.1:3001/api/series")"
    series_slug="$(pick_slug "$series_json" "Array.isArray(data) && data[0] && data[0].slug")" || {
        echo "SEO check failed: could not pick a series slug" >&2
        return 1
    }
    series_html="$(fetch_html "/series/${series_slug}")"
    assert_contains "$series_html" "<link rel=\"canonical\" href=\"${SITE_URL}/series/${series_slug}\"" "series canonical"
    assert_contains "$series_html" "og:url" "series og meta"
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
