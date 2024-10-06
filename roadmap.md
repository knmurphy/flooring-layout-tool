# Floor Plan Drawing Tool Enhancement Plan

## Technology Stack
- Frontend Framework: Vue 3
- UI Library: Element Plus
- Canvas Library: Konva
- PDF Handling: PDF.js
- State Management: Vue 3 Composition API (no Vuex)
- Styling: Scoped CSS in Vue components
- Build Tool: Vue CLI

## 1. PDF Loading
- [x] Add file input for PDF selection using Element Plus upload component
- [x] Implement PDF to image conversion using PDF.js
- [x] Display PDF image as background in Konva stage

## 2. Layer Management
- [x] Create background layer for PDF image
- [ ] Implement pattern layer
- [x] Add drawing layer for user-created shapes

## 3. Drawing Functionality
- [x] Implement box drawing tool (click and drag) using Konva
- [x] Create polygon drawing tool (multi-point click) using Konva
- [ ] Add shape editing capabilities (move vertices, resize) using Konva transformers

## 4. Pattern and Fill Management
- [x] Develop a basic library of fill colors
- [x] Create pattern selection tool using Element Plus menu
- [ ] Implement pattern scale and rotation adjustments
- [ ] Add transparency control for fills

## 5. Shape Properties
- [ ] Design and implement properties panel for selected shapes using Element Plus components
- [ ] Add controls for:
  - [x] Fill color selection
  - [ ] Pattern scale and rotation
  - [ ] Fill transparency
  - [ ] Outline color and thickness

## 6. Rendering
- [x] Utilize Konva's basic fill capabilities
- [ ] Implement custom shaders for complex patterns (if needed)
- [ ] Implement zoom and pan operations

## 7. Export as PDF
- [ ] Capture entire stage (PDF background + patterns + drawings)
- [ ] Generate new PDF with jsPDF
- [ ] Match new PDF dimensions and resolution to original
- [ ] Ensure correct pattern rendering in export

## 8. User Interface
- [x] Add tools for shape drawing (rectangle and polygon)
- [x] Design and implement color selection interface (Element Plus menu)
- [ ] Create properties panel for shape attribute adjustments using Element Plus
- [x] Develop controls for PDF loading using Element Plus components
- [ ] Implement PDF export functionality

## 9. Performance Optimization
- [ ] Optimize rendering
- [ ] Implement caching for frequently used patterns/colors
- [ ] Ensure efficient handling of large PDFs

## 10. Undo/Redo Functionality
- [ ] Implement undo/redo for all drawing and editing actions using custom state management

## 11. Shape Management
- [x] Implement basic shape selection
- [ ] Implement shape deselection
- [ ] Add ability to delete shapes
- [ ] Implement shape dragging and resizing

## 12. Labeling
- [ ] Add labels to shapes
- [ ] Implement label editing functionality
- [ ] Create a shape list dialog for bulk label editing

## Key Challenges to Address
- Efficient rendering of complex patterns in Konva
- Smooth interaction when editing shapes with patterns
- Ensuring pattern quality at different zoom levels
- Correct pattern rendering in PDF export
- Maintaining PDF resolution and dimensions
- Handling multi-page PDFs
- Ensuring good performance with large files

## Dark Mode
- [ ] Implement dark mode using Element Plus theming capabilities
- [ ] Ensure consistent dark mode styling across custom components
