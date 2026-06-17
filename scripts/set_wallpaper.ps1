param(
    [string]$ImagePath = "d:\label\productive\assets\wallpaper.png"
)

# Set wallpaper using SystemParametersInfo
$code = @'
using System;
using System.Runtime.InteropServices;

public class Wallpaper {
    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int SystemParametersInfo(int uAction, int uParam, string lpvParam, int fuWinIni);
}
'@

Add-Type -TypeDefinition $code -ErrorAction SilentlyContinue
[Wallpaper]::SystemParametersInfo(20, 0, $ImagePath, 3)
