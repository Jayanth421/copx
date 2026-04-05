$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$draftRoot = Join-Path $projectRoot "src/draft-pages"
$appRoot = Join-Path $projectRoot "src/app"

if (!(Test-Path -LiteralPath $draftRoot)) {
  Write-Error "Draft pages folder not found: $draftRoot"
}

$draftPages = Get-ChildItem -Path $draftRoot -Recurse -Filter page.tsx -File

foreach ($draft in $draftPages) {
  $relativePath = $draft.FullName.Substring($draftRoot.Length).TrimStart('\\')
  $destination = Join-Path $appRoot $relativePath
  $destinationDir = Split-Path $destination -Parent

  if (!(Test-Path -LiteralPath $destinationDir)) {
    New-Item -ItemType Directory -Path $destinationDir | Out-Null
  }

  Copy-Item -LiteralPath $draft.FullName -Destination $destination -Force
}

Write-Output "Restored $($draftPages.Count) page files from draft."