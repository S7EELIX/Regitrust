$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$bundledNode = "C:\Users\rajra\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
$bundledGit = "E:\CodexTools\PortableGit\bin\git.exe"
$node = if (Test-Path $bundledNode) { $bundledNode } else { "node" }
$git = if (Test-Path $bundledGit) { $bundledGit } else { "git" }

Push-Location $root
try {
  & $node tools\audit-site.js
  & $node tools\verify-runtime.js
  & $git diff --check
} finally {
  Pop-Location
}
