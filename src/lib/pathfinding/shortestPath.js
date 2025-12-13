export const dijkstraPath = (graph, startNode, endNode) => {
  if (!graph || !startNode || !endNode) return null
  if (!graph[startNode] || !graph[endNode]) return null
  if (startNode === endNode) return [startNode]

  const distances = new Map()
  const previous = new Map()
  const visited = new Set()

  Object.keys(graph).forEach((node) => {
    distances.set(node, Number.POSITIVE_INFINITY)
  })
  distances.set(startNode, 0)

  const pickClosestUnvisited = () => {
    let bestNode = null
    let bestDist = Number.POSITIVE_INFINITY
    for (const [node, dist] of distances.entries()) {
      if (visited.has(node)) continue
      if (dist < bestDist) {
        bestDist = dist
        bestNode = node
      }
    }
    return bestNode
  }

  while (true) {
    const current = pickClosestUnvisited()
    if (!current) break
    if (current === endNode) break

    visited.add(current)

    const neighbors = graph[current] || {}
    const currentDist = distances.get(current)
    if (!Number.isFinite(currentDist)) continue

    for (const [neighbor, weight] of Object.entries(neighbors)) {
      if (visited.has(neighbor)) continue
      const w = Number(weight)
      if (!Number.isFinite(w)) continue

      const candidate = currentDist + w
      if (candidate < (distances.get(neighbor) ?? Number.POSITIVE_INFINITY)) {
        distances.set(neighbor, candidate)
        previous.set(neighbor, current)
      }
    }
  }

  if (!Number.isFinite(distances.get(endNode))) return null

  const path = []
  let cur = endNode
  while (cur) {
    path.push(cur)
    if (cur === startNode) break
    cur = previous.get(cur)
  }

  if (path[path.length - 1] !== startNode) return null
  path.reverse()
  return path
}

export const pathNodesToRouteObjects = (pathNodes, routeMap) => {
  if (!Array.isArray(pathNodes) || pathNodes.length < 2) return []
  if (!routeMap || typeof routeMap !== 'object') return []

  const routes = []
  for (let i = 0; i < pathNodes.length - 1; i += 1) {
    const a = pathNodes[i]
    const b = pathNodes[i + 1]
    const key = `${a}|${b}`
    const reverseKey = `${b}|${a}`
    const routeName = routeMap[key] || routeMap[reverseKey]
    if (routeName) routes.push(routeName)
  }
  return routes
}
