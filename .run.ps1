# .run.ps1 - Inject .env into current PowerShell session
# Usage: ./run.ps1 [--dev|--prod|--help]
#   --dev  -> uses .env.dev
#   --prod -> uses .env.prod
#   --help -> shows this help message
#   (no arg) -> shows help message

param(
    [switch]$dev,
    [switch]$prod,
    [switch]$help
)

# Show help if --help is used or no arguments provided
if ($help -or (-not $dev -and -not $prod)) {
    Write-Host @"
.run.ps1 - Environment Variable Loader

DESCRIPTION:
    Loads environment variables from .env files into the current PowerShell session.

USAGE:
    ./run.ps1 [OPTIONS]

OPTIONS:
    --dev      Load environment variables from .env.dev
    --prod     Load environment variables from .env.prod
    --help     Show this help message

EXAMPLES:
    ./run.ps1 --dev     # Load .env.dev
    ./run.ps1 --prod    # Load .env.prod
    ./run.ps1 --help    # Show this help

NOTES:
    - If no option is provided, this help message is displayed
    - Environment variables are loaded into the current PowerShell process
    - The script looks for .env files in the current directory
"@ -ForegroundColor Cyan
    exit 0
}

# Determine which .env file to use
$envFile = if ($dev) {
    ".env.dev"
} elseif ($prod) {
    ".env.prod"
} else {
    ".env"
}

# Load environment variables
if (Test-Path $envFile) {
    $loadedCount = 0
    Get-Content $envFile | ForEach-Object {
        # Skip comments and empty lines
        if ($_ -match '^\s*#|^\s*$') {
            return
        }
        
        if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)') {
            $name = $matches[1]
            # Remove surrounding quotes (single or double) and trim whitespace
            $value = $matches[2].Trim() -replace '^["'']|["'']$', ''
            [System.Environment]::SetEnvironmentVariable($name, $value, 'Process')
            $loadedCount++
        }
    }
    Write-Host "Successfully loaded $loadedCount environment variable(s) from $envFile" -ForegroundColor Green
} else {
    Write-Host "Warning: $envFile file not found in current directory!" -ForegroundColor Yellow
    exit 1
}