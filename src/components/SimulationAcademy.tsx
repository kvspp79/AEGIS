import React, { useState } from 'react';
import { 
  GraduationCap, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  HelpCircle, 
  Award, 
  BookOpen, 
  ArrowRight, 
  Sparkles, 
  Cpu, 
  BrainCircuit, 
  Layers, 
  Clock, 
  ChevronRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { QuizQuestion } from '../types';

interface SimulationAcademyProps {
  onNavigateToTab: (tab: any) => void;
}

export const SimulationAcademy: React.FC<SimulationAcademyProps> = ({
  onNavigateToTab,
}) => {
  // 10-Step Lifecycle State
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [selectedScenario, setSelectedScenario] = useState<string>('COASTAL_CYCLONE');

  // Quiz State
  const [quizIndex, setQuizIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [activeMode, setActiveMode] = useState<'SIMULATION' | 'QUIZ_VIVA' | 'DSA_REFERENCE'>('SIMULATION');

  const lifecycleSteps = [
    {
      id: 'REPORT',
      title: '1. Report',
      subtitle: 'Citizen SOS Submission',
      desc: 'Eyewitness submits emergency description, simulated damage photo, and browser GPS coordinates.',
      algorithm: 'GPS Triangulation + Multi-part Payload Packaging',
      dsaTag: 'O(1) Ingestion',
      sampleOutput: 'Incident SOS-9402 logged at 13.0827°N, 80.2707°E. Timestamp: 23:18 UTC.',
    },
    {
      id: 'UNDERSTAND',
      title: '2. Understand',
      subtitle: 'AI Urgency & Threat Triage',
      desc: 'Natural language semantic parsing extracts distress tokens ("trapped", "collapse") and estimates casualty severity.',
      algorithm: 'Aho-Corasick Pattern Matcher & Risk Matrix',
      dsaTag: 'O(L) Semantic Scan',
      sampleOutput: 'Urgency: CRITICAL (Confidence 94%). 12 casualties detected; structural instability confirmed.',
    },
    {
      id: 'PRIORITIZE',
      title: '3. Prioritize',
      subtitle: 'Emergency Heap + Starvation Aging',
      desc: 'Emergency is pushed onto a Binary Max-Heap. Aging factor prevents lower-priority incidents from starving over time.',
      algorithm: 'Max-Heap Priority Queue (P_calc = P_base + alpha * t)',
      dsaTag: 'O(log N) Heapify',
      sampleOutput: 'Pushed to root of Priority Queue with calculated priority 94.5 (Aging multiplier: 0.5/min).',
    },
    {
      id: 'ASSIGN',
      title: '4. Assign',
      subtitle: 'Optimal Unit Matching',
      desc: 'Evaluates available ambulance and rescue squadrons via Branch & Bound and Bipartite Matching to minimize total response delay.',
      algorithm: 'Branch & Bound State-Space Pruning / Kuhn Bipartite',
      dsaTag: 'O(V * E) / Pruned Tree',
      sampleOutput: 'Assigned: NDRF Tactical Rescue Bravo-01 to Sector Bravo collapse. Zero subtree cost violations.',
    },
    {
      id: 'ROUTE',
      title: '5. Route',
      subtitle: 'Shortest & Safest Pathfinding',
      desc: 'Calculates the fastest route avoiding flooded underpasses and bridge blockages using Dijkstra and A* heuristics.',
      algorithm: 'Dijkstra / A* with Euclidean Heuristic',
      dsaTag: 'O((V + E) log V)',
      sampleOutput: 'Computed path: HQ -> Bridge 2 -> Sector Bravo. Distance: 4.8 km. ETA: 6.2 mins (Nodes visited: 14).',
    },
    {
      id: 'RESPOND',
      title: '6. Respond',
      subtitle: 'Fleet Dispatch Execution',
      desc: 'Unit transitions to DISPATCHED status. Command stack logs action for instantaneous Undo / Recovery auditability.',
      algorithm: 'Command Pattern Undo/Redo Stack',
      dsaTag: 'O(1) Push / Pop',
      sampleOutput: 'Unit deployed. Undo snapshot recorded in memory stack. Siren telemetry transmitted.',
    },
    {
      id: 'OPTIMIZE',
      title: '7. Optimize',
      subtitle: 'Relief Cargo Payload Packing',
      desc: 'Helicopter airlift weight is constrained. Dynamic Programming 0/1 Knapsack selects highest utility medical and food supplies.',
      algorithm: '0/1 Knapsack Dynamic Programming',
      dsaTag: 'O(N * W) DP Table',
      sampleOutput: 'Selected: 12 trauma kits + 8 water purifiers. Total Weight: 3,450 kg (Capacity: 3,500 kg). Utility: 1,840 pts.',
    },
    {
      id: 'MONITOR',
      title: '8. Monitor',
      subtitle: 'Environmental Sensor Feeds',
      desc: 'Live seismometers, river sluices, and coastal buoy telemetry continuously feed early warning alert thresholds.',
      algorithm: 'Continuous Threshold Trigger & PGA Attenuation',
      dsaTag: 'O(1) Telemetry Feed',
      sampleOutput: 'Seismic M6.4 stable. River sluice level: 4.8m (Warning active). Tsunami wave alert verified.',
    },
    {
      id: 'RESOLVE',
      title: '9. Resolve',
      subtitle: 'Casualty Containment & Clearance',
      desc: 'All victims extricated and transported to Metro General Hospital. Incident transitioned to RESOLVED state.',
      algorithm: 'State Machine Transition Validator',
      dsaTag: 'O(1) State Update',
      sampleOutput: 'Incident status: RESOLVED. Shelters accommodated 42 displaced residents. Responders returning to base.',
    },
    {
      id: 'LEARN',
      title: '10. Learn',
      subtitle: 'Computational Syllabus Reflection',
      desc: 'System archives performance logs. Student reviews algorithm complexity, branch pruning stats, and latency benchmarks.',
      algorithm: 'Algorithmic Post-Mortem & Viva Analytics',
      dsaTag: 'DSA Synthesis',
      sampleOutput: 'Simulation Cycle Complete! 10 algorithms successfully executed. Proceed to syllabus viva quiz.',
    },
  ];

  const quizQuestions: QuizQuestion[] = [
    {
      id: 1,
      question: 'When floodwaters wash away arterial bridges, which Data Structure is optimal for detecting isolated, unreachable disaster zones in near O(1) time?',
      options: [
        'Disjoint Set Union (Union-Find) with path compression',
        'Binary Search Tree (BST)',
        'Breadth-First Search on a dense adjacency matrix',
        'Simple Stack'
      ],
      correctIndex: 0,
      syllabusCategory: 'Graph Theory & Disjoint Sets',
      dsaPrinciple: 'DSU / Union by Rank',
      explanation: 'Disjoint Set Union (DSU) maintains dynamic connectivity components in O(E * alpha(V)) time, allowing near-instant identification of severed nodes cut off from hospital bases.',
    },
    {
      id: 2,
      question: 'Why is Branch & Bound preferable to a purely greedy assignment algorithm when dispatching specialized disaster rescue teams?',
      options: [
        'It randomly guesses the best assignment without checking costs',
        'It systematically explores assignments and prunes subtrees whose lower bounds exceed the best known cost, guaranteeing global optimality',
        'It has a worst-case time complexity of O(1)',
        'It only works for unweighted graphs'
      ],
      correctIndex: 1,
      syllabusCategory: 'Optimization & Backtracking',
      dsaPrinciple: 'Branch & Bound Pruning',
      explanation: 'Greedy algorithms can get trapped in local optima that leave critical emergencies stranded. Branch & Bound calculates lower bounds and prunes suboptimal branches while guaranteeing the minimal overall response cost.',
    },
    {
      id: 3,
      question: 'In the 0/1 Knapsack problem for emergency helicopter cargo, why does a greedy approach by (Value / Weight) ratio fail to guarantee the optimal solution?',
      options: [
        'Items cannot be fractionally divided, so greedily picking highest ratios may leave unused weight capacity that could have fit higher total value items',
        'Dynamic programming is always faster than greedy',
        'Weights can be negative in disaster logistics',
        'Greedy algorithms cannot run on arrays'
      ],
      correctIndex: 0,
      syllabusCategory: 'Dynamic Programming',
      dsaPrinciple: '0/1 Knapsack Subproblem Overlap',
      explanation: 'Because items are 0/1 (all-or-nothing), greedy ratio selection can leave awkward empty weight capacity. 0/1 Knapsack DP solves overlapping subproblems to find the exact combination maximizing utility.',
    },
    {
      id: 4,
      question: 'In an emergency priority queue, what algorithmic mechanism prevents lower-priority emergencies (like localized street flooding) from starving indefinitely while severe earthquakes occur?',
      options: [
        'First-In First-Out (FIFO) queue order',
        'Priority Aging formula: P_calc = P_base + alpha * waiting_minutes',
        'Deleting old emergencies automatically',
        'Round-robin random scheduling'
      ],
      correctIndex: 1,
      syllabusCategory: 'Heaps & Priority Queues',
      dsaPrinciple: 'Starvation Aging',
      explanation: 'Starvation Aging adds a time-weighted increment to an emergency’s base priority for every minute it waits in the queue, ensuring every emergency will eventually rise to the top and receive attention.',
    },
    {
      id: 5,
      question: 'Which self-balancing search tree ensures O(log N) worst-case lookup when indexing response units by readiness preparation windows?',
      options: [
        'AVL Tree with height-balancing rotations',
        'Standard Unbalanced Binary Search Tree',
        'Array with linear scan',
        'Singly Linked List'
      ],
      correctIndex: 0,
      syllabusCategory: 'Balanced Search Trees',
      dsaPrinciple: 'AVL Tree Balancing & Rotations',
      explanation: 'An AVL tree strictly enforces that the heights of two child subtrees differ by at most 1. Whenever an insertion or deletion violates this, Left or Right rotations restore O(log N) balance.',
    },
  ];

  const handleSelectOption = (idx: number) => {
    setSelectedOption(idx);
    setShowExplanation(true);
    if (idx === quizQuestions[quizIndex].correctIndex) {
      setQuizScore((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setShowExplanation(false);
    if (quizIndex < quizQuestions.length - 1) {
      setQuizIndex(quizIndex + 1);
    } else {
      // Finished quiz
      setActiveMode('SIMULATION');
    }
  };

  return (
    <div id="simulation-academy-page" className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
              Disaster Management & DSA Syllabus Lab
            </span>
            <span className="text-xs text-slate-500 font-medium">Interactive Student Sandbox</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Simulation & Learning Academy
          </h1>
          <p className="text-xs text-slate-500">
            Follow the complete emergency lifecycle from initial citizen SOS to algorithmic resolution, or test your syllabus knowledge with the Viva Quiz.
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl">
          <button
            onClick={() => setActiveMode('SIMULATION')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeMode === 'SIMULATION' ? 'bg-white text-indigo-700 shadow-sm shadow-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            10-Step Simulation
          </button>
          <button
            onClick={() => setActiveMode('QUIZ_VIVA')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeMode === 'QUIZ_VIVA' ? 'bg-white text-purple-700 shadow-sm shadow-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Syllabus Viva Quiz ({quizScore}/{quizQuestions.length})</span>
          </button>
          <button
            onClick={() => onNavigateToTab('dsa')}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
          >
            <Cpu className="w-3.5 h-3.5 text-sky-600" />
            <span>11 DSA Hub →</span>
          </button>
        </div>
      </div>

      {/* Mode 1: 10-Step Interactive Simulation */}
      {activeMode === 'SIMULATION' && (
        <div className="space-y-6">
          
          {/* Step Timeline Indicator */}
          <div className="glass-card p-4 rounded-3xl border border-slate-100 overflow-x-auto">
            <div className="flex items-center justify-between min-w-[720px] gap-2">
              {lifecycleSteps.map((step, idx) => {
                const isCurrent = currentStepIndex === idx;
                const isPast = currentStepIndex > idx;
                return (
                  <button
                    key={step.id}
                    onClick={() => setCurrentStepIndex(idx)}
                    className={`flex flex-col items-center flex-1 transition ${
                      isCurrent ? 'scale-105' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center transition-all ${
                      isCurrent ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 ring-2 ring-indigo-300' :
                      isPast ? 'bg-emerald-100 text-emerald-700' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {isPast ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </div>
                    <span className={`text-[11px] font-bold mt-1.5 whitespace-nowrap ${isCurrent ? 'text-indigo-700' : 'text-slate-600'}`}>
                      {step.title.split('. ')[1]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Step Deep-Dive Card */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/90 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                  Step {currentStepIndex + 1} of 10: {lifecycleSteps[currentStepIndex].subtitle}
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-1">
                  {lifecycleSteps[currentStepIndex].title}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {lifecycleSteps[currentStepIndex].desc}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentStepIndex === 0}
                  onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold disabled:opacity-40 transition"
                >
                  Previous Step
                </button>
                <button
                  onClick={() => setCurrentStepIndex((prev) => (prev + 1) % lifecycleSteps.length)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 flex items-center gap-1.5 transition"
                >
                  <span>{currentStepIndex === lifecycleSteps.length - 1 ? 'Restart Cycle' : 'Next Step'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Algorithm Details Box */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-2xl bg-white/70 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">DSA Mathematical Engine</span>
                <span className="text-xs font-bold text-slate-900 block mt-1">
                  {lifecycleSteps[currentStepIndex].algorithm}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-white/70 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Asymptotic Complexity</span>
                <span className="text-xs font-bold text-indigo-600 block mt-1 font-mono">
                  {lifecycleSteps[currentStepIndex].dsaTag}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-white/70 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Operational Outcome</span>
                <span className="text-xs font-bold text-emerald-600 block mt-1">
                  Deterministic Global Optimum
                </span>
              </div>
            </div>

            {/* Real-Time Algorithmic Execution Console Log */}
            <div className="p-4 rounded-2xl bg-slate-900 text-slate-200 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[10px] text-slate-400">
                <span>SIMULATION ENGINE TERMINAL OUTPUT</span>
                <span className="text-emerald-400">STATUS: STEP ACTIVE</span>
              </div>
              <p className="text-indigo-300">&gt; {lifecycleSteps[currentStepIndex].sampleOutput}</p>
              <p className="text-slate-500 text-[11px] mt-1">&gt; Memory footprint allocated: 1.4 KB. Step verified by Commander Safeguard.</p>
            </div>
          </div>

        </div>
      )}

      {/* Mode 2: Syllabus Viva Quiz & Challenge Mode */}
      {activeMode === 'QUIZ_VIVA' && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/90 shadow-xl max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                Question {quizIndex + 1} of {quizQuestions.length}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {quizQuestions[quizIndex].syllabusCategory}
              </span>
            </div>
            <span className="text-xs font-bold text-purple-700">
              Current Score: {quizScore}
            </span>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-6">
            {quizQuestions[quizIndex].question}
          </h2>

          <div className="space-y-3 mb-6">
            {quizQuestions[quizIndex].options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === quizQuestions[quizIndex].correctIndex;

              let btnStyle = 'bg-white/70 border-slate-200 hover:bg-slate-50 text-slate-800';
              if (showExplanation) {
                if (isCorrect) btnStyle = 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold';
                else if (isSelected) btnStyle = 'bg-rose-50 border-rose-300 text-rose-900';
                else btnStyle = 'bg-slate-50/50 border-slate-100 text-slate-400';
              }

              return (
                <button
                  key={idx}
                  disabled={showExplanation}
                  onClick={() => handleSelectOption(idx)}
                  className={`w-full text-left p-3.5 rounded-2xl border text-xs transition flex items-center justify-between ${btnStyle}`}
                >
                  <span>{option}</span>
                  {showExplanation && isCorrect && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation Box */}
          {showExplanation && (
            <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 mb-6 animate-in fade-in">
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900 mb-1">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Syllabus DSA Explanation ({quizQuestions[quizIndex].dsaPrinciple}):</span>
              </div>
              <p className="text-xs text-purple-950 font-medium leading-relaxed">
                {quizQuestions[quizIndex].explanation}
              </p>
            </div>
          )}

          {showExplanation && (
            <div className="flex justify-end">
              <button
                onClick={handleNextQuestion}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-200 flex items-center gap-1.5 transition"
              >
                <span>{quizIndex === quizQuestions.length - 1 ? 'Finish Quiz' : 'Next Question'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
