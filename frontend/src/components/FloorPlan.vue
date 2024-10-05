<template>
  <div ref="konvaContainer" class="konva-container" tabindex="0" @keydown="handleKeyDown" @keyup="handleKeyUp"></div>
</template>

<script>
import { defineComponent, ref, onMounted, watch } from 'vue'
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
  setup(props) {
    const konvaContainer = ref(null)
    const stage = ref(null)
    const layer = ref(null)
    const backgroundGroup = ref(null)
    let isDrawing = false
    let startPoint = null
    let currentShape = null
    let isPanning = false

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

      stage.value.on('mousedown touchstart', handleMouseDown)
      stage.value.on('mousemove touchmove', handleMouseMove)
      stage.value.on('mouseup touchend', handleMouseUp)
      stage.value.on('dblclick', handleDblClick)  // Add double-click event listener
    }

    const handleMouseDown = (e) => {
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

    const handleMouseMove = (e) => {
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

    const handleMouseUp = (e) => {
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

    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        isPanning = true
        stage.value.draggable(true)
      }
    }

    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        isPanning = false
        stage.value.draggable(false)
      }
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

    onMounted(() => {
      initKonva()
      if (props.fileId) {
        loadPDFBackground()
      }
      konvaContainer.value.focus()  // Set focus to enable key events
    })

    watch(() => props.fileId, (newFileId) => {
      if (newFileId) {
        loadPDFBackground()
      }
    })

    return {
      konvaContainer,
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
  outline: none;  /* Remove focus outline */
}
</style>