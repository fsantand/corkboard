<script setup>
import { computed } from 'vue'

const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
  connections: {
    type: Array,
    required: true,
  },
  connectMode: {
    type: Boolean,
    default: false,
  },
  connectFrom: {
    type: String,
    default: null,
  },
  pointerPos: {
    type: Object,
    default: () => ({ x: 0, y: 0 }),
  },
  hoveredItemId: {
    type: String,
    default: null,
  },
})

function pinCenter(item) {
  return {
    x: item.x + (item.width ?? 200) / 2,
    y: item.y + 12,
  }
}

function stringPath(A, B) {
  const dx = B.x - A.x
  const dy = B.y - A.y
  const dist = Math.hypot(dx, dy)
  const sag = Math.min(dist * 0.4, 120)
  return (
    `M ${A.x} ${A.y} C ` +
    `${A.x + dx * 0.25} ${A.y + dy * 0.25 + sag}, ` +
    `${A.x + dx * 0.75} ${A.y + dy * 0.75 + sag}, ` +
    `${B.x} ${B.y}`
  )
}

const itemMap = computed(() => {
  const m = {}
  for (const item of props.items) m[item.id] = item
  return m
})

const svgPaths = computed(() => {
  return props.connections
    .filter((c) => itemMap.value[c.fromId] && itemMap.value[c.toId])
    .map((c) => ({
      id: c.id,
      d: stringPath(pinCenter(itemMap.value[c.fromId]), pinCenter(itemMap.value[c.toId])),
      dimmed:
        !!props.hoveredItemId &&
        c.fromId !== props.hoveredItemId &&
        c.toId !== props.hoveredItemId,
    }))
})

const previewPath = computed(() => {
  if (!props.connectMode || !props.connectFrom) return null
  const fromItem = itemMap.value[props.connectFrom]
  if (!fromItem) return null
  return stringPath(pinCenter(fromItem), props.pointerPos)
})
</script>

<template>
  <svg class="string-layer" xmlns="http://www.w3.org/2000/svg">
    <path
      v-for="p in svgPaths"
      :key="p.id"
      :d="p.d"
      :class="{ 'string-path': true, dimmed: p.dimmed }"
      stroke="#c0392b"
      stroke-width="2"
      fill="none"
      stroke-linecap="round"
    />
    <path
      v-if="previewPath"
      :d="previewPath"
      stroke="#c0392b"
      stroke-width="1.5"
      stroke-dasharray="6 4"
      fill="none"
      stroke-linecap="round"
      opacity="0.65"
    />
  </svg>
</template>

<style scoped>
.string-path {
  transition: opacity 0.2s;
}

.string-path.dimmed {
  opacity: 0.1;
}

.string-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1000;
}
</style>
