# Markdown Viewer

A lightweight, offline-first Markdown viewer and editor built as a desktop application with Tauri, React, and TypeScript.

## Features

- Open and view local Markdown files
- Open a folder and navigate Markdown files from the sidebar
- Edit Markdown with a dedicated editor
- Preview rendered Markdown
- Split editor / preview mode
- Create new Markdown documents
- Save Markdown files locally
- Light and dark themes
- Search files in the current workspace
- Table of contents navigation
- Word and line counts
- Mermaid diagram rendering
- Local/offline operation — no internet connection is required for normal use

## Desktop Builds

GitHub Actions builds the application for:

- **Windows** — NSIS installer
- **macOS** — `.app` / `.dmg`
- **Linux** — AppImage

Build artifacts are uploaded to the corresponding GitHub Actions workflow run.

## Tech Stack

- **React** + **TypeScript**
- **Vite**
- **Tauri**
- **Tailwind CSS**
- **CodeMirror** for editing
- **react-markdown** for Markdown rendering
- **Mermaid** for diagrams
- **Lucide React** for icons

## Project Structure

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

## Development

### Requirements

- Node.js
- npm
- Rust and Cargo
- Tauri prerequisites for your operating system

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

## Offline Design

Markdown Viewer is designed to work with files stored on the user's computer. Markdown rendering, editing, and Mermaid rendering are bundled into the application, so normal document viewing and editing do not depend on a web service or an internet connection.

## GitHub Actions

The repository contains workflows for building the desktop application on Windows, macOS, and Linux. The workflows install the required dependencies, generate application icons, build the Tauri application, verify the generated bundles, and upload the resulting desktop packages as workflow artifacts.

## Status

Markdown Viewer is under active development. Core viewing, editing, preview, split view, local file handling, and desktop packaging are being developed together.

## License

No license has currently been specified for this repository.