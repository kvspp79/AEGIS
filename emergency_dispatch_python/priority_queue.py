"""
Emergency Priority Queue Module (Max-Heap with Dynamic Aging)

ALGORITHM SPECIFICATION:
- Name: Binary Max-Heap with Starvation-Free Aging Formula
- Feature: Emergency Incident Triaging & Dispatch Ordering
- Why Suitable:
  In emergency disaster management, critical incidents (mass casualties, collapsed structures)
  must be addressed before lower-priority incidents. However, static priorities cause "starvation",
  where moderate incidents wait indefinitely.
  A Binary Max-Heap guarantees O(1) peek for the most urgent incident and O(log N) insert/extract,
  while an aging function dynamically increases incident priority over time:
    Priority = basePriority * 0.4 + severityBonus + casualtyBonus + (agingMinutes * agingRate)
  This ensures even moderate emergencies eventually bubble to the top if unattended.
- Python File: priority_queue.py
- Key Functions:
  - insert(incident): O(log N)
  - extract_max(): O(log N)
  - peek(): O(1)
  - reapply_aging(): O(N) rebuilds heap in linear time using Floyd's heapify algorithm
"""

from typing import List, Optional
import copy
from models import Incident, SeverityLevel


class EmergencyPriorityQueue:
    """
    Max-Heap data structure tailored for emergency triage.
    Maintains incident priority dynamically based on casualties, severity,
    base risk rating, and elapsed waiting time (aging).
    """

    def __init__(self, aging_rate_per_minute: float = 0.5):
        """
        Initialize an empty Max-Heap.
        
        Args:
            aging_rate_per_minute: Priority boost added per minute of waiting (default 0.5 pts/min).
        """
        self.heap: List[Incident] = []
        self.aging_rate_per_minute: float = aging_rate_per_minute

    def calculate_dynamic_priority(self, incident: Incident) -> int:
        """
        Calculates dynamic triage priority score (range 1 - 100).
        
        Formula:
          - Base weight: 40% of base priority
          - Severity tier bonus: CRITICAL=50, SEVERE=35, MODERATE=20, LOW/WATCH=10
          - Casualty escalation factor: 3 points per reported victim
          - Aging starvation prevention: aging_minutes * aging_rate_per_minute
        
        Returns:
            Integer priority capped at 100.
        """
        casualty_factor = incident.casualties * 3

        sev = incident.severity.value if isinstance(incident.severity, SeverityLevel) else str(incident.severity)
        if sev in ("CRITICAL", "EXTREME"):
            severity_factor = 50
        elif sev in ("SEVERE", "HIGH"):
            severity_factor = 35
        elif sev == "MODERATE":
            severity_factor = 20
        else:
            severity_factor = 10

        aging_boost = incident.aging_minutes * self.aging_rate_per_minute
        score = int(round(incident.base_priority * 0.4 + severity_factor + casualty_factor + aging_boost))
        return min(100, max(1, score))

    def insert(self, incident: Incident) -> int:
        """
        Inserts an incident into the priority heap.
        Calculates dynamic priority and bubbles up to maintain Max-Heap invariant.
        
        Complexity: O(log N) time, O(1) auxiliary space.
        
        Returns:
            The calculated priority score assigned to the incident.
        """
        incident_copy = copy.deepcopy(incident)
        calculated_pri = self.calculate_dynamic_priority(incident_copy)
        incident_copy.calculated_priority = calculated_pri

        self.heap.append(incident_copy)
        self._bubble_up(len(self.heap) - 1)
        return calculated_pri

    def extract_max(self) -> Optional[Incident]:
        """
        Removes and returns the incident with the highest priority score.
        Moves the last element to the root and restores heap invariant via bubble_down.
        
        Complexity: O(log N) time.
        
        Returns:
            The highest priority Incident, or None if heap is empty.
        """
        if not self.heap:
            return None

        max_incident = self.heap[0]
        last_item = self.heap.pop()

        if self.heap:
            self.heap[0] = last_item
            self._bubble_down(0)

        return max_incident

    def peek(self) -> Optional[Incident]:
        """
        Inspects the highest priority incident without removing it.
        Complexity: O(1) time.
        """
        return self.heap[0] if self.heap else None

    def size(self) -> int:
        """Returns the number of incidents currently queued."""
        return len(self.heap)

    def is_empty(self) -> bool:
        """Returns True if the priority queue contains no incidents."""
        return len(self.heap) == 0

    def get_heap_array(self) -> List[Incident]:
        """Returns a shallow copy of the underlying heap array."""
        return list(self.heap)

    def reapply_aging(self, additional_minutes: int = 5) -> None:
        """
        Simulates the passage of time:
        1. Loops through every incident in O(N) time and increments waiting minutes.
        2. Recalculates dynamic priority with starvation-prevention boost.
        3. Rebuilds heap using Floyd's bottom-up heapify in O(N) time.
        
        Complexity: O(N) overall.
        """
        for item in self.heap:
            item.aging_minutes += additional_minutes
            item.calculated_priority = self.calculate_dynamic_priority(item)

        self._rebuild_heap()

    def _bubble_up(self, index: int) -> None:
        """
        Restores max-heap property upwards from given index.
        Loop continues while child index > 0 and child priority > parent priority.
        """
        while index > 0:
            parent_idx = (index - 1) // 2
            current_pri = self.heap[index].calculated_priority or 0
            parent_pri = self.heap[parent_idx].calculated_priority or 0

            if current_pri <= parent_pri:
                break

            # Swap child with parent
            self.heap[index], self.heap[parent_idx] = self.heap[parent_idx], self.heap[index]
            index = parent_idx

    def _bubble_down(self, index: int) -> None:
        """
        Restores max-heap property downwards from given index.
        Loop compares parent with left and right children, swapping with largest child.
        """
        length = len(self.heap)
        while True:
            largest = index
            left = 2 * index + 1
            right = 2 * index + 2

            largest_pri = self.heap[largest].calculated_priority or 0

            if left < length and (self.heap[left].calculated_priority or 0) > largest_pri:
                largest = left
                largest_pri = self.heap[largest].calculated_priority or 0

            if right < length and (self.heap[right].calculated_priority or 0) > largest_pri:
                largest = right

            if largest == index:
                break

            self.heap[index], self.heap[largest] = self.heap[largest], self.heap[index]
            index = largest

    def _rebuild_heap(self) -> None:
        """
        Floyd's algorithm for bottom-up heap construction.
        Starts at the last non-leaf node ((N // 2) - 1) down to 0, running bubble_down.
        Complexity: O(N).
        """
        for i in range(len(self.heap) // 2 - 1, -1, -1):
            self._bubble_down(i)
