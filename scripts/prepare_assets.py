import os
import sys
import subprocess

def install_and_import(package, pip_name=None):
    if pip_name is None:
        pip_name = package
    try:
        __import__(package)
    except ImportError:
        print(f"Installing {pip_name}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", pip_name])

if __name__ == "__main__":
    # Ensure Pillow is installed
    install_and_import("PIL", "Pillow")
    from PIL import Image, ImageFilter

    # Create assets folder if not exists
    os.makedirs("d:/label/productive/assets", exist_ok=True)

    # Paths
    src_image = r"C:\Users\vipin\.gemini\antigravity-ide\brain\b9d71d77-3d70-4ae8-9f9b-858f46e853d5\wallpaper_1781670008453.png"
    dest_wallpaper = "d:/label/productive/assets/wallpaper.png"
    dest_blurred = "d:/label/productive/assets/wallpaper_blurred.png"

    # Copy and convert wallpaper
    print(f"Copying {src_image} to {dest_wallpaper}...")
    try:
        img = Image.open(src_image)
        img.save(dest_wallpaper, "PNG")
        print("Wallpaper copied successfully.")

        # Create heavily blurred version
        print("Generating blurred wallpaper...")
        # A radius of 40-50 gives a beautiful soft glassmorphism blur
        blurred_img = img.filter(ImageFilter.GaussianBlur(40))
        # Adjust brightness/contrast slightly for a richer dark look
        # We can also tint it slightly in CSS or Python, let's just save it.
        blurred_img.save(dest_blurred, "PNG")
        print("Blurred wallpaper generated successfully.")
    except Exception as e:
        print(f"Error preparing assets: {e}")
        sys.exit(1)
