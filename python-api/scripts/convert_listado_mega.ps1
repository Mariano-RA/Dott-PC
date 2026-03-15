# Convierte listadoMegaViejo.xls a CSV en C:\Users\nanos\Documents\Proveedores
$proveedores = "C:\Users\nanos\Documents\Proveedores"
$entrada = Join-Path $proveedores "listadoMegaViejo.xls"
$salida   = Join-Path $proveedores "listadoMegaViejo.csv"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot  = Split-Path -Parent (Split-Path -Parent $scriptDir)
Set-Location $repoRoot

# Asegurar dependencias
py -3 -m pip install pandas xlrd openpyxl -q 2>$null

# Ejecutar conversión
py -3 python-api/scripts/convert_xls_to_csv.py $entrada $salida
if ($LASTEXITCODE -eq 0) {
    Write-Host "Listo. CSV guardado en: $salida" -ForegroundColor Green
} else {
    Write-Host "Error en la conversión." -ForegroundColor Red
}
