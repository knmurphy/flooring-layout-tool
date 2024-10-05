<template>
  <div class="floor-plan-container">
    <div class="materials-menu" :style="{ top: menuTop + 'px', left: menuLeft + 'px' }" ref="materialsMenu">
      <div class="menu-handle" @mousedown="startDragging">Materials</div>
      <button v-for="pattern in availablePatterns" :key="pattern.name" @click="selectPattern(pattern)">
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
      <v-layer ref="floorLayer">
        <v-line
          v-for="(wall, index) in walls"
          :key="`wall-${index}`"
          :config="wall"
        />
      </v-layer>
      <v-layer ref="patternLayer">
        <v-rect
          v-for="(pattern, index) in patterns"
          :key="`pattern-${index}`"
          :config="pattern"
          @dragmove="handleDragMove"
        />
      </v-layer>
    </v-stage>
    <div v-if="showSizeWarning" class="size-warning">
      For the best experience, please use a larger screen size.
    </div>
    <button @click="saveLayout">Save Layout</button>
    <button @click="loadLayout">Load Layout</button>
  </div>
</template>

<script>
import { defineComponent, ref, watchEffect, onMounted, onUnmounted } from 'vue'
import { Stage, Layer, Rect, Line } from 'vue-konva'

export default defineComponent({
  name: 'FloorPlan',
  components: {
    VStage: Stage,
    VLayer: Layer,
    VRect: Rect,
    VLine: Line,
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

    const updateStageSize = () => {
      stageConfig.value.width = window.innerWidth;
      stageConfig.value.height = window.innerHeight - 100;
      showSizeWarning.value = window.innerWidth < 768; // Show warning for screens smaller than 768px
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
        floorLayer.value?.batchDraw();
      }
    };

    const handleMouseUp = () => {
      isDrawing.value = false;
    };

    const startDrawingWall = (pos) => {
      isDrawing.value = true;
      currentLine.value = {
        points: [pos.x, pos.y, pos.x, pos.y],
        stroke: 'black',
        strokeWidth: 2,
      };
      walls.value.push(currentLine.value);
    };

    const placePattern = (pos) => {
      if (selectedPattern.value) {
        const newPattern = {
          ...selectedPattern.value,
          x: Math.round(pos.x / 20) * 20,
          y: Math.round(pos.y / 20) * 20,
          draggable: true,
        };
        patterns.value.push(newPattern);
        patternLayer.value?.batchDraw();
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
    };
  },
});
</script>

<style scoped>
.floor-plan-container {
  position: relative;
  width: 100%;
  height: calc(100vh - 60px); /* Subtract header height */
  overflow: hidden;
}

.materials-menu {
  position: absolute;
  background-color: white;
  border: 1px solid #ccc;
  padding: 10px;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.menu-handle {
  cursor: move;
  padding: 5px;
  background-color: #f0f0f0;
  margin-bottom: 5px;
  text-align: center;
  font-weight: bold;
}

.size-warning {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(255, 255, 255, 0.9);
  padding: 20px;
  border-radius: 5px;
  text-align: center;
  z-index: 1001;
}

#container {
  border: 1px solid #ccc;
  width: 100%;
  height: 100%;
}

.pattern-selector {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  flex-direction: column;
}

.pattern-selector button {
  margin-bottom: 5px;
  padding: 5px 10px;
}

button.active {
  background-color: #4CAF50;
  color: white;
}
</style>