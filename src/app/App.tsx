import { useState } from "react";
import { CitizenView } from "./components/CitizenView";

export type ComplaintStatus = "Open" | "Assigned" | "In Progress" | "Resolved";

export interface StructuredOutput {
  issue: string;
  why_it_matters: string;
  desired_outcome: string;
}

export interface Complaint {
  id: string;
  text_input: string;
  category: string;
  location: string;
  tags: string[];
  status: ComplaintStatus;
  assigned_department: string | null;
  assigned_officer: string | null;
  cluster_id: string;
  timestamp: string;
  // Reflection fields
  context?: string;
  past_context?: string;
  vision?: string;
  structured_output?: StructuredOutput | null;
}

export function getCluster(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("pothole") || lower.includes("road") || lower.includes("street") || lower.includes("pavement"))
    return "Road Issues";
  if (lower.includes("garbage") || lower.includes("waste") || lower.includes("trash") || lower.includes("dump") || lower.includes("sanit"))
    return "Sanitation";
  if (lower.includes("water") || lower.includes("drain") || lower.includes("flood") || lower.includes("tap") || lower.includes("pipe"))
    return "Water Supply";
  return "General Issues";
}

export const DEPARTMENTS = [
  "Roads Department",
  "Sanitation Department",
  "Water Supply Department",
  "General Administration",
];

export const DEPT_OFFICERS: Record<string, string> = {
  "Roads Department": "Officer A",
  "Sanitation Department": "Officer B",
  "Water Supply Department": "Officer C",
  "General Administration": "Officer D",
};

export const CLUSTER_DEPT: Record<string, string> = {
  "Road Issues": "Roads Department",
  "Sanitation": "Sanitation Department",
  "Water Supply": "Water Supply Department",
  "General Issues": "General Administration",
};

export const CLUSTER_COMMUNITY_PCT: Record<string, number> = {
  "Road Issues": 34,
  "Sanitation": 27,
  "Water Supply": 22,
  "General Issues": 15,
};

const now = Date.now();

const SEED: Complaint[] = [
  {
    id: "s1",
    text_input: "Pothole on MG Road near bus station floods every monsoon, kids late to school daily",
    category: "Infrastructure",
    location: "MG Road, Ward 12",
    tags: ["pothole", "roads", "monsoon"],
    status: "In Progress",
    assigned_department: "Roads Department",
    assigned_officer: "Officer A",
    cluster_id: "Road Issues",
    timestamp: new Date(now - 3600000 * 5).toISOString(),
    context: "I take this route every morning. During rains it completely floods and the pothole is almost a foot deep.",
    past_context: "Two years ago this road was well-maintained after the last repair cycle. It started deteriorating during last monsoon.",
    vision: "The road needs a proper re-lay, not a patch job. Permanent fix with good drainage alongside.",
    structured_output: {
      issue: "Pothole on MG Road near bus station floods every monsoon, kids late to school daily",
      why_it_matters: "I take this route every morning. During rains it completely floods and the pothole is almost a foot deep.",
      desired_outcome: "The road needs a proper re-lay, not a patch job. Permanent fix with good drainage alongside.",
    },
  },
  {
    id: "s2",
    text_input: "Large crater near the school gate is dangerous for two-wheelers at night",
    category: "Infrastructure",
    location: "School Road, Ward 12",
    tags: ["pothole", "roads", "safety"],
    status: "Open",
    assigned_department: null,
    assigned_officer: null,
    cluster_id: "Road Issues",
    timestamp: new Date(now - 3600000 * 3).toISOString(),
  },
  {
    id: "s3",
    text_input: "Garbage not collected from our colony for 3 days, serious health hazard",
    category: "Sanitation",
    location: "Sector 7, Ward 12",
    tags: ["garbage", "sanitation", "health"],
    status: "Assigned",
    assigned_department: "Sanitation Department",
    assigned_officer: "Officer B",
    cluster_id: "Sanitation",
    timestamp: new Date(now - 3600000 * 8).toISOString(),
    context: "The smell is unbearable, children are falling sick.",
    vision: "Daily pickup schedule that actually gets followed, and a proper bin at each block entrance.",
    structured_output: {
      issue: "Garbage not collected from our colony for 3 days, serious health hazard",
      why_it_matters: "The smell is unbearable, children are falling sick.",
      desired_outcome: "Daily pickup schedule that actually gets followed, and a proper bin at each block entrance.",
    },
  },
  {
    id: "s4",
    text_input: "Water supply has been irregular for 5 days, taps run dry from 6am onwards",
    category: "Utilities",
    location: "Colony Block C, Ward 12",
    tags: ["water", "supply", "shortage"],
    status: "Open",
    assigned_department: null,
    assigned_officer: null,
    cluster_id: "Water Supply",
    timestamp: new Date(now - 3600000 * 2).toISOString(),
  },
  {
    id: "s5",
    text_input: "Drain near market area blocked causing flooding during every light rain",
    category: "Drainage",
    location: "Market Street, Ward 12",
    tags: ["water", "drain", "flooding"],
    status: "Assigned",
    assigned_department: "Water Supply Department",
    assigned_officer: "Officer C",
    cluster_id: "Water Supply",
    timestamp: new Date(now - 3600000 * 12).toISOString(),
  },
  {
    id: "s6",
    text_input: "Waste dumped openly near park entry, children playing there are at risk",
    category: "Sanitation",
    location: "Park Avenue, Ward 12",
    tags: ["garbage", "sanitation", "children"],
    status: "Resolved",
    assigned_department: "Sanitation Department",
    assigned_officer: "Officer B",
    cluster_id: "Sanitation",
    timestamp: new Date(now - 3600000 * 36).toISOString(),
  },
];

export default function App() {
  const [complaints, setComplaints] = useState<Complaint[]>(SEED);

  const addComplaint = (text: string, location: string): Complaint => {
    const complaint: Complaint = {
      id: Date.now().toString(),
      text_input: text,
      category: "Uncategorized",
      location: location || "Ward 12",
      tags: [],
      status: "Open",
      assigned_department: null,
      assigned_officer: null,
      cluster_id: getCluster(text),
      timestamp: new Date().toISOString(),
    };
    setComplaints((prev) => [complaint, ...prev]);
    return complaint;
  };

  const updateComplaint = (id: string, updates: Partial<Complaint>) => {
    setComplaints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  return (
    <div className="size-full">
      <CitizenView
        complaints={complaints}
        onAddComplaint={addComplaint}
        onUpdateComplaint={updateComplaint}
      />
    </div>
  );
}
