import sys
import time
import ctypes

# Load user32.dll
user32 = ctypes.windll.user32

# Win32 Constants
HWND_BOTTOM = 1
SWP_NOSIZE = 0x0001
SWP_NOMOVE = 0x0002
SWP_NOACTIVATE = 0x0010
SWP_NOOWNERZORDER = 0x0200
SWP_SHOWWINDOW = 0x0040

GWL_EXSTYLE = -20

def keep_at_bottom(hwnd):
    # Set window styles: WS_EX_NOACTIVATE (0x08000000) | WS_EX_TOOLWINDOW (0x00000080)
    style = user32.GetWindowLongW(hwnd, GWL_EXSTYLE)
    style |= 0x08000000 | 0x00000080
    user32.SetWindowLongW(hwnd, GWL_EXSTYLE, style)

    print(f"Pinning HWND {hwnd} to bottom stack...", flush=True)
    while True:
        # SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE | SWP_NOOWNERZORDER | SWP_SHOWWINDOW
        user32.SetWindowPos(
            hwnd, 
            HWND_BOTTOM, 
            0, 0, 0, 0, 
            SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE | SWP_NOOWNERZORDER | SWP_SHOWWINDOW
        )
        time.sleep(0.5)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python window_helper.py <HWND>", flush=True)
        sys.exit(1)
    
    hwnd_str = sys.argv[1]
    try:
        # Check if hex string
        if hwnd_str.lower().startswith("0x"):
            hwnd = int(hwnd_str, 16)
        else:
            hwnd = int(hwnd_str)
    except ValueError:
        print(f"Invalid HWND format: {hwnd_str}", flush=True)
        sys.exit(1)
        
    keep_at_bottom(hwnd)
