import React, { useState, useMemo } from 'react';
import { 
  Cpu, 
  Share2, 
  TrendingUp, 
  Zap, 
  GitCommit, 
  Play, 
  RotateCcw, 
  Layers, 
  Search, 
  Clock, 
  CheckCircle, 
  Box, 
  Sliders, 
  Activity,
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';
import { 
  EmergencyGraph, 
  EmergencyPriorityQueue, 
  solve01Knapsack, 
  computeBipartiteMatching, 
  DisjointSetUnion, 
  computeGreedyIntervalScheduling, 
  AVLTree, 
  DisasterTrie,
  RescueMissionSlot
} from '../services/dsaEngine';
import { ROUTING_NODES, ROUTING_EDGES, INITIAL_INCIDENTS, INITIAL_RESPONDERS, INITIAL_SUPPLIES } from '../data/disasterItems';
import { KnapsackItem } from '../types';

export const DSALab: React.FC = () => {
  const [activeDsaTab, setActiveDsaTab] = useState<'SHORTEST_PATH' | 'MAX_HEAP' | 'KNAPSACK' | 'MATCHING' | 'DSU' | 'SCHEDULING' | 'AVL_TREE'>('SHORTEST_PATH');

  // --- 1. Graph State ---
  const graph = useMemo(() => new EmergencyGraph(ROUTING_NODES, ROUTING_EDGES), []);
  const [startNode, setStartNode] = useState('NODE-01');
  const [endNode, setEndNode] = useState('NODE-06');
  const [dijkstraResult, setDijkstraResult] = useState(() => graph.dijkstra('NODE-01', 'NODE-06'));
  const [aStarResult, setAStarResult] = useState(() => graph.aStar('NODE-01', 'NODE-06'));
  const [bellmanResult, setBellmanResult] = useState(() => graph.bellmanFord('NODE-01', 'NODE-06'));

  const handleRunShortestPaths = () => {
    setDijkstraResult(graph.dijkstra(startNode, endNode));
    setAStarResult(graph.aStar(startNode, endNode));
    setBellmanResult(graph.bellmanFord(startNode, endNode));
  };

  // --- 2. Max-Heap State ---
  const [heapQueue, setHeapQueue] = useState(() => {
    const pq = new EmergencyPriorityQueue(0.8);
    INITIAL_INCIDENTS.slice(0, 8).forEach((inc) => pq.insert(inc));
    return pq;
  });
  const [extractedIncident, setExtractedIncident] = useState<any | null>(null);

  const handleExtractMax = () => {
    const max = heapQueue.extractMax();
    setExtractedIncident(max);
    setHeapQueue(Object.assign(new EmergencyPriorityQueue(heapQueue.agingRatePerMinute), heapQueue));
  };

  const handleSimulateAging = () => {
    heapQueue.reapplyAging();
    setHeapQueue(Object.assign(new EmergencyPriorityQueue(heapQueue.agingRatePerMinute), heapQueue));
  };

  // --- 3. Knapsack State ---
  const knapsackItems: KnapsackItem[] = useMemo(() => {
    return INITIAL_SUPPLIES.map((s) => ({
      id: s.id,
      name: s.name,
      weight: s.weightKgPerUnit,
      value: s.utilityValue,
      category: s.category,
    }));
  }, []);

  const [knapsackCapacity, setKnapsackCapacity] = useState(120);
  const knapsackResult = useMemo(() => {
    return solve01Knapsack(knapsackItems.slice(0, 14), knapsackCapacity);
  }, [knapsackItems, knapsackCapacity]);

  // --- 4. Bipartite Matching State ---
  const matchingResult = useMemo(() => {
    return computeBipartiteMatching(INITIAL_RESPONDERS, INITIAL_INCIDENTS);
  }, []);

  // --- 5. DSU State ---
  const [blockedBridge, setBlockedBridge] = useState(false);
  const dsuResult = useMemo(() => {
    const nodeIds = ROUTING_NODES.map((n) => n.id);
    const dsu = new DisjointSetUnion(nodeIds);
    ROUTING_EDGES.forEach((e) => {
      // Simulate North River Bridge Cut-off if toggled
      if (blockedBridge && ((e.from === 'NODE-03' && e.to === 'NODE-04') || (e.from === 'NODE-03' && e.to === 'NODE-05'))) {
        return; // Bridge collapsed/flooded
      }
      dsu.union(e.from, e.to);
    });
    return dsu.getConnectedComponents(nodeIds);
  }, [blockedBridge]);

  // --- 6. Scheduling State ---
  const sampleMissions: RescueMissionSlot[] = [
    { id: 'MSN-1', name: 'Marina Coastal Air Evacuation', startHour: 8, endHour: 10, priority: 90 },
    { id: 'MSN-2', name: 'Harbor Chemical Plume Survey', startHour: 9, endHour: 11, priority: 85 },
    { id: 'MSN-3', name: 'Old City Rooftop Winch Airlift', startHour: 10, endHour: 12, priority: 95 },
    { id: 'MSN-4', name: 'River Basin Supply Air-Drop', startHour: 11, endHour: 13, priority: 80 },
    { id: 'MSN-5', name: 'Offshore Tsunami Buoy Inspection', startHour: 13, endHour: 15, priority: 75 },
    { id: 'MSN-6', name: 'Night Searchlight Sweep Flight', startHour: 14, endHour: 17, priority: 70 },
  ];
  const schedulingResult = useMemo(() => computeGreedyIntervalScheduling(sampleMissions), []);

  // --- 7. AVL Tree State ---
  const [minReadiness, setMinReadiness] = useState(1);
  const [maxReadiness, setMaxReadiness] = useState(5);
  const avlTree = useMemo(() => {
    const tree = new AVLTree<any>();
    INITIAL_RESPONDERS.forEach((r) => tree.insert(r.readinessTimeMinutes, r));
    return tree;
  }, []);
  const avlRangeResponders = useMemo(() => {
    return avlTree.findInRange(minReadiness, maxReadiness);
  }, [avlTree, minReadiness, maxReadiness]);

  return (
    <div className="w-full min-h-[calc(100vh-65px)] bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Hero Card */}
        <div className="glass-card p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-600 text-white shadow-md shadow-indigo-200">
                <Cpu className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Disaster DSA Computational Intelligence Workbench
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 font-medium">
              Interactive execution of advanced Data Structures & Algorithms with real-time asymptotic complexity metrics: Shortest Paths, Priority Triage, Knapsack DP, Graph Connectivity, and Bipartite Matching.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-indigo-50/80 border border-indigo-100 text-indigo-800 text-xs font-bold">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>11+ DSA MODULES ACTIVE</span>
          </div>
        </div>

        {/* Algorithm Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 glass-panel rounded-2xl">
          {[
            { id: 'SHORTEST_PATH', label: '1. Shortest Paths (Dijkstra/A*)', icon: GitCommit },
            { id: 'MAX_HEAP', label: '2. Priority Heap & Aging', icon: Activity },
            { id: 'KNAPSACK', label: '3. 0/1 Knapsack Cargo DP', icon: Box },
            { id: 'MATCHING', label: '4. Bipartite Unit Matching', icon: Share2 },
            { id: 'DSU', label: '5. DSU Disaster Connectivity', icon: Layers },
            { id: 'SCHEDULING', label: '6. Greedy Interval Scheduling', icon: Clock },
            { id: 'AVL_TREE', label: '7. AVL Tree Range Queries', icon: Sliders },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeDsaTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveDsaTab(tab.id as any)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                  isActive 
                    ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ==================================================== */}
        {/* TAB 1: SHORTEST PATHS COMPARISON */}
        {/* ==================================================== */}
        {activeDsaTab === 'SHORTEST_PATH' && (
          <div className="space-y-6">
            
            {/* Control Bar */}
            <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold text-slate-700">Source:</span>
                <select
                  value={startNode}
                  onChange={(e) => setStartNode(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium"
                >
                  {ROUTING_NODES.map((n) => (
                    <option key={n.id} value={n.id}>{n.name} ({n.id})</option>
                  ))}
                </select>

                <ArrowRight className="w-4 h-4 text-slate-600 mx-1" />

                <span className="font-bold text-slate-700">Destination Hotspot:</span>
                <select
                  value={endNode}
                  onChange={(e) => setEndNode(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium"
                >
                  {ROUTING_NODES.map((n) => (
                    <option key={n.id} value={n.id}>{n.name} ({n.id})</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleRunShortestPaths}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-200 flex items-center gap-1.5 active:scale-95 transition"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Execute Benchmark</span>
              </button>
            </div>

            {/* 3 Algorithm Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Dijkstra */}
              <div className="glass-card p-5 rounded-3xl space-y-3 border-indigo-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-slate-900">Dijkstra's Algorithm</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold">
                    O((V + E) log V)
                  </span>
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <div>Distance: <b className="text-slate-900">{dijkstraResult.totalDistanceKm} km</b></div>
                  <div>ETA: <b className="text-slate-900">{dijkstraResult.estimatedMinutes} minutes</b></div>
                  <div>Nodes Relaxed: <b className="text-indigo-600">{dijkstraResult.nodesVisited} nodes</b></div>
                  <div>Exec Runtime: <b className="text-slate-900">{dijkstraResult.executionTimeMs} ms</b></div>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Computed Optimal Node Route:</span>
                  <div className="flex flex-wrap gap-1">
                    {dijkstraResult.path.map((nodeId, idx) => (
                      <span key={idx} className="text-[10px] font-mono font-semibold px-1.5 py-0.5 bg-slate-100 rounded text-slate-700">
                        {nodeId} {idx < dijkstraResult.path.length - 1 ? '→' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* A* Search */}
              <div className="glass-card p-5 rounded-3xl space-y-3 border-sky-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-slate-900">A* Search (Euclidean)</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100 font-bold">
                    O(E) Directed
                  </span>
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <div>Distance: <b className="text-slate-900">{aStarResult.totalDistanceKm} km</b></div>
                  <div>ETA: <b className="text-slate-900">{aStarResult.estimatedMinutes} minutes</b></div>
                  <div>Nodes Visited: <b className="text-sky-600">{aStarResult.nodesVisited} nodes</b></div>
                  <div>Exec Runtime: <b className="text-slate-900">{aStarResult.executionTimeMs} ms</b></div>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Heuristic Pruned Route:</span>
                  <div className="flex flex-wrap gap-1">
                    {aStarResult.path.map((nodeId, idx) => (
                      <span key={idx} className="text-[10px] font-mono font-semibold px-1.5 py-0.5 bg-slate-100 rounded text-slate-700">
                        {nodeId} {idx < aStarResult.path.length - 1 ? '→' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bellman-Ford */}
              <div className="glass-card p-5 rounded-3xl space-y-3 border-amber-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-slate-900">Bellman-Ford Algorithm</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 font-bold">
                    O(V * E)
                  </span>
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <div>Distance: <b className="text-slate-900">{bellmanResult.totalDistanceKm} km</b></div>
                  <div>ETA: <b className="text-slate-900">{bellmanResult.estimatedMinutes} minutes</b></div>
                  <div>Pass Iterations: <b className="text-amber-700">{bellmanResult.nodesVisited} passes</b></div>
                  <div>Exec Runtime: <b className="text-slate-900">{bellmanResult.executionTimeMs} ms</b></div>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Negative Edge Resilient Path:</span>
                  <div className="flex flex-wrap gap-1">
                    {bellmanResult.path.map((nodeId, idx) => (
                      <span key={idx} className="text-[10px] font-mono font-semibold px-1.5 py-0.5 bg-slate-100 rounded text-slate-700">
                        {nodeId} {idx < bellmanResult.path.length - 1 ? '→' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 2: MAX-HEAP WITH STARVATION AGING */}
        {/* ==================================================== */}
        {activeDsaTab === 'MAX_HEAP' && (
          <div className="space-y-6">
            <div className="glass-panel p-5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Emergency Incident Priority Queue (Max-Heap with Aging)
                </h3>
                <p className="text-xs text-slate-700">
                  Formula: <code className="text-indigo-600 font-mono">Priority = BaseScore + (Severity*10) + (WaitMinutes * 0.8)</code> prevents low-severity incidents from starving.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSimulateAging}
                  className="px-3.5 py-1.5 text-xs font-bold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl shadow-sm transition"
                >
                  Simulate +5m Aging
                </button>
                <button
                  onClick={handleExtractMax}
                  disabled={heapQueue.size() === 0}
                  className="px-4 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md shadow-rose-200 transition"
                >
                  Extract Max Urgency O(log N)
                </button>
              </div>
            </div>

            {/* Extracted Top Alert */}
            {extractedIncident && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-rose-500 text-white">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-rose-600">Dispatched Root Incident (Max Extracted)</span>
                    <h5 className="font-bold text-slate-900 text-sm">{extractedIncident.title}</h5>
                    <p className="text-slate-600">Location: {extractedIncident.locationName} • Casualties: {extractedIncident.casualties}</p>
                  </div>
                </div>
                <span className="text-base font-mono font-black text-rose-700">
                  Priority: {extractedIncident.calculatedPriority}
                </span>
              </div>
            )}

            {/* Visual Heap Array */}
            <div className="glass-card p-5 rounded-3xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Active Heap Memory Array (Index 0 = Root) — Total: {heapQueue.size()}
                </span>
                <span className="text-[11px] font-mono text-indigo-600">Max-Heap Property: Parent &ge; Left & Right Children</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {heapQueue.getHeapArray().map((item, idx) => (
                  <div key={item.id} className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-mono text-indigo-600 font-bold">Node [{idx}]</span>
                      <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700">
                        Pri: {item.calculatedPriority}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-800 truncate">{item.title}</div>
                    <div className="text-[10px] text-slate-700 flex justify-between">
                      <span>Wait: {item.agingMinutes}m</span>
                      <span>Sev: {item.severity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 3: 0/1 KNAPSACK CARGO DP */}
        {/* ==================================================== */}
        {activeDsaTab === 'KNAPSACK' && (
          <div className="space-y-6">
            <div className="glass-panel p-5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  0/1 Knapsack Dynamic Programming Cargo Optimizer
                </h3>
                <p className="text-xs text-slate-700">
                  Computes optimal emergency medical and rescue kit cargo combination to maximize saved life utility under weight capacity constraints.
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Payload Limit: {knapsackCapacity} kg</span>
                <input
                  type="range"
                  min="30"
                  max="300"
                  step="10"
                  value={knapsackCapacity}
                  onChange={(e) => setKnapsackCapacity(+e.target.value)}
                  className="w-36 accent-indigo-600"
                />
              </div>
            </div>

            {/* Results Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glass-card p-4 rounded-2xl">
                <span className="text-slate-700 text-xs block">Max Life-Saving Utility</span>
                <span className="text-2xl font-black text-indigo-600">{knapsackResult.totalValue} pts</span>
              </div>
              <div className="glass-card p-4 rounded-2xl">
                <span className="text-slate-700 text-xs block">Selected Cargo Weight</span>
                <span className="text-2xl font-black text-slate-900">{knapsackResult.totalWeight} / {knapsackCapacity} kg</span>
              </div>
              <div className="glass-card p-4 rounded-2xl">
                <span className="text-slate-700 text-xs block">DP Matrix Time Complexity</span>
                <span className="text-xl font-black text-emerald-600">{knapsackResult.timeComplexity}</span>
              </div>
            </div>

            {/* Chosen Items */}
            <div className="glass-card p-5 rounded-3xl space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Optimal Cargo manifest ({knapsackResult.selectedItems.length} items packed)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {knapsackResult.selectedItems.map((item) => (
                  <div key={item.id} className="p-3 bg-white rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-slate-800 block truncate max-w-[200px]">{item.name}</span>
                      <span className="text-[10px] text-slate-700">{item.category}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-indigo-600 block">+{item.value} pts</span>
                      <span className="text-[10px] text-slate-600 font-mono">{item.weight} kg</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 4: BIPARTITE MATCHING */}
        {/* ==================================================== */}
        {activeDsaTab === 'MATCHING' && (
          <div className="space-y-6">
            <div className="glass-panel p-5 rounded-3xl">
              <h3 className="text-sm font-bold text-slate-900">
                Bipartite Matching & Gale-Shapley Dispatcher
              </h3>
              <p className="text-xs text-slate-700">
                Automatically matches available specialized responders to active incidents based on distance, readiness time, and critical rescue capabilities (Hazmat &rarr; Chemical, Boat &rarr; Flood, NDRF &rarr; Collapse).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matchingResult.matches.map((m, idx) => (
                <div key={idx} className="glass-card p-4 rounded-2xl flex items-center justify-between gap-3">
                  <div className="space-y-1 max-w-[45%]">
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {m.responder.type}
                    </span>
                    <h5 className="text-xs font-bold text-slate-900 truncate">{m.responder.name}</h5>
                    <p className="text-[10px] text-slate-700">{m.responder.speedKmh} km/h • Ready {m.responder.readinessTimeMinutes}m</p>
                  </div>

                  <div className="flex flex-col items-center shrink-0">
                    <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      Match: {m.score}%
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-600 mt-1" />
                  </div>

                  <div className="space-y-1 max-w-[45%] text-right">
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-100">
                      {m.incident.severity}
                    </span>
                    <h5 className="text-xs font-bold text-slate-900 truncate">{m.incident.title}</h5>
                    <p className="text-[10px] text-slate-700">{m.incident.locationName}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 5: DSU CONNECTIVITY */}
        {/* ==================================================== */}
        {activeDsaTab === 'DSU' && (
          <div className="space-y-6">
            <div className="glass-panel p-5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Disjoint Set Union (Union-Find) Road & Bridge Isolation Detector
                </h3>
                <p className="text-xs text-slate-700">
                  Tracks connected network components to instantly detect whether river floods or bridge collapses have isolated residential zones from hospital hubs.
                </p>
              </div>

              <button
                onClick={() => setBlockedBridge(!blockedBridge)}
                className={`px-4 py-2 text-xs font-bold rounded-xl border transition ${
                  blockedBridge 
                    ? 'bg-rose-500 text-white border-rose-600 shadow-md' 
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {blockedBridge ? 'Simulating Bridge Collapsed (North River)' : 'Simulate North River Bridge Collapse'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dsuResult.components.map((comp, idx) => (
                <div 
                  key={idx} 
                  className={`p-5 rounded-3xl border transition ${
                    comp.isAccessibleToHospitals 
                      ? 'glass-card border-emerald-200' 
                      : 'bg-rose-50/80 border-rose-300 shadow-lg'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Component Root: {comp.rootId}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      comp.isAccessibleToHospitals ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-600 text-white'
                    }`}>
                      {comp.isAccessibleToHospitals ? 'Hospital Connected' : 'ISOLATED DISASTER ISLAND'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mb-3">
                    {comp.isAccessibleToHospitals 
                      ? 'Connected to Metro Trauma Hospital and Central Dispatch HQ.'
                      : 'WARNING: Road connectivity severed by water surge. Accessible only by Air Ambulance or Boat!'}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {comp.members.map((member) => (
                      <span key={member} className="px-2 py-1 bg-white text-slate-800 rounded-lg text-xs font-mono border border-slate-200">
                        {member}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 6: GREEDY SCHEDULING */}
        {/* ==================================================== */}
        {activeDsaTab === 'SCHEDULING' && (
          <div className="space-y-6">
            <div className="glass-panel p-5 rounded-3xl">
              <h3 className="text-sm font-bold text-slate-900">
                Greedy Interval Scheduling (Helicopter Airlift Slots)
              </h3>
              <p className="text-xs text-slate-700">
                Earliest Finish Time Greedy selection maximizes the number of non-overlapping search and rescue air missions using a single primary helipad.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-card p-5 rounded-3xl space-y-3">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide block">
                  Scheduled Rescue Missions ({schedulingResult.scheduledMissions.length} Missions Approved)
                </span>
                <div className="space-y-2">
                  {schedulingResult.scheduledMissions.map((m) => (
                    <div key={m.id} className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs flex justify-between items-center">
                      <div>
                        <span className="font-bold text-emerald-900 block">{m.name}</span>
                        <span className="text-[10px] text-emerald-700">{m.id}</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-800 bg-white px-2 py-1 rounded">
                        {m.startHour}:00 - {m.endHour}:00
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card p-5 rounded-3xl space-y-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                  Rejected / Conflicting Missions ({schedulingResult.rejectedMissions.length} Deferred)
                </span>
                <div className="space-y-2">
                  {schedulingResult.rejectedMissions.map((m) => (
                    <div key={m.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex justify-between items-center opacity-70">
                      <div>
                        <span className="font-bold text-slate-700 block">{m.name}</span>
                        <span className="text-[10px] text-slate-700">Conflict at helipad</span>
                      </div>
                      <span className="font-mono text-slate-600 bg-white px-2 py-1 rounded">
                        {m.startHour}:00 - {m.endHour}:00
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 7: AVL TREE RANGE QUERIES */}
        {/* ==================================================== */}
        {activeDsaTab === 'AVL_TREE' && (
          <div className="space-y-6">
            <div className="glass-panel p-5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  AVL Tree Self-Balancing Range Query (Response Readiness)
                </h3>
                <p className="text-xs text-slate-700">
                  Uses balanced height rotations to guarantee O(log N + K) range query when looking up all emergency vehicles ready between X and Y minutes.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-700">Readiness Window: {minReadiness}m to {maxReadiness}m</span>
                <input
                  type="range"
                  min="1"
                  max="15"
                  value={maxReadiness}
                  onChange={(e) => setMaxReadiness(+e.target.value)}
                  className="accent-indigo-600"
                />
              </div>
            </div>

            <div className="glass-card p-5 rounded-3xl space-y-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Responders within {minReadiness} - {maxReadiness} mins ({avlRangeResponders.length} units ready)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {avlRangeResponders.map((r) => (
                  <div key={r.id} className="p-3 bg-white rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-900 block truncate max-w-[180px]">{r.name}</span>
                      <span className="text-[10px] text-slate-700">{r.type}</span>
                    </div>
                    <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                      {r.readinessTimeMinutes} mins
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
