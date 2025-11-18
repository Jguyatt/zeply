# Zeply - Professional File Manager

A modern, professional file management application built with React, Tailwind CSS, and Electron. Zeply helps you organize, track, and manage all your files with a beautiful, intuitive interface.

## Features

- 🎨 **Modern UI** - Beautiful, professional design with navy blue branding
- 📁 **File Management** - Comprehensive file tracking and organization
- 🔍 **Smart Search** - Find files by name, type, folder, or content
- 📊 **Analytics Dashboard** - Track storage usage, file counts, and more
- 🤖 **Automated Workflows** - AI-powered file organization
- 🖥️ **Cross-Platform** - Available for Windows and Mac
- ⚡ **Fast & Responsive** - Built with React and optimized performance

## Tech Stack

- **React 18** - Modern UI framework
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Fast build tool and dev server
- **Electron** - Desktop app framework
- **React Router** - Client-side routing
- **Lucide React** - Beautiful icon library

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd zeeply
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. For Electron development (in a separate terminal):
```bash
npm run electron:dev
```

## Building for Production

### Build Web Version
```bash
npm run build
```

### Build Desktop App

**For Mac:**
```bash
npm run electron:build:mac
```

**For Windows:**
```bash
npm run electron:build:win
```

**For both platforms:**
```bash
npm run electron:pack
```

Built applications will be in the `dist-electron` directory.

## Project Structure

```
zeeply/
├── electron.js              # Electron main process
├── src/
│   ├── components/          # React components
│   │   ├── Header.jsx
│   │   ├── Hero.jsx
│   │   ├── FileManagement.jsx
│   │   ├── AutomatedWorkflows.jsx
│   │   └── StatsCard.jsx
│   ├── pages/              # Page components
│   │   ├── Home.jsx
│   │   └── Dashboard.jsx
│   ├── App.jsx             # Main app component
│   ├── main.jsx            # React entry point
│   └── index.css           # Global styles
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## Customization

### Colors

The app uses a navy blue color scheme (blue-900, blue-800, blue-700) matching the Zeply brand.

### Branding

The logo features a folder icon with a "Z" inside, representing Zeply's file management focus.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

# zeply
