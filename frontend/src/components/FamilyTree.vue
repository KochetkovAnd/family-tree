<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { VueFlow, useVueFlow, MarkerType, type Edge, type Node } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { getTree, resetDb } from '../api'
import { layoutTree, type EdgeKind } from '../composables/useTreeLayout'
import PersonNode from './PersonNode.vue'
import UnionNode from './UnionNode.vue'
import PersonEditModal from './PersonEditModal.vue'

const { fitView } = useVueFlow()

const nodes = ref<Node[]>([])
const edges = ref<Edge[]>([])
const loading = ref(true)
const openPersonId = ref<string | null>(null)
const creatingNew = ref(false)

const edgeStyle: Record<EdgeKind, { stroke: string; dash?: string; arrow?: boolean }> = {
  'parent-union': { stroke: '#3b6ea5' },
  'union-child': { stroke: '#3b6ea5', arrow: true },
  spouse: { stroke: '#b5548a' },
  sibling: { stroke: '#9aa3af', dash: '3 4' },
}

async function loadTree() {
  loading.value = true
  const graph = await getTree()
  const laidOut = layoutTree(graph)

  const personNodes = laidOut.nodes.map((n) => ({
    id: n.id,
    type: 'person',
    position: n.position,
    data: n.data,
    draggable: true,
  }))
  const unionNodes = laidOut.unions.map((u) => ({
    id: u.id,
    type: 'union',
    position: u.position,
    data: {},
    draggable: false,
    selectable: false,
  }))
  nodes.value = [...personNodes, ...unionNodes] as unknown as Node[]

  edges.value = laidOut.edges.map((e) => {
    const style = edgeStyle[e.kind]
    return {
      id: e.id,
      source: e.source,
      target: e.target,
      // parent-union is a plain diagonal from each parent's side straight
      // into the union dot — no right-angle bends. union-child still uses
      // smoothstep since it's the one that has to fan out to several
      // children with clean corners.
      type: e.kind === 'union-child' || e.kind === 'sibling' ? 'smoothstep' : 'straight',
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      zIndex: e.kind === 'spouse' ? 1 : 0,
      markerEnd: style.arrow ? MarkerType.ArrowClosed : undefined,
      style: { stroke: style.stroke, strokeDasharray: style.dash, strokeWidth: 2 },
    }
  }) as unknown as Edge[]

  loading.value = false
}

onMounted(async () => {
  await loadTree()
  requestAnimationFrame(() => fitView({ padding: 0.2 }))
})

function onNodeClick(event: { node: Node }) {
  if (event.node.type !== 'person') return
  openPersonId.value = event.node.id
}

function openCreate() {
  creatingNew.value = true
}

async function onModalClosed(shouldRefresh: boolean) {
  openPersonId.value = null
  creatingNew.value = false
  if (shouldRefresh) await loadTree()
}

async function onReset() {
  if (!confirm('Стереть все изменения и вернуть демо-данные по умолчанию?')) return
  resetDb()
  await loadTree()
  requestAnimationFrame(() => fitView({ padding: 0.2 }))
}

const activeModalPersonId = computed(() => openPersonId.value)
</script>

<template>
  <div class="tree-page">
    <header class="toolbar">
      <h1>Семейное дерево</h1>
      <div class="toolbar-actions">
        <button class="btn" @click="openCreate">+ Новый человек</button>
        <button class="btn btn-ghost" @click="onReset">Сбросить демо-данные</button>
      </div>
    </header>

    <div class="canvas">
      <VueFlow
        v-if="!loading"
        v-model:nodes="nodes"
        v-model:edges="edges"
        :nodes-connectable="false"
        :edges-updatable="false"
        :min-zoom="0.15"
        :max-zoom="2.5"
        @node-click="onNodeClick"
      >
        <template #node-person="props">
          <PersonNode :data="props.data" :selected="props.selected" />
        </template>
        <template #node-union>
          <UnionNode />
        </template>
        <Background :gap="24" />
        <Controls />
      </VueFlow>
      <div v-else class="loading">Загрузка дерева…</div>
    </div>

    <PersonEditModal
      v-if="activeModalPersonId || creatingNew"
      :person-id="activeModalPersonId"
      @close="onModalClosed"
    />
  </div>
</template>

<style scoped>
.tree-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-bottom: 1px solid #e3e6ea;
  background: #fff;
  z-index: 5;
}
.toolbar h1 {
  font-size: 18px;
  margin: 0;
}
.toolbar-actions {
  display: flex;
  gap: 8px;
}
.canvas {
  flex: 1;
  position: relative;
  background: #f7f8fa;
}
.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6b7280;
}
</style>
