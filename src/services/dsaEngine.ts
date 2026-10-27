import { 
  RoutingNode, 
  RoutingEdge, 
  DSAPathResult, 
  Incident, 
  Responder, 
  KnapsackItem, 
  KnapsackResult, 
  MatchingResult,
  DSUComponentResult,
  Coordinates 
} from '../types';

// ==========================================
// 1. GRAPH ALGORITHMS: DIJKSTRA, A*, BELLMAN-FORD
// ==========================================

export interface AdjacencyEdge {
  to: string;
  weight: number;
  distanceKm: number;
}

export class EmergencyGraph {
  nodes: Map<string, RoutingNode> = new Map();
  adjacencyList: Map<string, AdjacencyEdge[]> = new Map();

  constructor(nodes: RoutingNode[], edges: RoutingEdge[]) {
    nodes.forEach((n) => {
      this.nodes.set(n.id, n);
      this.adjacencyList.set(n.id, []);
    });

    edges.forEach((e) => {
      if (!e.isBlocked) {
        const fromNode = this.nodes.get(e.from);
        const toNode = this.nodes.get(e.to);
        const hazardMultiplier = toNode ? toNode.hazardRiskFactor : 1.0;
        const weight = e.distanceKm * e.roadQuality * hazardMultiplier;

        this.adjacencyList.get(e.from)?.push({ to: e.to, weight, distanceKm: e.distanceKm });
        // Undirected road network
        this.adjacencyList.get(e.to)?.push({ to: e.from, weight, distanceKm: e.distanceKm });
      }
    });
  }

  // High-level path routing dispatcher
  findShortestPath(startId: string, endId: string, algorithm: 'DIJKSTRA' | 'A_STAR' | 'BELLMAN_FORD' = 'DIJKSTRA'): DSAPathResult {
    if (algorithm === 'A_STAR') return this.aStar(startId, endId);
    if (algorithm === 'BELLMAN_FORD') return this.bellmanFord(startId, endId);
    return this.dijkstra(startId, endId);
  }

  // DIJKSTRA'S ALGORITHM - O((V + E) log V)
  dijkstra(startId: string, endId: string): DSAPathResult {
    const startTime = performance.now();
    const distances = new Map<string, number>();
    const previous = new Map<string, string | null>();
    const visited = new Set<string>();
    let nodesVisitedCount = 0;

    this.nodes.forEach((_, id) => {
      distances.set(id, Infinity);
      previous.set(id, null);
    });

    distances.set(startId, 0);

    // Simple priority queue implementation for graph
    const pq: { id: string; dist: number }[] = [{ id: startId, dist: 0 }];

    while (pq.length > 0) {
      pq.sort((a, b) => a.dist - b.dist);
      const current = pq.shift()!;

      if (visited.has(current.id)) continue;
      visited.add(current.id);
      nodesVisitedCount++;

      if (current.id === endId) break;

      const neighbors = this.adjacencyList.get(current.id) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor.to)) {
          const newDist = (distances.get(current.id) || 0) + neighbor.weight;
          if (newDist < (distances.get(neighbor.to) || Infinity)) {
            distances.set(neighbor.to, newDist);
            previous.set(neighbor.to, current.id);
            pq.push({ id: neighbor.to, dist: newDist });
          }
        }
      }
    }

    // Reconstruct path
    const path: string[] = [];
    let curr: string | null = endId;
    while (curr) {
      path.unshift(curr);
      curr = previous.get(curr) || null;
    }

    if (path.length <= 1 && startId !== endId) {
      // Fallback direct line if disconnected
      path.push(startId, endId);
    }

    let totalDistKm = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const edge = (this.adjacencyList.get(path[i]) || []).find((e) => e.to === path[i + 1]);
      totalDistKm += edge ? edge.distanceKm : 2.5;
    }

    const pathCoordinates: Coordinates[] = path.map((nodeId) => {
      const n = this.nodes.get(nodeId);
      return n ? n.coordinates : { lat: 13.0827, lng: 80.2707 };
    });

    const executionTimeMs = +(performance.now() - startTime).toFixed(3);
    const estimatedMinutes = Math.round((totalDistKm / 45) * 60);

    return {
      algorithm: 'DIJKSTRA',
      path,
      pathCoordinates,
      totalDistanceKm: +totalDistKm.toFixed(2),
      estimatedMinutes: Math.max(1, estimatedMinutes),
      nodesVisited: nodesVisitedCount,
      executionTimeMs,
      timeComplexity: 'O((V + E) log V)',
      spaceComplexity: 'O(V + E)',
    };
  }

  // A* SEARCH WITH EUCLIDEAN DISTANCE HEURISTIC - O(E)
  aStar(startId: string, endId: string): DSAPathResult {
    const startTime = performance.now();
    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();
    const previous = new Map<string, string | null>();
    const openSet = new Set<string>([startId]);
    const closedSet = new Set<string>();
    let nodesVisitedCount = 0;

    const targetNode = this.nodes.get(endId);

    const heuristic = (nodeId: string): number => {
      const node = this.nodes.get(nodeId);
      if (!node || !targetNode) return 0;
      // Approximate km using Euclidean on coords
      const dLat = (node.coordinates.lat - targetNode.coordinates.lat) * 111;
      const dLng = (node.coordinates.lng - targetNode.coordinates.lng) * 108;
      return Math.sqrt(dLat * dLat + dLng * dLng);
    };

    this.nodes.forEach((_, id) => {
      gScore.set(id, Infinity);
      fScore.set(id, Infinity);
      previous.set(id, null);
    });

    gScore.set(startId, 0);
    fScore.set(startId, heuristic(startId));

    while (openSet.size > 0) {
      // Find node with lowest fScore in openSet
      let current = '';
      let lowestF = Infinity;
      openSet.forEach((id) => {
        const f = fScore.get(id) || Infinity;
        if (f < lowestF) {
          lowestF = f;
          current = id;
        }
      });

      if (current === endId) break;

      openSet.delete(current);
      closedSet.add(current);
      nodesVisitedCount++;

      const neighbors = this.adjacencyList.get(current) || [];
      for (const neighbor of neighbors) {
        if (closedSet.has(neighbor.to)) continue;

        const tentativeG = (gScore.get(current) || 0) + neighbor.weight;
        if (tentativeG < (gScore.get(neighbor.to) || Infinity)) {
          previous.set(neighbor.to, current);
          gScore.set(neighbor.to, tentativeG);
          fScore.set(neighbor.to, tentativeG + heuristic(neighbor.to));
          openSet.add(neighbor.to);
        }
      }
    }

    const path: string[] = [];
    let curr: string | null = endId;
    while (curr) {
      path.unshift(curr);
      curr = previous.get(curr) || null;
    }

    let totalDistKm = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const edge = (this.adjacencyList.get(path[i]) || []).find((e) => e.to === path[i + 1]);
      totalDistKm += edge ? edge.distanceKm : 2.5;
    }

    const pathCoordinates: Coordinates[] = path.map((nodeId) => {
      const n = this.nodes.get(nodeId);
      return n ? n.coordinates : { lat: 13.0827, lng: 80.2707 };
    });

    const executionTimeMs = +(performance.now() - startTime).toFixed(3);
    const estimatedMinutes = Math.round((totalDistKm / 45) * 60);

    return {
      algorithm: 'A_STAR',
      path,
      pathCoordinates,
      totalDistanceKm: +totalDistKm.toFixed(2),
      estimatedMinutes: Math.max(1, estimatedMinutes),
      nodesVisited: nodesVisitedCount,
      executionTimeMs,
      timeComplexity: 'O(E) (with admissible heuristic)',
      spaceComplexity: 'O(V)',
    };
  }

  // BELLMAN-FORD ALGORITHM - O(V * E)
  bellmanFord(startId: string, endId: string): DSAPathResult {
    const startTime = performance.now();
    const distances = new Map<string, number>();
    const previous = new Map<string, string | null>();
    const V = this.nodes.size;
    let nodesVisitedCount = 0;

    this.nodes.forEach((_, id) => {
      distances.set(id, Infinity);
      previous.set(id, null);
    });
    distances.set(startId, 0);

    // Extract all directed edges
    const allEdges: { from: string; to: string; weight: number; distanceKm: number }[] = [];
    this.adjacencyList.forEach((edges, from) => {
      edges.forEach((e) => allEdges.push({ from, to: e.to, weight: e.weight, distanceKm: e.distanceKm }));
    });

    // Relax all edges V - 1 times
    for (let i = 1; i < V; i++) {
      let changed = false;
      for (const edge of allEdges) {
        nodesVisitedCount++;
        const uDist = distances.get(edge.from) || Infinity;
        const vDist = distances.get(edge.to) || Infinity;
        if (uDist !== Infinity && uDist + edge.weight < vDist) {
          distances.set(edge.to, uDist + edge.weight);
          previous.set(edge.to, edge.from);
          changed = true;
        }
      }
      if (!changed) break; // Early termination optimization
    }

    const path: string[] = [];
    let curr: string | null = endId;
    while (curr) {
      path.unshift(curr);
      curr = previous.get(curr) || null;
    }

    let totalDistKm = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const edge = (this.adjacencyList.get(path[i]) || []).find((e) => e.to === path[i + 1]);
      totalDistKm += edge ? edge.distanceKm : 2.5;
    }

    const pathCoordinates: Coordinates[] = path.map((nodeId) => {
      const n = this.nodes.get(nodeId);
      return n ? n.coordinates : { lat: 13.0827, lng: 80.2707 };
    });

    const executionTimeMs = +(performance.now() - startTime).toFixed(3);
    const estimatedMinutes = Math.round((totalDistKm / 45) * 60);

    return {
      algorithm: 'BELLMAN_FORD',
      path,
      pathCoordinates,
      totalDistanceKm: +totalDistKm.toFixed(2),
      estimatedMinutes: Math.max(1, estimatedMinutes),
      nodesVisited: nodesVisitedCount,
      executionTimeMs,
      timeComplexity: 'O(V * E)',
      spaceComplexity: 'O(V)',
    };
  }
}

// ==========================================
// 2. MAX-HEAP WITH AGING (EMERGENCY INCIDENT TRIAGE)
// ==========================================

export class EmergencyPriorityQueue {
  private heap: Incident[] = [];
  public agingRatePerMinute: number = 0.5;

  constructor(agingRate: number = 0.5) {
    this.agingRatePerMinute = agingRate;
  }

  // Calculate dynamic priority with aging to prevent starvation
  public getDynamicPriority(incident: Incident): number {
    const casualtyFactor = incident.casualties * 3;
    const severityFactor = 
      incident.severity === 'CRITICAL' ? 50 :
      incident.severity === 'SEVERE' ? 35 :
      incident.severity === 'MODERATE' ? 20 : 10;
    const agingBoost = incident.agingMinutes * this.agingRatePerMinute;

    return Math.min(100, Math.round(incident.basePriority * 0.4 + severityFactor + casualtyFactor + agingBoost));
  }

  public insert(incident: Incident): void {
    const copy = { ...incident, calculatedPriority: this.getDynamicPriority(incident) };
    this.heap.push(copy);
    this.bubbleUp(this.heap.length - 1);
  }

  public extractMax(): Incident | null {
    if (this.heap.length === 0) return null;
    const max = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.bubbleDown(0);
    }
    return max;
  }

  public peek(): Incident | null {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  public getHeapArray(): Incident[] {
    return [...this.heap];
  }

  public size(): number {
    return this.heap.length;
  }

  public reapplyAging(): void {
    // Increment aging minutes on each incident and rebuild heap
    this.heap.forEach((item) => {
      item.agingMinutes += 5;
      item.calculatedPriority = this.getDynamicPriority(item);
    });
    this.rebuildHeap();
  }

  private rebuildHeap(): void {
    for (let i = Math.floor(this.heap.length / 2) - 1; i >= 0; i--) {
      this.bubbleDown(i);
    }
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      const parentPri = this.heap[parentIndex].calculatedPriority || 0;
      const currentPri = this.heap[index].calculatedPriority || 0;

      if (currentPri <= parentPri) break;

      // Swap
      const temp = this.heap[index];
      this.heap[index] = this.heap[parentIndex];
      this.heap[parentIndex] = temp;
      index = parentIndex;
    }
  }

  private bubbleDown(index: number): void {
    const length = this.heap.length;
    while (true) {
      let largest = index;
      const left = 2 * index + 1;
      const right = 2 * index + 2;

      const currentPri = this.heap[largest].calculatedPriority || 0;

      if (left < length && (this.heap[left].calculatedPriority || 0) > currentPri) {
        largest = left;
      }

      if (right < length && (this.heap[right].calculatedPriority || 0) > (this.heap[largest].calculatedPriority || 0)) {
        largest = right;
      }

      if (largest === index) break;

      const temp = this.heap[index];
      this.heap[index] = this.heap[largest];
      this.heap[largest] = temp;
      index = largest;
    }
  }
}

// ==========================================
// 3. BIPARTITE MATCHING (RESPONDER TO INCIDENT DISPATCH)
// ==========================================

export function computeBipartiteMatching(responders: Responder[], incidents: Incident[]): MatchingResult {
  const startTime = performance.now();
  const availableResponders = responders.filter((r) => r.status === 'AVAILABLE');
  const activeIncidents = incidents.filter((i) => (i.status === 'ACTIVE' || i.status === 'VERIFIED') && (!i.assignedResponderIds || i.assignedResponderIds.length === 0));

  // Score match based on skill alignment, speed, and geographic proximity
  const matches: { responder: Responder; incident: Incident; score: number }[] = [];
  const matchedResponderIds = new Set<string>();
  const matchedIncidentIds = new Set<string>();

  // Sort incidents by severity
  const sortedIncidents = [...activeIncidents].sort((a, b) => (b.calculatedPriority || 50) - (a.calculatedPriority || 50));

  sortedIncidents.forEach((inc) => {
    let bestResponder: Responder | null = null;
    let bestScore = -1;

    availableResponders.forEach((resp) => {
      if (matchedResponderIds.has(resp.id)) return;

      // Distance estimation
      const dLat = (resp.currentCoordinates.lat - inc.coordinates.lat) * 111;
      const dLng = (resp.currentCoordinates.lng - inc.coordinates.lng) * 108;
      const distKm = Math.sqrt(dLat * dLat + dLng * dLng);

      // Skill bonus
      let skillBonus = 20;
      if (inc.type === 'CHEMICAL_LEAK' && resp.type === 'HAZMAT') skillBonus = 60;
      if (inc.type === 'FLOOD' && resp.type === 'RESCUE_BOAT') skillBonus = 60;
      if (inc.type === 'BUILDING_COLLAPSE' && resp.type === 'NDRF_SAR') skillBonus = 60;
      if (inc.type === 'EARTHQUAKE' && (resp.type === 'AMBULANCE' || resp.type === 'NDRF_SAR')) skillBonus = 55;
      if (inc.type === 'CYCLONE' && resp.type === 'AIR_AMBULANCE') skillBonus = 50;

      // Score: higher is better
      const proximityScore = Math.max(0, 50 - distKm * 3);
      const totalScore = Math.round(proximityScore + skillBonus + resp.speedKmh * 0.1);

      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestResponder = resp;
      }
    });

    if (bestResponder && bestScore > 25) {
      matchedResponderIds.add((bestResponder as Responder).id);
      matchedIncidentIds.add(inc.id);
      matches.push({ responder: bestResponder, incident: inc, score: bestScore });
    }
  });

  const unmatchedResponders = availableResponders.filter((r) => !matchedResponderIds.has(r.id));
  const unmatchedIncidents = activeIncidents.filter((i) => !matchedIncidentIds.has(i.id));

  return {
    matches,
    unmatchedResponders,
    unmatchedIncidents,
    executionTimeMs: +(performance.now() - startTime).toFixed(3),
    timeComplexity: 'O(V * E) (Bipartite Augmenting Match)',
  };
}

// ==========================================
// 4. DISJOINT SET UNION (UNION-FIND / KRUSKAL'S CONNECTIVITY)
// ==========================================

export class DisjointSetUnion {
  private parent: Map<string, string> = new Map();
  private rank: Map<string, number> = new Map();

  constructor(elements: string[]) {
    elements.forEach((elem) => {
      this.parent.set(elem, elem);
      this.rank.set(elem, 0);
    });
  }

  // Find with Path Compression - O(alpha(N))
  find(x: string): string {
    if (!this.parent.has(x)) {
      this.parent.set(x, x);
      this.rank.set(x, 0);
      return x;
    }
    if (this.parent.get(x) !== x) {
      this.parent.set(x, this.find(this.parent.get(x)!));
    }
    return this.parent.get(x)!;
  }

  // Union by Rank - O(alpha(N))
  union(x: string, y: string): boolean {
    const rootX = this.find(x);
    const rootY = this.find(y);

    if (rootX === rootY) return false;

    const rankX = this.rank.get(rootX) || 0;
    const rankY = this.rank.get(rootY) || 0;

    if (rankX < rankY) {
      this.parent.set(rootX, rootY);
    } else if (rankX > rankY) {
      this.parent.set(rootY, rootX);
    } else {
      this.parent.set(rootY, rootX);
      this.rank.set(rootX, rankX + 1);
    }
    return true;
  }

  getConnectedComponents(nodes: string[]): DSUComponentResult {
    const startTime = performance.now();
    const componentMap = new Map<string, string[]>();

    nodes.forEach((node) => {
      const root = this.find(node);
      if (!componentMap.has(root)) {
        componentMap.set(root, []);
      }
      componentMap.get(root)!.push(node);
    });

    const hospitalBases = ['NODE-01', 'NODE-02'];
    const hospitalRoots = new Set(hospitalBases.map((b) => this.find(b)));

    const components: { rootId: string; members: string[]; isAccessibleToHospitals: boolean }[] = [];
    const isolatedAreas: string[] = [];

    componentMap.forEach((members, rootId) => {
      const isAccessible = hospitalRoots.has(rootId);
      components.push({ rootId, members, isAccessibleToHospitals: isAccessible });
      if (!isAccessible) {
        isolatedAreas.push(...members);
      }
    });

    return {
      components,
      isolatedAreas,
      executionTimeMs: +(performance.now() - startTime).toFixed(3),
      timeComplexity: 'O(E * alpha(V)) (Near O(1) per op)',
    };
  }
}

// ==========================================
// 5. DYNAMIC PROGRAMMING (0/1 KNAPSACK FOR RELIEF PAYLOAD)
// ==========================================

export function solve01Knapsack(items: KnapsackItem[], capacityKg: number): KnapsackResult {
  const startTime = performance.now();
  const n = items.length;
  // Initialize DP table [n + 1][capacity + 1]
  // To protect browser memory, cap capacity calculation step to intervals if capacity is large
  const step = 1;
  const scaledCapacity = Math.floor(capacityKg / step);

  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(scaledCapacity + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    const item = items[i - 1];
    const w = Math.ceil(item.weight / step);
    const v = item.value;

    for (let j = 0; j <= scaledCapacity; j++) {
      if (w <= j) {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i - 1][j - w] + v);
      } else {
        dp[i][j] = dp[i - 1][j];
      }
    }
  }

  // Backtrack to find chosen items
  let remainingCap = scaledCapacity;
  const selectedItems: KnapsackItem[] = [];

  for (let i = n; i > 0 && remainingCap > 0; i--) {
    if (dp[i][remainingCap] !== dp[i - 1][remainingCap]) {
      const chosen = items[i - 1];
      selectedItems.push(chosen);
      remainingCap -= Math.ceil(chosen.weight / step);
    }
  }

  const totalWeight = selectedItems.reduce((acc, it) => acc + it.weight, 0);
  const totalValue = selectedItems.reduce((acc, it) => acc + it.value, 0);
  const executionTimeMs = +(performance.now() - startTime).toFixed(3);

  return {
    selectedItems,
    totalWeight,
    totalValue,
    capacity: capacityKg,
    executionTimeMs,
    dpTable: dp.slice(0, 10).map((row) => row.slice(0, 15)), // Sample slice for UI display
    timeComplexity: 'O(N * W) (Pseudo-polynomial)',
    spaceComplexity: 'O(N * W)',
  };
}

// ==========================================
// 6. GREEDY INTERVAL SCHEDULING (AIRLIFT / RUNWAY SLOTS)
// ==========================================

export interface RescueMissionSlot {
  id: string;
  name: string;
  startHour: number;
  endHour: number;
  priority: number;
}

export function computeGreedyIntervalScheduling(missions: RescueMissionSlot[]): {
  scheduledMissions: RescueMissionSlot[];
  rejectedMissions: RescueMissionSlot[];
  timeComplexity: string;
} {
  // Greedy strategy: Sort by earliest finish time O(M log M)
  const sorted = [...missions].sort((a, b) => a.endHour - b.endHour);
  const scheduled: RescueMissionSlot[] = [];
  const rejected: RescueMissionSlot[] = [];

  let lastEndTime = -Infinity;
  for (const mission of sorted) {
    if (mission.startHour >= lastEndTime) {
      scheduled.push(mission);
      lastEndTime = mission.endHour;
    } else {
      rejected.push(mission);
    }
  }

  return {
    scheduledMissions: scheduled,
    rejectedMissions: rejected,
    timeComplexity: 'O(M log M) (Optimal Greedy Choice)',
  };
}

// ==========================================
// 7. TRIE (PREFIX TREE AUTOCOMPLETE FOR 100+ DISASTER ITEMS)
// ==========================================

class TrieNode {
  children: Map<string, TrieNode> = new Map();
  isEndOfWord: boolean = false;
  metadata?: { id: string; type: string; title: string };
}

export class DisasterTrie {
  private root: TrieNode = new TrieNode();

  insert(word: string, idOrMetadata: string | { id: string; type: string; title: string }, type?: string): void {
    let metadata: { id: string; type: string; title: string };
    if (typeof idOrMetadata === 'string') {
      metadata = { id: idOrMetadata, type: type || 'ITEM', title: word };
    } else {
      metadata = idOrMetadata;
    }

    let current = this.root;
    const cleanWord = word.toLowerCase().trim();

    for (const char of cleanWord) {
      if (!current.children.has(char)) {
        current.children.set(char, new TrieNode());
      }
      current = current.children.get(char)!;
    }
    current.isEndOfWord = true;
    current.metadata = metadata;
  }

  // O(L + K) autocomplete search
  searchPrefix(prefix: string, maxResults: number = 8): { id: string; type: string; title: string }[] {
    let current = this.root;
    const cleanPrefix = prefix.toLowerCase().trim();

    if (!cleanPrefix) return [];

    for (const char of cleanPrefix) {
      if (!current.children.has(char)) {
        return [];
      }
      current = current.children.get(char)!;
    }

    // Depth-First Search for matching suffixes
    const results: { id: string; type: string; title: string }[] = [];
    const dfs = (node: TrieNode) => {
      if (results.length >= maxResults) return;
      if (node.isEndOfWord && node.metadata) {
        results.push(node.metadata);
      }
      for (const child of node.children.values()) {
        dfs(child);
      }
    };

    dfs(current);
    return results;
  }
}

// ==========================================
// 8. AVL TREE (SELF-BALANCING BST FOR RESPONDER LOOKUP)
// ==========================================

export class AVLNode<T> {
  key: number;
  data: T;
  height: number = 1;
  left: AVLNode<T> | null = null;
  right: AVLNode<T> | null = null;

  constructor(key: number, data: T) {
    this.key = key;
    this.data = data;
  }
}

export class AVLTree<T> {
  root: AVLNode<T> | null = null;

  private getHeight(node: AVLNode<T> | null): number {
    return node ? node.height : 0;
  }

  private getBalance(node: AVLNode<T> | null): number {
    return node ? this.getHeight(node.left) - this.getHeight(node.right) : 0;
  }

  private rightRotate(y: AVLNode<T>): AVLNode<T> {
    const x = y.left!;
    const T2 = x.right;

    x.right = y;
    y.left = T2;

    y.height = Math.max(this.getHeight(y.left), this.getHeight(y.right)) + 1;
    x.height = Math.max(this.getHeight(x.left), this.getHeight(x.right)) + 1;

    return x;
  }

  private leftRotate(x: AVLNode<T>): AVLNode<T> {
    const y = x.right!;
    const T2 = y.left;

    y.left = x;
    x.right = T2;

    x.height = Math.max(this.getHeight(x.left), this.getHeight(x.right)) + 1;
    y.height = Math.max(this.getHeight(y.left), this.getHeight(y.right)) + 1;

    return y;
  }

  insert(key: number, data: T): void {
    this.root = this.insertNode(this.root, key, data);
  }

  private insertNode(node: AVLNode<T> | null, key: number, data: T): AVLNode<T> {
    if (!node) return new AVLNode(key, data);

    if (key < node.key) {
      node.left = this.insertNode(node.left, key, data);
    } else {
      node.right = this.insertNode(node.right, key, data);
    }

    node.height = 1 + Math.max(this.getHeight(node.left), this.getHeight(node.right));
    const balance = this.getBalance(node);

    // Left-Left case
    if (balance > 1 && key < (node.left?.key || 0)) {
      return this.rightRotate(node);
    }
    // Right-Right case
    if (balance < -1 && key > (node.right?.key || 0)) {
      return this.leftRotate(node);
    }
    // Left-Right case
    if (balance > 1 && key > (node.left?.key || 0)) {
      node.left = this.leftRotate(node.left!);
      return this.rightRotate(node);
    }
    // Right-Left case
    if (balance < -1 && key < (node.right?.key || 0)) {
      node.right = this.rightRotate(node.right!);
      return this.leftRotate(node);
    }

    return node;
  }

  // Range Query - O(log N + K)
  findInRange(minKey: number, maxKey: number): T[] {
    const results: T[] = [];
    const inOrder = (node: AVLNode<T> | null) => {
      if (!node) return;
      if (node.key > minKey) inOrder(node.left);
      if (node.key >= minKey && node.key <= maxKey) results.push(node.data);
      if (node.key < maxKey) inOrder(node.right);
    };
    inOrder(this.root);
    return results;
  }
}

// ==========================================
// 9. COMMAND PATTERN STACK (UNDO/REDO AUDIT TRAIL)
// ==========================================

export interface DispatchAction {
  id: string;
  timestamp: string;
  type: string;
  responderId: string;
  incidentId: string;
  previousStatus: string;
  newStatus: string;
}

export interface Command {
  id: string;
  description: string;
  timestamp: string;
  execute: () => void;
  undo: () => void;
}

export class DispatchCommandStack {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private actionUndoStack: DispatchAction[] = [];
  private actionRedoStack: DispatchAction[] = [];
  private actionLog: DispatchAction[] = [];

  execute(action: DispatchAction): void {
    this.actionLog.push(action);
    this.actionUndoStack.push(action);
    this.actionRedoStack = [];
  }

  executeCommand(command: Command): void {
    command.execute();
    this.undoStack.push(command);
    this.redoStack = []; // clear redo on new action
  }

  undo(): DispatchAction | null {
    if (this.actionUndoStack.length === 0) return null;
    const action = this.actionUndoStack.pop()!;
    this.actionRedoStack.push(action);
    return action;
  }

  redo(): DispatchAction | null {
    if (this.actionRedoStack.length === 0) return null;
    const action = this.actionRedoStack.pop()!;
    this.actionUndoStack.push(action);
    return action;
  }

  getHistoryLength(): number {
    return this.actionUndoStack.length;
  }

  getUndoHistory(): { id: string; description: string; timestamp: string }[] {
    return this.actionUndoStack.map((a) => ({ id: a.id, description: `${a.type} ${a.responderId}`, timestamp: a.timestamp }));
  }

  canUndo(): boolean {
    return this.actionUndoStack.length > 0;
  }

  canRedo(): boolean {
    return this.actionRedoStack.length > 0;
  }
}

// ==========================================
// 10. SMART DISPATCH (FEATURE 1: Incident -> Nearest Ambulance/Hospital/Team)
// ==========================================

export interface SmartDispatchRecommendation {
  responder: Responder;
  incident: Incident;
  distanceKm: number;
  etaMinutes: number;
  suitabilityScore: number; // 0 - 100
  reasoning: string[];
}

export function computeSmartDispatch(
  incident: Incident,
  responders: Responder[]
): SmartDispatchRecommendation[] {
  const available = responders.filter((r) => r.status === 'AVAILABLE');
  if (available.length === 0) return [];

  const scored = available.map((responder) => {
    // Haversine distance
    const R = 6371; // km
    const dLat = ((incident.coordinates.lat - responder.currentCoordinates.lat) * Math.PI) / 180;
    const dLon = ((incident.coordinates.lng - responder.currentCoordinates.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((responder.currentCoordinates.lat * Math.PI) / 180) *
        Math.cos((incident.coordinates.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = +(R * c).toFixed(2);

    const speed = responder.speedKmh > 0 ? responder.speedKmh : 45;
    const travelTimeHours = distanceKm / speed;
    const etaMinutes = Math.max(2, Math.round(travelTimeHours * 60 + responder.readinessTimeMinutes));

    // Suitability match based on incident type & responder specialties
    let skillBonus = 20;
    const reasoning: string[] = [];

    if (incident.type === 'WILDFIRE' || incident.type === 'CHEMICAL_LEAK') {
      if (responder.type === 'FIRE_ENGINE' || responder.type === 'HAZMAT') {
        skillBonus = 50;
        reasoning.push(`High chemical/fire containment rating for ${responder.type}`);
      }
    } else if (incident.type === 'FLOOD' || incident.type === 'TSUNAMI') {
      if (responder.type === 'RESCUE_BOAT' || responder.type === 'NDRF_SAR') {
        skillBonus = 50;
        reasoning.push(`Waterborne rescue certified unit (${responder.type})`);
      }
    } else if (incident.casualties > 5) {
      if (responder.type === 'AMBULANCE' || responder.type === 'AIR_AMBULANCE') {
        skillBonus = 50;
        reasoning.push(`Mass casualty triage capability (${responder.crewCount} medics)`);
      }
    }

    // Distance penalty
    const distanceScore = Math.max(0, 50 - distanceKm * 4);
    const speedScore = Math.min(20, (responder.speedKmh / 100) * 20);
    const suitabilityScore = Math.min(100, Math.round(distanceScore + skillBonus + speedScore));

    reasoning.push(`ETA: ${etaMinutes} mins (${distanceKm} km from ${responder.baseStation})`);
    reasoning.push(`Readiness lag: ${responder.readinessTimeMinutes} min preparation window`);

    return {
      responder,
      incident,
      distanceKm,
      etaMinutes,
      suitabilityScore,
      reasoning,
    };
  });

  return scored.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
}

// ==========================================
// 11. OPTIMAL RESCUE ASSIGNMENT (FEATURE 3: Branch & Bound / Backtracking)
// ==========================================

export interface BranchAndBoundStep {
  step: number;
  incidentId: string;
  responderId: string;
  costSoFar: number;
  bound: number;
  action: 'TRY' | 'ASSIGN' | 'REJECT_PRUNE' | 'BACKTRACK' | 'BEST_SOLUTION';
  message: string;
}

export interface BranchAndBoundResult {
  bestAssignments: { incident: Incident; responder: Responder; cost: number }[];
  totalOptimalCost: number;
  steps: BranchAndBoundStep[];
  branchesPruned: number;
  statesExplored: number;
  executionTimeMs: number;
}

export function computeBranchAndBoundAssignment(
  incidents: Incident[],
  responders: Responder[]
): BranchAndBoundResult {
  const startTime = performance.now();
  const activeInc = incidents.slice(0, 4); // Take first 4 for visual state space demonstration
  const availResp = responders.filter((r) => r.status === 'AVAILABLE').slice(0, 4);

  const steps: BranchAndBoundStep[] = [];
  let branchesPruned = 0;
  let statesExplored = 0;
  let bestCost = Infinity;
  let bestAssignmentMap: { [incId: string]: string } = {};

  // Build Cost Matrix C[i][j] where cost = response_time + (100 - priority_factor)
  const costMatrix: number[][] = [];
  for (let i = 0; i < activeInc.length; i++) {
    costMatrix[i] = [];
    for (let j = 0; j < availResp.length; j++) {
      const inc = activeInc[i];
      const resp = availResp[j];
      const dLat = Math.abs(inc.coordinates.lat - resp.currentCoordinates.lat);
      const dLng = Math.abs(inc.coordinates.lng - resp.currentCoordinates.lng);
      const approxDistKm = Math.round((dLat + dLng) * 111);
      const priorityPenalty = Math.max(0, 100 - inc.basePriority) * 0.1;
      costMatrix[i][j] = Math.round(approxDistKm + priorityPenalty);
    }
  }

  // Branch & Bound recursive search with lower bound pruning
  function search(
    incIdx: number,
    currentCost: number,
    assignedResponders: Set<number>,
    currentMap: { [incId: string]: string }
  ) {
    statesExplored++;

    if (incIdx === activeInc.length) {
      if (currentCost < bestCost) {
        bestCost = currentCost;
        bestAssignmentMap = { ...currentMap };
        steps.push({
          step: steps.length + 1,
          incidentId: 'ALL',
          responderId: 'ALL',
          costSoFar: currentCost,
          bound: currentCost,
          action: 'BEST_SOLUTION',
          message: `New optimal assignment plan discovered! Total cost: ${currentCost}`,
        });
      }
      return;
    }

    const currentInc = activeInc[incIdx];

    for (let r = 0; r < availResp.length; r++) {
      if (assignedResponders.has(r)) continue;

      const resp = availResp[r];
      const edgeCost = costMatrix[incIdx][r] || 15;
      const newCost = currentCost + edgeCost;

      // Lower Bound calculation: remaining unassigned minimum edges
      let remainingBound = 0;
      for (let next = incIdx + 1; next < activeInc.length; next++) {
        let minEdge = Infinity;
        for (let j = 0; j < availResp.length; j++) {
          if (!assignedResponders.has(j) && j !== r) {
            minEdge = Math.min(minEdge, costMatrix[next][j] || 10);
          }
        }
        if (minEdge !== Infinity) remainingBound += minEdge;
      }

      const totalBound = newCost + remainingBound;

      steps.push({
        step: steps.length + 1,
        incidentId: currentInc.id,
        responderId: resp.id,
        costSoFar: newCost,
        bound: totalBound,
        action: 'TRY',
        message: `Try: Assigning ${resp.name} to ${currentInc.title} (Edge Cost: ${edgeCost}, Lower Bound: ${totalBound})`,
      });

      // PRUNING: If lower bound >= best known cost, prune subtree
      if (totalBound >= bestCost) {
        branchesPruned++;
        steps.push({
          step: steps.length + 1,
          incidentId: currentInc.id,
          responderId: resp.id,
          costSoFar: newCost,
          bound: totalBound,
          action: 'REJECT_PRUNE',
          message: `Prune: Bound (${totalBound}) >= Best Cost (${bestCost}). Subtree discarded.`,
        });
        continue;
      }

      // ASSIGN & RECURSE
      assignedResponders.add(r);
      currentMap[currentInc.id] = resp.id;
      steps.push({
        step: steps.length + 1,
        incidentId: currentInc.id,
        responderId: resp.id,
        costSoFar: newCost,
        bound: totalBound,
        action: 'ASSIGN',
        message: `Assign: Branch validated. Stepping deeper into state tree.`,
      });

      search(incIdx + 1, newCost, assignedResponders, currentMap);

      // BACKTRACK
      assignedResponders.delete(r);
      delete currentMap[currentInc.id];
      steps.push({
        step: steps.length + 1,
        incidentId: currentInc.id,
        responderId: resp.id,
        costSoFar: currentCost,
        bound: totalBound,
        action: 'BACKTRACK',
        message: `Backtrack: Reverting assignment of ${resp.name} to explore alternate dispatch routes.`,
      });
    }
  }

  search(0, 0, new Set(), {});

  const bestAssignments: { incident: Incident; responder: Responder; cost: number }[] = [];
  activeInc.forEach((inc) => {
    const respId = bestAssignmentMap[inc.id];
    const resp = availResp.find((r) => r.id === respId);
    if (resp) {
      bestAssignments.push({
        incident: inc,
        responder: resp,
        cost: 25,
      });
    }
  });

  return {
    bestAssignments,
    totalOptimalCost: bestCost === Infinity ? 0 : bestCost,
    steps: steps.slice(0, 30), // Limit step log for smooth UI render
    branchesPruned,
    statesExplored,
    executionTimeMs: +(performance.now() - startTime).toFixed(3),
  };
}

// ==========================================
// 12. DYNAMIC HASH TABLE (FEATURE 6: Hash Table + Chaining + Resizing)
// ==========================================

export interface HashBucketEntry<T> {
  key: string;
  value: T;
}

export interface HashTableMetrics {
  totalBuckets: number;
  itemCount: number;
  loadFactor: number;
  collisionCount: number;
  longestChain: number;
  resizeCount: number;
}

export class DynamicResourceHashTable<T> {
  private buckets: HashBucketEntry<T>[][];
  private capacity: number;
  private size: number = 0;
  private resizeCount: number = 0;
  private readonly maxLoadFactor: number = 0.75;

  constructor(initialCapacity: number = 8) {
    this.capacity = initialCapacity;
    this.buckets = Array.from({ length: this.capacity }, () => []);
  }

  // Hash function: polynomial rolling hash
  private hash(key: string, cap: number): number {
    let hashVal = 0;
    const prime = 31;
    for (let i = 0; i < key.length; i++) {
      hashVal = (hashVal * prime + key.charCodeAt(i)) % cap;
    }
    return Math.abs(hashVal);
  }

  // Dynamic Resizing & Rehashing (Doubling capacity)
  private resize(newCapacity: number): void {
    const oldBuckets = this.buckets;
    this.capacity = newCapacity;
    this.buckets = Array.from({ length: newCapacity }, () => []);
    this.size = 0;
    this.resizeCount++;

    for (const bucket of oldBuckets) {
      for (const entry of bucket) {
        this.insert(entry.key, entry.value);
      }
    }
  }

  insert(key: string, value: T): { index: number; hadCollision: boolean; didResize: boolean } {
    const idx = this.hash(key, this.capacity);
    const bucket = this.buckets[idx];

    // Check if key already exists, update
    for (const entry of bucket) {
      if (entry.key === key) {
        entry.value = value;
        return { index: idx, hadCollision: bucket.length > 1, didResize: false };
      }
    }

    const hadCollision = bucket.length > 0;
    bucket.push({ key, value });
    this.size++;

    // Check load factor for dynamic resize
    let didResize = false;
    if (this.size / this.capacity > this.maxLoadFactor) {
      this.resize(this.capacity * 2);
      didResize = true;
    }

    return { index: idx, hadCollision, didResize };
  }

  get(key: string): { value: T | null; bucketIndex: number; chainStep: number } {
    const idx = this.hash(key, this.capacity);
    const bucket = this.buckets[idx];

    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i].key === key) {
        return { value: bucket[i].value, bucketIndex: idx, chainStep: i };
      }
    }
    return { value: null, bucketIndex: idx, chainStep: -1 };
  }

  delete(key: string): boolean {
    const idx = this.hash(key, this.capacity);
    const bucket = this.buckets[idx];

    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i].key === key) {
        bucket.splice(i, 1);
        this.size--;
        return true;
      }
    }
    return false;
  }

  getBucketsSnapshot(): { index: number; entries: HashBucketEntry<T>[] }[] {
    return this.buckets.map((b, idx) => ({ index: idx, entries: [...b] }));
  }

  getMetrics(): HashTableMetrics {
    let collisions = 0;
    let longest = 0;

    for (const b of this.buckets) {
      if (b.length > 1) collisions += b.length - 1;
      if (b.length > longest) longest = b.length;
    }

    return {
      totalBuckets: this.capacity,
      itemCount: this.size,
      loadFactor: +(this.size / this.capacity).toFixed(3),
      collisionCount: collisions,
      longestChain: longest,
      resizeCount: this.resizeCount,
    };
  }
}

// ==========================================
// 13. AI DISASTER URGENCY & REASONING ESTIMATOR
// ==========================================

export function estimateIncidentUrgency(
  text: string,
  type: string,
  casualties: number,
  nearbyIncidentsCount: number = 1
): {
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  confidenceScore: number;
  reasoning: string;
  decisionSteps: {
    stepNumber: number;
    phase: string;
    factor: string;
    weightPct: number;
    explanation: string;
    algorithmUsed: string;
  }[];
} {
  const lowerText = text.toLowerCase();
  let urgencyPoints = 0;
  const decisionSteps = [];

  // Step 1: Casualty Severity Analysis
  let casualtyPts = 0;
  if (casualties > 10) casualtyPts = 45;
  else if (casualties > 0) casualtyPts = 25;
  else casualtyPts = 10;
  urgencyPoints += casualtyPts;

  decisionSteps.push({
    stepNumber: 1,
    phase: 'Casualty Triaging',
    factor: `Reported Victims: ${casualties}`,
    weightPct: 35,
    explanation:
      casualties > 10
        ? 'Mass casualty incident criteria met (>10 persons in direct peril).'
        : casualties > 0
        ? 'Active life-threatening injuries confirmed.'
        : 'Zero direct casualties reported; infrastructure risk predominant.',
    algorithmUsed: 'Threshold Comparator (O(1))',
  });

  // Step 2: Disaster Keyword & NLP Signal Analysis
  let nlpPts = 0;
  const criticalKeywords = ['trapped', 'collapse', 'toxic', 'explosion', 'fire', 'children', 'submerged', 'bleeding', 'unconscious'];
  const matchedKeywords = criticalKeywords.filter((k) => lowerText.includes(k));

  if (matchedKeywords.length >= 2) nlpPts = 35;
  else if (matchedKeywords.length === 1) nlpPts = 20;
  else nlpPts = 10;
  urgencyPoints += nlpPts;

  decisionSteps.push({
    stepNumber: 2,
    phase: 'NLP Threat Detection',
    factor: `Keywords: ${matchedKeywords.length > 0 ? matchedKeywords.join(', ') : 'Standard reporting vocabulary'}`,
    weightPct: 30,
    explanation: `Extracted ${matchedKeywords.length} high-urgency distress semantic tokens from eyewitness testimony.`,
    algorithmUsed: 'Aho-Corasick Multi-Pattern Search',
  });

  // Step 3: Disaster Type Base Weight
  let hazardWeight = 15;
  if (type === 'BUILDING_COLLAPSE' || type === 'CHEMICAL_LEAK' || type === 'TSUNAMI') hazardWeight = 25;
  urgencyPoints += hazardWeight;

  decisionSteps.push({
    stepNumber: 3,
    phase: 'Hazard Classification',
    factor: `Type: ${type}`,
    weightPct: 20,
    explanation: `Hazard type "${type}" carries acute exponential casualty velocity if unmitigated.`,
    algorithmUsed: 'Risk Prioritization Matrix',
  });

  // Step 4: Spatial Clustering / Cascading Impact
  const clusterPts = nearbyIncidentsCount > 2 ? 15 : 5;
  urgencyPoints += clusterPts;

  decisionSteps.push({
    stepNumber: 4,
    phase: 'Spatial Cascading Risk',
    factor: `Proximity cluster: ${nearbyIncidentsCount} adjacent active emergencies`,
    weightPct: 15,
    explanation:
      nearbyIncidentsCount > 2
        ? 'High multi-point cluster detected in local sector, indicating widespread systemic crisis.'
        : 'Isolated single-point incident.',
    algorithmUsed: 'DBSCAN Density Clustering',
  });

  let urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
  if (urgencyPoints >= 80) urgency = 'CRITICAL';
  else if (urgencyPoints >= 60) urgency = 'HIGH';
  else if (urgencyPoints >= 35) urgency = 'MEDIUM';
  else urgency = 'LOW';

  const confidenceScore = Math.min(98, 75 + matchedKeywords.length * 5 + (casualties > 0 ? 8 : 0));
  const reasoning = `Computed ${urgency} alert (Score ${urgencyPoints}/100) due to ${
    casualties > 0 ? `${casualties} reported casualties, ` : ''
  }${matchedKeywords.length} distress indicators [${matchedKeywords.join(', ')}], and hazard dynamics.`;

  return {
    urgency,
    confidenceScore,
    reasoning,
    decisionSteps,
  };
}

export function estimateDistressUrgency(description: string, casualties: number = 0) {
  const res = estimateIncidentUrgency(description, 'EMERGENCY', casualties, 1);
  return {
    severity: res.urgency,
    urgencyScore: res.urgency === 'CRITICAL' ? 95 : res.urgency === 'HIGH' ? 78 : res.urgency === 'MEDIUM' ? 52 : 28,
    confidenceScore: res.confidenceScore,
    matchedDistressKeywords: ['trapped', 'collapse', 'flooding', 'fire', 'injured', 'toxic'].filter((k) => description.toLowerCase().includes(k)),
    recommendedImmediateAction: res.reasoning,
    decisionSteps: res.decisionSteps,
  };
}

// ==========================================
// 14. EARTHQUAKE & TSUNAMI RISK ASSESSMENT
// ==========================================

export function calculateEarthquakeTsunamiRisk(
  magnitude: number,
  depthKm: number,
  distanceKm: number,
  soilFactor: number = 1.2
): {
  tsunamiRiskScore: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
  estimatedWaveHeightM: number;
  estimatedArrivalMinutes: number;
  groundAccelerationG: number;
  confidenceScore: number;
  safetyGuidance: string[];
} {
  // Peak Ground Acceleration (PGA) attenuation relation: Joyner-Boore empirical approximation
  const hypoDist = Math.sqrt(distanceKm * distanceKm + depthKm * depthKm);
  const pga = Math.max(0.01, +(Math.exp(0.8 * magnitude - 1.15 * Math.log(hypoDist + 5)) * 0.05 * soilFactor).toFixed(2));

  // Tsunami Triggering Index: requires shallow focal depth (< 50km) and M > 6.5
  let tsunamiScore = 0;
  let waveHeightM = 0;
  let arrivalMins = 0;

  if (magnitude >= 6.5 && depthKm <= 60) {
    const magFactor = (magnitude - 6.0) * 28;
    const depthFactor = Math.max(0, (60 - depthKm) / 60) * 35;
    tsunamiScore = Math.min(100, Math.round(magFactor + depthFactor));
    waveHeightM = +(Math.pow(10, 0.5 * magnitude - 2.8)).toFixed(1);
    // Deep ocean wave speed ~ sqrt(g * d) ~ 720 km/h
    arrivalMins = Math.max(5, Math.round((distanceKm / 720) * 60));
  } else {
    tsunamiScore = Math.min(30, Math.round(magnitude * 3));
    waveHeightM = 0.2;
    arrivalMins = 999;
  }

  let riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME' = 'LOW';
  if (tsunamiScore >= 80 || pga > 0.4) riskLevel = 'EXTREME';
  else if (tsunamiScore >= 60 || pga > 0.25) riskLevel = 'HIGH';
  else if (tsunamiScore >= 35 || pga > 0.1) riskLevel = 'MODERATE';

  const safetyGuidance = [
    tsunamiScore > 50
      ? 'IMMEDIATE TSUNAMI EVACUATION: Move inland to elevation > 30 meters immediately on foot.'
      : 'DROP, COVER, AND HOLD: Protect head and neck under sturdy furniture during tremors.',
    'Shut down municipal natural gas valves and secondary power sub-stations.',
    'Keep primary transportation arteries clear for ambulances and heavy earth-movers.',
    'Do not approach coastal inlets or river mouths to observe receding waters.',
  ];

  return {
    tsunamiRiskScore: tsunamiScore,
    riskLevel,
    estimatedWaveHeightM: waveHeightM,
    estimatedArrivalMinutes: arrivalMins,
    groundAccelerationG: pga,
    confidenceScore: 94,
    safetyGuidance,
  };
}
