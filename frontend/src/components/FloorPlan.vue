<template>
  <div ref="konvaContainer" class="konva-container" tabindex="0"></div>
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

    const getRelativePointerPosition = (node) => {
      const transform = node.getAbsoluteTransform().copy()
      transform.invert()
      const pos = node.getStage().getPointerPosition()
      return transform.point(pos)
    }

    const initKonva = () => {
      stage.value = new Konva.Stage({
        container: konvaContainer.value,
        width: konvaContainer.value.offsetWidth,
        height: konvaContainer.value.offsetHeight,
      })
      layer.value = new Konva.Layer()
      backgroundGroup.value = new Konva.Group()
      layer.value.add(backgroundGroup.value)
      stage.value.add(layer.value)
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
      let shape
      if (type === 'rectangle') {
        shape = new Konva.Rect({
          ...config,
          draggable: true
        })
      } else if (type === 'polygon') {
        shape = new Konva.Line({
          ...config,
          points: [],
          closed: false,
          draggable: false
        })
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
        selectedShape.value.stroke(null)
        selectedShape.value.strokeWidth(0)
      }
      selectedShape.value = shape
      shape.stroke('blue')
      shape.strokeWidth(2)
      layer.value.batchDraw()
      emit('shapeSelected', shape)
    }

    const deselectShape = () => {
      if (selectedShape.value) {
        selectedShape.value.stroke(null)
        selectedShape.value.strokeWidth(0)
        selectedShape.value = null
        layer.value.batchDraw()
        emit('shapeSelected', null)
      }
    }

    const handleStageMouseDown = (e) => {
      const pos = getRelativePointerPosition(stage.value)
      if (props.selectedTool === 'cursor') {
        if (e.target === stage.value) {
          deselectShape()
        }
      } else if (props.selectedTool === 'rectangle') {
        isDrawing = true
        newShape = createShape('rectangle', {
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0,
          fill: props.selectedPattern.fill,
        })
      } else if (props.selectedTool === 'polygon') {
        if (!newShape) {
          newShape = createShape('polygon', {
            points: [pos.x, pos.y],
            fill: props.selectedPattern.fill,
            stroke: 'black',
            strokeWidth: 2,
          })
          isDrawing = true
        } else {
          const points = newShape.points()
          points.push(pos.x, pos.y)
          newShape.points(points)
          layer.value.batchDraw()
        }
      }
    }

    const handleStageMouseMove = () => {
      if (!isDrawing || !newShape) return

      const pos = getRelativePointerPosition(stage.value)
      if (props.selectedTool === 'rectangle') {
        newShape.width(pos.x - newShape.x())
        newShape.height(pos.y - newShape.y())
      } else if (props.selectedTool === 'polygon') {
        const points = newShape.points()
        points[points.length - 2] = pos.x
        points[points.length - 1] = pos.y
        newShape.points(points)
      }
      layer.value.batchDraw()
    }

    const handleStageMouseUp = () => {
      if (isDrawing && props.selectedTool === 'rectangle') {
        isDrawing = false
        newShape = null
      }
    }

    const handleStageDoubleClick = () => {
      if (props.selectedTool === 'polygon' && newShape) {
        newShape.closed(true)
        newShape.draggable(true)
        isDrawing = false
        newShape = null
        layer.value.batchDraw()
      }
    }

    // Zoom and pan functions
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

    onMounted(() => {
      initKonva()
      if (props.fileId) {
        loadPDFBackground()
      }
      stage.value.on('mousedown touchstart', handleStageMouseDown)
      stage.value.on('mousemove touchmove', handleStageMouseMove)
      stage.value.on('mouseup touchend', handleStageMouseUp)
      stage.value.on('dblclick', handleStageDoubleClick)
      stage.value.on('wheel', handleWheel)
      window.addEventListener('keydown', handleKeyDown)
      window.addEventListener('keyup', handleKeyUp)
    })

    onUnmounted(() => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    })

    watch(() => props.fileId, (newFileId) => {
      if (newFileId) {
        loadPDFBackground()
      }
    })

    return {
      konvaContainer
    }
  }
})
</script>

<style scoped>
.konva-container {
  width: 100%;
  height: 100%;
  outline: none;
}
</style>