import { useMemo, useEffect, useCallback } from 'react';
import { Responder, Incident, IncidentStatus } from '../types';

export interface ActiveMissionVehicle {
  responder: Responder;
  incident?: Incident;
  missionDurationMinutes: number;
}

export function useActiveMissionVehicles(
  responders: Responder[],
  incidents: Incident[],
  onRecycleResponder?: (responderId: string) => void,
  onUpdateIncidentStatus?: (incidentId: string, status: IncidentStatus) => void
) {
  // Automatically recycle any responder assigned to a RESOLVED or non-existent incident
  useEffect(() => {
    responders.forEach((resp) => {
      if (resp.assignedIncidentId) {
        const matchingInc = incidents.find((i) => i.id === resp.assignedIncidentId);
        // If the incident is resolved or not found, recycle the vehicle back to AVAILABLE
        if (!matchingInc || matchingInc.status === 'RESOLVED') {
          if (resp.status !== 'AVAILABLE') {
            onRecycleResponder?.(resp.id);
          }
        }
      }
    });
  }, [incidents, responders, onRecycleResponder]);

  // Filter: ONLY vehicles currently assigned to an active mission
  // (must have assignedIncidentId and corresponding incident must NOT be 'RESOLVED')
  const activeMissionVehicles = useMemo<ActiveMissionVehicle[]>(() => {
    return responders
      .filter((r) => {
        if (!r.assignedIncidentId) return false;
        const matchingInc = incidents.find((i) => i.id === r.assignedIncidentId);
        return matchingInc !== undefined && matchingInc.status !== 'RESOLVED';
      })
      .map((r) => {
        const matchingInc = incidents.find((i) => i.id === r.assignedIncidentId);
        let durationMinutes = 5;
        if (matchingInc?.reportedAt) {
          const diffMs = Date.now() - new Date(matchingInc.reportedAt).getTime();
          if (!isNaN(diffMs) && diffMs > 0) {
            durationMinutes = Math.max(1, Math.round(diffMs / 60000));
          }
        }
        return {
          responder: r,
          incident: matchingInc,
          missionDurationMinutes: durationMinutes,
        };
      });
  }, [responders, incidents]);

  // Available fleet vehicles (ready for deployment)
  const availableVehicles = useMemo<Responder[]>(() => {
    return responders.filter((r) => {
      if (r.status === 'AVAILABLE') return true;
      if (!r.assignedIncidentId) return true;
      const matchingInc = incidents.find((i) => i.id === r.assignedIncidentId);
      return !matchingInc || matchingInc.status === 'RESOLVED';
    });
  }, [responders, incidents]);

  // Manually complete a mission: marks incident resolved and recycles vehicle back to available
  const completeMissionAndRecycle = useCallback(
    (incidentId: string, responderId: string) => {
      onUpdateIncidentStatus?.(incidentId, 'RESOLVED');
      onRecycleResponder?.(responderId);
    },
    [onUpdateIncidentStatus, onRecycleResponder]
  );

  return {
    activeMissionVehicles,
    availableVehicles,
    totalActiveMissions: activeMissionVehicles.length,
    totalAvailableVehicles: availableVehicles.length,
    completeMissionAndRecycle,
  };
}
