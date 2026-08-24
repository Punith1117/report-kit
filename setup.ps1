# setup.ps1
# Checks for LibreOffice (soffice), Pandoc, and Node.js.
# Installs missing tools using winget.

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CLI Dependency Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ----------------------------------------
# Check winget
# ----------------------------------------

if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: winget is not installed or not available in PATH." -ForegroundColor Red
    Write-Host "Install App Installer from the Microsoft Store." -ForegroundColor Yellow
    exit 1
}

# ----------------------------------------
# Dependencies
# ----------------------------------------

$dependencies = @(
    @{
        Name       = "LibreOffice"
        Command    = "soffice"
        PackageId  = "TheDocumentFoundation.LibreOffice"
    },
    @{
        Name       = "Pandoc"
        Command    = "pandoc"
        PackageId  = "JohnMacFarlane.Pandoc"
    },
    @{
        Name       = "Node.js"
        Command    = "node"
        PackageId  = "OpenJS.NodeJS"
    }
)

# ----------------------------------------
# Function: Refresh PATH
# ----------------------------------------

function Refresh-Path {
    $machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
    $userPath    = [Environment]::GetEnvironmentVariable("Path", "User")

    $env:Path = "$machinePath;$userPath"
}

# ----------------------------------------
# Check / Install
# ----------------------------------------

foreach ($dependency in $dependencies) {

    $name      = $dependency.Name
    $command   = $dependency.Command
    $packageId = $dependency.PackageId

    Write-Host "Checking $name..." -ForegroundColor Cyan

    if (Get-Command $command -ErrorAction SilentlyContinue) {

        try {
            $version = & $command --version 2>&1 | Select-Object -First 1
        }
        catch {
            $version = "installed"
        }

        Write-Host "  [OK] $name - $version" -ForegroundColor Green
        Write-Host ""

        continue
    }

    Write-Host "  [MISSING] $command" -ForegroundColor Yellow
    Write-Host "  Installing $name..." -ForegroundColor Yellow

    $arguments = @(
        "install"
        "--id"
        $packageId
        "--exact"
        "--accept-source-agreements"
        "--accept-package-agreements"
        "--silent"
    )

    & winget @arguments

    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "ERROR: Failed to install $name." -ForegroundColor Red
        exit 1
    }

    Write-Host "  [INSTALLED] $name" -ForegroundColor Green
    Write-Host ""

    # Refresh PATH so newly installed executables
    # can be detected by this same PowerShell process.
    Refresh-Path
}

# ----------------------------------------
# Final verification
# ----------------------------------------

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Final Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$failed = $false

foreach ($dependency in $dependencies) {

    $name    = $dependency.Name
    $command = $dependency.Command

    if (Get-Command $command -ErrorAction SilentlyContinue) {

        try {
            $version = & $command --version 2>&1 | Select-Object -First 1
        }
        catch {
            $version = "available"
        }

        Write-Host "[OK] $name -> $version" -ForegroundColor Green
    }
    else {
        Write-Host "[FAILED] $name -> '$command' not found in PATH" -ForegroundColor Red
        $failed = $true
    }
}

Write-Host ""

if ($failed) {
    Write-Host "Some dependencies are still unavailable." -ForegroundColor Red
    Write-Host "You may need to restart your terminal and run the script again." -ForegroundColor Yellow
    exit 1
}

Write-Host "All CLI dependencies are ready!" -ForegroundColor Green
Write-Host ""
Write-Host "You can now use:" -ForegroundColor Cyan
Write-Host "  soffice --headless ..." -ForegroundColor White
Write-Host "  pandoc ..." -ForegroundColor White
Write-Host "  node ..." -ForegroundColor White
Write-Host ""
