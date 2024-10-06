<template>
  <div ref="konvaContainer" class="konva-container"></div>
</template>

<script>
import { defineComponent, ref, onMounted, watch, onUnmounted } from 'vue'
import Konva from 'konva'
import { openDB } from 'idb'
import { convertPDFToImage } from '../utils/pdfUtils'

export default defineComponent({
  props: {
    fileId: String,
    selectedTool: String,
    selectedPattern: Object
  },
  emits: ['shapeSelected', 'shapeUpdated'],
  setup(props, { emit }) {
    const konvaContainer = ref(null)
    const stage = ref(null)
    const layer = ref(null)
    const backgroundGroup = ref(null)
    const shapes = ref([])
    const selectedShape = ref(null)
    let isDrawing = false
    let newShape = null
    const lastClickTime = ref(0)
    const doubleClickDelay = 300 // milliseconds
    const startPoint = ref(null)

    const getRelativePointerPosition = () => {
      const pos = stage.value.getPointerPosition();
      return {
        x: (pos.x - stage.value.x()) / stage.value.scaleX(),
        y: (pos.y - stage.value.y()) / stage.value.scaleY()
      };
    };

    const initKonva = () => {
      const container = konvaContainer.value;
      stage.value = new Konva.Stage({
        container: container,
        width: container.offsetWidth,
        height: container.offsetHeight,
        scaleX: 1,
        scaleY: 1
      });
      layer.value = new Konva.Layer()
      backgroundGroup.value = new Konva.Group()
      layer.value.add(backgroundGroup.value)
      stage.value.add(layer.value)

      // Log stage dimensions
      console.log('Stage dimensions:', stage.value.width(), stage.value.height())
    }

    const loadPDFBackground = async () => {
      try {
        const db = await openDB('PDFStorage', 1)
        const pdfFile = await db.get('pdfs', props.fileId)
        if (pdfFile) {
          const imageDataUrl = await convertPDFToImage(pdfFile)
          const image = new Image()
          image.onload = () => {
            const backgroundImage = new Konva.Image({
              image: image,
              width: stage.value.width(),
              height: stage.value.height(),
            })
            backgroundGroup.value.destroyChildren()
            backgroundGroup.value.add(backgroundImage)
            layer.value.batchDraw()
          }
          image.src = imageDataUrl
        }
      } catch (error) {
        console.error('Error loading PDF background:', error)
      }
    }

    const createShape = (type, config) => {
      let shape;
      if (type === 'rectangle') {
        shape = new Konva.Rect({
          ...config,
          draggable: true
        });
      } else if (type === 'polygon') {
        shape = new Konva.Line({
          points: [config.x, config.y, config.x, config.y],
          closed: true,
          fill: props.selectedPattern.fill,
          stroke: 'black',
          strokeWidth: 2,
          draggable: false
        });
      }

      shape.on('click', () => selectShape(shape))
      shape.on('dragstart', () => {
        if (props.selectedTool === 'cursor') {
          selectShape(shape)
        }
      })
      shape.on('dragend', () => {
        if (props.selectedTool === 'cursor') {
          emit('shapeUpdated', shape)
        }
      })

      shapes.value.push(shape)
      layer.value.add(shape)
      layer.value.batchDraw()

      return shape
    }

    const selectShape = (shape) => {
      if (selectedShape.value) {
        selectedShape.value.stroke(null);
        selectedShape.value.strokeWidth(0);
      }
      selectedShape.value = shape;
      shape.stroke('blue');
      shape.strokeWidth(2);
      layer.value.batchDraw();
      emit('shapeSelected', shape);
    };

    const deselectShape = () => {
      if (selectedShape.value) {
        selectedShape.value.stroke(null);
        selectedShape.value.strokeWidth(0);
        selectedShape.value = null;
        layer.value.batchDraw();
        emit('shapeSelected', null);
      }
    };

    const finishPolygon = () => {
      if (props.selectedTool === 'polygon' && newShape) {
        console.log('Finishing polygon');
        const points = newShape.points().slice(0, -2);
        newShape.points(points);
        newShape.closed(true);
        newShape.draggable(true);
        isDrawing = false;
        selectShape(newShape);
        newShape = null;
        layer.value.batchDraw();
      }
    };

    const handleStageClick = () => {
      const currentTime = new Date().getTime();
      const timeSinceLastClick = currentTime - lastClickTime.value;

      if (timeSinceLastClick < doubleClickDelay) {
        console.log('Double click detected');
        finishPolygon();
      } else {
        const pos = getRelativePointerPosition();
        console.log('Single click at:', pos);

        if (props.selectedTool === 'polygon') {
          if (!isDrawing) {
            isDrawing = true;
            newShape = createShape('polygon', {
              x: pos.x,
              y: pos.y,
            });
          } else {
            const points = newShape.points();
            points.splice(points.length - 2, 0, pos.x, pos.y);
            newShape.points(points);
            layer.value.batchDraw();
          }
        } else if (props.selectedTool === 'rectangle') {
          if (!isDrawing) {
            isDrawing = true;
            startPoint.value = pos;
          }
        } else if (props.selectedTool === 'cursor') {
          if (stage.value.getIntersection(pos)) {
            // If clicked on a shape, select it
            const clickedShape = stage.value.getIntersection(pos).getParent();
            selectShape(clickedShape);
          } else {
            // If clicked on empty space, deselect
            deselectShape();
          }
        }
      }

      lastClickTime.value = currentTime;
    };

    const handleStageMouseMove = () => {
      if (!isDrawing) return;

      const pos = getRelativePointerPosition();
      if (props.selectedTool === 'rectangle' && startPoint.value) {
        if (!newShape) {
          newShape = createShape('rectangle', {
            x: startPoint.value.x,
            y: startPoint.value.y,
            width: 0,
            height: 0,
            fill: props.selectedPattern.fill,
          });
        }
        newShape.width(pos.x - startPoint.value.x);
        newShape.height(pos.y - startPoint.value.y);
        layer.value.batchDraw();
      } else if (props.selectedTool === 'polygon') {
        const points = newShape.points();
        points[points.length - 2] = pos.x;
        points[points.length - 1] = pos.y;
        newShape.points(points);
      }
      layer.value.batchDraw();
    };

    const handleStageMouseUp = () => {
      if (isDrawing && props.selectedTool === 'rectangle') {
        isDrawing = false;
        startPoint.value = null;
        if (newShape) {
          newShape.draggable(true);
          selectShape(newShape);
          newShape = null;
        }
      }
    };

    const handleWheel = (e) => {
      e.evt.preventDefault()
      const scaleBy = 1.1
      const oldScale = stage.value.scaleX()

      const pointer = stage.value.getPointerPosition()
      const mousePointTo = {
        x: (pointer.x - stage.value.x()) / oldScale,
        y: (pointer.y - stage.value.y()) / oldScale,
      }

      const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy

      stage.value.scale({ x: newScale, y: newScale })

      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      }
      stage.value.position(newPos)
      stage.value.batchDraw()
    }

    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        stage.value.container().style.cursor = 'grab'
        stage.value.draggable(true)
      }
    }

    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        stage.value.container().style.cursor = 'default'
        stage.value.draggable(false)
      }
    }

    const handleResize = () => {
      if (stage.value) {
        const container = konvaContainer.value
        stage.value.width(container.offsetWidth)
        stage.value.height(container.offsetHeight)
        stage.value.draw()
      }
    }

    onMounted(() => {
      initKonva()
      if (props.fileId) {
        loadPDFBackground()
      }
      stage.value.on('mousedown touchstart', handleStageClick)
      stage.value.on('mousemove touchmove', handleStageMouseMove)
      stage.value.on('mouseup touchend', handleStageMouseUp)
      stage.value.on('wheel', handleWheel)
      window.addEventListener('keydown', handleKeyDown)
      window.addEventListener('keyup', handleKeyUp)
      window.addEventListener('resize', handleResize)
    })

    onUnmounted(() => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('resize', handleResize)
    })

    watch(() => props.fileId, (newFileId) => {
      if (newFileId) {
        loadPDFBackground()
      }
    })

    return {
      konvaContainer,
      // ... other returned values
    }
  }
})
</script>

<style scoped>
.konva-container {
  width: 100%;
  height: 100vh; /* or a specific height */
}
</style>