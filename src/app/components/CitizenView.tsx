import { useState, useRef, useEffect } from "react";
import {
  Send, MapPin, ArrowLeft, Users, Clock, CheckCircle2,
  CircleDot, Loader2, AlertCircle, Mic, ChevronRight, SkipForward,
  FileText, Bell, User, TrendingUp, BarChart2, Award, Heart, Eye, Plus,
  Map, Trash2, Droplet, Sparkles, Shield, Check
} from "lucide-react";
import type { Complaint, ComplaintStatus, StructuredOutput } from "../App";
import { getCluster, inferIntent, CLUSTER_DEPT, CLUSTER_COMMUNITY_PCT } from "../App";
import { CivicStructure, SystemState } from "./ui/CivicStructure";
import { LocationPicker } from "./ui/LocationPicker";

// ─── i18n ────────────────────────────────────────────────────────────────────

type Lang = "en" | "hi";

const T: Record<Lang, Record<string, string>> = {
  en: {
    welcome: "Welcome back",
    greeting: "Hello Rajesh,",
    hero: "What would make this city work better for you?",
    tagline: "Your voice shapes the city's priorities",
    placeholder: "Describe your concern… (e.g. pothole on MG Road)",
    location_ph: "Location (optional)",
    cluster_preview: "Will be filed under:",
    submit: "Submit Complaint",
    // Ack screen
    ack_heading: "We've received your complaint",
    ack_conveyed: "We have conveyed this to the authorities that are responsible.",
    ack_question: "If you have 2 more minutes, can you tell us more about it?",
    ack_continue: "Yes, tell us more",
    ack_skip: "Skip for now",
    // Reflection steps
    step_of: "of",
    step_context_q: "How is this affecting your daily life?",
    step_context_ph: "This affects my daily commute…",
    chip_commute: "This is affecting my commute",
    chip_harder: "This makes it harder to get to work or school",
    chip_safety: "This affects my safety / health / time",
    chip_others: "This also affects others in the area",
    step_past_q: "Tell me more about what was different before.",
    step_past_ph: "Earlier this stretch was well-maintained…",
    chip_freq: "This is happening more frequently",
    chip_worse: "It has gotten significantly worse recently",
    chip_ignored: "Previous reports seem to be ignored",
    chip_past_others: "Others have also noticed this change",
    step_vision_q: "What do you think can be done about it?",
    step_vision_ph: "The roads should be properly repaired, not just patched…",
    chip_repair: "Complete repair instead of temporary fix",
    chip_inspect: "Regular inspection and maintenance",
    chip_update: "Modernize the infrastructure",
    chip_vision_others: "I just want it working again",
    step_vision_note: "This is the most important part",
    voice_hint: "Tap mic to record (simulated)",
    next: "Next →",
    skip_step: "Skip",
    // Output card
    your_vision: "Your Vision",
    vision_issue: "Issue",
    vision_why: "Why it matters",
    vision_outcome: "Desired outcome",
    vision_note: "Submitted to municipal system · Now visible to officers",
    continue_to_community: "See community impact →",
    // Community
    vision_heading: "Your Vision",
    vision_subheading: "Structure for Civil Action",
    community_sub: "Your voice joins a growing community movement in your ward.",
    community_stat_pct: "of your ward shares this concern",
    community_stat_similar: "similar reports nearby",
    community_impact_title: "Impact if solved",
    community_impact_desc: "If resolved, this improves daily mobility, safety, and quality of life for many residents.",
    track_complaint: "Track complaint",
    // Tracking
    tracking_title: "Complaint Tracking",
    tracking_sub: "Live updates from municipal system",
    cluster_label: "Cluster",
    similar_label: "Similar complaints in your area",
    first_reporter: "You're the first to report this type of issue!",
    submit_another: "Submit Another Complaint",
    // Status
    awaiting: "Awaiting assignment",
    within_24: "Municipal team will review and assign within 24 hours",
    live_status: "Live Status",
    assigned_to: "Assigned To",
  },
  hi: {
    welcome: "वापसी पर स्वागत",
    greeting: "नमस्ते राजेश,",
    hero: "आप अपने शहर को बेहतर बनाने के लिए क्या चाहते हैं?",
    tagline: "आपकी आवाज़ शहर की प्राथमिकताएं तय करती है",
    placeholder: "अपनी समस्या बताएं… (जैसे MG रोड पर गड्ढा)",
    location_ph: "स्थान (वैकल्पिक)",
    cluster_preview: "इसमें दर्ज होगा:",
    submit: "शिकायत दर्ज करें",
    ack_heading: "आपकी शिकायत मिल गई",
    ack_conveyed: "हमने इसे जिम्मेदार अधिकारियों तक पहुंचा दिया है।",
    ack_question: "क्या आप 2 मिनट में और बता सकते हैं?",
    ack_continue: "हाँ, और बताएं",
    ack_skip: "अभी नहीं",
    step_of: "में से",
    step_context_q: "यह आपके दैनिक जीवन को कैसे प्रभावित कर रहा है?",
    step_context_ph: "यह मेरी रोज़ की यात्रा को प्रभावित करता है…",
    chip_commute: "यह मेरे आवागमन को प्रभावित कर रहा है",
    chip_harder: "इससे काम या स्कूल जाना मुश्किल हो जाता है",
    chip_safety: "यह मेरी सुरक्षा / स्वास्थ्य / समय को प्रभावित करता है",
    chip_others: "यह क्षेत्र के अन्य लोगों को भी प्रभावित करता है",
    step_past_q: "पहले कैसा था? क्या बदला?",
    step_past_ph: "पहले यह सड़क ठीक रहती थी…",
    chip_freq: "यह अधिक बार हो रहा है",
    chip_worse: "हाल ही में यह काफी खराब हो गया है",
    chip_ignored: "पिछली शिकायतों को नजरअंदाज कर दिया गया",
    chip_past_others: "अन्य लोगों ने भी यह बदलाव देखा है",
    step_vision_q: "आपके अनुसार इसका हल क्या हो सकता है?",
    step_vision_ph: "सड़क की ठीक से मरम्मत होनी चाहिए…",
    chip_repair: "अस्थायी समाधान के बजाय पूर्ण मरम्मत",
    chip_inspect: "नियमित निरीक्षण और रखरखाव",
    chip_update: "बुनियादी ढांचे का आधुनिकीकरण करें",
    chip_vision_others: "मैं बस इसे फिर से ठीक काम करते देखना चाहता हूँ",
    step_vision_note: "यह सबसे महत्वपूर्ण हिस्सा है",
    voice_hint: "रिकॉर्ड करने के लिए माइक दबाएं (सिमुलेटेड)",
    next: "अगला →",
    skip_step: "छोड़ें",
    your_vision: "आपकी दृष्टि",
    vision_issue: "समस्या",
    vision_why: "यह क्यों मायने रखती है",
    vision_outcome: "वांछित परिणाम",
    vision_note: "नगर पालिका प्रणाली को भेजा गया",
    continue_to_community: "सामुदायिक प्रभाव देखें →",
    vision_heading: "आपकी दृष्टि",
    vision_subheading: "नागरिक कार्रवाई के लिए संरचना",
    community_sub: "आपकी आवाज़ आपके वार्ड के बढ़ते सामुदायिक आंदोलन से जुड़ती है।",
    community_stat_pct: "वार्ड के लोग यह चिंता साझा करते हैं",
    community_stat_similar: "आसपास की समान शिकायतें",
    community_impact_title: "समाधान होने पर प्रभाव",
    community_impact_desc: "यदि यह हल हो जाता है, तो इससे कई निवासियों की दैनिक गतिशीलता, सुरक्षा और जीवन की गुणवत्ता में सुधार होगा।",
    track_complaint: "शिकायत ट्रैक करें",
    tracking_title: "शिकायत ट्रैकिंग",
    tracking_sub: "नगर पालिका से लाइव अपडेट",
    cluster_label: "क्लस्टर",
    similar_label: "आपके क्षेत्र में समान शिकायतें",
    first_reporter: "आप इस प्रकार की पहली शिकायत दर्ज कर रहे हैं!",
    submit_another: "एक और दर्ज करें",
    awaiting: "असाइनमेंट की प्रतीक्षा",
    within_24: "नगर पालिका 24 घंटे में समीक्षा करेगी",
    live_status: "लाइव स्थिति",
    assigned_to: "सौंपा गया",
  },
};

// ─── Types ───────────────────────────────────────────────────────────────────

type Screen =
  | "landing"
  | "home"
  | "ack"
  | "step_context"
  | "step_past"
  | "step_vision"
  | "output"
  | "community"
  | "tracking";

type Tab = "report" | "updates" | "community" | "profile";

interface Props {
  complaints: Complaint[];
  onAddComplaint: (text: string, location: string) => Complaint;
  onUpdateComplaint: (id: string, updates: Partial<Complaint>) => void;
}

// ─── Screen Components ────────────────────────────────────────────────────────

function LandingScreen({ 
  onStart, hasComplaints, activeComplaint, onGoToUpdate, t 
}: { 
  onStart: () => void, hasComplaints: boolean, activeComplaint?: Complaint | null, onGoToUpdate?: () => void, t: Record<string, string> 
}) {
  const cfg = activeComplaint ? STATUS_CONFIG[activeComplaint.status] : null;

  return (
    <div className="flex flex-col h-full px-6 pt-10 pb-10 bg-transparent relative z-10 overflow-y-auto">
      <div className="mb-auto mt-4 text-center">
        <h1 className="font-extrabold text-black text-3xl tracking-tight drop-shadow-sm opacity-90">
          Sanchaar
        </h1>
        <p className="text-sm font-medium text-black/60 mt-2 max-w-[250px] mx-auto leading-relaxed">
          {hasComplaints 
            ? "A living snapshot of civic activity." 
            : "Your voice shapes the city's priorities. File a complaint to watch it join others and grow into a collective call for action."}
        </p>
      </div>

      {activeComplaint && cfg && onGoToUpdate && (
        <div className="mt-4 bg-white/90 backdrop-blur rounded-2xl border border-black/10 p-4 shadow-lg cursor-pointer hover:border-black/20 active:scale-95 transition-all text-left" onClick={onGoToUpdate}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shadow-sm ${cfg.bg}`}>
              <cfg.Icon className={`w-3 h-3 ${cfg.color}`} />
            </div>
            <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest">Latest Update</p>
          </div>
          <p className="text-sm font-extrabold text-black leading-snug mb-1">{cfg.label}</p>
          <p className="text-[11px] text-black/60 leading-relaxed">{cfg.desc}</p>
          <p className="text-[9px] text-black/30 mt-2 truncate border-t border-black/5 pt-2">Regarding: {activeComplaint.text_input}</p>
        </div>
      )}

      {/* Massive spacer to let the 3D cubes shine */}
      <div className="flex-1 min-h-[350px] pointer-events-none" />

      <div className="mt-auto flex justify-center pb-8">
        <button
          onClick={onStart}
          aria-label="Add complaint"
          className="flex items-center gap-3 bg-[#FFA958] text-black px-6 py-4 rounded-full shadow-2xl shadow-[#FFA958]/30 active:scale-95 transition-all hover:bg-[#FFA958]/90"
        >
          <div className="w-8 h-8 bg-black/10 rounded-full flex items-center justify-center">
            <Plus className="w-5 h-5 text-black" />
          </div>
          <span className="font-bold text-base tracking-wide">Add complaint</span>
        </button>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const STATUS_CONFIG: Record<ComplaintStatus, { label: string; color: string; bg: string; Icon: any; desc: string }> = {
  "Submitted": { label: "Submitted", color: "text-gray-700", bg: "bg-gray-100 border-gray-200", Icon: FileText, desc: "Your complaint has been logged in the system." },
  "Acknowledged": { label: "Acknowledged", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", Icon: CheckCircle2, desc: "Received and acknowledged by the civic system." },
  "Grouped": { label: "Grouped", color: "text-purple-700", bg: "bg-purple-50 border-purple-200", Icon: Users, desc: "Similar complaints from your ward have been linked to this issue." },
  "Routed": { label: "Routed", color: "text-orange-700", bg: "bg-orange-50 border-orange-200", Icon: MapPin, desc: "Sent to the responsible civic authority for review." },
  "Under Review": { label: "Under Review", color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200", Icon: Eye, desc: "The issue is currently being assessed by officers." },
  "Action Initiated": { label: "Action Initiated", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", Icon: Loader2, desc: "Initial action and on-ground work has started." },
  "Resolved": { label: "Resolved", color: "text-green-700", bg: "bg-green-50 border-green-200", Icon: CheckCircle2, desc: "The complaint has been marked resolved." },
};

const CLUSTER_ICON: Record<string, React.ElementType> = {
  "Road Issues": Map,
  "Sanitation": Trash2,
  "Water Supply": Droplet,
  "General Issues": FileText,
};

// ─── Sub-screens (Report tab) ─────────────────────────────────────────────────

function HomeScreen({
  inputText, location, onInput, onLocation, onSubmit, recentCluster, onBack, lang, t,
}: {
  inputText: string; location: string;
  onInput: (v: string) => void; onLocation: (v: string) => void;
  onSubmit: () => void; recentCluster: string | null;
  onBack: () => void;
  lang: Lang; t: Record<string, string>;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canSubmit = inputText.trim().length > 3;
  const preview = inputText.trim() ? getCluster(inputText) : null;

  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState(false);
  const recognitionRef = useRef<any>(null);
  const originalTextRef = useRef("");

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setVoiceError(true);
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      originalTextRef.current = inputText ? inputText + " " : "";
      recognitionRef.current.lang = lang === "hi" ? "hi-IN" : "en-IN";
      
      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setVoiceError(false);
      };
      
      recognitionRef.current.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        onInput(originalTextRef.current + currentTranscript);
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (event.error !== "no-speech") {
            setVoiceError(true);
        }
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        // The value is available in inputText state, but due to closure we read from textarea ref to be safe or just use the preview/inferIntent on render.
      };

      try {
        recognitionRef.current.start();
      } catch (e) {
        setIsListening(false);
        setVoiceError(true);
      }
    }
  };

  // Removed inferredSummary live-inference effect as per user request to not over-interpret

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [inputText]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-7 pt-9 pb-3 relative">
        <button onClick={onBack} className="absolute left-6 top-8 w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-black/40 hover:text-black/60 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3 mb-4 mt-8">
          <div className="w-10 h-10 rounded-full bg-[#FFA958] flex items-center justify-center shrink-0">
            <span className="text-sm font-extrabold text-black">R</span>
          </div>
          <div>
            <p className="text-xs text-black/40 font-medium">{t.welcome}</p>
            <p className="font-bold text-black leading-none">{t.greeting}</p>
          </div>
        </div>
        <h2 className="font-extrabold text-[#FFA757] leading-tight" style={{ fontSize: 24 }}>
          {t.hero}
        </h2>
        <p className="text-xs text-black/35 mt-1">{t.tagline}</p>
      </div>

      {preview && (() => {
        const PreviewIcon = CLUSTER_ICON[preview] || Map;
        return (
          <div className="mx-6 mb-2.5">
            <div className="flex items-center gap-1.5 bg-[#FFA958]/10 border border-[#FFA958]/30 rounded-full px-3 py-1.5 w-fit">
              <PreviewIcon className="w-4 h-4 text-[#FFA958]" />
              <span className="text-xs font-semibold text-[#FFA958]">{t.cluster_preview} {preview}</span>
            </div>
          </div>
        );
      })()}

      <div className="flex-1 px-6 flex flex-col gap-2.5 overflow-y-auto">
        <div className="bg-white/80 backdrop-blur rounded-2xl border border-black/8 shadow-sm overflow-hidden flex flex-col">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => onInput(e.target.value)}
              placeholder={t.placeholder}
              className="w-full px-4 pt-3 pb-12 text-sm text-black bg-transparent resize-none outline-none placeholder:text-black/30 leading-relaxed"
              style={{ minHeight: 90, maxHeight: 150 }}
            />
            <div className="absolute right-3 bottom-3">
              <button 
                onClick={toggleListening}
                aria-label={isListening ? "Stop recording" : "Start voice input"}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full shadow-md transition-all ${
                  isListening 
                    ? "bg-red-500 text-white animate-pulse" 
                    : "bg-[#FFA958] text-black shadow-[#FFA958]/30 hover:bg-[#FFA958]/90"
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isListening ? 'bg-white/20' : 'bg-black/10'}`}>
                  <Mic className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold">{isListening ? "Listening..." : "Record"}</span>
              </button>
            </div>
          </div>
          <div className="border-t border-black/5">
            <LocationPicker value={location} onChange={onLocation} lang={lang} t={t} />
          </div>
        </div>

        {/* Accessibility Live Region */}
        <div aria-live="polite" className="sr-only">
          {isListening ? "Recording started" : "Recording stopped"}
          {voiceError && "I may have misheard that — please review or try again."}
        </div>

        {voiceError && (
          <div className="px-2 text-xs text-red-500/80 font-medium animate-in fade-in slide-in-from-top-1">
            {lang === "en" ? "I may have misheard that — please review or try again." : "शायद मैंने ठीक से नहीं सुना — कृपया समीक्षा करें या पुनः प्रयास करें।"}
          </div>
        )}

        <button
          onClick={onSubmit}
          disabled={!canSubmit}
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all ${
            canSubmit
              ? "bg-[#FFA958] text-black shadow-lg shadow-[#FFA958]/30 active:scale-95"
              : "bg-black/8 text-black/30"
          }`}
        >
          <Send className="w-4 h-4" />
          {t.submit}
        </button>


      </div>

      <div className="px-6 py-3 text-center">
        <p className="text-[10px] text-black/25">
          {lang === "en" ? "Your complaint is private · Ward 12 · Bangalore" : "आपकी शिकायत निजी है · वार्ड 12 · बैंगलोर"}
        </p>
      </div>
    </div>
  );
}

function AckScreen({ complaint, onContinue, onSkip, onBack, t }: {
  complaint: Complaint; onContinue: () => void; onSkip: () => void; onBack: () => void;
  t: Record<string, string>;
}) {
  return (
    <div className="flex flex-col h-full px-7 pt-10 pb-6 relative">
      <button onClick={onBack} className="absolute left-6 top-8 w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-black/40 hover:text-black/60 transition-colors">
        <ArrowLeft className="w-4 h-4" />
      </button>
      <div className="flex flex-col gap-3 mb-8 mt-8">
        <div className="w-12 h-12 rounded-2xl bg-[#FFA958] flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6 text-black" />
        </div>
        <div>
          <p className="font-extrabold text-black text-xl leading-tight">{t.ack_heading}</p>
          <p className="text-sm text-black/50 mt-1">
            {t.ack_conveyed}
          </p>
        </div>
      </div>

      <div className="bg-[#FFA958] rounded-2xl p-4 mb-6">
        <p className="text-sm font-semibold text-black leading-snug line-clamp-3">
          {complaint.text_input}
        </p>
        <div className="flex items-center gap-1.5 mt-2 text-black/50 text-xs">
          <MapPin className="w-3 h-3" />{complaint.location}
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-end gap-3 relative z-10">
        <div className="bg-white/70 backdrop-blur rounded-2xl border border-black/8 p-4">
          <p className="font-extrabold text-[#FFA757] text-lg leading-snug">
            {t.ack_question}
          </p>
          <p className="text-xs text-black/40 mt-1">
            {t["step_of"] === "of"
              ? "3 quick questions · takes ~2 minutes · completely optional"
              : "3 त्वरित प्रश्न · लगभग 2 मिनट · पूरी तरह वैकल्पिक"}
          </p>
        </div>

        <button
          onClick={onContinue}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#FFA958] text-black font-bold text-sm shadow-lg shadow-[#FFA958]/30 active:scale-95 transition-all"
        >
          {t.ack_continue}
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={onSkip}
          className="w-full py-2.5 rounded-2xl text-sm font-semibold text-black/40 hover:text-black/60 transition-colors"
        >
          {t.ack_skip}
        </button>
      </div>
    </div>
  );
}

function ReflectionCard({
  stepNum, totalSteps, question, placeholder, value, onChange,
  onNext, onSkip, onBack, isVision, chips, t,
}: {
  stepNum: number; totalSteps: number;
  question: string; placeholder: string;
  value: string; onChange: (v: string) => void;
  onNext: () => void; onSkip: () => void; onBack: () => void;
  isVision?: boolean;
  chips?: string[];
  t: Record<string, string>;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [micActive, setMicActive] = useState(false);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + "px";
    }
  }, [value]);

  const handleMic = () => {
    setMicActive(true);
    setTimeout(() => setMicActive(false), 1500);
  };

  return (
    <div className="flex flex-col h-full px-6 pt-10 pb-6 relative">
      <button onClick={onBack} className="absolute left-6 top-8 w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-black/40 hover:text-black/60 transition-colors">
        <ArrowLeft className="w-4 h-4" />
      </button>
      <div className="flex items-center gap-2 mb-6 mt-8">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all ${
              i < stepNum ? "bg-[#FFA958]" : i === stepNum - 1 ? "bg-[#FFA958]" : "bg-black/10"
            }`}
          />
        ))}
        <span className="text-[11px] text-black/40 ml-1 shrink-0">{stepNum} {t.step_of} {totalSteps}</span>
      </div>

      <div className="mb-5">
        {isVision && (
          <div className="inline-flex items-center gap-1.5 bg-[#FFA958]/15 text-[#FFA758] text-[10px] font-bold px-2.5 py-1 rounded-full mb-2 uppercase tracking-wider">
            ✦ {t.step_vision_note}
          </div>
        )}
        <p className="font-extrabold text-[#FFA757] text-xl leading-snug">{question}</p>
      </div>

      <div className="flex-1 flex flex-col gap-3 relative z-10 overflow-y-auto pb-4">

        {chips && chips.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-1">
            {chips.map(chip => (
              <button
                key={chip}
                onClick={() => onChange(value ? `${value.trim()} ${chip}` : chip)}
                className="text-[11px] font-medium text-black/60 bg-white/50 backdrop-blur border border-black/5 hover:bg-black/5 hover:text-black/80 px-3 py-1.5 rounded-full transition-all text-left shadow-sm active:scale-95"
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        <div className="bg-white/80 backdrop-blur rounded-2xl border border-black/8 shadow-sm overflow-hidden">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 pt-3 pb-2 text-sm text-black bg-transparent resize-none outline-none placeholder:text-black/30 leading-relaxed"
            style={{ minHeight: 100, maxHeight: 150 }}
          />
          <div className="flex items-center gap-2 px-4 pb-3 pt-1 border-t border-black/5">
            <button
              onClick={handleMic}
              className={`flex items-center gap-1.5 text-xs font-medium transition-all ${
                micActive ? "text-[#FFA958]" : "text-black/30 hover:text-black/50"
              }`}
            >
              <Mic className={`w-3.5 h-3.5 ${micActive ? "animate-pulse" : ""}`} />
              {micActive ? "Listening…" : t.voice_hint}
            </button>
          </div>
        </div>

        <div className="flex gap-2 mt-4 mb-auto">
          <button
            onClick={onSkip}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-sm font-semibold text-black/40 hover:text-black/60 border border-black/10 transition-colors"
          >
            <SkipForward className="w-3.5 h-3.5" />
            {t.skip_step}
          </button>
          <button
            onClick={onNext}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-[#FFA958] text-black font-bold text-sm shadow-md shadow-[#FFA958]/25 active:scale-95 transition-all"
          >
            {t.next}
          </button>
        </div>
      </div>
    </div>
  );
}

function CommunityScreen({ complaint, onTrack, onBack, t }: {
  complaint: Complaint; onTrack: () => void; onBack: () => void; t: Record<string, string>;
}) {
  const pct = CLUSTER_COMMUNITY_PCT[complaint.cluster_id] ?? 18;
  const similarCount = Math.floor(pct * 3.5); // Mock number for nearby reports

  return (
    <div className="flex flex-col h-full px-6 pt-10 pb-6 bg-transparent relative z-10 overflow-y-auto">
      <button onClick={onBack} className="absolute left-6 top-8 w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-black/40 hover:text-black/60 transition-colors">
        <ArrowLeft className="w-4 h-4" />
      </button>
      {/* Top Section */}
      <div className="mb-auto mt-6">
        <p className="font-extrabold text-black text-2xl leading-tight drop-shadow-sm">{t.vision_heading}</p>
        <p className="text-base font-semibold text-black/70 leading-snug mt-1">{t.vision_subheading}</p>
        <p className="text-sm font-medium text-black/50 mt-3 pr-8">{t.community_sub}</p>
      </div>

      {/* Massive spacer for CivicStructure to shine through as central visual anchor without overlap */}
      <div className="flex-1 min-h-[350px] pointer-events-none" />

      {/* Stats Section */}
      <div className="flex flex-col gap-3 mt-auto shrink-0">
        {/* Progression & Legend Section */}
        <div className="bg-white/90 backdrop-blur rounded-3xl p-5 border border-black/10 shadow-lg">
          {/* Progression */}
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex flex-col items-center gap-1 text-center flex-1">
              <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center border border-orange-200">
                <FileText className="w-3.5 h-3.5 text-orange-600" />
              </div>
              <p className="text-[9px] font-bold text-black/60 uppercase tracking-widest mt-1">Logged</p>
            </div>
            <div className="w-4 h-[1px] bg-black/10" />
            <div className="flex flex-col items-center gap-1 text-center flex-1">
              <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center border border-purple-200">
                <Users className="w-3.5 h-3.5 text-purple-600" />
              </div>
              <p className="text-[9px] font-bold text-black/60 uppercase tracking-widest mt-1">Grouped</p>
            </div>
            <div className="w-4 h-[1px] bg-black/10" />
            <div className="flex flex-col items-center gap-1 text-center flex-1">
              <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200">
                <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <p className="text-[9px] font-bold text-black/60 uppercase tracking-widest mt-1">Elevated</p>
            </div>
            <div className="w-4 h-[1px] bg-black/10" />
            <div className="flex flex-col items-center gap-1 text-center flex-1">
              <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center border border-green-200">
                <MapPin className="w-3.5 h-3.5 text-green-600" />
              </div>
              <p className="text-[9px] font-bold text-black/60 uppercase tracking-widest mt-1">Routed</p>
            </div>
          </div>
          
          <p className="text-[11px] text-black/70 leading-relaxed text-center mb-4">
            Your complaint just joined <span className="font-bold text-black">{similarCount} others</span> in the {complaint.cluster_id} cluster. 
            The structure above grows as more citizens report issues, elevating its priority for routing.
          </p>

          <div className="bg-black/5 rounded-2xl p-3 border border-black/5">
            <ul className="text-[10px] text-black/60 font-medium space-y-1.5 list-disc pl-3">
              <li><span className="font-bold text-black/80">1 Cube:</span> Represents 1 local complaint.</li>
              <li><span className="font-bold text-black/80">Clusters:</span> Similar complaints grouped together.</li>
              <li><span className="font-bold text-black/80">Density:</span> Indicates stronger community concentration.</li>
            </ul>
          </div>
        </div>

        {/* Primary CTA */}
        <button
          onClick={onTrack}
          className="w-full flex items-center justify-center gap-2 py-4 mt-2 rounded-2xl bg-[#FFA958] text-black font-extrabold text-sm shadow-lg shadow-[#FFA958]/30 active:scale-95 transition-all"
        >
          {t.track_complaint}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function TrackingScreen({ complaint, clusterComplaints, onBack, t }: {
  complaint: Complaint; clusterComplaints: Complaint[]; onBack: () => void;
  t: Record<string, string>;
}) {
  const statusCfg = STATUS_CONFIG[complaint.status];
  const { Icon } = statusCfg;
  const others = clusterComplaints.filter((c) => c.id !== complaint.id);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 pt-8 pb-4">
        <button onClick={onBack} className="w-8 h-8 rounded-full bg-black/8 flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-black" />
        </button>
        <div>
          <p className="font-extrabold text-black" style={{ fontSize: 15 }}>{t.tracking_title}</p>
          <p className="text-xs text-black/40">{t.tracking_sub}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-4">
        <div className="bg-[#FFA958] rounded-2xl p-4 text-black">
          <p className="font-bold text-sm leading-snug">{complaint.text_input}</p>
          <div className="flex items-center gap-2 text-xs text-black/60 mt-2">
            <MapPin className="w-3 h-3" />
            <span>{complaint.location}</span>
            <span>·</span>
            <Clock className="w-3 h-3" />
            <span>{timeAgo(complaint.timestamp)}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-black/8 p-4 shadow-sm">
          <p className="text-[10px] font-semibold text-black/40 uppercase tracking-wider mb-3">{t.live_status}</p>
          <div className={`flex items-center gap-2.5 border rounded-xl px-3 py-2.5 ${statusCfg.bg}`}>
            <Icon className={`w-4 h-4 shrink-0 ${statusCfg.color} ${complaint.status === "In Progress" ? "animate-spin" : ""}`} />
            <span className={`font-bold text-sm ${statusCfg.color}`}>{statusCfg.label}</span>
            {complaint.status === "Open" && (
              <span className="ml-auto text-[10px] text-amber-600">{t.awaiting}</span>
            )}
          </div>

          {complaint.assigned_department ? (
            <div className="mt-3 pt-3 border-t border-black/5">
              <p className="text-[10px] font-semibold text-black/40 uppercase tracking-wider mb-2">{t.assigned_to}</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FFA958]/20 flex items-center justify-center shrink-0">
                  <span className="text-sm">🏛️</span>
                </div>
                <div>
                  <p className="font-semibold text-sm text-black">{complaint.assigned_department}</p>
                  {complaint.assigned_officer && (
                    <p className="text-xs text-black/50">{complaint.assigned_officer}</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-black/40 mt-2 pt-2 border-t border-black/5">{t.within_24}</p>
          )}
        </div>

        {complaint.structured_output && (
          <div className="bg-white rounded-2xl border border-[#FFA958]/30 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">✦</span>
              <p className="text-[10px] font-semibold text-[#FFA958] uppercase tracking-wider">{t.your_vision}</p>
            </div>
            <div className="flex flex-col gap-2.5">
              <div>
                <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{t.vision_why}</p>
                <p className="text-xs text-gray-700 leading-relaxed">{complaint.structured_output.why_it_matters}</p>
              </div>
              <div>
                <p className="text-[9px] font-semibold text-[#FFA958] uppercase tracking-wider mb-0.5">{t.vision_outcome}</p>
                <p className="text-xs font-semibold text-gray-800 leading-relaxed">{complaint.structured_output.desired_outcome}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-black/8 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">
              {(() => {
                const Icon = CLUSTER_ICON[complaint.cluster_id] || Map;
                return <Icon className="w-5 h-5 text-black" />;
              })()}
            </span>
            <div>
              <p className="font-bold text-sm text-black">{complaint.cluster_id}</p>
              <p className="text-[10px] text-black/40">{t.cluster_label} · {clusterComplaints.length} complaints</p>
            </div>
          </div>

          {others.length > 0 ? (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-semibold text-black/40 uppercase tracking-wider">{t.similar_label}</p>
              {others.slice(0, 3).map((c) => {
                const cfg = STATUS_CONFIG[c.status];
                return (
                  <div key={c.id} className="bg-black/3 rounded-xl p-3 flex items-start gap-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-black/70 leading-snug line-clamp-2">{c.text_input}</p>
                      <p className="text-[10px] text-black/35 mt-1">{timeAgo(c.timestamp)}</p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${cfg.bg} ${cfg.color}`}>
                      {c.status}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-black/40">{t.first_reporter}</p>
          )}
        </div>

        <button
          onClick={onBack}
          className="w-full py-3 rounded-2xl border-2 border-[#FFA958] text-[#FFA958] font-bold text-sm"
        >
          {t.submit_another}
        </button>
      </div>
    </div>
  );
}

// ─── Updates Tab ─────────────────────────────────────────────────────────────

function UpdatesTab({ complaints, onSelect }: { complaints: Complaint[], onSelect: (id: string) => void }) {
  type UpdateEvent = {
    id: string;
    complaintId: string;
    type: "submitted" | "vision" | "status";
    title: string;
    description: string;
    time: Date;
    Icon: any;
    colorClass: string;
    bgClass: string;
    originalTitle: string;
  };

  const STAGES: ComplaintStatus[] = [
    "Submitted", "Acknowledged", "Grouped", "Routed", 
    "Under Review", "Action Initiated", "Resolved"
  ];

  const events: UpdateEvent[] = complaints.flatMap((c) => {
    const list: UpdateEvent[] = [];
    const baseTime = new Date(c.timestamp).getTime();
    const currentIndex = STAGES.indexOf(c.status);
    
    for (let i = 0; i <= currentIndex; i++) {
      const stage = STAGES[i];
      const cfg = STATUS_CONFIG[stage];
      if (!cfg) continue;
      
      let title = stage;
      let desc = cfg.desc;
      if (stage === "Submitted") {
        desc = `Complaint logged: ${c.text_input}`;
      } else if (stage === "Routed" && c.assigned_department) {
        desc = `Sent to ${c.assigned_department} for review.`;
      }
      
      list.push({
        id: `${c.id}-${stage}`,
        complaintId: c.id,
        type: "status",
        title: title,
        description: desc,
        time: new Date(baseTime + (i * 3600000)), // 1 hour per stage simulated
        Icon: cfg.Icon,
        colorClass: cfg.color,
        bgClass: cfg.bg,
        originalTitle: c.text_input
      });
    }

    if (c.structured_output) {
      list.push({
        id: `${c.id}-vision`,
        complaintId: c.id,
        type: "vision",
        title: "Vision Contributed",
        description: c.structured_output.desired_outcome,
        time: new Date(baseTime + 60000), 
        Icon: Sparkles,
        colorClass: "text-[#FFA958]",
        bgClass: "bg-[#FFA958]/10 border-[#FFA958]/30",
        originalTitle: c.text_input
      });
    }
    
    return list;
  });

  const sortedEvents = events.sort((a, b) => b.time.getTime() - a.time.getTime());

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-8 pb-4">
        <p className="font-extrabold text-black" style={{ fontSize: 20 }}>Updates</p>
        <p className="text-xs text-black/40 mt-0.5">Live status from municipal system</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {sortedEvents.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <Bell className="w-10 h-10 text-black/15" />
            <p className="text-sm text-black/40">No activity yet.<br />Submit a complaint to see updates.</p>
          </div>
        )}

        <div className="relative pl-4 py-2">
          {sortedEvents.length > 0 && (
            <div className="absolute top-4 bottom-4 left-[27px] w-0.5 bg-black/5" />
          )}

          <div className="flex flex-col gap-6">
            {sortedEvents.map((evt) => (
              <div 
                key={evt.id} 
                className="relative pl-10 cursor-pointer active:scale-[0.98] transition-transform"
                onClick={() => onSelect(evt.complaintId)}
              >
                <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#faf3eb] shadow-sm z-10 ${evt.bgClass}`}>
                  <evt.Icon className={`w-3 h-3 ${evt.colorClass}`} />
                </div>
                <div className="bg-white/80 rounded-2xl border border-black/8 p-3 shadow-sm hover:border-black/15 transition-colors">
                  <div className="flex items-start justify-between mb-1.5">
                    <p className="text-xs font-extrabold text-black">{evt.title}</p>
                    <span className="text-[10px] text-black/40 font-medium">{timeAgo(evt.time.toISOString())}</span>
                  </div>
                  <p className="text-[11px] text-black/70 leading-snug mb-1">{evt.description}</p>
                  <p className="text-[9px] text-black/30 font-medium truncate pt-1 border-t border-black/5">Regarding: {evt.originalTitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Community Tab ────────────────────────────────────────────────────────────

function CommunityTab({ complaints }: { complaints: Complaint[] }) {
  const clusters = ["Road Issues", "Sanitation", "Water Supply", "General Issues"] as const;
  const totalComplaints = complaints.length;
  const withVisions = complaints.filter((c) => c.structured_output).length;
  const resolvedCount = complaints.filter((c) => c.status === "Resolved").length;
  const engagementRate = totalComplaints > 0 ? Math.round((withVisions / totalComplaints) * 100) : 0;

  return (
    <div className="flex flex-col h-full bg-transparent relative z-10">
      <div className="px-6 pt-8 pb-4">
        <p className="font-extrabold text-black" style={{ fontSize: 20 }}>Your Ward</p>
        <p className="text-xs text-black/40 mt-0.5">Community voice · shared priorities · collective vision</p>
      </div>

      <div className="flex-1 min-h-[350px] pointer-events-none" />

      <div className="flex-1 overflow-y-auto px-5 pb-4 flex flex-col gap-4">
        {/* Summary row with better visuals */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-gradient-to-br from-[#FFA958]/10 to-[#FFA958]/5 rounded-2xl border border-[#FFA958]/25 p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#FFA958]/20 rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-4 h-4 text-[#FFA958]" />
                <span className="text-[10px] font-semibold text-[#FFA958] uppercase tracking-wider">Engagement</span>
              </div>
              <p className="font-extrabold text-[#FFA958] text-3xl leading-none mb-1">{engagementRate}%</p>
              <p className="text-[10px] text-black/50">{withVisions} visions from {totalComplaints} voices</p>
            </div>
          </div>
          <div className="bg-white/80 rounded-2xl border border-black/8 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-[10px] font-semibold text-black/40 uppercase tracking-wider">Progress</span>
            </div>
            <p className="font-extrabold text-green-700 text-3xl leading-none mb-1">{resolvedCount}</p>
            <p className="text-[10px] text-black/40">issues resolved this month</p>
          </div>
        </div>

        {/* Civic Missions (instead of generic clusters) */}
        <div className="bg-white/80 rounded-2xl border border-black/8 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold text-black/40 uppercase tracking-wider">Ward Priorities · What We're Working On</p>
            <span className="text-[10px] text-black/30">{totalComplaints} active</span>
          </div>
          <div className="flex flex-col gap-3">
            {clusters.map((cluster) => {
              const count = complaints.filter((c) => c.cluster_id === cluster).length;
              const pct = CLUSTER_COMMUNITY_PCT[cluster];
              const barW = totalComplaints > 0 ? Math.round((count / totalComplaints) * 100) : 0;
              const clusterResolved = complaints.filter((c) => c.cluster_id === cluster && c.status === "Resolved").length;
              const progress = count > 0 ? Math.round((clusterResolved / count) * 100) : 0;

              // Map to civic mission name
              const missionNames: Record<string, string> = {
                "Road Issues": "Better & Free Mobility",
                "Sanitation": "Cleaner Neighborhoods",
                "Water Supply": "Healthy Air & Water",
                "General Issues": "Reliable Infrastructure",
              };

              return (
                <div key={cluster} className="bg-gradient-to-r from-black/2 to-transparent rounded-xl p-3 border border-black/5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-base">
                          {(() => {
                            const Icon = CLUSTER_ICON[cluster] || Map;
                            return <Icon className="w-4 h-4 text-black" />;
                          })()}
                        </span>
                        <span className="text-xs font-extrabold text-black/80">{missionNames[cluster]}</span>
                      </div>
                      <div className="flex items-center gap-2 ml-6">
                        <span className="text-[10px] text-black/40">{count} active</span>
                        <span className="text-[10px] text-black/20">·</span>
                        <span className="text-[10px] font-semibold text-green-600">{clusterResolved} resolved</span>
                        <span className="text-[10px] text-black/20">·</span>
                        <span className="text-[10px] text-[#FFA958] font-semibold">{pct}% community concern</span>
                      </div>
                    </div>
                  </div>
                  {/* Dual progress bars */}
                  <div className="flex gap-1.5 ml-6">
                    <div className="flex-1">
                      <div className="flex justify-between text-[9px] text-black/30 mb-0.5">
                        <span>Your activity</span>
                        <span>{barW}%</span>
                      </div>
                      <div className="h-1 bg-black/8 rounded-full overflow-hidden">
                        <div className="h-full bg-[#FFA958] rounded-full transition-all" style={{ width: `${barW}%` }} />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-[9px] text-black/30 mb-0.5">
                        <span>Resolution</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-1 bg-black/8 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Shared visions - more prominent */}
        {withVisions > 0 && (
          <div className="bg-gradient-to-br from-[#FFA958]/8 via-[#FFA958]/3 to-transparent rounded-2xl border border-[#FFA958]/20 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-[#FFA958]/20 flex items-center justify-center">
                <span className="text-sm">✦</span>
              </div>
              <div>
                <p className="text-xs font-extrabold text-[#FFA758]">Community Visions</p>
                <p className="text-[10px] text-black/40">{withVisions} neighbors shared their hopes</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {complaints
                .filter((c) => c.structured_output)
                .slice(0, 3)
                .map((c) => (
                  <div key={c.id} className="bg-white/60 backdrop-blur rounded-xl border border-[#FFA958]/25 p-3 shadow-sm">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[9px] text-[#FFA958] font-bold">✦</span>
                      <span className="text-[9px] font-semibold text-[#FFA958] uppercase tracking-wider">{c.cluster_id}</span>
                      <span className="text-[9px] text-black/20">·</span>
                      <span className="text-[9px] text-black/30">{CLUSTER_COMMUNITY_PCT[c.cluster_id]}% ward alignment</span>
                    </div>
                    <p className="text-xs font-semibold text-black/80 leading-snug line-clamp-2">
                      "{c.structured_output!.desired_outcome}"
                    </p>
                  </div>
                ))}
            </div>
            {withVisions > 3 && (
              <p className="text-[10px] text-black/30 text-center mt-2">+{withVisions - 3} more visions shared</p>
            )}
          </div>
        )}

        {/* Active campaigns with better visualization */}
        <div className="bg-gradient-to-br from-blue-50 to-transparent border border-blue-200/50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-blue-700">Top Ward Priority</p>
              <p className="text-[10px] text-black/40">Collaborative action · measurable progress</p>
            </div>
          </div>
          <p className="text-sm font-extrabold text-black/90 leading-snug mb-2">
            Better & Free Mobility
          </p>
          <p className="text-xs text-black/60 mb-3 leading-relaxed">
            Road repairs on MG Road & surrounds · 34% of residents directly affected · 2 active issues tracked
          </p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] mb-0.5">
              <span className="text-black/50">Community support</span>
              <span className="font-bold text-blue-600">68%</span>
            </div>
            <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all" style={{ width: "68%" }} />
            </div>
            <p className="text-[9px] text-black/30 mt-1">32% more to reach municipal action threshold</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Profile Tab ─────────────────────────────────────────────────────────────

function ProfileTab({ complaints, onViewAll }: { complaints: Complaint[], onViewAll: () => void }) {
  const activeComplaints = complaints.filter(c => c.status !== "Resolved");
  const resolvedCount = complaints.length - activeComplaints.length;
  const latestComplaint = complaints[0];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="px-6 pt-8 pb-4 bg-white border-b border-black/5">
        <p className="font-extrabold text-black text-2xl tracking-tight">Dashboard</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-8 flex flex-col gap-6">
        
        {/* 1. Identity Block */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-black/5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border-2 border-white shadow-sm">
            <span className="font-extrabold text-blue-600 text-xl">R</span>
          </div>
          <div className="flex-1">
            <p className="font-extrabold text-black text-lg leading-tight">Rajesh Kumar</p>
            <p className="text-xs font-semibold text-black/50 mt-0.5">Ward 12 · Bangalore North</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[9px] font-bold uppercase tracking-wider text-black/40 bg-black/5 px-2 py-0.5 rounded-sm">Resident since 2014</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-black/40 bg-black/5 px-2 py-0.5 rounded-sm">Lang: EN</span>
            </div>
          </div>
        </div>

        {/* 2. Complaint Summary */}
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest pl-1">Civic Record</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-black/5 text-center flex flex-col items-center justify-center">
              <p className="font-black text-black text-2xl">{complaints.length}</p>
              <p className="text-[10px] font-bold text-black/50 uppercase mt-1">Total Filed</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-black/5 text-center flex flex-col items-center justify-center">
              <p className="font-black text-orange-500 text-2xl">{activeComplaints.length}</p>
              <p className="text-[10px] font-bold text-black/50 uppercase mt-1">Active</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-black/5 text-center flex flex-col items-center justify-center">
              <p className="font-black text-green-500 text-2xl">{resolvedCount}</p>
              <p className="text-[10px] font-bold text-black/50 uppercase mt-1">Resolved</p>
            </div>
          </div>

          {latestComplaint && (
            <div className="bg-[#FFA958]/10 border border-[#FFA958]/20 rounded-2xl p-4 mt-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-20">
                <FileText className="w-16 h-16 text-[#FFA958]" />
              </div>
              <p className="text-[10px] font-bold text-[#FFA958] uppercase tracking-widest mb-1.5 relative z-10">Latest Active Issue</p>
              <p className="text-sm font-bold text-black/80 leading-snug line-clamp-2 relative z-10 pr-6">{latestComplaint.text_input}</p>
              <p className="text-xs font-semibold text-black/50 mt-2 relative z-10">Status: <span className="text-black/80">{latestComplaint.status}</span></p>
            </div>
          )}

          <button 
            onClick={onViewAll}
            className="w-full bg-white border border-black/10 rounded-xl py-3 mt-1 text-xs font-bold text-black/70 hover:bg-black/5 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            View All Complaints
            <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          </button>
        </div>

        {/* 3. Participation Footprint */}
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest pl-1">Community Impact</p>
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100/50 rounded-3xl p-5 shadow-sm relative overflow-hidden">
             <div className="absolute -right-4 -bottom-4 opacity-5">
               <Users className="w-32 h-32 text-purple-900" />
             </div>
             <p className="text-xl font-black text-purple-900 mb-1">Strong Presence</p>
             <p className="text-xs font-medium text-purple-700/80 leading-relaxed max-w-[220px]">
               Your active complaints are strengthening <span className="font-bold text-purple-900">2 community clusters</span>, directly elevating the civic priority for 144 nearby residents.
             </p>
          </div>
        </div>

        {/* 4. Recent Activity */}
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest pl-1">Recent Activity</p>
          <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-2 flex flex-col gap-1">
            <div className="flex items-center gap-3 p-2">
              <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                <FileText className="w-3.5 h-3.5 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-black/80 truncate">Filed a new complaint</p>
                <p className="text-[10px] font-medium text-black/40">2 days ago</p>
              </div>
            </div>
            <div className="w-full h-px bg-black/5" />
            <div className="flex items-center gap-3 p-2">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <Bell className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-black/80 truncate">Update: Under Review</p>
                <p className="text-[10px] font-medium text-black/40">1 week ago</p>
              </div>
            </div>
            <div className="w-full h-px bg-black/5" />
            <div className="flex items-center gap-3 p-2">
              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 text-green-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-black/80 truncate">Issue Resolved: Waste collection</p>
                <p className="text-[10px] font-medium text-black/40">3 weeks ago</p>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Preferences & Accessibility */}
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest pl-1">Preferences</p>
          <div className="bg-white rounded-2xl border border-black/5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-black/5">
              <div className="flex items-center gap-3">
                <Map className="w-4 h-4 text-black/40" />
                <p className="text-sm font-semibold text-black/80">App Language</p>
              </div>
              <span className="text-xs font-bold text-[#FFA958]">English</span>
            </div>
            <div className="flex items-center justify-between p-4 border-b border-black/5">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-black/40" />
                <p className="text-sm font-semibold text-black/80">Push Notifications</p>
              </div>
              <div className="w-10 h-6 bg-[#FFA958] rounded-full relative shadow-inner">
                <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm" />
              </div>
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Mic className="w-4 h-4 text-black/40" />
                <p className="text-sm font-semibold text-black/80">Default to Voice Input</p>
              </div>
              <div className="w-10 h-6 bg-black/10 rounded-full relative shadow-inner">
                <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5 shadow-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* 6. Trust & Transparency */}
        <div className="flex flex-col gap-3 mb-6">
          <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest pl-1">Data & Privacy</p>
          <div className="bg-gray-100 rounded-2xl p-5 border border-black/5 text-center">
            <Shield className="w-6 h-6 text-black/20 mx-auto mb-2" />
            <p className="text-xs font-bold text-black/60 mb-1">Your identity remains private.</p>
            <p className="text-[10px] text-black/40 leading-relaxed max-w-[250px] mx-auto">
              Only the category and general location of your complaints are shared publicly to build community clusters. Your personal information is never exposed to other citizens.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── My Complaints Screen ─────────────────────────────────────────────────────

function MyComplaintsScreen({ complaints, onSelect, onBack }: { complaints: Complaint[], onSelect: (id: string) => void, onBack: () => void }) {
  return (
    <div className="absolute inset-0 bg-gray-50 z-40 flex flex-col pt-4">
      <div className="px-6 flex items-center justify-between pb-4">
        <button onClick={onBack} className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-black/40 hover:text-black/60 transition-colors active:scale-95">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-xs font-bold text-black/60 tracking-widest uppercase">My Complaints</span>
        <div className="w-8" />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-20">
        {complaints.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
             <FileText className="w-10 h-10 text-black/15" />
             <p className="text-sm text-black/40">No complaints filed yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {complaints.map((c) => {
              const cfg = STATUS_CONFIG[c.status];
              return (
                <div 
                  key={c.id} 
                  className="bg-white rounded-2xl border border-black/10 p-4 shadow-sm flex flex-col gap-3 cursor-pointer hover:border-black/20 active:scale-[0.98] transition-all"
                  onClick={() => onSelect(c.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-bold text-black/80 leading-snug line-clamp-2">{c.text_input}</p>
                    <span className="text-[10px] text-black/40 font-semibold whitespace-nowrap mt-0.5">{timeAgo(c.timestamp)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color} flex items-center gap-1.5`}>
                      <cfg.Icon className="w-3 h-3" />
                      {c.status}
                    </span>
                    <span className="text-[10px] font-semibold text-black/40 bg-black/5 px-2.5 py-1 rounded-full flex items-center gap-1 max-w-[120px] truncate">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{c.location}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Complaint Detail Screen ──────────────────────────────────────────────────

function ComplaintDetailScreen({ complaint, onBack, t }: { complaint: Complaint, onBack: () => void, t: Record<string, string> }) {
  const STAGES: ComplaintStatus[] = [
    "Submitted", "Acknowledged", "Grouped", "Routed", 
    "Under Review", "Action Initiated", "Resolved"
  ];
  
  const currentIndex = STAGES.indexOf(complaint.status);
  const baseTime = new Date(complaint.timestamp).getTime();
  const currentCfg = STATUS_CONFIG[complaint.status];

  return (
    <div className="absolute inset-0 bg-[#faf3eb] z-50 flex flex-col pt-4">
      <div className="px-6 flex items-center justify-between pb-4">
        <button onClick={onBack} className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-black/40 hover:text-black/60 transition-colors active:scale-95">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-xs font-bold text-black/30 tracking-widest uppercase">Details</span>
        <div className="w-8" />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-20">
        <div className="mb-6">
          <p className="text-lg font-extrabold text-black leading-snug mb-3">{complaint.text_input}</p>
          
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${currentCfg.bg} ${currentCfg.color} flex items-center gap-1.5`}>
              <currentCfg.Icon className="w-3.5 h-3.5" />
              {currentCfg.label}
            </span>
            <span className="text-[11px] font-semibold text-black/40 bg-black/5 px-3 py-1 rounded-full">
              {timeAgo(complaint.timestamp)}
            </span>
          </div>

          <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 flex items-start gap-3">
            <div className="mt-0.5 bg-purple-100 w-6 h-6 rounded-full flex items-center justify-center shrink-0">
              <Users className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-purple-900 mb-0.5">Community Grouping</p>
              <p className="text-[11px] text-purple-700 leading-snug">
                This complaint is part of the <span className="font-bold">{complaint.cluster_id}</span> cluster. It has been prioritized along with similar local issues.
              </p>
            </div>
          </div>
        </div>

        <div className="relative pl-4 py-2">
          <div className="absolute top-4 bottom-4 left-[27px] w-0.5 bg-black/5" />
          
          <div className="flex flex-col gap-6">
            {/* Generate timeline from newest (current) to oldest (Submitted) */}
            {Array.from({ length: currentIndex + 1 }).map((_, i) => {
              const stageIdx = currentIndex - i; // reverse order
              const stage = STAGES[stageIdx];
              const cfg = STATUS_CONFIG[stage];
              let desc = cfg.desc;
              if (stage === "Submitted") desc = `Complaint logged: ${complaint.text_input}`;
              else if (stage === "Routed" && complaint.assigned_department) desc = `Sent to ${complaint.assigned_department} for review.`;

              const isLatest = stageIdx === currentIndex;

              return (
                <div key={stage} className="relative pl-10">
                  <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#faf3eb] shadow-sm z-10 ${cfg.bg}`}>
                    <cfg.Icon className={`w-3 h-3 ${cfg.color}`} />
                  </div>
                  <div className={`rounded-2xl border p-3 ${isLatest ? 'bg-white shadow-md border-black/15' : 'bg-white/60 border-black/5 shadow-sm'}`}>
                    <div className="flex items-start justify-between mb-1">
                      <p className={`text-xs font-extrabold ${isLatest ? 'text-black' : 'text-black/60'}`}>{cfg.label}</p>
                      <span className="text-[10px] text-black/40 font-medium">
                        {timeAgo(new Date(baseTime + (stageIdx * 3600000)).toISOString())}
                      </span>
                    </div>
                    <p className={`text-[11px] leading-snug ${isLatest ? 'text-black/80 font-medium' : 'text-black/50'}`}>
                      {desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Bottom Nav ───────────────────────────────────────────────────────────────

const NAV_TABS: Array<{ id: Tab; label: string; Icon: typeof FileText }> = [
  { id: "report", label: "Report", Icon: FileText },
  { id: "updates", label: "Updates", Icon: Bell },
  { id: "community", label: "Community", Icon: Users },
  { id: "profile", label: "Profile", Icon: User },
];

// ─── Main CitizenView ─────────────────────────────────────────────────────────

export function CitizenView({ complaints, onAddComplaint, onUpdateComplaint }: Props) {
  const [tab, setTab] = useState<Tab>("report");
  const [screen, setScreen] = useState<Screen>("landing");
  const [activeComplaintId, setActiveComplaintId] = useState<string | null>(null);
  const [showMyComplaints, setShowMyComplaints] = useState(false);
  const [lang, setLang] = useState<Lang>("en");
  const [inputText, setInputText] = useState("");
  const [location, setLocation] = useState("");
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  // Reflection state
  const [contextInput, setContextInput] = useState("");
  const [pastInput, setPastInput] = useState("");
  const [visionInput, setVisionInput] = useState("");
  const [generatedOutput, setGeneratedOutput] = useState<StructuredOutput | null>(null);

  const t = T[lang];
  const submittedComplaint = complaints.find((c) => c.id === submittedId) ?? null;
  const clusterComplaints = submittedComplaint
    ? complaints.filter((c) => c.cluster_id === submittedComplaint.cluster_id)
    : [];
  const recentCluster = complaints.length > 0 ? complaints[0].cluster_id : null;

  // Count for Updates badge
  const openCount = complaints.filter((c) => c.status === "Open" || c.status === "Assigned").length;

  const handleSubmit = () => {
    if (!inputText.trim()) return;
    const c = onAddComplaint(inputText.trim(), location.trim());
    setSubmittedId(c.id);
    setInputText("");
    setLocation("");
    setContextInput("");
    setPastInput("");
    setVisionInput("");
    setGeneratedOutput(null);
    setScreen("ack");
  };

  const buildOutput = (id: string) => {
    if (!submittedComplaint && !id) return;
    const target = complaints.find((c) => c.id === id) ?? submittedComplaint;
    if (!target) return;

    const out: StructuredOutput = {
      issue: target.text_input,
      why_it_matters:
        contextInput.trim() ||
        `Affects daily life of residents in ${target.location}. Part of a broader ${target.cluster_id} cluster.`,
      desired_outcome:
        visionInput.trim() || "Proper resolution by the municipal authorities within the expected timeframe.",
    };
    setGeneratedOutput(out);
    onUpdateComplaint(target.id, {
      context: contextInput.trim() || undefined,
      past_context: pastInput.trim() || undefined,
      vision: visionInput.trim() || undefined,
      structured_output: out,
    });
  };

  const goToTracking = () => setScreen("tracking");

  const handleReset = () => {
    setScreen("home");
    setSubmittedId(null);
    setContextInput("");
    setPastInput("");
    setVisionInput("");
    setGeneratedOutput(null);
  };

  // Whether we're in a flow that should hide the nav (post-submit reflection steps)
  const inReflectionFlow = ["ack", "step_context", "step_past", "step_vision", "output", "community"].includes(screen);

  let systemState: SystemState = 'idle';
  if (tab === 'report') {
    if (screen === 'landing') systemState = 'idle';
    else if (screen === 'home') systemState = 'idle';
    else if (screen === 'ack' || screen.startsWith('step_')) systemState = 'submitting';
    else if (screen === 'output' || screen === 'community') systemState = 'clustering';
    else if (screen === 'tracking') systemState = 'response';
  } else if (tab === 'updates') {
    systemState = 'response';
  } else if (tab === 'community') {
    systemState = 'clustering';
  } else if (tab === 'profile') {
    systemState = 'idle';
  }

  return (
    <div className="w-full h-[100dvh] flex items-center justify-center bg-white sm:bg-gray-100 sm:p-4 overflow-hidden">
      {/* Phone mockup */}
      <div
        className="relative overflow-hidden sm:shadow-2xl w-full h-full sm:w-[390px] sm:h-[780px] sm:rounded-[40px] bg-[#faf3eb] sm:border-[10px] sm:border-[#1a1a1a] flex-shrink-0"
      >
        {/* Notch - hidden on mobile */}
        <div className="hidden sm:block absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-[#1a1a1a] rounded-b-2xl z-20" />

        {/* Status bar */}
        <div className="absolute top-0 left-0 right-0 pt-[env(safe-area-inset-top,16px)] sm:pt-0 sm:h-10 flex items-center sm:items-end justify-between px-6 pb-2 sm:pb-1 z-20">
          <span className="hidden sm:block text-[11px] font-semibold text-black">9:41</span>
          <button
            onClick={() => setLang((l) => (l === "en" ? "hi" : "en"))}
            className="flex items-center bg-black/10 rounded-full px-3 py-1 mt-2 sm:mt-0 text-[11px] font-bold text-black/60 gap-1 sm:ml-auto"
          >
            <span className={lang === "en" ? "text-black" : "text-black/40"}>EN</span>
            <span className="text-black/20">|</span>
            <span className={lang === "hi" ? "text-black" : "text-black/40"}>हि</span>
          </button>
          <div className="hidden sm:flex items-center gap-1 text-black ml-auto">
            <svg width="17" height="11" viewBox="0 0 17 11" fill="none">
              <rect x="0" y="4" width="3" height="7" rx="1" fill="currentColor" opacity="0.4" />
              <rect x="4.5" y="2.5" width="3" height="8.5" rx="1" fill="currentColor" opacity="0.6" />
              <rect x="9" y="0.5" width="3" height="10.5" rx="1" fill="currentColor" opacity="0.8" />
              <rect x="13.5" y="0" width="3" height="11" rx="1" fill="currentColor" />
            </svg>
            <svg width="15" height="12" viewBox="0 0 24 12" fill="currentColor">
              <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="currentColor" strokeOpacity="0.35" fill="none" />
              <rect x="23" y="4" width="1" height="4" rx="1" fill="currentColor" fillOpacity="0.4" />
              <rect x="2" y="2" width="17" height="8" rx="2" fill="currentColor" />
            </svg>
          </div>
        </div>

        {/* Screen content */}
        <div className="absolute inset-0 pt-[calc(env(safe-area-inset-top,16px)+40px)] sm:pt-10 pb-[calc(env(safe-area-inset-bottom,16px)+70px)] overflow-hidden flex flex-col">
          {activeComplaintId && (
            <ComplaintDetailScreen 
              complaint={complaints.find(c => c.id === activeComplaintId)!}
              onBack={() => setActiveComplaintId(null)}
              t={t}
            />
          )}
          {showMyComplaints && !activeComplaintId && (
            <MyComplaintsScreen 
              complaints={complaints}
              onSelect={setActiveComplaintId}
              onBack={() => setShowMyComplaints(false)}
            />
          )}
          {((tab === "report" && (screen === "landing" || screen === "community")) || tab === "community") && !activeComplaintId && !showMyComplaints && (
            <CivicStructure 
              complaints={complaints} 
              systemState={systemState} 
              activeClusterId={submittedComplaint?.cluster_id ?? recentCluster} 
              recentlyAddedId={submittedId}
            />
          )}
          {/* Report tab: existing screen flow */}
          {tab === "report" && (
            <>
              {screen === "landing" && (
                <LandingScreen 
                  onStart={() => setScreen("home")} 
                  hasComplaints={complaints.length > 0}
                  activeComplaint={complaints.find(c => c.status !== "Submitted")}
                  onGoToUpdate={() => {
                    const latestMoved = complaints.find(c => c.status !== "Submitted");
                    if (latestMoved) setActiveComplaintId(latestMoved.id);
                  }}
                  t={t} 
                />
              )}
              {screen === "home" && (
                <HomeScreen
                  inputText={inputText} location={location}
                  onInput={setInputText} onLocation={setLocation}
                  onSubmit={handleSubmit} recentCluster={recentCluster}
                  onBack={() => setScreen("landing")}
                  lang={lang} t={t}
                />
              )}
              {screen === "ack" && submittedComplaint && (
                <AckScreen
                  complaint={submittedComplaint}
                  onContinue={() => setScreen("step_context")}
                  onSkip={goToTracking}
                  onBack={() => setScreen("home")}
                  t={t}
                />
              )}
              {screen === "step_context" && (
                <ReflectionCard
                  stepNum={1} totalSteps={3}
                  question={t.step_context_q} placeholder={t.step_context_ph}
                  value={contextInput} onChange={setContextInput}
                  onNext={() => setScreen("step_past")}
                  onSkip={() => setScreen("step_past")}
                  onBack={() => setScreen("ack")}
                  chips={[t.chip_commute, t.chip_harder, t.chip_safety, t.chip_others]}
                  t={t}
                />
              )}
              {screen === "step_past" && (
                <ReflectionCard
                  stepNum={2} totalSteps={3}
                  question={t.step_past_q} placeholder={t.step_past_ph}
                  value={pastInput} onChange={setPastInput}
                  onNext={() => setScreen("step_vision")}
                  onSkip={() => setScreen("step_vision")}
                  onBack={() => setScreen("step_context")}
                  chips={[t.chip_freq, t.chip_worse, t.chip_ignored, t.chip_past_others]}
                  t={t}
                />
              )}
              {screen === "step_vision" && (
                <ReflectionCard
                  stepNum={3} totalSteps={3}
                  question={t.step_vision_q} placeholder={t.step_vision_ph}
                  value={visionInput} onChange={setVisionInput}
                  onNext={() => {
                    buildOutput(submittedId!);
                    setScreen("community");
                  }}
                  onSkip={() => {
                    buildOutput(submittedId!);
                    setScreen("community");
                  }}
                  onBack={() => setScreen("step_past")}
                  chips={[t.chip_repair, t.chip_inspect, t.chip_update, t.chip_vision_others]}
                  isVision
                  t={t}
                />
              )}
              {screen === "community" && submittedComplaint && (
                <CommunityScreen
                  complaint={submittedComplaint}
                  onTrack={goToTracking}
                  onBack={() => setScreen("step_vision")}
                  t={t}
                />
              )}
              {screen === "tracking" && submittedComplaint && (
                <TrackingScreen
                  complaint={submittedComplaint}
                  clusterComplaints={clusterComplaints}
                  onBack={handleReset}
                  t={t}
                />
              )}
            </>
          )}

          {tab === "updates" && !showMyComplaints && !activeComplaintId && <UpdatesTab complaints={complaints} onSelect={setActiveComplaintId} />}
          {tab === "community" && !showMyComplaints && !activeComplaintId && <CommunityTab complaints={complaints} />}
          {tab === "profile" && !showMyComplaints && !activeComplaintId && <ProfileTab complaints={complaints} onViewAll={() => setShowMyComplaints(true)} />}
        </div>

        {/* Bottom navigation bar */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#faf3eb]/95 backdrop-blur border-t border-black/8 flex items-center z-30">
          {NAV_TABS.map(({ id, label, Icon }) => {
            const isActive = tab === id;
            const showBadge = id === "updates" && openCount > 0 && tab !== "updates";
            return (
              <button
                key={id}
                onClick={() => {
                  setTab(id);
                  if (id === "report") {
                    // If returning to report tab while in reflection flow, stay there
                  }
                }}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 h-full relative"
              >
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 transition-all ${isActive ? "text-[#FFA958]" : "text-black/30"}`}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                  {showBadge && (
                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-[8px] font-bold text-white">{openCount}</span>
                    </div>
                  )}
                </div>
                <span
                  className={`text-[10px] font-semibold transition-all ${isActive ? "text-[#FFA958]" : "text-black/30"}`}
                >
                  {label}
                </span>
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#FFA958] rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
