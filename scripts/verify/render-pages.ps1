# PDF 쪽을 Windows 내장 렌더러로 PNG에 그린다. (배율 3종: 가로 2400·3600·4800px)
#
# 왜 Windows 렌더러인가:
#   한-칠레 국문처럼 JBIG2로 압축된 스캔 PDF는 pdfjs(Node)로 그리면 **빈 쪽**이 나온다.
#   Windows 내장 PDF 엔진(Windows.Data.Pdf)은 JBIG2까지 지원하므로 이것으로 통일한다.
#
# 왜 배율 3종인가:
#   OCR을 한 번만 돌리면 오독을 알아챌 수 없다. 배율을 달리해 세 번 읽고
#   compare-ocr.mjs 에서 다수결로 확정한다.
#
# 사용: powershell -File scripts/verify/render-pages.ps1 "<pdf>" <시작쪽> <끝쪽> "<출력폴더>"
#   쪽마다 <출력폴더>\p0000\w2400.png · w3600.png · w4800.png 이 생긴다.
param(
  [Parameter(Mandatory = $true)][string]$Pdf,
  [Parameter(Mandatory = $true)][int]$From,
  [Parameter(Mandatory = $true)][int]$To,
  [Parameter(Mandatory = $true)][string]$OutDir
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Runtime.WindowsRuntime

$mOp = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]
$mAct = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncAction' })[0]
function Await($op, $type) { $t = $mOp.MakeGenericMethod($type).Invoke($null, @($op)); $t.Wait(-1) | Out-Null; $t.Result }
function AwaitAction($act) { $t = $mAct.Invoke($null, @($act)); $t.Wait(-1) | Out-Null }

[void][Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime]
[void][Windows.Storage.StorageFolder, Windows.Storage, ContentType = WindowsRuntime]
[void][Windows.Data.Pdf.PdfDocument, Windows.Data.Pdf, ContentType = WindowsRuntime]

$src = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync((Resolve-Path $Pdf).Path)) ([Windows.Storage.StorageFile])
$doc = Await ([Windows.Data.Pdf.PdfDocument]::LoadFromFileAsync($src)) ([Windows.Data.Pdf.PdfDocument])
Write-Output "총 $($doc.PageCount)쪽"

for ($p = $From; $p -le $To; $p++) {
  $pageDir = Join-Path $OutDir ('p{0:D4}' -f $p)
  if (-not (Test-Path $pageDir)) { New-Item -ItemType Directory -Force -Path $pageDir | Out-Null }
  $folder = Await ([Windows.Storage.StorageFolder]::GetFolderFromPathAsync((Resolve-Path $pageDir).Path)) ([Windows.Storage.StorageFolder])

  $page = $doc.GetPage([uint32]($p - 1))   # 0부터 센다
  foreach ($w in @(2400, 3600, 4800)) {
    $opts = New-Object Windows.Data.Pdf.PdfPageRenderOptions
    $opts.DestinationWidth = [uint32]$w
    $of = Await ($folder.CreateFileAsync("w$w.png", [Windows.Storage.CreationCollisionOption]::ReplaceExisting)) ([Windows.Storage.StorageFile])
    $st = Await ($of.OpenAsync([Windows.Storage.FileAccessMode]::ReadWrite)) ([Windows.Storage.Streams.IRandomAccessStream])
    AwaitAction ($page.RenderToStreamAsync($st, $opts))
    $st.Dispose()
  }
  $page.Dispose()
  Write-Output "그림: $pageDir (w2400·w3600·w4800)"
}
