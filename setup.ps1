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
# Functions: PATH management
# ----------------------------------------

function Refresh-Path {
    $machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
    $userPath    = [Environment]::GetEnvironmentVariable("Path", "User")

    $env:Path = "$machinePath;$userPath"
}

function Add-To-PathIfMissing {
    param (
        [string]$PathToAdd
    )

    $machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
    $userPath    = [Environment]::GetEnvironmentVariable("Path", "User")

    $allPaths = @(
        $machinePath -split ';'
        $userPath -split ';'
    ) | Where-Object { $_ -and $_.Trim() }

    # Case-insensitive comparison because Windows paths are case-insensitive.
    $exists = $allPaths | Where-Object {
        $_.TrimEnd('\') -ieq $PathToAdd.TrimEnd('\')
    }

    if ($exists) {
        Write-Host "  [OK] LibreOffice is already in PATH." -ForegroundColor Green

        # Refresh current PowerShell PATH even if the entry already exists.
        Refresh-Path
        return
    }

    # Add to User PATH so administrator privileges aren't required.
    $newUserPath = @(
        $userPath -split ';'
        $PathToAdd
    ) | Where-Object { $_ -and $_.Trim() } | Select-Object -Unique

    [Environment]::SetEnvironmentVariable(
        "Path",
        ($newUserPath -join ';'),
        "User"
    )

    Write-Host "  [PATH] Added LibreOffice to User PATH." -ForegroundColor Green

    # Make the change available immediately in this PowerShell process.
    Refresh-Path
}

function Ensure-LibreOfficePath {
    $possiblePaths = @(
        "$env:ProgramFiles\LibreOffice\program"
        "${env:ProgramFiles(x86)}\LibreOffice\program"
        "$env:LOCALAPPDATA\Programs\LibreOffice\program"
    )

    $libreOfficePath = $possiblePaths |
        Where-Object { Test-Path (Join-Path $_ "soffice.exe") } |
        Select-Object -First 1

    if (-not $libreOfficePath) {
        return $false
    }

    Add-To-PathIfMissing $libreOfficePath

    return [bool](Get-Command soffice -ErrorAction SilentlyContinue)
}

# ----------------------------------------
# Check / Install
# ----------------------------------------

foreach ($dependency in $dependencies) {

    $name      = $dependency.Name
    $command   = $dependency.Command
    $packageId = $dependency.PackageId

    Write-Host "Checking $name..." -ForegroundColor Cyan

    # LibreOffice special handling:
    # If soffice is not in PATH but LibreOffice is installed,
    # add its program directory to PATH.
    if ($name -eq "LibreOffice") {
        if (-not (Get-Command soffice -ErrorAction SilentlyContinue)) {
            Ensure-LibreOfficePath
        }
    }

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

    # LibreOffice may not automatically be in PATH.
    if ($name -eq "LibreOffice") {
        if (-not (Ensure-LibreOfficePath)) {
            Write-Host "ERROR: LibreOffice was installed, but soffice.exe could not be found or added to PATH." -ForegroundColor Red
            exit 1
        }
    }
    else {
        # Refresh PATH so newly installed executables
        # can be detected by this same PowerShell process.
        Refresh-Path
    }
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
