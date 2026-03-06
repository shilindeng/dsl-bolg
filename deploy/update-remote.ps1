[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$ServerHost,

    [Parameter(Mandatory = $true)]
    [string]$KeyPath,

    [string]$User = "root",
    [int]$Port = 22,
    [string]$RemoteScript = "/opt/dsl-blog/bin/update.sh",
    [string]$ConfigPath = "/opt/dsl-blog/config/deploy.env"
)

$resolvedKeyPath = (Resolve-Path -Path $KeyPath).Path
$sshArgs = @(
    "-i", $resolvedKeyPath,
    "-o", "IdentitiesOnly=yes",
    "-o", "StrictHostKeyChecking=no",
    "-p", "$Port",
    "$User@$ServerHost",
    "DEPLOY_CONFIG='$ConfigPath' bash '$RemoteScript'"
)

& ssh @sshArgs
if ($LASTEXITCODE -ne 0) {
    throw "Remote deploy failed with exit code $LASTEXITCODE"
}
