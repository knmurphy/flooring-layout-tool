<template>
  <div id="container">
    <v-stage ref="stage" :config="stageConfig">
      <v-layer ref="layer">
        <v-rect
          v-for="(rect, index) in rectangles"
          :key="index"
          :config="rect"
          @dragmove="handleDragMove"
        />
      </v-layer>
    </v-stage>
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue';
import { Stage, Layer, Rect } from 'vue-konva';

export default defineComponent({
  name: 'FloorPlan',
  components: {
    'v-stage': Stage,
    'v-layer': Layer,
    'v-rect': Rect,
  },
  setup() {
    const stageConfig = ref({
      width: window.innerWidth - 100,
      height: window.innerHeight - 100,
    });

    const rectangles = ref([
      {
        x: 100,
        y: 100,
        width: 150,
        height: 100,
        fill: 'red',
        draggable: true,
      },
    ]);

    const handleDragMove = (e) => {
      const shape = e.target;
      console.log(`Dragged to x: ${shape.x()}, y: ${shape.y()}`);
    };

    return {
      stageConfig,
      rectangles,
      handleDragMove,
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
</style>
