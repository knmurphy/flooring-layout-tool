# Floor Plan Drawing Tool Enhancement Plan

## Technology Stack
- Frontend Framework: Vue 3
- UI Library: Element Plus
- Canvas Library: Konva
- PDF Handling: PDF.js
- State Management: Vue 3 Composition API (no Vuex)
- Styling: Scoped CSS in Vue components
- Build Tool: Vite

## 1. PDF Loading
- [x] Add file input for PDF selection using Element Plus upload component
- [ ] Implement PDF to image conversion using PDF.js
- [ ] Display PDF image as background in Konva stage

## 2. Layer Management
- [x] Create background layer for PDF image
- [x] Implement pattern layer
- [ ] Add drawing layer for user-created shapes

## 3. Drawing Functionality
- [ ] Implement box drawing tool (click and drag) using Konva
- [ ] Create polygon drawing tool (multi-point click) using Konva
- [ ] Add shape editing capabilities (move vertices, resize) using Konva transformers

## 4. Pattern and Fill Management
- [x] Develop a library of fill patterns (currently using solid colors)
- [x] Create pattern selection tool using Konva-based draggable menu
- [ ] Implement pattern scale and rotation adjustments
- [ ] Add transparency control for fills

## 5. Shape Properties
- [ ] Design and implement properties panel for selected shapes using Element Plus components
- [ ] Add controls for:
  - [ ] Fill pattern selection
  - [ ] Pattern scale and rotation
  - [ ] Fill transparency
  - [ ] Outline color and thickness

## 6. Rendering
- [ ] Utilize Konva's pattern fill capabilities
- [ ] Implement custom shaders for complex patterns (if needed)
- [ ] Optimize rendering for zoom and pan operations

## 7. Export as PDF
- [ ] Capture entire stage (PDF background + patterns + drawings)
- [ ] Generate new PDF with jsPDF
- [ ] Match new PDF dimensions and resolution to original
- [ ] Ensure correct pattern rendering in export

## 8. User Interface
- [x] Add tools for shape drawing (currently using click-to-place)
- [x] Design and implement pattern selection interface (Konva-based draggable menu)
- [ ] Create properties panel for shape attribute adjustments using Element Plus
- [ ] Develop controls for PDF loading and export using Element Plus components

## 9. Performance Optimization
- [ ] Optimize pattern rendering
- [ ] Implement caching for frequently used patterns
- [ ] Ensure efficient handling of large PDFs

## 10. Undo/Redo Functionality
- [ ] Implement undo/redo for all drawing and editing actions using custom state management

## Key Challenges to Address
- Efficient rendering of complex patterns in Konva
- Smooth interaction when editing shapes with patterns
- Ensuring pattern quality at different zoom levels
- Correct pattern rendering in PDF export
- Maintaining PDF resolution and dimensions
- Handling multi-page PDFs
- Ensuring good performance with large files

## Dark Mode
- [x] Implement dark mode using Element Plus theming capabilities
- [ ] Ensure consistent dark mode styling across custom components
