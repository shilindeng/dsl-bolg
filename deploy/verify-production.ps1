[CmdletBinding()]
param(
    [string]$BaseUrl = "https://www.shilin.tech",
    [string]$ExpectedProjectSlug = "",
    [string]$ExpectedPostSlug = "",
    [string]$ExpectedSeriesSlug = ""
)

function Get-Body {
    param([string]$Url)
    return (Invoke-WebRequest -Uri $Url -UseBasicParsing).Content
}

function Assert-Contains {
    param(
        [string]$Body,
        [string]$Needle,
        [string]$Label
    )

    if ($Body -notmatch [Regex]::Escape($Needle)) {
        throw "$Label missing expected content: $Needle"
    }
}

function Assert-Match {
    param(
        [string]$Body,
        [string]$Pattern,
        [string]$Label
    )

    if ($Body -notmatch $Pattern) {
        throw "$Label missing expected pattern: $Pattern"
    }
}

function Get-Json {
    param([string]$Url)
    return Invoke-RestMethod -Uri $Url
}

function Resolve-DynamicSlug {
    param(
        [string]$Provided,
        [object[]]$Items,
        [string]$PropertyName,
        [string]$Label
    )

    if ($Provided) {
        return $Provided
    }

    if (-not $Items -or $Items.Count -eq 0) {
        throw "No public $Label available for validation"
    }

    return $Items[0].$PropertyName
}

$health = Get-Body "$BaseUrl/api/health"
$robots = Get-Body "$BaseUrl/robots.txt"
$sitemap = Get-Body "$BaseUrl/sitemap.xml"
$rss = Get-Body "$BaseUrl/rss.xml"

$postsJson = Get-Json "$BaseUrl/api/posts?limit=1"
$projectsJson = Get-Json "$BaseUrl/api/projects"
$seriesJson = Get-Json "$BaseUrl/api/series"

$ExpectedPostSlug = Resolve-DynamicSlug -Provided $ExpectedPostSlug -Items $postsJson.data -PropertyName "slug" -Label "post"
$ExpectedProjectSlug = Resolve-DynamicSlug -Provided $ExpectedProjectSlug -Items $projectsJson -PropertyName "slug" -Label "project"
$ExpectedSeriesSlug = Resolve-DynamicSlug -Provided $ExpectedSeriesSlug -Items $seriesJson -PropertyName "slug" -Label "series"

$homeHtml = Get-Body "$BaseUrl/"
$blogHtml = Get-Body "$BaseUrl/blog"
$projectsHtml = Get-Body "$BaseUrl/projects"
$seriesListHtml = Get-Body "$BaseUrl/series"

$postHtml = Get-Body "$BaseUrl/blog/$ExpectedPostSlug"
$projectHtml = Get-Body "$BaseUrl/projects/$ExpectedProjectSlug"
$seriesHtml = Get-Body "$BaseUrl/series/$ExpectedSeriesSlug"

Assert-Contains $health '"status":"ok"' 'health'
Assert-Contains $robots "$BaseUrl/sitemap.xml" 'robots'
Assert-Contains $sitemap "$BaseUrl" 'sitemap'
Assert-Contains $rss '<rss version="2.0">' 'rss'
# Raw HTML SEO checks (canonical/meta tags should change per route)
Assert-Contains $homeHtml "<link rel=`"canonical`" href=`"$BaseUrl/`"" 'home canonical'
Assert-Contains $blogHtml "<link rel=`"canonical`" href=`"$BaseUrl/blog`"" 'blog canonical'
Assert-Contains $projectsHtml "<link rel=`"canonical`" href=`"$BaseUrl/projects`"" 'projects canonical'
Assert-Contains $seriesListHtml "<link rel=`"canonical`" href=`"$BaseUrl/series`"" 'series list canonical'

Assert-Contains $postHtml "<link rel=`"canonical`" href=`"$BaseUrl/blog/$ExpectedPostSlug`"" 'post canonical'
Assert-Match $postHtml 'article:published_time' 'post article meta'

Assert-Contains $projectHtml "<link rel=`"canonical`" href=`"$BaseUrl/projects/$ExpectedProjectSlug`"" 'project canonical'
Assert-Match $projectHtml 'CreativeWork' 'project json-ld'

Assert-Contains $seriesHtml "<link rel=`"canonical`" href=`"$BaseUrl/series/$ExpectedSeriesSlug`"" 'series canonical'
Assert-Match $seriesHtml 'og:url' 'series og meta'

Write-Output "Production verification passed for $BaseUrl"

