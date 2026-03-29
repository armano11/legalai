Write-Host "Waiting for Ollama winget installation to finish..."
while (Get-Process -Name "winget" -ErrorAction SilentlyContinue) {
    Start-Sleep -Seconds 10
}
Write-Host "Winget finished. Refreshing environment variables to detect ollama..."
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Write-Host "Ensuring Ollama service is running..."
# Start Ollama service silently in the background
Start-Process -WindowStyle Hidden -FilePath "ollama" -ArgumentList "serve"
Start-Sleep -Seconds 5

Write-Host "Removing DeepSeek-R1 models as requested..."
ollama rm deepseek-r1
ollama rm deepseek-r1:8b

Write-Host "Pulling primary model: qwen2.5:7b... (This may take some time)"
ollama pull qwen2.5:7b

Write-Host "Pulling backup model: llama3.1:8b... (This may take some time)"
ollama pull llama3.1

Write-Host "All requested AI models have been installed successfully! The LegalAI Platform is ready to use them."
