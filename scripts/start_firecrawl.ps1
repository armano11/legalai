# JurisAI - Firecrawl Local Infrastructure Starter
# This script launches the multi-container scraping stack required for premium web research.

Write-Host "Initializing Firecrawl local infrastructure..." -ForegroundColor Cyan

$firecrawlPath = Join-Path $PSScriptRoot "..\\external\\firecrawl"

if (Test-Path $firecrawlPath) {
    Set-Location $firecrawlPath
    Write-Host "Starting Docker containers (API, Playwright, Redis, RabbitMQ, Postgres)..." -ForegroundColor Yellow
    docker compose up -d
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Firecrawl stack is starting in the background." -ForegroundColor Green
        Write-Host "API endpoint: http://127.0.0.1:3002" -ForegroundColor Gray
        Write-Host "It may take 30-60 seconds for all services to become healthy." -ForegroundColor Yellow
    } else {
        Write-Host "Failed to start Docker containers. Ensure Docker Desktop is running." -ForegroundColor Red
    }
} else {
    Write-Host "Firecrawl source not found at $firecrawlPath" -ForegroundColor Red
}

Set-Location ..\\..
