# split-lines.mjs가 만든 글줄 그림을 Windows 내장 OCR(한국어)로 읽는다.
#
# 쪽폴더 안의 lines_w2400/ · lines_w3600/ · lines_w4800/ 을 각각 읽어
# ocr_w2400.txt · ocr_w3600.txt · ocr_w4800.txt 로 저장한다. (형식: 파일명<TAB>읽은 글)
# 세 결과는 compare-ocr.mjs 가 다수결로 합친다.
#
# 참고:
#   - 한국어 엔진은 영문도 읽지만 o→0, l→1 오독이 잦다. 영문 검증에 쓸 때는
#     compare-ocr.mjs 결과에서 그런 잡음을 감안하고 볼 것.
#   - 이 스크립트는 BOM 있는 UTF-8로 저장돼 있어야 한다. PowerShell 5.1은
#     BOM 없는 UTF-8을 ANSI로 읽어 한글 주석·문자열을 깨뜨린다.
#
# 사용: powershell -File scripts/verify/ocr-lines.ps1 "<쪽폴더>" [...]
param([Parameter(Mandatory = $true, ValueFromRemainingArguments = $true)][string[]]$Dirs)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Runtime.WindowsRuntime

$mOp = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]
function Await($op, $type) { $t = $mOp.MakeGenericMethod($type).Invoke($null, @($op)); $t.Wait(-1) | Out-Null; $t.Result }

[void][Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime]
[void][Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics, ContentType = WindowsRuntime]
[void][Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime]
[void][Windows.Globalization.Language, Windows.Globalization, ContentType = WindowsRuntime]

$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage((New-Object Windows.Globalization.Language 'ko'))
if ($null -eq $engine) { throw '한국어 OCR 엔진을 만들 수 없습니다. Windows 언어 설정에서 한국어를 확인하세요.' }

foreach ($dir in $Dirs) {
  foreach ($w in @(2400, 3600, 4800)) {
    $lineDir = Join-Path $dir "lines_w$w"
    if (-not (Test-Path $lineDir)) { Write-Output "건너뜀(폴더 없음): $lineDir"; continue }
    $lines = @()
    Get-ChildItem -Path $lineDir -Filter *.png | Sort-Object Name | ForEach-Object {
      $f = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($_.FullName)) ([Windows.Storage.StorageFile])
      $st = Await ($f.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
      $dec = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($st)) ([Windows.Graphics.Imaging.BitmapDecoder])
      $bmp = Await ($dec.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
      $res = Await ($engine.RecognizeAsync($bmp)) ([Windows.Media.Ocr.OcrResult])
      $lines += ($_.BaseName + "`t" + ((@($res.Lines | ForEach-Object { $_.Text })) -join ' '))
      $st.Dispose()
    }
    $out = Join-Path $dir "ocr_w$w.txt"
    [System.IO.File]::WriteAllLines($out, $lines, (New-Object System.Text.UTF8Encoding $false))
    Write-Output "OCR: $out ($($lines.Count)줄)"
  }
}
