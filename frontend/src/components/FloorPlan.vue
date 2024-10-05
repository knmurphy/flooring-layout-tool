<template>
  <div id="container">
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
    <div class="controls">
      <div class="pattern-selector">
        <button 
          v-for="(pattern, index) in availablePatterns" 
          :key="index" 
          @click="selectPattern(pattern)"
          :class="{ active: selectedPattern && selectedPattern.name === pattern.name }"
        >
          {{ pattern.name }}
        </button>
      </div>
      <button @click="clearSelection">Clear Selection</button>
      <button @click="saveLayout">Save Layout</button>
      <button @click="loadLayout">Load Layout</button>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, watchEffect } from 'vue'
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
      width: window.innerWidth - 100,
      height: window.innerHeight - 100,
    });

    const walls = ref([]);
    const patterns = ref([]);
    const isDrawing = ref(false);
    const currentLine = ref(null);
    const selectedPattern = ref(null);

    const stage = ref(null);
    const floorLayer = ref(null);
    const patternLayer = ref(null);

    const availablePatterns = ref([
      { name: 'Hardwood', fill: '#8B4513', width: 50, height: 50 },
      { name: 'Tile', fill: '#D3D3D3', width: 40, height: 40 },
      { name: 'Carpet', fill: '#DEB887', width: 60, height: 60 },
      { name: 'Laminate', fill: '#A0522D', width: 45, height: 45 },
      { name: 'Vinyl', fill: '#708090', width: 55, height: 55 },
    ]);

    watchEffect(() => {
      if (stage.value && floorLayer.value && patternLayer.value) {
        stage.value = stage.value.getNode();
        floorLayer.value = floorLayer.value.getNode();
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