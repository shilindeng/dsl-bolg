[CmdletBinding()]
param(
    [string]$BaseUrl = "https://www.shilin.tech",
    [string]$ExpectedProjectSlug = "dsl-blog",
    [string]$ExpectedPostSlug = "build-a-professional-personal-blog",
    [string]$ExpectedSeriesSlug = "blog-as-public-system"
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

$health = Get-Body "$BaseUrl/api/health"
$robots = Get-Body "$BaseUrl/robots.txt"
$sitemap = Get-Body "$BaseUrl/sitemap.xml"
$rss = Get-Body "$BaseUrl/rss.xml"

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

