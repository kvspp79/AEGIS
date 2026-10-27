"""
Lightweight Web Server and REST API for Emergency Dispatch System.
Runs using Python's standard library http.server (Zero external dependencies).
Provides REST endpoints and an embedded interactive web dashboard.
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import urllib.parse
from typing import Dict, Any
from models import DisasterType, SeverityLevel, Coordinates
from services import EmergencyDispatchSystem

# Global singleton system instance for the server
SYSTEM = EmergencyDispatchSystem()


HTML_DASHBOARD = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AEGIS Emergency Dispatch & DSA Control Center</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen">
  <div class="max-w-7xl mx-auto p-6 space-y-6">
    <header class="flex justify-between items-center border-b border-slate-800 pb-4">
      <div>
        <h1 class="text-2xl font-bold text-red-500 flex items-center gap-2">
          <span>🚨</span> AEGIS Emergency Dispatch System (Python)
        </h1>
        <p class="text-sm text-slate-400">Real-time DSA Resource Allocation, Graph Routing & Bed Locator</p>
      </div>
      <div class="flex gap-2">
        <button onclick="undoDispatch()" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs rounded font-medium border border-slate-700">⏪ Undo</button>
        <button onclick="redoDispatch()" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs rounded font-medium border border-slate-700">⏩ Redo</button>
        <button onclick="refreshData()" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-xs rounded font-medium">🔄 Refresh</button>
      </div>
    </header>

    <!-- Metrics Bar -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4" id="stats-grid">
      <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div class="text-xs text-slate-400 font-semibold uppercase">Pending Triage (Heap)</div>
        <div class="text-2xl font-bold text-amber-400 mt-1" id="stat-queue">-</div>
      </div>
      <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div class="text-xs text-slate-400 font-semibold uppercase">Available Responders</div>
        <div class="text-2xl font-bold text-emerald-400 mt-1" id="stat-resp">-</div>
      </div>
      <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div class="text-xs text-slate-400 font-semibold uppercase">Open Hospital Beds</div>
        <div class="text-2xl font-bold text-blue-400 mt-1" id="stat-beds">-</div>
      </div>
      <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div class="text-xs text-slate-400 font-semibold uppercase">Resolved Missions</div>
        <div class="text-2xl font-bold text-purple-400 mt-1" id="stat-resolved">-</div>
      </div>
    </div>

    <!-- Main Content Columns -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Priority Queue List -->
      <div class="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
        <div class="flex justify-between items-center">
          <h2 class="text-lg font-bold text-slate-200">Incident Triage (Max-Heap Priority Order)</h2>
          <button onclick="dispatchTopIncident()" class="px-3 py-1 bg-red-600 hover:bg-red-500 text-xs font-semibold rounded">
            ⚡ Quick Dispatch Top Emergency
          </button>
        </div>
        <div class="space-y-3" id="incidents-container">Loading emergencies...</div>
      </div>

      <!-- Responders & Hospitals -->
      <div class="space-y-6">
        <div class="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3">
          <h2 class="text-md font-bold text-slate-200">Emergency Vehicles & Crew</h2>
          <div class="space-y-2 text-xs" id="responders-container">Loading...</div>
        </div>

        <div class="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3">
          <h2 class="text-md font-bold text-slate-200">Hospital Bed Availability</h2>
          <div class="space-y-2 text-xs" id="hospitals-container">Loading...</div>
        </div>
      </div>
    </div>
  </div>

  <script>
    async function refreshData() {
      try {
        const [statusRes, incRes, respRes, hospRes] = await Promise.all([
          fetch('/api/status').then(r => r.json()),
          fetch('/api/incidents').then(r => r.json()),
          fetch('/api/responders').then(r => r.json()),
          fetch('/api/hospitals').then(r => r.json()),
        ]);

        document.getElementById('stat-queue').innerText = statusRes.priority_queue_size;
        document.getElementById('stat-resp').innerText = `${statusRes.available_responders}/${statusRes.total_responders}`;
        document.getElementById('stat-beds').innerText = `${statusRes.available_beds}/${statusRes.total_hospital_beds}`;
        document.getElementById('stat-resolved').innerText = statusRes.resolved_incidents;

        // Render Incidents
        const incBox = document.getElementById('incidents-container');
        incBox.innerHTML = incRes.map(inc => `
          <div class="bg-slate-950 border border-slate-800 p-4 rounded-lg flex justify-between items-center">
            <div>
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
                  inc.severity === 'CRITICAL' ? 'bg-red-950 text-red-400 border border-red-800' :
                  inc.severity === 'HIGH' ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'bg-blue-950 text-blue-400'
                }">${inc.severity}</span>
                <span class="font-bold text-sm text-slate-200">${inc.title}</span>
              </div>
              <p class="text-xs text-slate-400 mt-1">${inc.location_name} • Casualties: ${inc.casualties} • Priority: <b class="text-amber-400">${inc.calculated_priority || inc.base_priority}/100</b></p>
            </div>
            <div>
              ${inc.status === 'RESPONDING' 
                ? `<button onclick="resolveMission('${inc.id}', '${(inc.assigned_responder_ids||[])[0]}')" class="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold rounded">Resolve Mission</button>` 
                : `<button onclick="dispatchSpecific('${inc.id}')" class="px-3 py-1 bg-red-600 hover:bg-red-500 text-xs font-semibold rounded">Dispatch</button>`
              }
            </div>
          </div>
        `).join('') || '<div class="text-xs text-slate-500">No active incidents.</div>';

        // Render Responders
        const respBox = document.getElementById('responders-container');
        respBox.innerHTML = respRes.map(r => `
          <div class="flex justify-between items-center p-2 rounded bg-slate-950 border border-slate-800">
            <div>
              <div class="font-semibold text-slate-300">${r.name}</div>
              <div class="text-slate-500 text-[10px]">${r.base_station} • ${r.speed_kmh} km/h</div>
            </div>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
              r.status === 'AVAILABLE' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400'
            }">${r.status}</span>
          </div>
        `).join('');

        // Render Hospitals
        const hospBox = document.getElementById('hospitals-container');
        hospBox.innerHTML = hospRes.map(h => `
          <div class="flex justify-between items-center p-2 rounded bg-slate-950 border border-slate-800">
            <div>
              <div class="font-semibold text-slate-300">${h.name}</div>
              <div class="text-slate-500 text-[10px]">${h.location_name}</div>
            </div>
            <div class="text-right">
              <div class="text-emerald-400 font-bold">${h.available_beds} beds free</div>
              <div class="text-slate-500 text-[10px]">${h.capacity_current}/${h.capacity_total}</div>
            </div>
          </div>
        `).join('');

      } catch (e) {
        console.error(e);
      }
    }

    async function dispatchTopIncident() {
      const incs = await fetch('/api/incidents').then(r => r.json());
      const active = incs.find(i => i.status !== 'RESOLVED');
      if (active) dispatchSpecific(active.id);
    }

    async function dispatchSpecific(incId) {
      const res = await fetch('/api/dispatch', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({incident_id: incId})
      }).then(r => r.json());
      alert(`Dispatched ${res.responder.name} to ${res.incident.title}! Route: ${res.route.total_distance_km}km`);
      refreshData();
    }

    async function resolveMission(incId, respId) {
      await fetch('/api/resolve', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({incident_id: incId, responder_id: respId})
      });
      alert('Mission complete! Vehicle returned to AVAILABLE status.');
      refreshData();
    }

    async function undoDispatch() {
      const res = await fetch('/api/undo', {method: 'POST'}).then(r => r.json());
      if (res.action) alert('Reverted last dispatch action.');
      refreshData();
    }

    async function redoDispatch() {
      const res = await fetch('/api/redo', {method: 'POST'}).then(r => r.json());
      if (res.action) alert('Restored dispatch action.');
      refreshData();
    }

    refreshData();
  </script>
</body>
</html>
"""


class DispatchRequestHandler(BaseHTTPRequestHandler):
    def _send_json(self, data: Any, status: int = 200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path in ("/", "/dashboard"):
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(HTML_DASHBOARD.encode("utf-8"))
        elif path == "/api/status":
            self._send_json(SYSTEM.get_system_summary())
        elif path == "/api/incidents":
            incs = [i.to_dict() for i in SYSTEM.db.get_all_incidents()]
            self._send_json(incs)
        elif path == "/api/responders":
            resps = [r.to_dict() for r in SYSTEM.db.get_all_responders()]
            self._send_json(resps)
        elif path == "/api/hospitals":
            hosps = [h.to_dict() for h in SYSTEM.db.get_all_hospitals()]
            self._send_json(hosps)
        elif path == "/api/dsa/routing":
            d_res = SYSTEM.graph.dijkstra("NODE-CBE-01", "NODE-CBE-06")
            a_res = SYSTEM.graph.a_star("NODE-CBE-01", "NODE-CBE-06")
            b_res = SYSTEM.graph.bellman_ford("NODE-CBE-01", "NODE-CBE-06")
            self._send_json({"dijkstra": d_res.to_dict(), "a_star": a_res.to_dict(), "bellman_ford": b_res.to_dict()})
        else:
            self._send_json({"error": "Not Found"}, status=404)

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length).decode("utf-8") if length > 0 else "{}"
        try:
            payload = json.loads(body)
        except json.JSONDecodeError:
            payload = {}

        if path == "/api/dispatch":
            inc_id = payload.get("incident_id")
            if not inc_id:
                self._send_json({"error": "incident_id is required"}, status=400)
                return
            try:
                res = SYSTEM.dispatch_unit(inc_id, payload.get("preferred_responder_id"))
                self._send_json(res)
            except Exception as e:
                self._send_json({"error": str(e)}, status=500)

        elif path == "/api/resolve":
            inc_id = payload.get("incident_id")
            resp_id = payload.get("responder_id")
            res = SYSTEM.complete_mission(inc_id, resp_id)
            self._send_json(res)

        elif path == "/api/undo":
            res = SYSTEM.undo_last_dispatch()
            self._send_json(res or {"message": "Nothing to undo"})

        elif path == "/api/redo":
            res = SYSTEM.redo_dispatch()
            self._send_json(res or {"message": "Nothing to redo"})

        elif path == "/api/incidents":
            inc = SYSTEM.register_incident(
                title=payload.get("title", "Emergency Report"),
                disaster_type=getattr(DisasterType, payload.get("type", "FLOOD"), DisasterType.FLOOD),
                severity=getattr(SeverityLevel, payload.get("severity", "HIGH"), SeverityLevel.HIGH),
                location_name=payload.get("location_name", "Coimbatore Zone"),
                coordinates=Coordinates(lat=float(payload.get("lat", 11.01)), lng=float(payload.get("lng", 76.96))),
                casualties=int(payload.get("casualties", 0)),
                description=payload.get("description", ""),
            )
            self._send_json(inc.to_dict(), status=201)
        else:
            self._send_json({"error": "Not Found"}, status=404)


def run_server(port: int = 8080):
    server = HTTPServer(("0.0.0.0", port), DispatchRequestHandler)
    print(f"🚀 AEGIS Emergency Dispatch Server running at http://localhost:{port}/")
    print(f"📋 REST API available at http://localhost:{port}/api/status")
    print("Press Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        server.server_close()


if __name__ == "__main__":
    run_server(8080)
