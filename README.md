# 📝 Markdown Viewer

A lightweight, offline-first Markdown viewer and editor built as a desktop application with **Tauri**, **React**, and **TypeScript**.

![Windows](https://img.shields.io/badge/Windows-NSIS-0078D6?logo=windows&logoColor=white)
![macOS](https://img.shields.io/badge/macOS-.app%20%2F%20.dmg-000000?logo=apple&logoColor=white)
![Linux](https://img.shields.io/badge/Linux-AppImage-FCC624?logo=linux&logoColor=black)
![Status](https://img.shields.io/badge/status-active%20development-yellow)
![License](https://img.shields.io/badge/license-unspecified-lightgrey)

---

## ✨ Features

| | |
|---|---|
| 📂 **File & folder browsing** | Open local Markdown files or an entire folder, and navigate documents from the sidebar |
| ✍️ **Editing** | Full-featured Markdown editing with a dedicated editor pane |
| 👁️ **Live preview** | Rendered Markdown preview alongside your source |
| 🔀 **Split view** | Edit and preview side by side |
| 🆕 **New documents** | Create new Markdown files from scratch |
| 💾 **Local save** | Save files directly back to disk |
| 🌗 **Light & dark themes** | Comfortable viewing in any environment |
| 🔍 **Workspace search** | Search across files in the current workspace |
| 📑 **Table of contents** | Jump to headings with generated TOC navigation |
| 🔢 **Word & line counts** | Quick document stats at a glance |
| 🧩 **Mermaid diagrams** | Render diagrams directly inside your Markdown |
| ✈️ **Offline-first** | No internet connection required for normal use |

---

## 🖥️ Desktop Builds

GitHub Actions builds the application for each major platform, with artifacts uploaded to the corresponding workflow run:

| Platform | Output |
|---|---|
| 🪟 Windows | NSIS installer |
| 🍎 macOS | `.app` / `.dmg` |
| 🐧 Linux | AppImage |

---

## 🛠️ Tech Stack

- **React** + **TypeScript** — UI framework
- **Vite** — build tooling
- **Tauri** — desktop application shell
- **Tailwind CSS** — styling
- **CodeMirror** — text editing
- **react-markdown** — Markdown rendering
- **Mermaid** — diagram rendering
- **Lucide React** — icons

---

## 📁 Project Structure

```text
md-viewer/
├── src/                  # React frontend
│   ├── main.tsx          # Application UI and editor/preview logic
│   ├── MermaidBlock.tsx  # Mermaid renderer
│   └── styles.css        # Application styles
├── src-tauri/            # Tauri desktop application
│   ├── src/              # Native Rust commands
│   └── tauri.conf.json   # Tauri configuration
├── .github/workflows/    # Desktop build workflows
├── package.json
├── vite.config.ts
└── README.md
```

---

## 🚀 Development

### Requirements

- Node.js
- npm
- Rust and Cargo
- [Tauri prerequisites](https://tauri.app/start/prerequisites/) for your operating system

### Install dependencies

```bash
npm install
```

### Start the development application

```bash
npm run tauri dev
```

### Build the desktop application

```bash
npm run tauri build
```

### Build the frontend only

```bash
npm run build
```

---

## 🔌 Offline Design

Markdown Viewer is built to work entirely with files stored on your computer. Markdown rendering, editing, and Mermaid rendering are bundled into the application itself, so normal document viewing and editing never depend on a web service or an internet connection.

---

## ⚙️ GitHub Actions

The repository includes workflows for building the desktop application on Windows, macOS, and Linux. Each workflow:

1. Installs required dependencies
2. Generates application icons
3. Builds the Tauri application
4. Verifies the generated bundles
5. Uploads the resulting desktop packages as workflow artifacts

---

## 📌 Status

Markdown Viewer is under **active development**. Core viewing, editing, preview, split view, local file handling, and desktop packaging are all being developed together.

---

## 📄 License

No license has currently been specified for this repository.
