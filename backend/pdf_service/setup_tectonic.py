#!/usr/bin/env python3
import subprocess
import sys
import os

def check_tectonic():
    """Check if Tectonic is installed and accessible"""
    try:
        result = subprocess.run(['tectonic', '--version'], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            print(f"Tectonic is installed: {result.stdout.strip()}")
            return True
        else:
            print("Tectonic is not accessible")
            return False
    except FileNotFoundError:
        print("Tectonic is not installed")
        return False

def install_tectonic():
    """Install Tectonic LaTeX engine"""
    print("Installing Tectonic...")
    
    # Check if we're on Windows
    if os.name == 'nt':
        print("On Windows, please install Tectonic manually:")
        print("1. Download from: https://github.com/tectonic-typesetting/tectonic/releases")
        print("2. Or use: winget install tectonic")
        print("3. Or use Chocolatey: choco install tectonic")
        return False
    
    # For Unix-like systems
    try:
        # Try installing via cargo (Rust package manager)
        result = subprocess.run(['cargo', 'install', 'tectonic'], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            print("Tectonic installed successfully via cargo")
            return True
        else:
            print("Failed to install via cargo")
    except FileNotFoundError:
        print("Cargo not found")
    
    # Alternative installation methods
    print("Please install Tectonic manually:")
    print("- macOS: brew install tectonic")
    print("- Ubuntu/Debian: Install from GitHub releases")
    print("- Or visit: https://tectonic-typesetting.github.io/")
    
    return False

if __name__ == "__main__":
    if not check_tectonic():
        install_tectonic()
    else:
        print("Tectonic is ready to use!")