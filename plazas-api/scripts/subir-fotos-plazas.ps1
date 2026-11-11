param(
    [Parameter(Mandatory = $true)]
    [string]$Token,
    [string]$Base = "http://localhost:3000",
    [string]$Plaza = "todas"
)

# Usar enlaces directos a archivos de imagen (JPG, PNG o WEBP), no páginas HTML.
$plazas = @(
    @{ nombre = "Constitución"; id = "6af1fbdeb7155c87cec2e631"; imagen = "https://www.southamericanpostcard.com/images/photos/uruguay-PAAA0304_trip5.JPG" },
    @{ nombre = "Artigas"; id = "6af1ee253c49f3a2e3fa3cc5"; imagen = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRp5L_veILvcOMgHqiIEVvPJxppRjBs37teMcN8htWcPK8yLy8zUnwrfTfM&s=10" },
    @{ nombre = "Acuña de Figueroa"; id = "6af1fbdeb7155c87cec2e633"; imagen = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBDs5Vvt3Br65NPJm_cHQHcAcvTj7uOfKpxEY1COINkU1C39m9UZfn_us&s=10" },
    @{ nombre = "Rivera"; id = "6af1fbdeb7155c87cec2e634"; imagen = "https://www.eltelegrafo.com/wp-content/uploads/2022/10/j56632.jpg" },
    @{ nombre = "Colón"; id = "6af1fbdeb7155c87cec2e635"; imagen = "https://www.stonek.com/FOTOS/_FOTOGRAFOS/dstonek/dstonek_20059.jpg" },
    @{ nombre = "Bella Vista"; id = "6af1fbdfb7155c87cec2e636"; imagen = "https://www.eltelegrafo.com/wp-content/uploads/2025/09/k36681-678x381.jpg" },
    @{ nombre = "Deportes"; id = "6af1fbdfb7155c87cec2e637"; imagen = "https://www.eltelegrafo.com/wp-content/uploads/2024/11/k15762-678x381.jpg" }
)

$headers = @{ Authorization = "Bearer $Token" }
$seleccion = if ($Plaza -eq "todas") { $plazas } else { @($plazas | Where-Object { $_.nombre -eq $Plaza }) }
if (!$seleccion) { throw "Plaza '$Plaza' no encontrada. Opciones: todas, Constitución, Artigas, Acuña de Figueroa, Rivera, Colón, Bella Vista, Deportes." }

foreach ($p in $seleccion) {
    try {
        $subida = Invoke-RestMethod -Method Post -Uri "$Base/api/uploads/image-url" `
            -Headers $headers -ContentType "application/json" `
            -Body (@{ url = $p.imagen } | ConvertTo-Json) -ErrorAction Stop

        $actual = Invoke-RestMethod -Method Get -Uri "$Base/api/square/$($p.id)" -ErrorAction Stop
        $fotos = @($actual.pictures) + @($subida.url) | Select-Object -Unique
        $body = @{ pictures = $fotos } | ConvertTo-Json -Depth 5
        Invoke-RestMethod -Method Patch -Uri "$Base/api/square/$($p.id)" `
            -Headers $headers -ContentType "application/json" -Body $body -ErrorAction Stop | Out-Null
        Write-Host "OK: $($p.nombre) -> $($subida.url)"
    }
    catch {
        Write-Warning "FALLO $($p.nombre): $($_.Exception.Message)"
    }
}
