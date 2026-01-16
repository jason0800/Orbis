# Orbis

Orbis is a powerful, interactive folder structure planner and diagramming tool built/based on React and React Flow. It allows you to visualize directory structures, draw shapes, and plan your projects with an intuitive infinite canvas interface.

## Features

- **Infinite Canvas**: Interactive whiteboard powered by React Flow.
- **Node Types**:
  - **Folder Nodes**: Represent file directories with editable names and descriptions.
  - **Shape Nodes**: Draw rectangles, circles, diamonds, arrows, and lines.
  - **Text Nodes**: Add annotations and labels.
  - **Freehand Drawing**: Sketch ideas freely using the pencil tool.
- **Customization**:
  - **Theme Support**: Seamless Dark and Light mode switching.
  - **Grid Control**: Toggle between Dots, Lines, or Cross grid patterns.
- **Tools**:
  - **Selection & Panning**: Drag to select or pan the view.
  - **Rotation**: Rotate shapes to any angle.
  - **Export/Import**: Save your work as `.orbis` files or export the structure to a ZIP archive.
- **Persistence**: Auto-saves your work using IndexedDB.

## Tech Stack

- **Framework**: React (Vite)
- **State Management**: Zustand
- **Canvas Engine**: @xyflow/react
- **Icons**: Lucide React
- **Persistence**: idb (IndexedDB)
- **Utilities**: uuid, jszip

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

## Controls

- **1**: Pan Tool
- **2**: Select Tool
- **3**: Add Folder Node
- **Rectangle (R) / Circle (C) / Diamond (D)**: Add Shapes
- **Arrow (A) / Line (L)**: Connectors
- **F**: Freehand/Pencil
- **T**: Text
- **E**: Eraser
- **Delete / Backspace**: Remove selected items

## License

MIT
