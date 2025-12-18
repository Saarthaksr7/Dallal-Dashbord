# Quick Start Guide - Dependency Installer

## One-Click Installation

### Step 1: Run the Installer
📁 Navigate to: `Dallal Dashboard\install files`  
🖱️ Double-click: **install-dependencies.bat**

### Step 2: Choose Installation Type
When prompted:
- **Option 1** (Recommended): Create virtual environment
- **Option 2**: Install globally

### Step 3: Wait
Installation takes 3-5 minutes depending on internet speed.

### Step 4: Done! ✅

## What You Need

- ✅ Windows 10 or higher
- ✅ Python 3.8+ ([Download](https://www.python.org/downloads/))
- ✅ Internet connection

## If Something Goes Wrong

The installer will:
- ❌ NOT close automatically
- 📝 Save errors to `install.log`
- 💡 Show you how to fix the issue
- 🔄 Let you retry

**To exit after error:** Type `y` and press Enter

## Converting to EXE (Optional)

### Quick Method (IExpress - Built into Windows)
1. Press `Win + R`
2. Type: `iexpress`
3. Follow wizard to package the .bat file

**Or keep as .bat** - works the same!

## Next Steps After Installation

```powershell
# 1. Go to backend folder
cd "..\backend"

# 2. Configure settings
copy .env.example .env

# 3. Start dashboard
python main.py

# 4. Open browser to: http://localhost:8000
```

## Need Help?

📖 Read: **INSTALLER_README.md** (detailed guide)  
📝 Check: **install.log** (error details)

---

**That's it!** The installer handles everything else automatically.
