<template>
  <div ref="konvaContainer" class="konva-container" tabindex="0" @keydown="handleKeyDown" @keyup="handleKeyUp"></div>
</template>

<script>
import { defineComponent, ref, onMounted, watch, onUnmounted } from 'vue'
import Konva from 'konva'
import { openDB } from 'idb'
import { convertPDFToImage } from '../utils/pdfUtils'

export default defineComponent({
  name: 'FloorPlan',
  props: {
    fileId: {
      type: String,
      required: true,
      default: ''
    },
    selectedTool: {
      type: String,
      default: ''
    },
    selectedPattern: {
      type: Object,
      default: () => ({ name: 'Default', fill: '#cccccc' })
    }
  },
  setup(props, { emit }) {
    const konvaContainer = ref(null)
    const stage = ref(null)
    const layer = ref(null)
    const backgroundGroup = ref(null)
    let isDrawing = false
    let startPoint = null
    let currentShape = null
    let isPanning = false
    const shapes = ref([])
    const selectedShape = ref(null)

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

      // Enable zoom
      const scaleBy = 1.1
      stage.value.on('wheel', (e) => {
        e.evt.preventDefault()
        const oldScale = stage.value.scaleX()
        const pointer = stage.value.getPointerPosition()
        const mousePointTo = {
          x: (pointer.x - stage.value.x()) / oldScale,
          y: (pointer.y - stage.value.y()) / oldScale,
        }
        const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy
        stage.value.scale({ x: newScale, y: newScale })
        const newPos = {
          x: pointer.x - mousePointTo.x * newScale,
          y: pointer.y - mousePointTo.y * newScale,
        }
        stage.value.position(newPos)
        stage.value.batchDraw()
      })

      stage.value.on('mousedown touchstart', handleStageMouseDown)
      stage.value.on('mousemove touchmove', handleStageMouseMove)
      stage.value.on('mouseup touchend', handleStageMouseUp)
      stage.value.on('dblclick', handleDblClick)  // Add double-click event listener
      stage.value.on('click tap', handleStageClick)
    }

    const handleStageMouseDown = (e) => {
      if (props.selectedTool === 'cursor') {
        // If in cursor mode, handle selection
        const clickedOnEmpty = e.target === stage.value
        if (clickedOnEmpty) {
          deselectShape()
        } else {
          const shape = e.target
          selectShape(shape)
        }
      } else {
        // If not in cursor mode, start drawing
        startDrawing(e)
      }
    }

    const handleStageMouseMove = (e) => {
      if (props.selectedTool !== 'cursor' && isDrawing) {
        draw(e)
      }
    }

    const handleStageMouseUp = (e) => {
      if (props.selectedTool !== 'cursor') {
        endDrawing(e)
      }
    }

    const startDrawing = (e) => {
      if (isPanning) {
        stage.value.draggable(true)
        return
      }

      if (props.selectedTool === '') return
      
      // Prevent default behavior for touch events
      if (e.evt.type.startsWith('touch')) {
        e.evt.preventDefault()
      }

      const pos = stage.value.getRelativePointerPosition()

      if (props.selectedTool === 'rectangle') {
        isDrawing = true
        startPoint = pos
        currentShape = new Konva.Rect({
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0,
          fill: props.selectedPattern.fill,
          stroke: 'black',
          strokeWidth: 2,
        })
        layer.value.add(currentShape)
      } else if (props.selectedTool === 'polygon') {
        if (!currentShape) {
          isDrawing = true
          currentShape = new Konva.Line({
            points: [pos.x, pos.y],
            fill: props.selectedPattern.fill,
            stroke: 'black',
            strokeWidth: 2,
            closed: true,
          })
          layer.value.add(currentShape)
        } else {
          const points = currentShape.points()
          points.push(pos.x)
          points.push(pos.y)
          currentShape.points(points)
        }
      }
      layer.value.batchDraw()
    }

    const draw = (e) => {
      if (!isDrawing || isPanning) return

      // Prevent default behavior for touch events
      if (e.evt.type.startsWith('touch')) {
        e.evt.preventDefault()
      }

      const pos = stage.value.getRelativePointerPosition()

      if (props.selectedTool === 'rectangle') {
        const width = pos.x - startPoint.x
        const height = pos.y - startPoint.y
        currentShape.width(width)
        currentShape.height(height)
      } else if (props.selectedTool === 'polygon') {
        const points = currentShape.points()
        points[points.length - 2] = pos.x
        points[points.length - 1] = pos.y
        currentShape.points(points)
      }
      layer.value.batchDraw()
    }

    const endDrawing = (e) => {
      if (isPanning) {
        stage.value.draggable(false)
        return
      }

      if (props.selectedTool === 'rectangle') {
        isDrawing = false
        currentShape = null
      } else if (props.selectedTool === 'polygon') {
        if (e.evt.button === 2 || (e.evt.button === 0 && e.evt.ctrlKey)) {  // Right-click or Ctrl+Click
          isDrawing = false
          currentShape = null
        }
      }
    }

    const handleDblClick = (e) => {
      if (props.selectedTool === 'polygon' && currentShape) {
        // Prevent default behavior
        e.evt.preventDefault()

        // Get the position of the double-click
        const pos = stage.value.getRelativePointerPosition()

        // Remove the last point (which is the same as the first point in a double-click)
        const points = currentShape.points().slice(0, -2)

        // Add the double-click position as the last point before closing
        points.push(pos.x, pos.y)

        currentShape.points(points)
        
        // Close the polygon
        currentShape.closed(true)
        layer.value.batchDraw()

        // Reset drawing state
        isDrawing = false
        currentShape = null

        // Optionally, you can emit an event or call a function to notify that a polygon has been completed
        // For example: emit('polygonCompleted', currentShape)
      }
    }

    const handleStageClick = (e) => {
      if (e.target === stage.value) {
        // Clicked on empty area, deselect
        deselectShape()
      }
    }

    const createShape = (type, config) => {
      let shape
      if (type === 'rectangle') {
        shape = new Konva.Rect({
          ...config,
          draggable: true // Make the shape draggable
        })
      } else if (type === 'polygon') {
        shape = new Konva.Line({
          ...config,
          closed: true,
          draggable: true // Make the shape draggable
        })
      }

      shape.on('click tap', () => selectShape(shape))
      
      // Add dragmove and dragend event listeners
      shape.on('dragmove', () => {
        emit('shapeUpdated', shape)
      })
      
      shape.on('dragend', () => {
        emit('shapeUpdated', shape)
        detectMaterialTransitions() // Recalculate material transitions after dragging
      })

      shapes.value.push(shape)
      layer.value.add(shape)
      layer.value.draw()
    }

    const selectShape = (shape) => {
      deselectShape()
      selectedShape.value = shape
      shape.stroke('blue')
      shape.strokeWidth(2)
      layer.value.draw()
      emit('shapeSelected', shape)
    }

    const deselectShape = () => {
      if (selectedShape.value) {
        selectedShape.value.stroke(null)
        selectedShape.value.strokeWidth(0)
        selectedShape.value = null
        layer.value.draw()
        emit('shapeSelected', null)
      }
    }

    const updateSelectedShape = (updates) => {
      if (selectedShape.value) {
        selectedShape.value.setAttrs(updates)
        layer.value.draw()
      }
    }

    const detectMaterialTransitions = () => {
      // Implement collision detection between shapes
      // This is a simplified version, you might need a more robust algorithm
      for (let i = 0; i < shapes.value.length; i++) {
        for (let j = i + 1; j < shapes.value.length; j++) {
          if (shapes.value[i].getAttr('material') !== shapes.value[j].getAttr('material')) {
            const intersection = Konva.Util.haveIntersection(
              shapes.value[i].getClientRect(),
              shapes.value[j].getClientRect()
            )
            if (intersection) {
              addTransitionIcon(intersection)
            }
          }
        }
      }
    }

    const addTransitionIcon = (position) => {
      const icon = new Konva.Star({
        x: position.x,
        y: position.y,
        numPoints: 5,
        innerRadius: 10,
        outerRadius: 20,
        fill: 'yellow',
        stroke: 'black',
        strokeWidth: 2
      })
      layer.value.add(icon)
      layer.value.draw()
    }

    const loadPDFBackground = async () => {
      if (!props.fileId) {
        console.warn('No fileId provided')
        return
      }

      try {
        const db = await openDB('PDFStorage', 1)
        const file = await db.get('pdfs', props.fileId)
        if (file) {
          const { dataUrl, width, height } = await convertPDFToImage(file)
          const backgroundImage = new Image()
          backgroundImage.onload = () => {
            const imageNode = new Konva.Image({
              image: backgroundImage,
              width: width,
              height: height,
            })
            backgroundGroup.value.add(imageNode)
            layer.value.batchDraw()
          }
          backgroundImage.src = dataUrl
        } else {
          console.warn(`No PDF found for fileId: ${props.fileId}`)
        }
      } catch (error) {
        console.error('Error loading PDF:', error)
      }
    }

    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        isPanning = true
        if (stage.value) {
          stage.value.container().style.cursor = 'grab'
          stage.value.draggable(true)
        }
      }
    }

    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        isPanning = false
        if (stage.value) {
          stage.value.container().style.cursor = 'default'
          stage.value.draggable(false)
        }
      }
    }

    onMounted(() => {
      initKonva()
      if (props.fileId) {
        loadPDFBackground()
      }
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
      konvaContainer,
      handleStageMouseDown,
      handleStageMouseMove,
      handleStageMouseUp,
      createShape,
      updateSelectedShape,
      detectMaterialTransitions,
      handleKeyDown,
      handleKeyUp
    }
  }
})
</script>

<style scoped>
.konva-container {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}
</style>