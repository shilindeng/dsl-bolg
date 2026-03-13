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

$health = Get-Body "$BaseUrl/api/health"
$robots = Get-Body "$BaseUrl/robots.txt"
$sitemap = Get-Body "$BaseUrl/sitemap.xml"
$rss = Get-Body "$BaseUrl/rss.xml"
$homeHtml = Get-Body "$BaseUrl/"
$postHtml = Get-Body "$BaseUrl/blog/$ExpectedPostSlug"
$projectHtml = Get-Body "$BaseUrl/projects/$ExpectedProjectSlug"
$seriesHtml = Get-Body "$BaseUrl/series/$ExpectedSeriesSlug"

Assert-Contains $health '"status":"ok"' 'health'
Assert-Contains $robots "$BaseUrl/sitemap.xml" 'robots'
Assert-Contains $sitemap "$BaseUrl/projects/$ExpectedProjectSlug" 'sitemap'
Assert-Contains $rss '<rss version="2.0">' 'rss'
Assert-Contains $homeHtml '<title>首页 | AI信息差研究院</title>' 'home title'
Assert-Contains $postHtml '<title>把个人博客做成专业品牌站，需要先解决什么问题 | AI信息差研究院</title>' 'post title'
Assert-Contains $projectHtml '<title>DSL Blog | AI信息差研究院</title>' 'project title'
Assert-Contains $seriesHtml "<title>把博客做成长期经营的作品系统 | AI信息差研究院</title>" 'series title'

Write-Output "Production verification passed for $BaseUrl"
