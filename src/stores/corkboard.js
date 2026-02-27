import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { DEFAULT_CATEGORIES } from '@/constants/categories'

const STORAGE_KEY = 'corkboard-state'

export const useCorkboardStore = defineStore('corkboard', () => {
  const items = ref([])
  const connections = ref([])
  const connectMode = ref(false)
  const connectFrom = ref(null)
  const categories = ref([])
  const background = ref({ type: 'cork', color: '#c8a96e', imageUrl: null, brightness: 0.5 })
  let zCounter = 0

  // Bootstrap from localStorage
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      items.value = (parsed.items ?? []).map((i) => ({
        id: i.id,
        x: i.x,
        y: i.y,
        rotation: i.rotation,
        zIndex: i.zIndex,
        title: i.title ?? '',
        description: i.description ?? '',
        photoSrc: i.photoSrc ?? null,
        width: i.width ?? 200,
        category: i.category ?? null,
      }))
      connections.value = parsed.connections ?? []
      zCounter = Math.max(0, ...items.value.map((i) => i.zIndex ?? 0))
      categories.value = parsed.categories
        ? parsed.categories.map((c) => ({ ...c }))
        : DEFAULT_CATEGORIES.map((c) => ({ ...c }))
      Object.assign(background.value, parsed.background ?? {})
    } catch {
      // ignore corrupt data
      categories.value = DEFAULT_CATEGORIES.map((c) => ({ ...c }))
    }
  } else {
    categories.value = DEFAULT_CATEGORIES.map((c) => ({ ...c }))
  }

  // Persist on every change
  watch(
    [items, connections, categories, background],
    () => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            items: items.value,
            connections: connections.value,
            categories: categories.value,
            background: background.value,
          }),
        )
      } catch (e) {
        console.warn('corkboard: localStorage quota exceeded', e)
      }
    },
    { deep: true },
  )

  function _randomRotation() {
    return Math.round((Math.random() * 16 - 8) * 10) / 10
  }

  function _spawnPosition() {
    return {
      x: 200 + Math.random() * 400,
      y: 100 + Math.random() * 300,
    }
  }

  function addItem(x, y) {
    const pos = x !== undefined && y !== undefined ? { x, y } : _spawnPosition()
    const id = crypto.randomUUID()
    items.value.push({
      id,
      x: pos.x,
      y: pos.y,
      rotation: _randomRotation(),
      zIndex: ++zCounter,
      title: '',
      description: '',
      photoSrc: null,
      width: 200,
      category: null,
    })
    return id
  }

  function updateItem(id, fields) {
    const item = items.value.find((i) => i.id === id)
    if (item) Object.assign(item, fields)
  }

  function moveItem(id, x, y) {
    const item = items.value.find((i) => i.id === id)
    if (item) {
      item.x = x
      item.y = y
      item.zIndex = ++zCounter
    }
  }

  function deleteItem(id) {
    items.value = items.value.filter((i) => i.id !== id)
    connections.value = connections.value.filter((c) => c.fromId !== id && c.toId !== id)
  }

  function startConnect(itemId) {
    connectMode.value = true
    connectFrom.value = itemId
  }

  function finishConnect(itemId) {
    if (connectFrom.value && connectFrom.value !== itemId) {
      const exists = connections.value.some(
        (c) =>
          (c.fromId === connectFrom.value && c.toId === itemId) ||
          (c.fromId === itemId && c.toId === connectFrom.value),
      )
      if (!exists) {
        connections.value.push({
          id: crypto.randomUUID(),
          fromId: connectFrom.value,
          toId: itemId,
        })
      }
    }
    cancelConnect()
  }

  function cancelConnect() {
    connectMode.value = false
    connectFrom.value = null
  }

  function removeConnection(id) {
    connections.value = connections.value.filter((c) => c.id !== id)
  }

  function addCategory() {
    const id = crypto.randomUUID()
    categories.value.push({
      id,
      label: '',
      colorPrimary: '#aaaaaa',
      colorSecondary: '#666666',
      icon: '🏷️',
    })
    return id
  }

  function updateCategory(id, fields) {
    const cat = categories.value.find((c) => c.id === id)
    if (cat) Object.assign(cat, fields)
  }

  function deleteCategory(id) {
    categories.value = categories.value.filter((c) => c.id !== id)
  }

  function setBackground(fields) {
    Object.assign(background.value, fields)
  }

  function importBoard(data) {
    items.value = (data.items ?? []).map((i) => ({
      id: i.id,
      x: i.x,
      y: i.y,
      rotation: i.rotation,
      zIndex: i.zIndex,
      title: i.title ?? '',
      description: i.description ?? '',
      photoSrc: i.photoSrc ?? null,
      width: i.width ?? 200,
      category: i.category ?? null,
    }))
    connections.value = data.connections ?? []
    zCounter = Math.max(0, ...items.value.map((i) => i.zIndex ?? 0))
    if (data.categories) categories.value = data.categories.map((c) => ({ ...c }))
    if (data.background) Object.assign(background.value, data.background)
  }

  return {
    items,
    connections,
    connectMode,
    connectFrom,
    categories,
    background,
    addItem,
    updateItem,
    moveItem,
    deleteItem,
    startConnect,
    finishConnect,
    cancelConnect,
    removeConnection,
    addCategory,
    updateCategory,
    deleteCategory,
    setBackground,
    importBoard,
  }
})
