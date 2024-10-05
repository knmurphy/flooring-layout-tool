<template>
  <div class="floor-plan-container dark-mode">
    <div class="materials-menu" :style="{ top: menuTop + 'px', left: menuLeft + 'px' }" ref="materialsMenu">
      <div class="menu-handle" @mousedown="startDragging">Materials</div>
      <button 
        v-for="pattern in availablePatterns" 
        :key="pattern.name" 
        @click="selectPattern(pattern)"
        :class="{ 'selected': selectedPattern === pattern }"
      >
        {{ pattern.name }}
      </button>
    </div>
    <v-stage
      ref="stage"
      :config="stageConfig"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @wheel="handleWheel"
    >
      <v-layer ref="gridLayer">
        <v-line
          v-for="line in gridLines"
          :key="line.id"
          :config="line"
        />
      </v-layer>
      <v-layer ref="floorLayer">
        <v-line
          v-for="(wall, index) in walls"
          :key="'wall-' + index"
          :config="wall"
        />
      </v-layer>
      <v-layer ref="patternLayer">
        <v-rect
          v-for="(pattern, index) in patterns"
          :key="'pattern-' + index"
          :config="pattern"
        />
      </v-layer>
    </v-stage>
    <div v-if="showSizeWarning" class="size-warning">
      For the best experience, please use a larger screen size.
    </div>
    <button @click="saveLayout">Save Layout</button>
    <button @click="loadLayout">Load Layout</button>
    <button @click="exportAsPNG">Export as PNG</button>
  </div>
</template>

<script>
import { defineComponent, ref, watchEffect, onMounted, onUnmounted, computed } from 'vue'
import { Stage, Layer, Line, Rect } from 'vue-konva'

export default defineComponent({
  name: 'FloorPlan',
  components: {
    VStage: Stage,
    VLayer: Layer,
    VLine: Line,
    VRect: Rect,
  },
  setup() {
    const stageConfig = ref({
      width: window.innerWidth,
      height: window.innerHeight - 100, // Subtract space for the header
    });
    const showSizeWarning = ref(false);
    const menuTop = ref(60); // Initial top position below the header
    const menuLeft = ref(10);
    const isDrawing = ref(false);
    const currentLine = ref(null);
    const selectedPattern = ref(null);
    const isDragging = ref(false);

    const stage = ref(null);
    const floorLayer = ref(null);
    const patternLayer = ref(null);
    const materialsMenu = ref(null);

    const walls = ref([]);
    const patterns = ref([]);
    const availablePatterns = ref([
      { name: 'Hardwood', fill: '#8B4513', width: 50, height: 50 },
      { name: 'Tile', fill: '#D3D3D3', width: 40, height: 40 },
      { name: 'Carpet', fill: '#DEB887', width: 60, height: 60 },
      { name: 'Laminate', fill: '#A0522D', width: 45, height: 45 },
      { name: 'Vinyl', fill: '#708090', width: 55, height: 55 },
    ]);

    const gridSize = 20; // Size of each grid cell
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
      if (gridLayer.value) {
        gridLayer.value.batchDraw();
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
    });

    onUnmounted(() => {
      window.removeEventListener('resize', updateStageSize);
    });

    watchEffect(() => {
      if (stage.value) {
        stage.value = stage.value.getNode();
      }
      if (floorLayer.value) {
        floorLayer.value = floorLayer.value.getNode();
      }
      if (patternLayer.value) {
        patternLayer.value = patternLayer.value.getNode();
      }
    });

    const handleMouseDown = (e) => {
      const pos = e.target.getStage().getPointerPosition();
      if (selectedPattern.value) {
        placePattern(pos);
      } else {
        startDrawingWall(pos);
      }
    };

    const handleMouseMove = (e) => {
      if (!isDrawing.value) return;
      const pos = e.target.getStage().getPointerPosition();
      if (currentLine.value) {
        currentLine.value.points = currentLine.value.points.slice(0, 2).concat([pos.x, pos.y]);
      }
    };

    const handleMouseUp = () => {
      isDrawing.value = false;
    };

    const startDrawingWall = (pos) => {
      isDrawing.value = true;
      currentLine.value = {
        points: [pos.x, pos.y, pos.x, pos.y],
        stroke: '#ffffff', // White color for visibility on dark background
        strokeWidth: 2,
      };
      walls.value.push(currentLine.value);
    };

    const placePattern = (pos) => {
      if (selectedPattern.value) {
        const newPattern = {
          ...selectedPattern.value,
          x: Math.round(pos.x / gridSize) * gridSize,
          y: Math.round(pos.y / gridSize) * gridSize,
          draggable: true,
        };
        patterns.value.push(newPattern);
      }
    };

    const handleDragMove = (e) => {
      const shape = e.target;
      const stepSize = 20; // Size of each grid cell
      const newX = Math.round(shape.x() / stepSize) * stepSize;
      const newY = Math.round(shape.y() / stepSize) * stepSize;
      shape.position({ x: newX, y: newY });
      patternLayer.value?.batchDraw();
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
          floorLayer.value.batchDraw();
          patternLayer.value.batchDraw();
          console.log('Layout loaded successfully');
        } else {
          console.error('Failed to load layout');
        }
      } catch (error) {
        console.error('Error loading layout:', error);
      }
    };

    const exportAsPNG = () => {
      if (stage.value) {
        // Temporarily change stage background to white
        const originalBg = stage.value.container().style.backgroundColor;
        stage.value.container().style.backgroundColor = 'white';

        // Invert colors of all shapes
        invertColors(true);

        // Create a data URL of the stage
        const dataURL = stage.value.toDataURL();

        // Revert stage background and shape colors
        stage.value.container().style.backgroundColor = originalBg;
        invertColors(false);

        // Create a link element and trigger download
        const link = document.createElement('a');
        link.download = 'floor-plan.png';
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };

    const invertColors = (invert) => {
      const invertLayer = (layer) => {
        layer.children.forEach((shape) => {
          if (shape.attrs.stroke) {
            shape.attrs.stroke = invert ? invertColor(shape.attrs.stroke) : invertColor(shape.attrs.stroke);
          }
          if (shape.attrs.fill) {
            shape.attrs.fill = invert ? invertColor(shape.attrs.fill) : invertColor(shape.attrs.fill);
          }
        });
      };

      invertLayer(floorLayer.value);
      invertLayer(patternLayer.value);
      stage.value.batchDraw();
    };

    const invertColor = (color) => {
      // Simple color inversion logic - you might need a more sophisticated approach
      if (color.startsWith('#')) {
        color = color.slice(1);
        const invertedColor = (Number(`0x${color}`) ^ 0xffffff).toString(16).padStart(6, '0');
        return `#${invertedColor}`;
      }
      return color;
    };

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
    };
  },
});
</script>

<style scoped>
.floor-plan-container {
  position: relative;
  width: 100%;
  height: calc(100vh - 60px);
  overflow: hidden;
}

.floor-plan-container.dark-mode {
  background-color: #1e1e1e;
  color: #ffffff;
}

.materials-menu {
  position: absolute;
  background-color: #2c2c2c;
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
  background-color: #4a4a4a;
  color: #ffffff;
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
</style>