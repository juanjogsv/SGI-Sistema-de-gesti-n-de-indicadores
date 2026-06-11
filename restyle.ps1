$files = Get-ChildItem -Path "app/admin" -Filter "*.tsx" -Recurse
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $content = $content.Replace('bg-white', 'bg-card')
    $content = $content.Replace('border-gray-200', 'border-border')
    $content = $content.Replace('border-gray-300', 'border-border')
    $content = $content.Replace('text-gray-900', 'text-foreground')
    $content = $content.Replace('text-gray-700', 'text-foreground/90')
    $content = $content.Replace('text-gray-600', 'text-muted-foreground/80')
    $content = $content.Replace('text-gray-500', 'text-muted-foreground')
    $content = $content.Replace('text-gray-400', 'text-muted-foreground/50')
    $content = $content.Replace('bg-gray-50', 'bg-muted/30')
    $content = $content.Replace('bg-gray-100', 'bg-muted/50')
    $content = $content.Replace('hover:bg-gray-50', 'hover:bg-muted/50')
    $content = $content.Replace('bg-[#1F4E79]', 'bg-luker-brown')
    $content = $content.Replace('hover:bg-[#163857]', 'hover:bg-luker-brown/90')
    $content = $content.Replace('text-[#1F4E79]', 'text-luker-brown')
    $content = $content.Replace('ring-[#1F4E79]', 'ring-luker-brown')
    $content = $content.Replace('accent-[#1F4E79]', 'accent-luker-brown')
    $content = $content.Replace('border-[#1F4E79]', 'border-luker-brown')
    $content = $content.Replace('bg-black/50 z-50', 'bg-black/50 z-50 backdrop-blur-sm')
    $content = $content.Replace('bg-card rounded-xl shadow-xl', 'bg-card rounded-lg shadow-card border border-border animate-in zoom-in-95 duration-200')
    
    Set-Content -Path $file.FullName -Value $content -NoNewline
}
