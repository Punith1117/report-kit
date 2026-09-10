# Installation

This project requires:

* Node.js
* Pandoc
* LibreOffice

The repository provides setup scripts for Linux and Windows to verify the required command-line tools.

---

## Linux

Run the setup script:

```bash
./setup.sh
```

The script checks whether the following commands are available:

* `node`
* `pandoc`
* `soffice`

The script does not install missing dependencies. If a dependency is missing, install it using your distribution's package manager.

After the required tools are available, install the project's Node.js dependencies:

```bash
npm install
```

---

## Windows

Run the PowerShell setup script:

```powershell
.\setup.ps1
```

The script checks for:

* Node.js
* Pandoc
* LibreOffice

Missing dependencies are installed automatically using `winget` and LibreOffice is added to PATH.

After the required tools are available, install the project's Node.js dependencies:

```powershell
npm install
```

The Windows setup script requires `winget`, which is provided by Microsoft's App Installer and available by default on Windows 11 and some Windows 10 versions.

If the LibreOffice installation through `winget` is too slow, you can install LibreOffice directly from the [official LibreOffice website](https://www.libreoffice.org/download/download-libreoffice/). Mirror links for downloading LibreOffice are also available on the official download page.

---

Now, you can use the software by following the [Usage Guide](usage.md).
