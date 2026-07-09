# Vérifie qu'on est dans un dépôt Git
git rev-parse --is-inside-work-tree *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur : ce dossier n'est pas un dépôt Git."
    exit 1
}

# Vérifie si le remote meca-europe existe, sinon il l'ajoute
$remoteExists = git remote | Where-Object { $_ -eq "meca-europe" }

if (-not $remoteExists) {
    git remote add meca-europe https://github.com/Fababidu43/MECA-EUROPE-SITE.git

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Erreur : impossible d'ajouter le remote meca-europe."
        exit 1
    }
}

# Vérifie s'il y a des changements à commit
$changes = git status --porcelain

if ($changes) {
    # Ajoute tous les fichiers
    git add .

    # Liste les fichiers ajoutés au commit
    $changedFiles = git diff --cached --name-only
    $fileCount = ($changedFiles | Measure-Object).Count
    $date = Get-Date -Format "yyyy-MM-dd HH:mm"

    # Message de commit automatique
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

    Write-Host "Commit créé : $commitMessage"
} else {
    Write-Host "Aucun changement à commit. Push quand même..."
}

# Push vers le dépôt principal
git push origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur pendant le push vers origin."
    exit 1
}

# Push vers le deuxième dépôt
git push meca-europe main

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur pendant le push vers meca-europe."
    exit 1
}

Write-Host "Push terminé vers origin et meca-europe."