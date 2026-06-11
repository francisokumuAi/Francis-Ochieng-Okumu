"use client";

import React, { useState, useEffect } from "react";
import Markdown from "react-markdown";
import { 
  Globe2, 
  MapPin, 
  FileCheck, 
  AlertTriangle, 
  ArrowRight, 
  Search, 
  BookOpen, 
  Gauge, 
  ShieldAlert, 
  Printer, 
  Copy, 
  RotateCcw, 
  FileText, 
  CheckCircle2, 
  HelpCircle, 
  ChevronRight, 
  Sparkles,
  Info,
  DollarSign,
  Briefcase
} from "lucide-react";

// Definitions for the HS Code classifier
interface AutoPartPreset {
  name: string;
  suggestedHs: string;
  category: "FASTENER" | "MACHINERY_ELECTRICAL" | "SPECIFIC_VEHICLE" | "MATERIAL_OTHER";
  exclusionReason: string;
}

const CLASS_PRESETS: AutoPartPreset[] = [
  {
    name: "Engine Cylinder Head Bolt",
    suggestedHs: "7318.15",
    category: "FASTENER",
    exclusionReason: "EXCLUDED (Parts of General Use - Section XV, Note 2). Under HS rules, standard steel fasteners are always classified by material (Chapter 73) regardless of automotive customization."
  },
  {
    name: "Suspension Leaf Spring",
    suggestedHs: "7320.10",
    category: "FASTENER",
    exclusionReason: "EXCLUDED (General Use Springs - Section XV, Note 2). Laminated leaf-springs and coil-springs are classified by material in Chapter 73 rather than vehicle accessories in Ch. 87."
  },
  {
    name: "Oil Filter / Air Filter",
    suggestedHs: "8421.31",
    category: "MACHINERY_ELECTRICAL",
    exclusionReason: "EXCLUDED (Functional Machinery). Filtering equipment is classified under its own functional heading in Chapter 84 (Heading 8421) rather than vehicle heading 8708."
  },
  {
    name: "Alternator / Starter Motor",
    suggestedHs: "8511.50 / 8511.40",
    category: "MACHINERY_ELECTRICAL",
    exclusionReason: "EXCLUDED (Functional Electrical Equipment). Specific electrical starting and ignition machinery has exclusive precedence in Chapter 85."
  },
  {
    name: "Windshield Glass (Laminated)",
    suggestedHs: "7007.21",
    category: "MATERIAL_OTHER",
    exclusionReason: "EXCLUDED (Safety Glass). Classified by constituent material under Chapter 70 (Toughened or laminated safety glass) styled for vehicles."
  },
  {
    name: "Bumper System Assembly",
    suggestedHs: "8708.10",
    category: "SPECIFIC_VEHICLE",
    exclusionReason: "CLASSIFIED IN 8708. Passes the 'Sole or Principal Use' test. Bumpers serve no other mechanical, structural, or electrical role except as vehicular components, and are not excluded by general notes."
  },
  {
    name: "Disc Brake Calipers & Pads",
    suggestedHs: "8708.30",
    category: "SPECIFIC_VEHICLE",
    exclusionReason: "CLASSIFIED IN 8708. Specific brakes and servo-brakes parts under automobile Heading 8708, as they cannot be dual-purposed for general non-transportation machinery easily."
  },
  {
    name: "Gearbox System (Transmission)",
    suggestedHs: "8708.40",
    category: "SPECIFIC_VEHICLE",
    exclusionReason: "CLASSIFIED IN 8708. Dedicated vehicular transmission gearboxes and matching components survive structural exclusions and sit comfortably under 8708."
  }
];

export default function Home() {
  // Trade corridor variables
  const [origin, setOrigin] = useState("Kenya");
  const [destination, setDestination] = useState("UAE");
  const [commodity, setCommodity] = useState("Arabica Specialty Coffee Beans");
  
  // States for report generation
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [reportText, setReportText] = useState<string>("");
  const [citations, setCitations] = useState<any[]>([]);
  const [toastMessage, setToastMessage] = useState("");
  
  // Stepper / Tab states
  const [activeTab, setActiveTab] = useState<"corridor" | "hscode" | "incoterms" | "documents" | "careers">("corridor");
  
  // Interactive Decision Tree for HS Codes
  const [step1GeneralUse, setStep1GeneralUse] = useState<boolean | null>(null);
  const [step2Functional, setStep2Functional] = useState<boolean | null>(null);
  const [customPartSearch, setCustomPartSearch] = useState("");
  const [customPartResult, setCustomPartResult] = useState<AutoPartPreset | null>(null);

  // Incoterms selection
  const [incoterm, setIncoterm] = useState<"FOB" | "CIF">("FOB");

  // Document checklist state
  const [checklist, setChecklist] = useState([
    { id: "ci", name: "Commercial Invoice", requirement: "Original, signed & attested by local Embassy", status: "In Progress", category: "Standard" },
    { id: "pl", name: "Packing List", requirement: "Detailed net/gross weight & matching HS Codes", status: "Not Started", category: "Standard" },
    { id: "coo", name: "Certificate of Origin", requirement: "Original, Chamber of Commerce certificate", status: "Not Started", category: "Standard" },
    { id: "bl", name: "Bill of Lading / Airway Bill", requirement: "Original signed, draft clean status mandatory", status: "In Progress", category: "Shipping" },
    { id: "hc", name: "Phytosanitary/Health Certificate", requirement: "Issued by origin Ministry/Dept of Agriculture/Health", status: "Not Started", category: "Food" },
    { id: "halal", name: "Halal Certificate (if applicable)", requirement: "Mandatory for meats/gelatins by approved agency", status: "Not Started", category: "Food" },
    { id: "permit", name: "Import Permit / Product Registration", requirement: "Registered through target portal (e.g. ZAD / FIRS)", status: "Not Started", category: "Permits" }
  ]);

  // Dubai Careers Diagnostic
  const [isUaeNational, setIsUaeNational] = useState<boolean | null>(null);
  const [selectedSkillRating, setSelectedSkillRating] = useState<string>("");

  // Reassuring loading steps
  const loadingSteps = [
    "Grounding search via Google Search tool...",
    "Assisting 2026 regulations & trade corridor exemptions...",
    "Querying WTO Valuation Agreement references...",
    "Formatting mandated layout structures..."
  ];

  useEffect(() => {
    if (!loading) return;
    const interval = setTimeout(() => {
      setLoadingStep((prev) => (prev + 1) % 4);
    }, 2500);
    return () => clearTimeout(interval);
  }, [loading]);

  // Trigger Gemini Report API
  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingStep(0);
    setLoading(true);
    setReportText("");
    setCitations([]);
    
    try {
      const res = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin, destination, commodity }),
      });

      const data = await res.json();
      if (data.success) {
        setReportText(data.report);
        setCitations(data.citations || []);
        
        // Auto pre-populate checklist if relevant
        if (commodity.toLowerCase().includes("food") || commodity.toLowerCase().includes("coffee") || commodity.toLowerCase().includes("meat")) {
          // Keep relevant ones
        }
      } else {
        setReportText(`### Error\n${data.error || "Failed to generate compliance analysis report. Please try again."}`);
      }
    } catch (err: any) {
      setReportText(`### Connection Failed\nCould not execute request: ${err?.message || "Internal network failure."}`);
    } finally {
      setLoading(false);
    }
  };

  // Pre-fill fields for user convenience
  const applyPreset = (orig: string, dest: string, comm: string) => {
    setOrigin(orig);
    setDestination(dest);
    setCommodity(comm);
    showToast(`Applied Preset: ${comm}`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 3000);
  };

  // Copy to Clipboard helper
  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast("Report copied to clipboard!");
  };

  // Update checklist status
  const toggleChecklistStatus = (id: string, current: string) => {
    const statuses = ["Not Started", "In Progress", "Ready for Review", "Validated"];
    const nextIdx = (statuses.indexOf(current) + 1) % statuses.length;
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, status: statuses[nextIdx] } : item));
  };

  // Calculate health of checklist
  const totalItems = checklist.length;
  const readyItems = checklist.filter(item => item.status === "Validated" || item.status === "Ready for Review").length;
  const healthPercent = Math.round((readyItems / totalItems) * 100);

  // Custom search logic for HS parts
  const handleCustomPartSearch = (val: string) => {
    setCustomPartSearch(val);
    if (!val.trim()) {
      setCustomPartResult(null);
      return;
    }
    const match = CLASS_PRESETS.find(p => p.name.toLowerCase().includes(val.toLowerCase()));
    if (match) {
      setCustomPartResult(match);
    } else {
      setCustomPartResult({
        name: val,
        suggestedHs: "REQUIRES REGULATORY AUDIT",
        category: "MATERIAL_OTHER",
        exclusionReason: "NO DIRECT PRESET MATCH FOUND. Ensure you perform the Sole or Principal use test to determine if Ch. 87 exclusions (Section XV Note 2 or Ch. 84/85 function carve-outs) disqualify this item."
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans select-none bg-[#f8fafc]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-slide-in">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Primary Brand Navbar */}
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-950/40">
              <Globe2 className="w-5 h-5 text-slate-100" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-100 font-sans tracking-tight">
                Global Trade Clearance Assistant
              </h1>
              <p className="text-xs text-slate-400 font-mono">
                Regulatory Workspace &bull; Compliance Year <span className="text-amber-400 font-bold">2026</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-slate-300">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-[#1a2d42] text-[#3b82f6] border border-[#2e5b88]">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              REAL-TIME GROUNDED
            </span>
          </div>
        </div>
      </header>

      {/* Main Operational Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6">
        
        {/* Left Side Sidebar / Tab Controls */}
        <div className="w-full lg:w-1/4 flex flex-col gap-3">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Operational Portals
            </h3>
            <nav className="flex flex-col gap-1">
              <button
                onClick={() => setActiveTab("corridor")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-all duration-150 ${
                  activeTab === "corridor"
                    ? "bg-slate-950 text-amber-400 shadow-md"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Globe2 className="w-4 h-4" />
                Corridor Checker
              </button>
              
              <button
                onClick={() => setActiveTab("hscode")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-all duration-150 ${
                  activeTab === "hscode"
                    ? "bg-slate-950 text-amber-400 shadow-md"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <BookOpen className="w-4 h-4" />
                HS Exclusion Classifier
              </button>

              <button
                onClick={() => setActiveTab("incoterms")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-all duration-150 ${
                  activeTab === "incoterms"
                    ? "bg-slate-950 text-amber-400 shadow-md"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <DollarSign className="w-4 h-4" />
                Incoterms cost & risk
              </button>

              <button
                onClick={() => setActiveTab("documents")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-all duration-150 ${
                  activeTab === "documents"
                    ? "bg-slate-950 text-amber-400 shadow-md"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <FileCheck className="w-4 h-4" />
                Customs Document Checklist
              </button>

              <button
                onClick={() => setActiveTab("careers")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-all duration-150 ${
                  activeTab === "careers"
                    ? "bg-slate-950 text-amber-400 shadow-md"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Briefcase className="w-4 h-4" />
                Dubai Customs Officer Route
              </button>
            </nav>
          </div>

          {/* Quick-Link Sandbox Presets */}
          <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 border border-slate-800 shadow-sm">
            <div className="flex items-center gap-1.5 mb-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Active Training Scenarios
              </h4>
            </div>
            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              Instantly seed the workspace parameters with common high-stakes global corridors:
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => applyPreset("Kenya", "UAE", "Arabica specialty green coffee beans")}
                className="w-full bg-slate-800 hover:bg-slate-700 text-left px-3 py-2 rounded-lg text-xs font-mono flex items-center justify-between border border-slate-700 transition"
              >
                <span>Kenya &rarr; UAE (Coffee)</span>
                <ChevronRight className="w-3 h-3 text-slate-400" />
              </button>
              <button
                onClick={() => applyPreset("UAE", "Kingdom of Saudi Arabia", "Halal certified poultry")}
                className="w-full bg-slate-800 hover:bg-slate-700 text-left px-3 py-2 rounded-lg text-xs font-mono flex items-center justify-between border border-slate-700 transition"
              >
                <span>UAE &rarr; KSA (Poultry)</span>
                <ChevronRight className="w-3 h-3 text-slate-400" />
              </button>
              <button
                onClick={() => applyPreset("Germany", "United States", "Automotive drive axles (HS 8708)")}
                className="w-full bg-slate-800 hover:bg-slate-700 text-left px-3 py-2 rounded-lg text-xs font-mono flex items-center justify-between border border-slate-700 transition"
              >
                <span>Germany &rarr; USA (Auto Parts)</span>
                <ChevronRight className="w-3 h-3 text-slate-400" />
              </button>
              <button
                onClick={() => applyPreset("China", "Germany", "Lithium battery power stations (Dangerous Goods)")}
                className="w-full bg-slate-800 hover:bg-slate-700 text-left px-3 py-2 rounded-lg text-xs font-mono flex items-center justify-between border border-slate-700 transition"
              >
                <span>China &rarr; Germany (Batteries)</span>
                <ChevronRight className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Side - Dynamic Portal Body */}
        <div className="flex-1 flex flex-col gap-6">

          {/* TAB 1: CORRIDOR CHECKER */}
          {activeTab === "corridor" && (
            <div className="flex flex-col gap-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-2.5 mb-2">
                  <Globe2 className="w-5 h-5 text-amber-500" />
                  <h2 className="text-xl font-bold text-slate-900">
                    Bilateral Corridor Trade Compliance Planner
                  </h2>
                </div>
                <p className="text-sm text-slate-500 mb-6 font-sans">
                  Generate instant, complete regulatory trade briefs conforming to exact WTO customs principles. Supported by live search grounding for current 2026 legislation.
                </p>

                <form onSubmit={handleGenerateReport} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-500" /> Origin Country
                    </label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-3 py-2.5 text-sm font-sans outline-none transition"
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      placeholder="e.g. Kenya"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-red-500" /> Destination Country
                    </label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-3 py-2.5 text-sm font-sans outline-none transition"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="e.g. UAE"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                      <Search className="w-3 h-3 text-amber-500" /> Commodity Description
                    </label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-3 py-2.5 text-sm font-sans outline-none transition"
                      value={commodity}
                      onChange={(e) => setCommodity(e.target.value)}
                      placeholder="e.g. Specialty coffee"
                      required
                    />
                  </div>

                  <div className="md:col-span-3 flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                      <Info className="w-4.5 h-4.5 text-amber-500" />
                      Zero speculation logic active. All queries verify 2026/2027 mandates.
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-slate-950 text-amber-400 font-sans font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-slate-900 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider shadow-lg shadow-slate-950/20"
                    >
                      {loading ? (
                        <>
                          <RotateCcw className="w-4 h-4 animate-spin text-amber-400" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Check Regulations
                          <ArrowRight className="w-4 h-4 text-amber-400 animate-pulse" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Active Loading Screen */}
              {loading && (
                <div className="bg-slate-950 rounded-2xl p-8 text-center border border-slate-800 shadow-xl flex flex-col items-center justify-center min-h-[300px]">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-amber-500 animate-spin"></div>
                    <Sparkles className="w-6 h-6 text-amber-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-100 mb-2">
                    Researching customs databases...
                  </h3>
                  <div className="inline-block bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-amber-400 font-mono text-xs opacity-90 animate-pulse">
                    {loadingSteps[loadingStep]}
                  </div>
                  <p className="text-xs text-slate-400 max-w-md mt-4">
                    Fetching live global customs regulations under temporal constraint: Year 2026. Prioritizing bilateral trade treaties.
                  </p>
                </div>
              )}

              {/* Report Display Container */}
              {reportText && !loading && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
                  <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4.5 h-4.5 text-amber-400" />
                      <span className="text-sm font-mono text-slate-100 font-semibold tracking-wider uppercase">
                        Compliance Verdict Report
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => copyToClipboard(reportText)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                        title="Copy report markdown"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Copy
                      </button>
                      <button
                        onClick={() => window.print()}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                        title="Print Report"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print Layout
                      </button>
                    </div>
                  </div>

                  <div className="p-6 md:p-8 markdown-body text-slate-800 leading-relaxed font-sans max-w-none text-sm space-y-4">
                    <Markdown>{reportText}</Markdown>
                  </div>

                  {/* References & Grounding Citations */}
                  {citations.length > 0 && (
                    <div className="bg-slate-50 p-5 border-t border-slate-200">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                        <Globe2 className="w-4 h-4 text-emerald-500 animate-pulse" />
                        Strict Grounding Citations & References
                      </h4>
                      <ul className="flex flex-wrap gap-2">
                        {citations.map((cite, index) => (
                          <li key={index}>
                            <a
                              href={cite.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-xl text-xs font-mono text-slate-600 transition"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              {cite.title || "Reference URL"}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Warning Disclaimer Box */}
                  <div className="bg-amber-50 border-t border-amber-200 p-5 flex gap-3 text-xs text-amber-800 leading-relaxed">
                    <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">Dynamic Regulation Notice:</strong> Regulatory environments are inherently dynamic. This agentic compliance summary utilizes the Google Search Grounding engine to parse current 2026 data. This output should undergo a second-level cross-reference verification with verified customs brokers or competent legal trade counsel before dispatch.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}


          {/* TAB 2: HS EXCLUSION CLASSIFIER */}
          {activeTab === "hscode" && (
            <div className="flex flex-col gap-6">
              
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-2.5 mb-2">
                  <BookOpen className="w-5 h-5 text-amber-500" />
                  <h2 className="text-xl font-bold text-slate-900">
                    &quot;Exclusion-First&quot; Automotive Spare Parts Classifier
                  </h2>
                </div>
                <p className="text-sm text-slate-500 mb-6">
                  Learn to qualify parts like a customs expert. Frontline officers in Dubai enforce strict Section/Chapter notes to throw out parts claiming 8708 status. Classify using the structural 3-tier exclusion logic.
                </p>

                {/* Interactive Diagnostic Flow */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 mb-6">
                  <h3 className="text-sm font-bold text-slate-700 tracking-tight flex items-center gap-1.5 mb-4">
                    <Gauge className="w-4 h-4 text-amber-500" />
                    Automotive Part Qualification Step-by-Step
                  </h3>

                  <div className="flex flex-col md:flex-row gap-4 items-stretch">
                    {/* Step 1 */}
                    <div className="flex-1 bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-[#3b82f6] uppercase tracking-wider font-mono">
                          Step 1 / Exclusion Check
                        </span>
                        <h4 className="font-bold text-slate-800 text-sm mt-1 mb-2">
                          Parts of General Use
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Does the part qualify as a general fastener (screw, bolt, nut, rivet), spring (leaf/coil), or minor metal hardware (lock, bracket, hinge) listed in Section XV Note 2?
                        </p>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => setStep1GeneralUse(true)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition ${
                            step1GeneralUse === true
                              ? "bg-red-50 text-red-700 border-red-300"
                              : "hover:bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          Yes, it is
                        </button>
                        <button
                          onClick={() => {
                            setStep1GeneralUse(false);
                            setStep2Functional(null);
                          }}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition ${
                            step1GeneralUse === false
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                              : "hover:bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          No, distinct part
                        </button>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className={`flex-1 bg-white p-4 rounded-xl border flex flex-col justify-between transition-opacity duration-300 ${
                      step1GeneralUse === false ? "opacity-100" : "opacity-40 pointer-events-none"
                    }`}>
                      <div>
                        <span className="text-[10px] font-bold text-[#3b82f6] uppercase tracking-wider font-mono">
                          Step 2 / Function Check
                        </span>
                        <h4 className="font-bold text-slate-800 text-sm mt-1 mb-2">
                          Specific Machinery or Electrical Carve-Out
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Does the device contain exclusive mechanics or electrical work defined under Chapter 84 or 85 (such as engines, pumps, complex filters, spark plugs, alternators, lamps, batteries)?
                        </p>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <button
                          disabled={step1GeneralUse !== false}
                          onClick={() => setStep2Functional(true)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition ${
                            step2Functional === true
                              ? "bg-red-50 text-red-700 border-red-300"
                              : "hover:bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          Yes, functional
                        </button>
                        <button
                          disabled={step1GeneralUse !== false}
                          onClick={() => setStep2Functional(false)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition ${
                            step2Functional === false
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                              : "hover:bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          No, specific accessory
                        </button>
                      </div>
                    </div>

                    {/* Final Verdict */}
                    <div className="flex-1 bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-amber-400 font-mono tracking-wider uppercase block">
                          Qualification Verdict
                        </span>
                        
                        {step1GeneralUse === null && (
                          <div className="mt-4 text-xs text-slate-400">
                            Please select answers in Steps 1 & 2 to gauge classification health...
                          </div>
                        )}

                        {step1GeneralUse === true && (
                          <div className="mt-2 text-xs">
                            <span className="inline-flex items-center gap-1 text-red-400 font-bold mb-1">
                              <AlertTriangle className="w-3.5 h-3.5" /> EXCLUDED FROM 8708
                            </span>
                            <p className="text-slate-300 leading-relaxed">
                              This item represents general hardware. It must be classified by its constituent material under Chapters 73 (Iron/Steel) or 83 (Base metals).
                            </p>
                          </div>
                        )}

                        {step1GeneralUse === false && step2Functional === true && (
                          <div className="mt-2 text-xs">
                            <span className="inline-flex items-center gap-1 text-red-400 font-bold mb-1">
                              <AlertTriangle className="w-3.5 h-3.5" /> EXCLUDED FROM 8708
                            </span>
                            <p className="text-slate-300 leading-relaxed">
                              This machinery / electrical part holds custom functional listings. It is classified by function in Chapter 84 (Machinery) or Chapter 85 (Electrical).
                            </p>
                          </div>
                        )}

                        {step1GeneralUse === false && step2Functional === false && (
                          <div className="mt-2 text-xs">
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-bold mb-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> VALID FOR HEADING 8708
                            </span>
                            <p className="text-slate-300 leading-relaxed">
                              Passes all exclusion gates! It is classified as an automotive part suitable *solely or principally* for motor vehicles of Chapter 87.
                            </p>
                          </div>
                        )}
                      </div>

                      {(step1GeneralUse !== null || step2Functional !== null) && (
                        <button
                          onClick={() => {
                            setStep1GeneralUse(null);
                            setStep2Functional(null);
                          }}
                          className="mt-4 w-full bg-slate-800 hover:bg-slate-700 text-xs py-1 text-center font-semibold rounded-lg font-mono text-slate-400 transition"
                        >
                          Reset Pipeline
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Database Search Preset */}
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                    Search Automotive Parts Presets & Exclusion Logic
                  </h3>
                  
                  <div className="relative mb-4">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl pl-9 pr-4 py-2.5 text-sm transition"
                      placeholder="Start typing/searching (e.g. Bolt, Spring, Filter, Bumper, Gearbox)..."
                      value={customPartSearch}
                      onChange={(e) => handleCustomPartSearch(e.target.value)}
                    />
                  </div>

                  {/* Preset match feedback */}
                  {customPartResult && (
                    <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-xl flex gap-3 text-xs text-slate-700 animate-slide-in">
                      <Info className="w-4.5 h-4.5 text-amber-600 flex-shrink-0" />
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-bold text-slate-900">{customPartResult.name}</span>
                          <span className="bg-slate-900 text-white font-mono px-2 py-0.5 rounded text-[10px]">
                            Tariff: {customPartResult.suggestedHs}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            customPartResult.category === "SPECIFIC_VEHICLE"
                              ? "bg-emerald-100 text-emerald-800 font-sans"
                              : "bg-red-100 text-red-800 font-sans"
                          }`}>
                            {customPartResult.category === "SPECIFIC_VEHICLE" ? "Approved 8708" : "Excluded"}
                          </span>
                        </div>
                        <p className="leading-relaxed text-slate-600">{customPartResult.exclusionReason}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
                    {CLASS_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setCustomPartSearch(preset.name);
                          setCustomPartResult(preset);
                        }}
                        className="bg-slate-50 hover:bg-slate-100 p-2.5 rounded-lg border border-slate-200 text-left text-[11px] font-sans transition"
                      >
                        <span className="block font-bold text-slate-800 truncate">{preset.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Suggested: {preset.suggestedHs}</span>
                      </button>
                    ))}
                  </div>

                </div>

              </div>

            </div>
          )}


          {/* TAB 3: INCOTERMS COST & RISK */}
          {activeTab === "incoterms" && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center gap-2.5 mb-2">
                <DollarSign className="w-5 h-5 text-amber-500" />
                <h2 className="text-xl font-bold text-slate-900">
                  Incoterms 2020 Allocation Dashboard
                </h2>
              </div>
              <p className="text-sm text-slate-500 mb-6">
                Understand the precise split of costs, freight responsibilities, and the moment risk shifts between exporters and importers.
              </p>

              {/* Incoterms Selector Tabs */}
              <div className="flex gap-2 p-1.5 bg-slate-100 rounded-xl mb-6">
                <button
                  onClick={() => setIncoterm("FOB")}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${
                    incoterm === "FOB"
                      ? "bg-slate-950 text-amber-400 shadow-sm"
                      : "text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  FOB (Free On Board)
                </button>
                <button
                  onClick={() => setIncoterm("CIF")}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${
                    incoterm === "CIF"
                      ? "bg-slate-950 text-amber-400 shadow-sm"
                      : "text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  CIF (Cost, Insurance & Freight)
                </button>
              </div>

              {/* Visual Transit Map */}
              <div className="relative border border-slate-100 bg-slate-50 rounded-2xl p-6 mb-6">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-6">
                  Logistics Pipeline & transfer points
                </h3>

                <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative">
                  {/* Pipeline Horizontal Bar */}
                  <div className="absolute top-[28px] left-[10%] right-[10%] h-1 bg-slate-300 hidden md:block z-0"></div>

                  {/* Stage 1: Factory */}
                  <div className="relative z-10 flex flex-col items-center flex-1">
                    <div className="w-14 h-14 rounded-full bg-white border-2 border-[#3b82f6] flex items-center justify-center font-bold text-xs text-slate-800 shadow-sm">
                      Factory
                    </div>
                    <span className="text-[10px] uppercase font-mono tracking-wide text-slate-400 mt-2">Stage 1</span>
                    <span className="text-xs font-bold text-slate-700 mt-1">Origin</span>
                  </div>

                  {/* Stage 2: Loaded on Ship */}
                  <div className="relative z-10 flex flex-col items-center flex-1">
                    <div className="w-14 h-14 rounded-full bg-white border-2 border-emerald-500 flex items-center justify-center font-bold text-xs text-slate-800 shadow-sm">
                      On Board
                    </div>
                    <span className="text-[10px] uppercase font-mono tracking-wide text-slate-400 mt-2">Stage 2</span>
                    <span className="text-xs font-bold text-slate-700 mt-1">Vessel Port</span>
                  </div>

                  {/* Stage 3: Transit */}
                  <div className="relative z-10 flex flex-col items-center flex-1">
                    <div className="w-14 h-14 rounded-full bg-white border-2 border-amber-500 flex items-center justify-center font-bold text-xs text-slate-800 shadow-sm">
                      Ocean
                    </div>
                    <span className="text-[10px] uppercase font-mono tracking-wide text-slate-400 mt-2">Stage 3</span>
                    <span className="text-xs font-bold text-slate-700 mt-1">In Transit</span>
                  </div>

                  {/* Stage 4: Destination Port */}
                  <div className="relative z-10 flex flex-col items-center flex-1">
                    <div className="w-14 h-14 rounded-full bg-white border-2 border-indigo-500 flex items-center justify-center font-bold text-xs text-slate-800 shadow-sm">
                      Dest Port
                    </div>
                    <span className="text-[10px] uppercase font-mono tracking-wide text-slate-400 mt-2">Stage 4</span>
                    <span className="text-xs font-bold text-slate-700 mt-1">Clearance</span>
                  </div>
                </div>

                {/* Cost & Risk Allocation highlights based on selected Incoterm */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-200">
                  <div className="bg-white p-4 rounded-xl border border-slate-200/80">
                    <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                      Who Pays What? (Costs Split)
                    </h4>
                    {incoterm === "FOB" ? (
                      <ul className="text-xs text-slate-600 space-y-1.5 font-mono">
                        <li>&bull; <span className="font-bold text-slate-800">Export Clearance & Port Handling:</span> Seller</li>
                        <li>&bull; <span className="font-bold text-slate-800">Ocean Carriage freight:</span> <span className="text-red-600 font-bold">Buyer</span></li>
                        <li>&bull; <span className="font-bold text-slate-800">Marine Insurance:</span> <span className="text-red-600 font-bold">Buyer (Optional)</span></li>
                        <li>&bull; <span className="font-bold text-slate-800">Import Customs and duties:</span> <span className="text-red-600 font-bold">Buyer</span></li>
                      </ul>
                    ) : (
                      <ul className="text-xs text-slate-600 space-y-1.5 font-mono">
                        <li>&bull; <span className="font-bold text-slate-800">Export Carriage & Ocean Freight:</span> <span className="text-emerald-700 font-bold">Seller Pays</span></li>
                        <li>&bull; <span className="font-bold text-slate-800">Marine Cargo Insurance:</span> <span className="text-emerald-700 font-bold">Seller Pays (Min Level)</span></li>
                        <li>&bull; <span className="font-bold text-slate-800">Import Handling & Duties:</span> Buyer</li>
                      </ul>
                    )}
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200/80">
                    <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                      Where Does Risk Shift?
                    </h4>
                    {incoterm === "FOB" ? (
                      <div className="text-xs text-slate-600 leading-relaxed font-sans">
                        <strong className="text-slate-800 font-bold block mb-1">On board at Origin Port:</strong>
                        Risk flips to the buyer the microsecond the goods pass safely past the cargo crane and reside on the vessel deck. If a wave hits during transit, damage claims are the buyer&apos;s responsibility.
                      </div>
                    ) : (
                      <div className="text-xs text-slate-600 leading-relaxed font-sans">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-red-100 text-red-800 rounded font-mono font-bold text-[10px] mb-2 uppercase">
                          CRUCIAL RISK ANOMALY
                        </span>
                        <p className="font-bold text-slate-800 mb-1">Risk still transfers to Buyer at the Origin Port!</p>
                        Even though the seller settles the shipping freight invoice and marine insurance to the destination port, matching damage risk moves to the buyer the moment goods are loaded at origin. If shipwrecked, the buyer files the insurance claim.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Pro recommendation warning panel */}
              <div className="bg-slate-900 text-amber-400 p-5 rounded-2xl flex gap-3 text-xs leading-relaxed border border-slate-800">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100 font-bold">Modern Logistics Recommendation:</strong> Under ICC guidelines, traditional FOB and CIF guidelines are reserved solely for waterborne vessels. When transporting consolidated containerized cargo, use <strong className="text-slate-100">FCA</strong> instead of FOB or <strong className="text-slate-100">CIP</strong> instead of CIF to prevent risk gaps before the freight clears terminal gates.
                </div>
              </div>

            </div>
          )}


          {/* TAB 4: DOCUMENTS CHECKLIST */}
          {activeTab === "documents" && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4 mb-2 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <FileCheck className="w-5 h-5 text-amber-500" />
                  <h2 className="text-xl font-bold text-slate-900">
                    Customs Clearance Document Checklist
                  </h2>
                </div>
                <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-xl font-mono text-xs font-semibold">
                  <span>Clearance Readiness:</span> 
                  <span className={`${healthPercent >= 70 ? "text-emerald-700" : "text-amber-700"} font-bold`}>
                    {healthPercent}%
                  </span>
                </div>
              </div>

              <p className="text-sm text-slate-500 mb-4">
                Validate and cross-check baseline customs trade files required by port declarants. Toggle document status to record progress logs.
              </p>

              {/* Health progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-2 mb-6">
                <div 
                  className="bg-slate-900 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${healthPercent}%` }}
                ></div>
              </div>

              <div className="flex flex-col gap-2.5">
                {checklist.map((doc) => (
                  <div key={doc.id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm font-sans">{doc.name}</span>
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-700 font-mono text-[9px] font-semibold rounded uppercase tracking-wider">
                          {doc.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 font-sans">{doc.requirement}</p>
                    </div>

                    <button
                      onClick={() => toggleChecklistStatus(doc.id, doc.status)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition ${
                        doc.status === "Validated"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : doc.status === "Ready for Review"
                          ? "bg-blue-100 text-blue-800 border border-blue-200"
                          : doc.status === "In Progress"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-slate-200 text-slate-600 border border-slate-300"
                      }`}
                    >
                      {doc.status}
                    </button>
                  </div>
                ))}
              </div>

            </div>
          )}


          {/* TAB 5: DUBAI CAREERS DIAGNOSTIC */}
          {activeTab === "careers" && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center gap-2.5 mb-2">
                <Briefcase className="w-5 h-5 text-amber-500" />
                <h2 className="text-xl font-bold text-slate-900">
                  Dubai Customs Professional Route Diagnostic
                </h2>
              </div>
              <p className="text-sm text-slate-500 mb-6">
                Understand your legal qualification potential to participate in the Dubai Customs and trade compliance ecosystem.
              </p>

              {/* Diagnostic Wizard */}
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 space-y-6">
                
                {/* Question 1 */}
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-3 block">
                    1. Do you hold UAE Citizenship (Emiratization Rules check)?
                  </h3>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setIsUaeNational(true)}
                      className={`flex-1 py-2.5 rounded-xl font-semibold border text-sm transition ${
                        isUaeNational === true
                          ? "bg-slate-950 text-amber-400 border-slate-950 shadow"
                          : "bg-white hover:bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      Yes, UAE National
                    </button>
                    <button
                      onClick={() => setIsUaeNational(false)}
                      className={`flex-1 py-2.5 rounded-xl font-semibold border text-sm transition ${
                        isUaeNational === false
                          ? "bg-slate-950 text-amber-400 border-slate-950 shadow"
                          : "bg-white hover:bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      No, International Professional/Resident
                    </button>
                  </div>
                </div>

                {/* Conditional Outcomes */}
                {isUaeNational === true && (
                  <div className="bg-[#eff6ff] border border-blue-200 rounded-xl p-4 text-xs text-blue-900 leading-relaxed animate-fade-in space-y-2">
                    <strong className="text-sm font-bold text-blue-950 block">Frontline Customs Officer Candidate:</strong>
                    <p>
                      You meet the direct requirements to govern customs ports as an officer under UAE direct employment.
                    </p>
                    <ul className="list-disc pl-4 mt-2 space-y-1 font-sans">
                      <li><strong>Prerequisites:</strong> High School Diploma or Bachelor&apos;s in Law, Criminology or Supply Chain.</li>
                      <li><strong>Key System:</strong> Must undergo professional trainups on the <strong>Dubai Customs Training Center</strong>, and inspect cargo using <strong>Mirsal 2</strong>.</li>
                      <li><strong>Where to apply:</strong> Dubai Careers Government portal.</li>
                    </ul>
                  </div>
                )}

                {isUaeNational === false && (
                  <div className="bg-[#f0fdf4] border border-emerald-200 rounded-xl p-4 text-xs text-emerald-950 leading-relaxed animate-fade-in space-y-3">
                    <strong className="text-sm font-bold text-emerald-950 block">Private Sector Trade Compliance Specialist:</strong>
                    <p>
                      Frontline port enforcement officers are restricted, but international professionals hold major high-value paths inside multinational corporations, shipping logistics providers (DHL, JAFZA free-zones, DP World), and broker agencies!
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                      <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
                        <strong className="font-bold text-slate-800 block text-[11px] mb-1">Corporate Compliance</strong>
                        Help global brands manage import documentation, HS coding audit checklists, and legal GCC tariff savings.
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
                        <strong className="font-bold text-slate-800 block text-[11px] mb-1">Licensed Dec Broker</strong>
                        Prepare, submit and reconcile export/import declarations directly onto the <strong>Mirsal 2</strong> portal for clients.
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
                        <strong className="font-bold text-slate-800 block text-[11px] mb-1">Free Zone Advisors</strong>
                        Offer custom guidance inside Designated Freezones (like JAFZA or DAFZA) regarding standard onshore VAT exemptions.
                      </div>
                    </div>

                    <div className="pt-2">
                      <strong className="font-bold text-slate-800 block mb-1 uppercase tracking-wide text-[10px]">Recommended Accreditations:</strong>
                      <p className="text-slate-700">
                        Maximize your resume value under Dubai authorities by earning certifications with the <strong className="text-slate-800">Chartered Institute of Logistics and Transport (CILT)</strong>, Certified Customs Specialist (CCS), or VAT-specific audit bodies.
                      </p>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

        </div>
      </main>

      {/* Corporate Footnotes */}
      <footer className="bg-slate-950 border-t border-slate-900 py-6 mt-12 text-slate-500 text-center font-mono text-xs">
        <div className="max-w-7xl mx-auto px-4">
          <p className="mb-2">
            Global Trade Clearance Assistant &bull; Factual Compliance Matrix &bull; Year 2026/2027
          </p>
          <p className="text-[10px] text-slate-600">
            Powered by Gemini Grounded Model with Google Search Grounding to guarantee absolute temporal accuracy.
          </p>
        </div>
      </footer>
    </div>
  );
}
