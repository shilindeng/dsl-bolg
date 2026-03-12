[CmdletBinding()]
param(
    [string]$BlogBaseUrl = "",
    [string]$BlogApiKey = $env:BLOG_PUBLISH_API_KEY,
    [string[]]$Roots = @(
        "D:\vibe-coding\codex\my-skill\runs",
        "D:\vibe-coding\codex\jobs"
    ),
    [switch]$Recursive,
    [switch]$Force,
    [switch]$DryRun,
    [switch]$Watch,
    [int]$IntervalSeconds = 60,
    [int]$Limit = 0
)

if (-not $BlogBaseUrl) {
    $BlogBaseUrl = if ($env:BLOG_PUBLISH_BASE_URL) { $env:BLOG_PUBLISH_BASE_URL } else { "https://www.shilin.tech" }
}

if (-not $BlogBaseUrl) {
    throw "Missing blog base URL. Pass -BlogBaseUrl or set BLOG_PUBLISH_BASE_URL."
}

if (-not $DryRun -and -not $BlogApiKey) {
    throw "Missing blog API key. Pass -BlogApiKey or set BLOG_PUBLISH_API_KEY."
}

$argsList = @(
    (Join-Path $PSScriptRoot "sync-wechat-studio-to-blog.mjs"),
    "--blog-base-url", $BlogBaseUrl
)

if ($BlogApiKey) {
    $argsList += @("--blog-api-key", $BlogApiKey)
}

foreach ($root in $Roots) {
    $argsList += @("--root", $root)
}

if ($Recursive) {
    $argsList += "--recursive"
}

if ($Force) {
    $argsList += "--force"
}

if ($DryRun) {
    $argsList += "--blog-dry-run"
}

if ($Watch) {
    $argsList += "--watch"
    $argsList += @("--interval-seconds", "$IntervalSeconds")
}

if ($Limit -gt 0) {
    $argsList += @("--limit", "$Limit")
}

& node @argsList
if ($LASTEXITCODE -ne 0) {
    throw "Sync failed with exit code: $LASTEXITCODE"
}
