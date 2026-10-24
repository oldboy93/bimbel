$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$v2Html = "file:///D:/bimbel/product-knowledge/company-catalog-v2.html"
$liteHtml = "file:///D:/bimbel/product-knowledge/company-catalog-lite.html"

$pdfTempV2 = "C:\Users\ubaid\Documents\uay_studio_company_catalog_v2.pdf"
$pdfTempLite = "C:\Users\ubaid\Documents\uay_studio_company_catalog_lite.pdf"

Start-Process -FilePath $edge -ArgumentList "--headless --disable-gpu --no-margins --print-to-pdf-no-header --print-to-pdf=`"$pdfTempV2`" `"$v2Html`"" -Wait
Start-Process -FilePath $edge -ArgumentList "--headless --disable-gpu --no-margins --print-to-pdf-no-header --print-to-pdf=`"$pdfTempLite`" `"$liteHtml`"" -Wait

Copy-Item $pdfTempV2 "D:\bimbel\product-knowledge\uay_studio_company_catalog_v2.pdf" -Force
Copy-Item $pdfTempLite "D:\bimbel\product-knowledge\uay_studio_company_catalog_lite.pdf" -Force

Write-Host "PDF Generation Complete!"
Get-ChildItem "D:\bimbel\product-knowledge\*.pdf" | Select-Object Name, Length
