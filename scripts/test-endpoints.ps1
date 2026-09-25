$base = "http://localhost:8000"

function Show-Section($title) {
    Write-Host "`n=== $title ===" -ForegroundColor Cyan
}

# Clear rate limit at the start
docker compose -f compose.dev.yaml exec redis redis-cli DEL "ratelimit:127.0.0.1" | Out-Null

Show-Section "Health"
Invoke-RestMethod "$base/health" | Out-Host

Show-Section "Ready"
Invoke-RestMethod "$base/ready" | Out-Host

Show-Section "POST complaint"
$body = @{
    text = "Burst water pipe on Street 15 flooding the road"
    location = "Street 15"
} | ConvertTo-Json
$created = Invoke-RestMethod -Uri "$base/api/complaints" -Method Post -ContentType "application/json" -Body $body
$created | ConvertTo-Json -Depth 5 | Out-Host
$id = $created.id
Write-Host "Created ID: $id" -ForegroundColor Green

if (-not $id) {
    Write-Host "POST failed - aborting tests that need an ID" -ForegroundColor Red
    exit 1
}

Show-Section "GET by id"
Invoke-RestMethod "$base/api/complaints/$id" | Out-Host

Show-Section "GET list"
$listUrl = $base + "/api/complaints?page=1" + [char]38 + "page_size=5"
Invoke-RestMethod $listUrl | Out-Host

Show-Section "PATCH valid - open to in_progress"
$patch = @{ status = "in_progress" } | ConvertTo-Json
Invoke-RestMethod -Uri "$base/api/complaints/$id/status" -Method Patch -ContentType "application/json" -Body $patch | Out-Host

Show-Section "PATCH invalid - in_progress to open"
try {
    $patch = @{ status = "open" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$base/api/complaints/$id/status" -Method Patch -ContentType "application/json" -Body $patch | Out-Host
} catch {
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
    Write-Host $reader.ReadToEnd() -ForegroundColor Yellow
}

Show-Section "Stats - MISS then HIT"
Write-Host "1st: $((Invoke-WebRequest "$base/api/stats").Headers['X-Cache'])"
Write-Host "2nd: $((Invoke-WebRequest "$base/api/stats").Headers['X-Cache'])"

Show-Section "Meta providers"
Invoke-RestMethod "$base/api/meta/providers" | Out-Host

Show-Section "Rate limit - 11 POSTs"
1..11 | ForEach-Object {
    $b = @{ text = "test number $_ for rate limit now"; location = "test loc" } | ConvertTo-Json
    try {
        $r = Invoke-WebRequest -Uri "$base/api/complaints" -Method Post -ContentType "application/json" -Body $b
        Write-Host "$_ -> $($r.StatusCode)"
    } catch {
        Write-Host "$_ -> $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
    }
}

Write-Host "`nAll tests complete." -ForegroundColor Green