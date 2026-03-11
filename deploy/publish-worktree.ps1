[CmdletBinding()]
param(
    [string]$ServerHost = "198.11.176.136",
    [string]$KeyPath = "D:\vibe-coding\root.pem",
    [string]$User = "root",
    [int]$Port = 22,
    [string]$RemoteInstallerPath = "/opt/dsl-blog/bin/install-worktree-release.sh",
    [string]$ConfigPath = "/opt/dsl-blog/config/deploy.env"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function ConvertTo-ShellLiteral {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Value
    )

    $singleQuoteEscape = "'" + '"' + "'" + '"' + "'"
    $escapedValue = $Value.Replace("'", $singleQuoteEscape)
    return "'" + $escapedValue + "'"
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$resolvedKeyPath = (Resolve-Path -Path $KeyPath).Path
$branchName = (git -C $repoRoot rev-parse --abbrev-ref HEAD).Trim()
$commitSha = (git -C $repoRoot rev-parse --verify HEAD).Trim()
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$archiveName = "dsl-blog-worktree-$timestamp.tar.gz"
$archivePath = Join-Path ([System.IO.Path]::GetTempPath()) $archiveName
$remoteArchive = "/tmp/$archiveName"
$remoteInstallerTemp = "/tmp/install-worktree-release-$timestamp.sh"
$remoteLibTemp = "/tmp/lib-$timestamp.sh"
$localInstallerPath = Join-Path $repoRoot "deploy\server\install-worktree-release.sh"
$localLibPath = Join-Path $repoRoot "deploy\server\lib.sh"

function New-LfScriptCopy {
    param(
        [Parameter(Mandatory = $true)]
        [string]$SourcePath,
        [Parameter(Mandatory = $true)]
        [string]$TargetPath
    )

    $raw = [System.IO.File]::ReadAllText($SourcePath)
    $raw = $raw.Replace("`r`n", "`n").Replace("`r", "`n")
    $utf8NoBom = [System.Text.UTF8Encoding]::new($false)
    [System.IO.File]::WriteAllText($TargetPath, $raw, $utf8NoBom)
}

Write-Host "[publish-worktree] Running server build"
Push-Location (Join-Path $repoRoot "server")
try {
    & npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Server build failed"
    }
}
finally {
    Pop-Location
}

Write-Host "[publish-worktree] Running client build"
Push-Location (Join-Path $repoRoot "client")
try {
    & npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Client build failed"
    }
}
finally {
    Pop-Location
}

if (Test-Path $archivePath) {
    Remove-Item -Force $archivePath
}

$tarArgs = @(
    "-czf", $archivePath,
    "--exclude=.git",
    "--exclude=.git/*",
    "--exclude=.codex-logs",
    "--exclude=.codex-logs/*",
    "--exclude=client/node_modules",
    "--exclude=client/node_modules/*",
    "--exclude=server/node_modules",
    "--exclude=server/node_modules/*",
    "--exclude=client/dist",
    "--exclude=client/dist/*",
    "--exclude=server/dist",
    "--exclude=server/dist/*",
    "--exclude=client/playwright-artifacts",
    "--exclude=client/playwright-artifacts/*",
    "--exclude=client/test-results",
    "--exclude=client/test-results/*",
    "--exclude=client/blob-report",
    "--exclude=client/blob-report/*",
    "--exclude=client/playwright-report",
    "--exclude=client/playwright-report/*",
    "-C", $repoRoot,
    "."
)

Write-Host "[publish-worktree] Packing worktree to $archivePath"
& tar @tarArgs
if ($LASTEXITCODE -ne 0) {
    throw "Failed to create worktree archive"
}

$archiveEntries = & tar -tzf $archivePath
$forbiddenEntries = $archiveEntries | Where-Object {
    $_ -match '(^|/)\.git(/|$)' -or
    $_ -match '(^|/)\.codex-logs(/|$)' -or
    $_ -match '(^|/)node_modules(/|$)' -or
    $_ -match '(^|/)dist(/|$)' -or
    $_ -match '(^|/)playwright-artifacts(/|$)' -or
    $_ -match '(^|/)test-results(/|$)' -or
    $_ -match '(^|/)blob-report(/|$)' -or
    $_ -match '(^|/)playwright-report(/|$)'
}
if ($forbiddenEntries) {
    throw "Archive contains excluded paths: $($forbiddenEntries -join ', ')"
}

$sshBaseArgs = @(
    "-i", $resolvedKeyPath,
    "-o", "IdentitiesOnly=yes",
    "-o", "StrictHostKeyChecking=no",
    "-p", "$Port"
)
$scpBaseArgs = @(
    "-i", $resolvedKeyPath,
    "-o", "IdentitiesOnly=yes",
    "-o", "StrictHostKeyChecking=no",
    "-P", "$Port"
)

try {
    $tempInstallerPath = Join-Path ([System.IO.Path]::GetTempPath()) "install-worktree-release-$timestamp.sh"
    $tempLibPath = Join-Path ([System.IO.Path]::GetTempPath()) "lib-$timestamp.sh"
    New-LfScriptCopy -SourcePath $localInstallerPath -TargetPath $tempInstallerPath
    New-LfScriptCopy -SourcePath $localLibPath -TargetPath $tempLibPath

    Write-Host "[publish-worktree] Uploading archive"
    & scp @scpBaseArgs $archivePath "${User}@${ServerHost}:$remoteArchive"
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to upload worktree archive"
    }

    Write-Host "[publish-worktree] Uploading remote installer"
    & scp @scpBaseArgs $tempInstallerPath "${User}@${ServerHost}:$remoteInstallerTemp"
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to upload remote installer"
    }

    Write-Host "[publish-worktree] Uploading deploy lib.sh"
    & scp @scpBaseArgs $tempLibPath "${User}@${ServerHost}:$remoteLibTemp"
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to upload deploy lib.sh"
    }

    $remoteArchiveLiteral = ConvertTo-ShellLiteral $remoteArchive
    $remoteInstallerTempLiteral = ConvertTo-ShellLiteral $remoteInstallerTemp
    $remoteInstallerPathLiteral = ConvertTo-ShellLiteral $RemoteInstallerPath
    $remoteLibTempLiteral = ConvertTo-ShellLiteral $remoteLibTemp
    $remoteLibPathLiteral = ConvertTo-ShellLiteral "/opt/dsl-blog/bin/lib.sh"
    $configPathLiteral = ConvertTo-ShellLiteral $ConfigPath
    $branchNameLiteral = ConvertTo-ShellLiteral $branchName
    $commitShaLiteral = ConvertTo-ShellLiteral $commitSha

    $remoteCommand = @"
set -Eeuo pipefail
REMOTE_ARCHIVE=$remoteArchiveLiteral
REMOTE_INSTALLER_TEMP=$remoteInstallerTempLiteral
REMOTE_LIB_TEMP=$remoteLibTempLiteral
REMOTE_INSTALLER_PATH=$remoteInstallerPathLiteral
REMOTE_LIB_PATH=$remoteLibPathLiteral
DEPLOY_CONFIG_PATH=$configPathLiteral
WORKTREE_BRANCH_NAME=$branchNameLiteral
WORKTREE_COMMIT_SHA=$commitShaLiteral
trap 'rm -f "`$REMOTE_ARCHIVE" "`$REMOTE_INSTALLER_TEMP" "`$REMOTE_LIB_TEMP"' EXIT
install -m 755 "`$REMOTE_LIB_TEMP" "`$REMOTE_LIB_PATH"
install -m 755 "`$REMOTE_INSTALLER_TEMP" "`$REMOTE_INSTALLER_PATH"
DEPLOY_CONFIG="`$DEPLOY_CONFIG_PATH" WORKTREE_BRANCH="`$WORKTREE_BRANCH_NAME" WORKTREE_COMMIT="`$WORKTREE_COMMIT_SHA" bash "`$REMOTE_INSTALLER_PATH" "`$REMOTE_ARCHIVE"
"@

    Write-Host "[publish-worktree] Triggering remote release install"
    & ssh @sshBaseArgs "${User}@${ServerHost}" $remoteCommand
    if ($LASTEXITCODE -ne 0) {
        throw "Remote worktree deployment failed with exit code $LASTEXITCODE"
    }
}
finally {
    if (Test-Path $tempInstallerPath) {
        Remove-Item -Force $tempInstallerPath
    }
    if (Test-Path $tempLibPath) {
        Remove-Item -Force $tempLibPath
    }
    if (Test-Path $archivePath) {
        Remove-Item -Force $archivePath
    }
}

Write-Host "[publish-worktree] Deployment finished"
