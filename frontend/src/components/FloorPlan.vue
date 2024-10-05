<template>
  <v-container fluid class="floor-plan-container pa-0">
    <v-row no-gutters>
      <v-col cols="12">
        <v-app-bar dense>
          <v-app-bar-title>Floor Plan</v-app-bar-title>
          <v-spacer></v-spacer>
          <v-switch v-model="isDarkMode" label="Dark Mode" @change="toggleUIDarkMode"></v-switch>
          <v-switch v-model="isCanvasDarkMode" label="Canvas Dark Mode" @change="toggleCanvasDarkMode"></v-switch>
          <v-btn @click="openFileInput">Load PDF</v-btn>
          <v-btn @click="exportAsPNG">Export as PNG</v-btn>
        </v-app-bar>
      </v-col>
    </v-row>
    <v-row no-gutters>
      <v-col cols="12">
        <div class="canvas-container">
          <v-stage
            ref="stage"
            :config="stageConfig"
            @mousedown="handleMouseDown"
            @mousemove="handleMouseMove"
            @mouseup="handleMouseUp"
            @wheel="handleWheel"
          >
            <v-layer ref="mainLayer">
              <v-group ref="backgroundGroup"></v-group>
              <v-group ref="shapeGroup"></v-group>
              <v-group ref="annotationGroup"></v-group>
            </v-layer>
          </v-stage>
        </div>
      </v-col>
    </v-row>
    <v-row no-gutters>
      <v-col cols="12">
        <v-bottom-navigation>
          <v-btn v-for="pattern in availablePatterns" :key="pattern.name" @click="selectPattern(pattern)">
            {{ pattern.name }}
          </v-btn>
        </v-bottom-navigation>
      </v-col>
    </v-row>
    <input 
      type="file" 
      ref="fileInput" 
      @change="handleFileSelect" 
      accept="application/pdf" 
      style="display: none;"
    >
  </v-container>
</template>

<script>
import { defineComponent, ref, watchEffect, onMounted, onUnmounted, computed, defineExpose } from 'vue'
import { Stage, Layer, Group } from 'vue-konva'
import Konva from 'konva'
import { convertPDFToImage } from '../utils/pdfUtils'

export default defineComponent({
  name: 'FloorPlan',
  components: {
    VStage: Stage,
    VLayer: Layer,
    VGroup: Group,
  },
  setup() {
    const isDarkMode = ref(false);
    const isCanvasDarkMode = ref(false);
    const showSizeWarning = ref(false);
    const stageConfig = ref({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: isDarkMode.value ? '#2c2c2c' : '#ffffff'
    });
    const menuTop = ref(60);
    const menuLeft = ref(10);
    const isDrawing = ref(false);
    const currentLine = ref(null);
    const selectedPattern = ref(null);
    const isDragging = ref(false);
    const walls = ref([]);
    const stage = ref(null);
    const mainLayer = ref(null);
    const backgroundGroup = ref(null);
    const shapeGroup = ref(null);
    const annotationGroup = ref(null);
    const materialsMenu = ref(null);

    const patterns = ref([]);
    const availablePatterns = ref([
      { name: 'Hardwood', fill: '#8B4513', width: 50, height: 50 },
      { name: 'Tile', fill: '#D3D3D3', width: 40, height: 40 },
      { name: 'Carpet', fill: '#DEB887', width: 60, height: 60 },
      { name: 'Laminate', fill: '#A0522D', width: 45, height: 45 },
      { name: 'Vinyl', fill: '#708090', width: 55, height: 55 },
    ]);

    const gridSize = 20;
    const gridLayer = ref(null);

    const gridLines = computed(() => {
      const lines = [];
      for (let i = 0; i <= stageConfig.value.width; i += gridSize) {
        lines.push({
          id: `vertical-${i}`,
          points: [i, 0, i, stageConfig.value.height],
          stroke: '#3a3a3a',
          strokeWidth: 1,
        });
      }
      for (let i = 0; i <= stageConfig.value.height; i += gridSize) {
        lines.push({
          id: `horizontal-${i}`,
          points: [0, i, stageConfig.value.width, i],
          stroke: '#3a3a3a',
          strokeWidth: 1,
        });
      }
      return lines;
    });

    const updateStageSize = () => {
      stageConfig.value.width = window.innerWidth;
      stageConfig.value.height = window.innerHeight - 100;
      showSizeWarning.value = window.innerWidth < 768;
      // Redraw grid when stage size changes
      if (gridLayer.value && gridLayer.value.getNode) {
        gridLayer.value.getNode().batchDraw();
      }
      if (mainLayer.value && mainLayer.value.getNode) {
        mainLayer.value.getNode().batchDraw();
      }
    };

    const startDragging = () => {
      isDragging.value = true;
      document.addEventListener('mousemove', onDrag);
      document.addEventListener('mouseup', stopDragging);
    };

    const onDrag = (event) => {
      if (isDragging.value) {
        menuTop.value = event.clientY;
        menuLeft.value = event.clientX;
      }
    };

    const stopDragging = () => {
      isDragging.value = false;
      document.removeEventListener('mousemove', onDrag);
      document.removeEventListener('mouseup', stopDragging);
    };

    onMounted(() => {
      window.addEventListener('resize', updateStageSize);
      updateStageSize();
      if (stage.value && stage.value.getNode) {
        const konvaStage = stage.value.getNode();
        mainLayer.value = new Konva.Layer();
        backgroundGroup.value = new Konva.Group();
        shapeGroup.value = new Konva.Group();
        annotationGroup.value = new Konva.Group();
        mainLayer.value.add(backgroundGroup.value, shapeGroup.value, annotationGroup.value);
        konvaStage.add(mainLayer.value);
      }
    });

    onUnmounted(() => {
      window.removeEventListener('resize', updateStageSize);
    });

    watchEffect(() => {
      if (stage.value && stage.value.getNode) {
        stage.value = stage.value.getNode();
      }
      if (mainLayer.value && mainLayer.value.getNode) {
        mainLayer.value = mainLayer.value.getNode();
      }
    });

    const handleMouseDown = (e) => {
      const pos = e.target.getStage().getPointerPosition();
      if (selectedPattern.value) {
        placePattern(pos);
      } else {
        startDrawingWall(pos);
        isDrawing.value = true;
      }
    };

    const handleMouseMove = (e) => {
      if (!isDrawing.value) return;
      const pos = e.target.getStage().getPointerPosition();
      if (currentLine.value) {
        const newPoints = currentLine.value.points().slice(0, 2).concat([pos.x, pos.y]);
        currentLine.value.points(newPoints);
        mainLayer.value.batchDraw();
      }
    };

    const handleMouseUp = () => {
      isDrawing.value = false;
      if (currentLine.value) {
        walls.value.push(currentLine.value);
        currentLine.value = null;
      }
    };

    const startDrawingWall = (pos) => {
      if (shapeGroup.value) {
        currentLine.value = new Konva.Line({
          points: [pos.x, pos.y, pos.x, pos.y],
          stroke: '#ffffff',
          strokeWidth: 2,
        });
        shapeGroup.value.add(currentLine.value);
        mainLayer.value.batchDraw();
      }
    };

    const placePattern = (pos) => {
      if (selectedPattern.value && shapeGroup.value) {
        const newPattern = new Konva.Rect({
          x: Math.round(pos.x / gridSize) * gridSize,
          y: Math.round(pos.y / gridSize) * gridSize,
          width: selectedPattern.value.width,
          height: selectedPattern.value.height,
          fill: selectedPattern.value.fill,
          draggable: true,
        });
        const konvaGroup = shapeGroup.value.getNode();
        konvaGroup.add(newPattern);
        patterns.value.push(newPattern);
        mainLayer.value.getNode().batchDraw();
      }
    };

    const handleDragMove = (e) => {
      const shape = e.target;
      const stepSize = 20; // Size of each grid cell
      const newX = Math.round(shape.x() / stepSize) * stepSize;
      const newY = Math.round(shape.y() / stepSize) * stepSize;
      shape.position({ x: newX, y: newY });
      mainLayer.value?.batchDraw();
    };

    const handleWheel = (e) => {
      if (!stage.value) return; // Add this line to check if stage.value exists

      e.evt.preventDefault();
      const scaleBy = 1.05;
      const oldScale = stage.value.scaleX();
      const pointer = stage.value.getPointerPosition();

      const mousePointTo = {
        x: (pointer.x - stage.value.x()) / oldScale,
        y: (pointer.y - stage.value.y()) / oldScale,
      };

      const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;

      stage.value.scale({ x: newScale, y: newScale });

      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };
      stage.value.position(newPos);
      stage.value.batchDraw();
    };

    const selectPattern = (pattern) => {
      selectedPattern.value = pattern;
    };

    const saveLayout = async () => {
      const layoutData = {
        walls: walls.value,
        patterns: patterns.value,
      };

      try {
        const response = await fetch('http://localhost:3030/save_layout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(layoutData),
        });
        if (response.ok) {
          console.log('Layout saved successfully');
        } else {
          console.error('Failed to save layout');
        }
      } catch (error) {
        console.error('Error saving layout:', error);
      }
    };

    const loadLayout = async () => {
      try {
        const response = await fetch('http://localhost:3030/load_layout');
        if (response.ok) {
          const layoutData = await response.json();
          walls.value = layoutData.walls;
          patterns.value = layoutData.patterns;
          mainLayer.value.batchDraw();
          console.log('Layout loaded successfully');
        } else {
          console.error('Failed to load layout');
        }
      } catch (error) {
        console.error('Error loading layout:', error);
      }
    };

    const invertColors = () => {
      isDarkMode.value = !isDarkMode.value;
      
      const invertLayer = (layer) => {
        layer.children.forEach((child) => {
          if (typeof child.fill === 'function') {
            const fill = child.fill();
            if (fill) {
              const rgb = Konva.Util.getRGB(fill);
              child.fill(`rgb(${255 - rgb.r}, ${255 - rgb.g}, ${255 - rgb.b})`);
            }
          }
          if (typeof child.stroke === 'function') {
            const stroke = child.stroke();
            if (stroke) {
              const rgb = Konva.Util.getRGB(stroke);
              child.stroke(`rgb(${255 - rgb.r}, ${255 - rgb.g}, ${255 - rgb.b})`);
            }
          }
        });
      };

      if (stage.value) {
        stage.value.children.forEach((child) => {
          if (child.getChildren) {
            invertLayer(child);
          }
        });
        stage.value.container().style.backgroundColor = isDarkMode.value ? '#2c2c2c' : '#ffffff';
        stage.value.batchDraw();
      }
    };

    const exportAsPNG = () => {
      if (stage.value) {
        const currentIsDarkMode = isDarkMode.value;
        
        // Temporarily switch to light mode if currently in dark mode
        if (currentIsDarkMode) {
          invertColors();
        }

        // Export the stage as a data URL
        const dataURL = stage.value.toDataURL({ pixelRatio: 2 });

        // Create a link element and trigger the download
        const link = document.createElement('a');
        link.download = 'floor-plan.png';
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Switch back to dark mode if it was in dark mode before
        if (currentIsDarkMode) {
          invertColors();
        }
      }
    };

    // Function to toggle dark mode (you can call this when user switches themes)
    const toggleDarkMode = () => {
      isDarkMode.value = !isDarkMode.value;
      if (stage.value) {
        stage.value.container().style.backgroundColor = isDarkMode.value ? '#2c2c2c' : '#ffffff';
      }
      // Force a re-render of the stage
      if (mainLayer.value) {
        mainLayer.value.batchDraw();
      }
    };

    const setPDFBackground = async (file) => {
      try {
        const { dataUrl, width, height } = await convertPDFToImage(file);
        const backgroundImage = new Image();
        backgroundImage.src = dataUrl;
        backgroundImage.onload = () => {
          if (stage.value && backgroundGroup.value) {
            const stageWidth = stage.value.width();
            const stageHeight = stage.value.height();
            const scale = Math.min(stageWidth / width, stageHeight / height);
            const x = (stageWidth - width * scale) / 2;
            const y = (stageHeight - height * scale) / 2;

            backgroundGroup.value.destroyChildren();
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(backgroundImage, 0, 0);
            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
              data[i] = 255 - data[i];     // red
              data[i + 1] = 255 - data[i + 1]; // green
              data[i + 2] = 255 - data[i + 2]; // blue
            }
            ctx.putImageData(imageData, 0, 0);

            const imageNode = new Konva.Image({
              x: x,
              y: y,
              image: canvas,
              width: width * scale,
              height: height * scale,
            });
            backgroundGroup.value.add(imageNode);
            backgroundGroup.value.batchDraw();

            // Enable dragging for the stage
            stage.value.draggable(true);

            console.log('PDF background set successfully');
          } else {
            console.error('Stage or backgroundGroup is not available');
          }
        };
      } catch (error) {
        console.error('Error setting PDF background:', error);
      }
    };

    // Make sure to expose the toggleColorInversion method
    defineExpose({ exportAsPNG, toggleDarkMode });

    watchEffect(() => {
      if (stage.value) {
        stage.value.container().style.backgroundColor = isDarkMode.value ? '#2c2c2c' : '#ffffff';
      }
    });

    const fileInput = ref(null);

    const openFileInput = () => {
      fileInput.value.click();
    };

    const handleFileSelect = (event) => {
      const file = event.target.files[0];
      if (file && file.type === 'application/pdf') {
        setPDFBackground(file);
      } else {
        alert('Please select a valid PDF file.');
      }
    };

    const toggleUIDarkMode = () => {
      // This will be handled by Vuetify's built-in dark mode
    };

    const toggleCanvasDarkMode = () => {
      if (stage.value) {
        stage.value.container().style.backgroundColor = isCanvasDarkMode.value ? '#2c2c2c' : '#ffffff';
      }
      // Force a re-render of the stage
      if (mainLayer.value) {
        mainLayer.value.batchDraw();
      }
    };

    // Update the return statement to include new methods and refs
    return {
      stageConfig,
      showSizeWarning,
      menuTop,
      menuLeft,
      materialsMenu,
      startDragging,
      walls,
      patterns,
      availablePatterns,
      handleMouseDown,
      handleMouseMove,
      handleMouseUp,
      handleDragMove,
      handleWheel,
      selectPattern,
      saveLayout,
      loadLayout,
      selectedPattern,
      gridLines,
      exportAsPNG,
      stage,
      toggleDarkMode,
      setPDFBackground,
      mainLayer,
      backgroundGroup,
      shapeGroup,
      annotationGroup,
      fileInput,
      openFileInput,
      handleFileSelect,
      isDarkMode,
      isCanvasDarkMode,
      toggleUIDarkMode,
      toggleCanvasDarkMode,
    };
  },
});
</script>

<style scoped>
:root {
  --bg-color: #ffffff;
  --text-color: #000000;
  --menu-bg-color: #f0f0f0;
  --button-bg-color: #4a4a4a;
  --button-text-color: #ffffff;
}

.dark-mode {
  --bg-color: #1e1e1e;
  --text-color: #ffffff;
  --menu-bg-color: #2c2c2c;
  --button-bg-color: #4a4a4a;
  --button-text-color: #ffffff;
}

.floor-plan-container {
  position: relative;
  width: 100%;
  height: calc(100vh - 60px);
  overflow: hidden;
  background-color: var(--bg-color);
  color: var(--text-color);
}

.materials-menu {
  position: absolute;
  background-color: var(--menu-bg-color);
  border: 1px solid #4a4a4a;
  padding: 10px;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
  z-index: 1000;
}

.menu-handle {
  cursor: move;
  padding: 5px;
  background-color: #3a3a3a;
  margin-bottom: 5px;
  text-align: center;
  font-weight: bold;
}

.size-warning {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(46, 46, 46, 0.9);
  padding: 20px;
  border-radius: 5px;
  text-align: center;
  z-index: 1001;
}

button {
  background-color: var(--button-bg-color);
  color: var(--button-text-color);
  border: none;
  padding: 5px 10px;
  margin: 5px;
  border-radius: 3px;
  cursor: pointer;
}

button:hover {
  background-color: #5a5a5a;
}

.materials-menu button {
  display: block;
  width: 100%;
  margin-bottom: 5px;
  padding: 5px;
  background-color: #4a4a4a;
  color: #ffffff;
  border: none;
  border-radius: 3px;
  cursor: pointer;
}

.materials-menu button.selected {
  background-color: #6a6a6a;
  font-weight: bold;
}

.materials-menu button:hover {
  background-color: #5a5a5a;
}

.controls {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
  z-index: 1000;
}

.controls button {
  padding: 10px 20px;
  font-size: 14px;
  background-color: var(--button-bg-color);
  color: var(--button-text-color);
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.controls button:hover {
  background-color: #5a5a5a;
}

.floor-plan-container {
  height: 100vh;
}

.canvas-container {
  height: calc(100vh - 112px); /* Adjust based on your app bar and bottom navigation heights */
  overflow: hidden;
}
</style>