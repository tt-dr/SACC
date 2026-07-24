import type { PenNode } from '../types/pen'

export function cloneDeep<T>(value: T): T {
  if (value === undefined || value === null || typeof value !== 'object') {
    return value
  }

  return JSON.parse(JSON.stringify(value))
}

export function traversePenTree(node: PenNode | null | undefined, visitor: (node: PenNode) => void): void {
  if (!node || typeof node !== 'object') {
    return
  }

  visitor(node)

  if (Array.isArray(node.children)) {
    node.children.forEach((child) => traversePenTree(child, visitor))
  }
}

export function findPenNode(
  node: PenNode | null | undefined,
  predicate: (candidate: PenNode) => boolean,
): PenNode | null {
  let matchedNode: PenNode | null = null

  traversePenTree(node, (currentNode) => {
    if (!matchedNode && predicate(currentNode)) {
      matchedNode = currentNode
    }
  })

  return matchedNode
}

export function findPenNodeById(node: PenNode | null | undefined, id: string): PenNode | null {
  if (!id) {
    return null
  }

  return findPenNode(node, (currentNode) => currentNode.id === id)
}

export function findPenNodeByName(node: PenNode | null | undefined, name: string): PenNode | null {
  if (!name) {
    return null
  }

  return findPenNode(node, (currentNode) => currentNode.name === name)
}

export function getTextChildren(node: PenNode | null | undefined): PenNode[] {
  if (!node || !Array.isArray(node.children)) {
    return []
  }

  return node.children.filter((child) => child?.type === 'text')
}
