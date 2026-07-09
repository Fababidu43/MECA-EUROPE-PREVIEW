# Vérifie qu'on est dans un dépôt Git
git rev-parse --is-inside-work-tree *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur : ce dossier n'est pas un dépôt Git."
    exit 1
}

# Récupère les fichiers modifiés
$files = git status --porcelain

if (-not $files) {
    Write-Host "Aucun changement à commit."
    exit 0
}

# Ajoute tous les fichiers
git add .

# Génère un message de commit automatiquement
$changedFiles = git diff --cached --name-only
$fileCount = ($changedFiles | Measure-Object).Count
$date = Get-Date -Format "yyyy-MM-dd HH:mm"

if ($fileCount -eq 1) {
    $commitMessage = "Update $changedFiles"
} else {
    $commitMessage = "Update $fileCount files - $date"
}

# Commit
git commit -m "$commitMessage"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur pendant le commit."
    exit 1
}

# Push
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "Push terminé avec succès."
} else {
    Write-Host "Erreur pendant le push."
    exit 1
}