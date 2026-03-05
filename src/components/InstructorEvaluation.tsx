import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { supabase } from "../lib/supabaseClient";
import axios from "axios";
import {
  Code as CodeIcon,
  FileJson,
  ClipboardCheck,
  MessageSquare,
  Save,
  LayoutDashboard,
  LogOut,
  Sparkles,
  Loader2,
  User,
  AlertTriangle,
} from "lucide-react";

// 1. Define the Props Interface ensuring onBack is required
interface InstructorEvaluationProps {
  submissionId?: string;
  onBack: () => void;
}

export default function InstructorEvaluation({
  submissionId,
  onBack,
}: InstructorEvaluationProps) {
  const [loading, setLoading] = useState(false);
  const [submission, setSubmission] = useState<any>(null);

  // Local state for code so instructor can edit it
  const [code, setCode] = useState(
    "// Waiting for submission or paste code here...",
  );
  const [irView, setIrView] = useState(
    "{\n  'status': 'No IR generated yet'\n}",
  );

  const [feedback, setFeedback] = useState("");
  const [scores, setScores] = useState({
    correctness: 0,
    efficiency: 0,
    style: 0,
  });
  const [user, setUser] = useState<any>(null);

  // --- Fetch User & Specific Submission ---
  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user || null);

      if (submissionId) {
        // FETCH SPECIFIC SUBMISSION BASED ON ID
        try {
          const response = await axios.get(`http://localhost:5000/api/submissions/${submissionId}`);

          if (!response.data.success) {
            throw new Error(response.data.error || "Failed to fetch submission details");
          }

          const data = response.data.data;
          setSubmission(data);
          setCode(data.source_code || "");
          if (data.pseudocodes) {
            setIrView(typeof data.pseudocodes.structured_blocks === 'string'
              ? data.pseudocodes.structured_blocks
              : JSON.stringify(data.pseudocodes.structured_blocks, null, 2));
          }
        } catch (error) {
          console.error("Error fetching submission:", error);
        }
      } else {
        // Sandbox Mode (No ID passed)
        setSubmission(null);
        setCode(
          "// Sandbox Mode.\n// No specific student submission selected.\n// You can write code here to test.",
        );
      }
    };
    init();
  }, [submissionId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleAISuggestion = () => {
    setScores({ correctness: 9, efficiency: 8, style: 7 });
    setFeedback(
      "The code logic is sound and handles edge cases well. However, the IR generation step could be optimized by reducing redundant nodes.",
    );
  };

  const handleSubmitEvaluation = async () => {
    if (!user) return;

    if (!submission) {
      alert(
        "Sandbox Mode: Evaluation generated but not saved (No student submission linked).",
      );
      return;
    }

    setLoading(true);

    try {
      const payload = {
        submissionId: submission.submission_id,
        scores,
        feedback
      };

      const response = await axios.post("http://localhost:5000/api/evaluations", payload);

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to save evaluation");
      }

      alert("Evaluation saved successfully!");
      onBack();
    } catch (error: any) {
      alert("Error saving evaluation: " + (error.response?.data?.error || error.message));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-white font-sans overflow-hidden">
      {/* ================= HEADER ================= */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md z-50">
        <div className="flex items-center gap-6">
          {/* --- NAVIGATION: DASHBOARD LINK --- */}
          {/* Changed to DIV to match Student Dashboard behavior exactly */}
          <div
            onClick={onBack}
            className="flex items-center gap-2 text-red-400 hover:text-red-300 cursor-pointer transition-colors select-none"
            role="button"
            tabIndex={0}
          >
            <LayoutDashboard size={20} />
            <span className="font-bold tracking-wide">DASHBOARD</span>
          </div>

          <div className="h-6 w-px bg-slate-700"></div>

          <div className="flex items-center gap-2 text-emerald-400 cursor-default">
            <ClipboardCheck size={20} />
            <span className="font-bold tracking-wide border-b-2 border-emerald-400 pb-0.5">
              EVALUATION
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {!submission && (
            <span className="text-xs px-2 py-1 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 flex items-center gap-1">
              <AlertTriangle size={12} /> Sandbox Mode
            </span>
          )}
          <div className="text-right hidden sm:block">
            <p className="text-xs text-slate-400">Instructor Mode</p>
            <p className="text-sm font-medium text-emerald-200">
              {user?.email}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 border border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)] hover:scale-105 transition-transform flex items-center justify-center group"
            title="Sign Out"
          >
            <LogOut
              size={16}
              className="text-white opacity-0 group-hover:opacity-100 transition-opacity absolute"
            />
            <User
              size={16}
              className="text-white group-hover:opacity-0 transition-opacity absolute"
            />
          </button>
        </div>
      </header>

      {/* ================= MAIN CONTENT ================= */}
      <div className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-y-auto lg:overflow-hidden">
        {/* COLUMN 1: CODE EDITOR */}
        <div className="lg:col-span-4 flex flex-col h-full rounded-xl border border-blue-500/30 bg-slate-900/40 backdrop-blur-sm overflow-hidden shadow-[0_0_20px_rgba(59,130,246,0.1)]">
          <div className="px-4 py-3 bg-blue-900/20 border-b border-blue-500/20 flex justify-between items-center">
            <span className="text-sm font-semibold text-blue-300 flex items-center gap-2">
              <CodeIcon size={16} /> Student Source Code
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-200 border border-blue-500/30">
              {submission?.language || "python"}
            </span>
          </div>
          <div className="flex-1 pt-2">
            <Editor
              height="100%"
              defaultLanguage="python"
              language={submission?.language || "python"}
              theme="vs-dark"
              value={code}
              onChange={(val) => setCode(val || "")}
              options={{ minimap: { enabled: false }, fontSize: 13 }}
            />
          </div>
        </div>

        {/* COLUMN 2: IR VIEW */}
        <div className="lg:col-span-4 flex flex-col h-full rounded-xl border border-yellow-500/30 bg-slate-900/40 backdrop-blur-sm overflow-hidden shadow-[0_0_20px_rgba(234,179,8,0.1)]">
          <div className="px-4 py-3 bg-yellow-900/20 border-b border-yellow-500/20 flex justify-between items-center">
            <span className="text-sm font-semibold text-yellow-300 flex items-center gap-2">
              <FileJson size={16} /> Structured IR View
            </span>
          </div>
          <div className="flex-1 p-4 overflow-auto custom-scrollbar">
            <textarea
              className="w-full h-full bg-transparent resize-none focus:outline-none text-xs text-yellow-100/80 font-mono"
              value={irView}
              onChange={(e) => setIrView(e.target.value)}
            />
          </div>
        </div>

        {/* COLUMN 3: RUBRIC */}
        <div className="lg:col-span-4 flex flex-col gap-4 h-full">
          <div className="flex-[3] flex flex-col rounded-xl border border-pink-500/30 bg-slate-900/40 backdrop-blur-sm overflow-hidden shadow-[0_0_20px_rgba(236,72,153,0.1)]">
            <div className="px-4 py-3 bg-pink-900/20 border-b border-pink-500/20 flex justify-between items-center">
              <span className="text-sm font-semibold text-pink-300 flex items-center gap-2">
                <ClipboardCheck size={16} /> Evaluation Rubric
              </span>
              <button
                onClick={handleAISuggestion}
                className="flex items-center gap-1 text-[10px] bg-pink-500 hover:bg-pink-400 text-white px-2 py-1 rounded transition-colors shadow-lg shadow-pink-500/20"
              >
                <Sparkles size={10} /> Auto-Grade
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-pink-100">
                  <span>Correctness</span>
                  <span className="font-bold text-pink-400">
                    {scores.correctness}/10
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={scores.correctness}
                  onChange={(e) =>
                    setScores({
                      ...scores,
                      correctness: parseInt(e.target.value),
                    })
                  }
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-pink-100">
                  <span>IR Efficiency</span>
                  <span className="font-bold text-pink-400">
                    {scores.efficiency}/10
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={scores.efficiency}
                  onChange={(e) =>
                    setScores({
                      ...scores,
                      efficiency: parseInt(e.target.value),
                    })
                  }
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-pink-100">
                  <span>Code Style</span>
                  <span className="font-bold text-pink-400">
                    {scores.style}/10
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={scores.style}
                  onChange={(e) =>
                    setScores({ ...scores, style: parseInt(e.target.value) })
                  }
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                />
              </div>
            </div>

            <div className="px-6 pb-4 pt-2 border-t border-pink-500/10">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Total Score</span>
                <span className="text-2xl font-bold text-white">
                  {scores.correctness + scores.efficiency + scores.style}
                  <span className="text-sm text-slate-500">/30</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex-[2] flex flex-col rounded-xl border border-emerald-500/30 bg-emerald-900/5 backdrop-blur-sm overflow-hidden shadow-[0_0_20px_rgba(16,185,129,0.1)] relative group">
            <div className="px-4 py-2 bg-emerald-900/20 border-b border-emerald-500/20">
              <span className="text-sm font-semibold text-emerald-300 flex items-center gap-2">
                <MessageSquare size={16} /> Instructor Feedback
              </span>
            </div>
            <textarea
              className="flex-1 bg-transparent p-4 resize-none focus:outline-none text-emerald-100 placeholder-emerald-500/50 text-sm"
              placeholder="Enter detailed feedback for the student here..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
            <div className="p-4 bg-emerald-900/20 border-t border-emerald-500/20">
              <button
                onClick={handleSubmitEvaluation}
                disabled={loading}
                className={`w-full py-2 font-bold rounded shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all
                  ${submission
                    ? "bg-emerald-500 hover:bg-emerald-400 text-slate-900"
                    : "bg-slate-700 text-slate-400 cursor-not-allowed hover:bg-slate-600"
                  }
                `}
              >
                {loading ? (
                  <Loader2 className="animate-spin h-4 w-4" />
                ) : (
                  <Save size={16} />
                )}
                {loading
                  ? "Saving..."
                  : submission
                    ? "Submit Evaluation"
                    : "View Only Mode"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
