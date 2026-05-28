import { useState, useMemo } from "react";
import {
  Target, TrendingUp, Users, Clock, MapPin, X, ChevronRight,
  CheckCircle2, CircleDot, Loader2, AlertCircle, Search, Eye,
  MessageSquare, Lightbulb, Sparkles, BarChart3, Activity,
  ArrowUpRight, ArrowDownRight, Minus, Calendar, Hash,
  Map, Trash2, Droplet, FileText
} from "lucide-react";
import type { Complaint, ComplaintStatus, CivicMission } from "../App";
import { CIVIC_MISSIONS, CLUSTER_TO_MISSION, CLUSTER_DEPT } from "../App";

interface Props {
  complaints: Complaint[];
  onUpdateComplaint: (id: string, updates: Partial<Complaint>) => void;
}

type DashView = "missions" | "insights" | "timeline";

const STATUS_CONFIG: Record<ComplaintStatus, { label: string; color: string; bg: string; dot: string; Icon: any }> = {
  "Submitted": { label: "Submitted", color: "text-gray-700", bg: "bg-gray-50 border-gray-200", dot: "bg-gray-400", Icon: FileText },
  "Acknowledged": { label: "Acknowledged", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", dot: "bg-blue-400", Icon: CheckCircle2 },
  "Grouped": { label: "Grouped", color: "text-purple-700", bg: "bg-purple-50 border-purple-200", dot: "bg-purple-400", Icon: Users },
  "Routed": { label: "Routed", color: "text-orange-700", bg: "bg-orange-50 border-orange-200", dot: "bg-orange-400", Icon: MapPin },
  "Under Review": { label: "Under Review", color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200", dot: "bg-indigo-400", Icon: Eye },
  "Action Initiated": { label: "Action Initiated", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", dot: "bg-amber-400", Icon: Loader2 },
  "Resolved": { label: "Resolved", color: "text-green-700", bg: "bg-green-50 border-green-200", dot: "bg-green-400", Icon: CheckCircle2 },
};

const CLUSTER_ICON: Record<string, React.ElementType> = {
  "Road Issues": Map,
  "Sanitation": Trash2,
  "Water Supply": Droplet,
  "General Issues": FileText,
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// Radial Progress Component
function RadialProgress({ progress, size = 120, strokeWidth = 10, color = "#FFA958" }: {
  progress: number; size?: number; strokeWidth?: number; color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-extrabold text-2xl text-gray-900">{Math.round(progress)}%</span>
        <span className="text-[10px] text-gray-400 uppercase tracking-wider">Complete</span>
      </div>
    </div>
  );
}

// Metric Trend Indicator
function TrendIndicator({ trend }: { trend?: "up" | "down" | "stable" }) {
  if (!trend) return null;
  if (trend === "up") return <ArrowUpRight className="w-3 h-3 text-green-500" />;
  if (trend === "down") return <ArrowDownRight className="w-3 h-3 text-red-500" />;
  return <Minus className="w-3 h-3 text-gray-400" />;
}

// Mission Detail Modal
function MissionDetailModal({ mission, complaints, onClose, onUpdateComplaint }: {
  mission: CivicMission;
  complaints: Complaint[];
  onClose: () => void;
  onUpdateComplaint: (id: string, updates: Partial<Complaint>) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedComplaint = complaints.find(c => c.id === selectedId);

  const stats = {
    total: complaints.length,
    open: complaints.filter(c => c.status === "Open").length,
    inProgress: complaints.filter(c => c.status === "In Progress").length,
    resolved: complaints.filter(c => c.status === "Resolved").length,
    withVision: complaints.filter(c => c.structured_output).length,
  };

  const progress = stats.total > 0 ? (stats.resolved / stats.total) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className={`${mission.bgColor} ${mission.borderColor} border-b px-6 py-5`}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/60 flex items-center justify-center text-2xl">
                {mission.emoji}
              </div>
              <div>
                <h2 className={`font-extrabold text-xl ${mission.color.replace('text-', 'text-')}`}>
                  {mission.name}
                </h2>
                <p className="text-sm text-gray-600 mt-0.5">{mission.description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/60 hover:bg-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Collaborating Departments */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500 font-medium">Collaborating Teams:</span>
            {mission.departments.map(dept => (
              <span key={dept} className="px-2.5 py-1 rounded-full bg-white/60 text-xs font-semibold text-gray-700">
                {dept}
              </span>
            ))}
          </div>
        </div>

        {/* Stats and Progress */}
        <div className="px-6 py-5 bg-gray-50 border-b border-gray-100">
          <div className="grid grid-cols-5 gap-4">
            {/* Radial Progress */}
            <div className="col-span-1 flex items-center justify-center">
              <RadialProgress progress={progress} size={100} strokeWidth={8} color={mission.color.includes('blue') ? '#3b82f6' : mission.color.includes('green') ? '#10b981' : mission.color.includes('purple') ? '#a855f7' : mission.color.includes('cyan') ? '#06b6d4' : '#f97316'} />
            </div>

            {/* Quick Stats */}
            <div className="col-span-4 grid grid-cols-4 gap-3">
              {[
                { label: "Total Issues", value: stats.total, icon: Hash, color: "text-gray-600" },
                { label: "In Progress", value: stats.inProgress, icon: Activity, color: "text-orange-600" },
                { label: "Resolved", value: stats.resolved, icon: CheckCircle2, color: "text-green-600" },
                { label: "Citizen Visions", value: stats.withVision, icon: Sparkles, color: "text-[#FFA958]" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-white rounded-xl p-3 border border-gray-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-3.5 h-3.5 ${color}`} />
                    <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{label}</span>
                  </div>
                  <p className={`font-extrabold text-2xl ${color}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Live Metrics */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {mission.metrics.map(metric => (
              <div key={metric.label} className="bg-white rounded-xl p-3 border border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">{metric.label}</span>
                  <TrendIndicator trend={metric.trend} />
                </div>
                <p className="font-bold text-lg text-gray-900 mt-1">{metric.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Complaints List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900">Active Issues ({complaints.length})</h3>
            <div className="flex items-center gap-2">
              {["Open", "In Progress", "Resolved"].map(status => (
                <div key={status} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${STATUS_CONFIG[status as ComplaintStatus].dot}`} />
                  <span className="text-xs text-gray-500">
                    {complaints.filter(c => c.status === status).length}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {complaints.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <Target className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No issues reported for this mission yet</p>
              </div>
            )}

            {complaints.map(complaint => {
              const cfg = STATUS_CONFIG[complaint.status];
              const Icon = cfg.Icon;
              return (
                <button
                  key={complaint.id}
                  onClick={() => setSelectedId(complaint.id)}
                  className="w-full text-left bg-white hover:bg-gray-50 rounded-xl border border-gray-100 p-3.5 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full ${cfg.dot} mt-2 shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 leading-snug line-clamp-2">
                        {complaint.text_input}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <MapPin className="w-3 h-3" />
                          {complaint.location}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          {timeAgo(complaint.timestamp)}
                        </span>
                        {complaint.structured_output && (
                          <span className="flex items-center gap-1 text-xs text-[#FFA958] font-semibold bg-[#FFA958]/10 px-2 py-0.5 rounded-full">
                            <Sparkles className="w-3 h-3" />
                            Vision
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}>
                        {complaint.status}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-600 transition-colors" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Panel for Selected Complaint */}
        {selectedComplaint && (
          <div className="border-t border-gray-200 bg-gray-50 p-4">
            <ComplaintActionPanel
              complaint={selectedComplaint}
              onUpdate={(updates) => {
                onUpdateComplaint(selectedComplaint.id, updates);
                setSelectedId(null);
              }}
              onClose={() => setSelectedId(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Compact Action Panel
function ComplaintActionPanel({ complaint, onUpdate, onClose }: {
  complaint: Complaint;
  onUpdate: (updates: Partial<Complaint>) => void;
  onClose: () => void;
}) {
  const [status, setStatus] = useState(complaint.status);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="font-semibold text-sm text-gray-900 leading-snug line-clamp-2">
            {complaint.text_input}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-400">{complaint.location}</span>
            <span className="text-xs text-gray-300">·</span>
            <span className="text-xs text-gray-400">{timeAgo(complaint.timestamp)}</span>
          </div>
        </div>
        <button onClick={onClose} className="w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center">
          <X className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </div>

      {/* Reflection Data */}
      {complaint.structured_output && (
        <div className="mb-3 p-3 bg-[#FFA958]/5 rounded-lg border border-[#FFA958]/20">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#FFA958]" />
            <span className="text-xs font-bold text-[#FFA958] uppercase tracking-wider">Citizen Vision</span>
          </div>
          <p className="text-xs text-gray-700 leading-relaxed line-clamp-3">
            {complaint.structured_output.desired_outcome}
          </p>
        </div>
      )}

      {/* Status Update */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500">Update Status:</span>
        <div className="flex gap-1.5">
          {(["Open", "Assigned", "In Progress", "Resolved"] as const).map(s => {
            const cfg = STATUS_CONFIG[s];
            return (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  status === s
                    ? `${cfg.bg} ${cfg.color} border ${cfg.bg.replace('bg-', 'border-')}`
                    : "bg-gray-100 text-gray-400 hover:bg-gray-150"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => onUpdate({ status, assigned_department: CLUSTER_DEPT[complaint.cluster_id] })}
          className="ml-auto px-4 py-1.5 rounded-lg bg-[#FFA958] text-black text-xs font-bold hover:bg-[#e89840] transition-colors"
        >
          Save & Notify
        </button>
      </div>
    </div>
  );
}

// Main Dashboard
export function MunicipalDashboard({ complaints, onUpdateComplaint }: Props) {
  const [view, setView] = useState<DashView>("missions");
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const selectedMission = selectedMissionId ? CIVIC_MISSIONS[selectedMissionId] : null;

  // Group complaints by mission
  const complaintsByMission = useMemo(() => {
    const grouped: Record<string, Complaint[]> = {};
    Object.keys(CIVIC_MISSIONS).forEach(id => {
      grouped[id] = [];
    });

    complaints.forEach(complaint => {
      const missionId = CLUSTER_TO_MISSION[complaint.cluster_id];
      if (missionId && grouped[missionId]) {
        grouped[missionId].push(complaint);
      }
    });

    return grouped;
  }, [complaints]);

  const stats = useMemo(() => ({
    total: complaints.length,
    open: complaints.filter(c => c.status === "Open").length,
    inProgress: complaints.filter(c => c.status === "In Progress").length,
    resolved: complaints.filter(c => c.status === "Resolved").length,
    withVision: complaints.filter(c => c.structured_output).length,
  }), [complaints]);

  const missionComplaints = selectedMission ? complaintsByMission[selectedMission.id] : [];

  return (
    <div className="size-full flex overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-gray-950 flex flex-col border-r border-white/5">
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-[#FFA958] flex items-center justify-center">
              <Target className="w-4 h-4 text-black" />
            </div>
            <div>
              <p className="font-extrabold text-white text-sm">Municipal Portal</p>
              <p className="text-[10px] text-white/40">Goal-Based Governance</p>
            </div>
          </div>
          <p className="text-xs text-white/60 mt-2">Ward 12 · Bangalore North</p>
        </div>

        <nav className="flex flex-col gap-1.5 p-3">
          {[
            { id: "missions" as DashView, label: "Civic Missions", icon: Target },
            { id: "insights" as DashView, label: "Community Insights", icon: Users },
            { id: "timeline" as DashView, label: "Impact Timeline", icon: Calendar },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                view === id
                  ? "bg-[#FFA958] text-black shadow-lg"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>

        {/* Live City Pulse */}
        <div className="mt-auto p-4 border-t border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <p className="text-xs font-bold text-white/70">Live City Pulse</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Active", val: stats.open + stats.inProgress, color: "text-orange-400" },
              { label: "Resolved", val: stats.resolved, color: "text-green-400" },
              { label: "Visions", val: stats.withVision, color: "text-[#FFA958]" },
              { label: "Total", val: stats.total, color: "text-white" },
            ].map(({ label, val, color }) => (
              <div key={label} className="bg-white/5 rounded-lg p-2">
                <p className="text-[10px] text-white/40">{label}</p>
                <p className={`font-extrabold text-lg ${color}`}>{val}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-extrabold text-gray-900 text-2xl">
                {view === "missions" && "Civic Missions"}
                {view === "insights" && "Community Insights"}
                {view === "timeline" && "Impact Timeline"}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {view === "missions" && "Goal-based governance · Collaborative departments"}
                {view === "insights" && "Citizen reflections · Shared visions · Community voice"}
                {view === "timeline" && "Progress tracking · Before & after · Measurable impact"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search issues..."
                  className="pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FFA958] focus:ring-2 focus:ring-[#FFA958]/20 transition-all w-64"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {view === "missions" && (
            <div className="max-w-7xl mx-auto">
              {/* Overview Stats */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Total Issues", value: stats.total, icon: BarChart3, color: "from-gray-500 to-gray-600", textColor: "text-gray-700" },
                  { label: "Active Now", value: stats.open + stats.inProgress, icon: Activity, color: "from-orange-500 to-orange-600", textColor: "text-orange-700" },
                  { label: "Resolved This Month", value: stats.resolved, icon: CheckCircle2, color: "from-green-500 to-green-600", textColor: "text-green-700" },
                  { label: "Citizen Visions", value: stats.withVision, icon: Sparkles, color: "from-[#FFA958] to-[#f97316]", textColor: "text-[#FFA958]" },
                ].map(({ label, value, icon: Icon, color, textColor }) => (
                  <div key={label} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <p className={`font-extrabold text-3xl ${textColor} mb-1`}>{value}</p>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</p>
                  </div>
                ))}
              </div>

              {/* Mission Cards */}
              <div className="grid grid-cols-2 gap-5">
                {Object.values(CIVIC_MISSIONS).map(mission => {
                  const missionComplaints = complaintsByMission[mission.id] || [];
                  const missionStats = {
                    total: missionComplaints.length,
                    open: missionComplaints.filter(c => c.status === "Open").length,
                    resolved: missionComplaints.filter(c => c.status === "Resolved").length,
                    withVision: missionComplaints.filter(c => c.structured_output).length,
                  };
                  const progress = missionStats.total > 0 ? (missionStats.resolved / missionStats.total) * 100 : 0;

                  return (
                    <button
                      key={mission.id}
                      onClick={() => setSelectedMissionId(mission.id)}
                      className={`text-left bg-white rounded-2xl border-2 ${mission.borderColor} p-6 hover:shadow-xl transition-all group relative overflow-hidden`}
                    >
                      {/* Background Pattern */}
                      <div className={`absolute top-0 right-0 w-32 h-32 ${mission.bgColor} rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition-opacity`} />

                      <div className="relative">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-14 h-14 rounded-2xl ${mission.bgColor} flex items-center justify-center text-2xl`}>
                              {mission.emoji}
                            </div>
                            <div>
                              <h3 className={`font-extrabold text-lg ${mission.color}`}>
                                {mission.name}
                              </h3>
                              <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                                {mission.description}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className={`w-5 h-5 ${mission.color} opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all`} />
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          {mission.metrics.map(metric => (
                            <div key={metric.label} className={`${mission.bgColor} rounded-xl p-2.5`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-gray-600 font-medium uppercase tracking-wider">
                                  {metric.label}
                                </span>
                                <TrendIndicator trend={metric.trend} />
                              </div>
                              <p className="font-bold text-sm text-gray-900">{metric.value}</p>
                            </div>
                          ))}
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-medium text-gray-500">Resolution Progress</span>
                            <span className="text-xs font-bold text-gray-900">{Math.round(progress)}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${mission.bgColor.replace('bg-', 'bg-').replace('-50', '-400')} rounded-full transition-all duration-1000`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Stats Footer */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full bg-amber-400" />
                              <span className="text-xs text-gray-600">{missionStats.open} Open</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full bg-green-400" />
                              <span className="text-xs text-gray-600">{missionStats.resolved} Resolved</span>
                            </div>
                            {missionStats.withVision > 0 && (
                              <div className="flex items-center gap-1.5">
                                <Sparkles className="w-3 h-3 text-[#FFA958]" />
                                <span className="text-xs font-semibold text-[#FFA958]">{missionStats.withVision} Visions</span>
                              </div>
                            )}
                          </div>
                          <span className="text-xs font-bold text-gray-400">{missionStats.total} Total</span>
                        </div>

                        {/* Collaborating Departments */}
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] text-gray-400 font-medium">Teams:</span>
                            {mission.departments.slice(0, 2).map(dept => (
                              <span key={dept} className="px-2 py-0.5 rounded-full bg-gray-100 text-[10px] font-semibold text-gray-600">
                                {dept}
                              </span>
                            ))}
                            {mission.departments.length > 2 && (
                              <span className="text-[10px] text-gray-400">+{mission.departments.length - 2}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {view === "insights" && (
            <div className="max-w-6xl mx-auto">
              <CommunityInsightsView complaints={complaints} />
            </div>
          )}

          {view === "timeline" && (
            <div className="max-w-6xl mx-auto">
              <ImpactTimelineView complaints={complaints} />
            </div>
          )}
        </div>
      </main>

      {/* Mission Detail Modal */}
      {selectedMission && (
        <MissionDetailModal
          mission={selectedMission}
          complaints={missionComplaints}
          onClose={() => setSelectedMissionId(null)}
          onUpdateComplaint={onUpdateComplaint}
        />
      )}
    </div>
  );
}

// Community Insights View
function CommunityInsightsView({ complaints }: { complaints: Complaint[] }) {
  const withVisions = complaints.filter(c => c.structured_output);

  return (
    <div className="flex flex-col gap-6">
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <p className="font-extrabold text-3xl text-blue-700">{complaints.length}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Citizen Voices</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="w-8 h-8 text-[#FFA958]" />
            <div>
              <p className="font-extrabold text-3xl text-[#FFA958]">{withVisions.length}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Shared Visions</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <div>
              <p className="font-extrabold text-3xl text-green-700">{Math.round((withVisions.length / complaints.length) * 100) || 0}%</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Engagement Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Vision Feed */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-extrabold text-gray-900 text-lg mb-4">Community Vision Feed</h3>
        <div className="flex flex-col gap-3">
          {withVisions.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Lightbulb className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No citizen visions submitted yet</p>
            </div>
          )}

          {withVisions.slice(0, 10).map(c => (
            <div key={c.id} className="bg-gradient-to-br from-[#FFA958]/5 to-transparent rounded-xl border border-[#FFA958]/20 p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[#FFA958] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-[#FFA958] flex items-center gap-1">
                      {(() => {
                        const Icon = CLUSTER_ICON[c.cluster_id] || Map;
                        return <Icon className="w-3.5 h-3.5" />;
                      })()}
                      {c.cluster_id}
                    </span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-400">{timeAgo(c.timestamp)}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 mb-1.5">{c.structured_output!.issue}</p>
                  <p className="text-xs text-gray-600 mb-2 leading-relaxed">{c.structured_output!.why_it_matters}</p>
                  <div className="bg-white/60 rounded-lg p-3 border border-[#FFA958]/30">
                    <p className="text-xs font-medium text-gray-500 mb-1">Desired Outcome:</p>
                    <p className="text-sm font-bold text-gray-900 leading-snug">{c.structured_output!.desired_outcome}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Impact Timeline View
function ImpactTimelineView({ complaints }: { complaints: Complaint[] }) {
  const sorted = [...complaints].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h3 className="font-extrabold text-gray-900 text-lg mb-6">Impact Timeline · Live Updates</h3>

      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

        <div className="flex flex-col gap-4">
          {sorted.map((c, idx) => {
            const cfg = STATUS_CONFIG[c.status];
            const Icon = cfg.Icon;

            return (
              <div key={c.id} className="relative pl-14">
                {/* Timeline Dot */}
                <div className={`absolute left-[18px] top-2 w-4 h-4 rounded-full ${cfg.dot} border-4 border-white shadow-lg`} />

                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}>
                        {c.status}
                      </span>
                      <span className="text-xs text-gray-500">{timeAgo(c.timestamp)}</span>
                    </div>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      {(() => {
                        const Icon = CLUSTER_ICON[c.cluster_id] || Map;
                        return <Icon className="w-3.5 h-3.5" />;
                      })()}
                      {c.cluster_id}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-gray-900 mb-2">{c.text_input}</p>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {c.location}
                    </span>
                    {c.assigned_department && (
                      <span className="text-xs text-blue-600 font-medium">→ {c.assigned_department}</span>
                    )}
                    {c.structured_output && (
                      <span className="text-xs text-[#FFA958] font-semibold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Vision submitted
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
