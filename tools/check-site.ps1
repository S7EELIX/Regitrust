$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$bundledNode = "C:\Users\rajra\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
$bundledGit = "E:\CodexTools\PortableGit\bin\git.exe"
$node = if (Test-Path $bundledNode) { $bundledNode } else { "node" }
$git = if (Test-Path $bundledGit) { $bundledGit } else { "git" }

Push-Location $root
try {
  function Invoke-Checked {
    param(
      [string]$Command,
      [string[]]$Arguments
    )

    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) {
      throw "Command failed with exit code $LASTEXITCODE`: $Command $($Arguments -join ' ')"
    }
  }

  Invoke-Checked $node @("tools\audit-site.js")
  Invoke-Checked $node @("tools\verify-runtime.js")
  Invoke-Checked $git @("diff", "--check")
} finally {
  Pop-Location
}
