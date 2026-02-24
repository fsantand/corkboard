<script setup>
import { computed, ref } from 'vue'

const MINIMAP_W = 200
const MINIMAP_H = 150
const CARD_H = 188
const ITEM_PAD = 80

const props = defineProps({
  items: { type: Array, required: true },
  connections: { type: Array, required: true },
  panX: { type: Number, required: true },
  panY: { type: Number, required: true },
  zoom: { type: Number, required: true },
  viewWidth: { type: Number, required: true },
  viewHeight: { type: Number, required: true },
})

const emit = defineEmits(['update-pan'])

const minimapEl = ref(null)
const isDragging = ref(false)

// World bounds based only on item positions — never changes due to panning/zooming
const worldBounds = computed(() => {
  if (props.items.length === 0) {
    return { minX: -100, minY: -100, w: 200, h: 200 }
  }
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const item of props.items) {
    const w = item.width ?? 200
    minX = Math.min(minX, item.x)
    minY = Math.min(minY, item.y)
    maxX = Math.max(maxX, item.x + w)
    maxY = Math.max(maxY, item.y + CARD_H)
  }
  return {
    minX: minX - ITEM_PAD,
    minY: minY - ITEM_PAD,
    w: maxX - minX + ITEM_PAD * 2,
    h: maxY - minY + ITEM_PAD * 2,
  }
})

// SVG viewBox maps world coords → fixed 200×150 pixels (may stretch, fine for a minimap)
const viewBox = computed(() => {
  const { minX, minY, w, h } = worldBounds.value
  return `${minX} ${minY} ${w} ${h}`
})

const itemMap = computed(() => {
  const m = {}
  for (const item of props.items) m[item.id] = item
  return m
})

const connLines = computed(() =>
  props.connections
    .filter((c) => itemMap.value[c.fromId] && itemMap.value[c.toId])
    .map((c) => {
      const a = itemMap.value[c.fromId]
      const b = itemMap.value[c.toId]
      return {
        id: c.id,
        x1: a.x + (a.width ?? 200) / 2,
        y1: a.y + 12,
        x2: b.x + (b.width ?? 200) / 2,
        y2: b.y + 12,
      }
    }),
)

const viewportRect = computed(() => ({
  x: -props.panX / props.zoom,
  y: -props.panY / props.zoom,
  w: props.viewWidth / props.zoom,
  h: props.viewHeight / props.zoom,
}))

// Convert minimap element px → world coords → emit pan
function panToMiniPos(mx, my) {
  const { minX, minY, w, h } = worldBounds.value
  const wx = minX + (mx / MINIMAP_W) * w
  const wy = minY + (my / MINIMAP_H) * h
  emit('update-pan', props.viewWidth / 2 - wx * props.zoom, props.viewHeight / 2 - wy * props.zoom)
}

function onPointerDown(e) {
  e.preventDefault()
  isDragging.value = true
  minimapEl.value.setPointerCapture(e.pointerId)
  const rect = minimapEl.value.getBoundingClientRect()
  panToMiniPos(e.clientX - rect.left, e.clientY - rect.top)
}

function onPointerMove(e) {
  if (!isDragging.value) return
  const rect = minimapEl.value.getBoundingClientRect()
  panToMiniPos(e.clientX - rect.left, e.clientY - rect.top)
}

function onPointerUp() {
  isDragging.value = false
}
</script>

<template>
  <div
    ref="minimapEl"
    class="minimap"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
  >
    <svg :width="MINIMAP_W" :height="MINIMAP_H" :viewBox="viewBox" preserveAspectRatio="none">
      <!-- Card rectangles (world coordinates, viewBox handles scaling) -->
      <rect
        v-for="item in items"
        :key="item.id"
        :x="item.x"
        :y="item.y"
        :width="item.width ?? 200"
        :height="CARD_H"
        fill="#f5f0e4"
        rx="2"
        opacity="0.85"
      />
      <!-- Connection lines -->
      <line
        v-for="line in connLines"
        :key="line.id"
        :x1="line.x1"
        :y1="line.y1"
        :x2="line.x2"
        :y2="line.y2"
        stroke="#c0392b"
        stroke-width="8"
        opacity="0.5"
      />
      <!-- Viewport indicator -->
      <rect
        :x="viewportRect.x"
        :y="viewportRect.y"
        :width="viewportRect.w"
        :height="viewportRect.h"
        fill="rgba(100, 160, 255, 0.15)"
        stroke="rgba(100, 160, 255, 0.85)"
        stroke-width="8"
      />
    </svg>
  </div>
</template>

<style scoped>
.minimap {
  position: fixed;
  bottom: 20px;
  left: 20px;
  width: 200px;
  height: 150px;
  background: rgba(20, 15, 10, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  z-index: 9000;
  cursor: crosshair;
  overflow: hidden;
  user-select: none;
}
</style>
