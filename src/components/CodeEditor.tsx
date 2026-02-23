import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { supabase } from "../lib/supabaseClient";
import {
  Code as CodeIcon,
  Brain,
  FileJson,
  Languages,
  Play,
  Save,
  LayoutDashboard,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  Check,
} from "lucide-react";

// Define props interface
interface CodeEditorProps {
  onNavigate?: (page: "dashboard" | "editor") => void;
}

export default function CodeEditor({ onNavigate }: CodeEditorProps) {
  // --- LOGOUT FUNCTION ---
  const handleLogout = async () => {
    await supabase.auth.signOut();
    // The App.tsx listener will automatically switch you back to AuthForm
  };

  // State Management
  const [code, setCode] = useState("// Write your source code here...");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [loading, setLoading] = useState(false);
  const [aiHints, setAiHints] = useState<string[]>([
    "Write a function to optimize the IR...",
    "Check for null pointers in your logic.",
  ]);
  const [irOutput, setIrOutput] = useState(
    "{\n  'block': 'entry',\n  'ops': []\n}",
  );
  const [translatedCode, setTranslatedCode] = useState(
    "// Translated code will appear here",
  );
  const [user, setUser] = useState<any>(null);
  const [isValidated, setIsValidated] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  const [copiedIr, setCopiedIr] = useState(false);

  const handleCopyIr = () => {
    navigator.clipboard.writeText(irOutput);
    setCopiedIr(true);
    setTimeout(() => setCopiedIr(false), 2000);
  };

  // Fetch User on Mount
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    getUser();
  }, []);

  // Handle Code Submission
  const handleSubmit = async () => {
    if (!user) return alert("Please login first");
    if (!isValidated) return alert("Please validate your code successfully before submitting.");
    setLoading(true);

    try {
      const { error } = await supabase.from("submissions").insert({
        user_id: user.id,
        source_code: code,
        description: description,
        language: language,
        ir_output: irOutput,
        status: "submitted",
      });

      if (error) throw error;
      setSubmissionSuccess(true);
      setAiHints((prev) => [...prev, "Submission successful!"]);
    } catch (error: any) {
      alert("Error submitting: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!description.trim() || !code.trim() || code.includes("Write your source code here")) {
      alert("Please provide both a valid problem description and code.");
      return;
    }

    setIsEvaluating(true);
    setAiHints(["Evaluating code correctness with local LLM..."]);
    setIrOutput("Waiting for validation...");
    setTranslatedCode("Waiting for validation...");
    setIsValidated(false);
    setSubmissionSuccess(false);

    try {
      // 1. Check Correctness
      const resCorrectness = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-oss', // Updated to match user's installed model
          prompt: `You are an expert code reviewer. Read the following problem description and the provided code. Is the code a completely correct solution to the problem? Respond with EXACTLY the word 'CORRECT' if it is correct, or provide brief feedback on what is wrong if it is incorrect.\nProblem: ${description}\nCode:\n${code}`,
          stream: false
        })
      });

      if (!resCorrectness.ok) throw new Error("Ollama endpoint not reachable");

      const dataCorrectness = await resCorrectness.json();
      const feedback = dataCorrectness.response.trim();

      if (feedback.toUpperCase().includes("CORRECT") && feedback.length < 50) {
        setAiHints(["Code is CORRECT! Generating IR and translations..."]);

        // 2. Generate IR and Translations in parallel
        const [resIR, resTranslate] = await Promise.all([
          fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'gpt-oss',
              prompt: `Generate high-level pseudocode for the following code. Output ONLY the pseudocode. Do not include any other text.\nCode:\n${code}`,
              stream: false
            })
          }),
          fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'gpt-oss',
              prompt: `Translate the following code into Python, Java, and C++. Format the output clearly with markdown code blocks.\nCode:\n${code}`,
              stream: false
            })
          })
        ]);

        const dataIR = await resIR.json();
        const dataTranslate = await resTranslate.json();

        setIrOutput(dataIR.response);
        setTranslatedCode(dataTranslate.response);
        setAiHints(["Validation complete. Code is correct. You can now save your submission."]);
        setIsValidated(true);
      } else {
        setAiHints(["Validation Failed", feedback, "Please fix your code and try validating again."]);
        setIrOutput("Validation failed. Please fix the code based on the feedback.");
        setTranslatedCode("Validation failed. Please fix the code based on the feedback.");
      }
    } catch (error: any) {
      setAiHints(["Error validating with local LLM. Make sure Ollama is running.", error.message]);
      setIrOutput("Error connecting to evaluation engine.");
      setTranslatedCode("Error connecting to evaluation engine.");
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-white font-sans overflow-hidden">
      {/* ================= HEADER ================= */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md z-50">
        <div className="flex items-center gap-6">
          {/* --- DASHBOARD NAVIGATION --- */}
          {/* Added onClick to navigate back to dashboard */}
          <div
            onClick={() => onNavigate?.("dashboard")}
            className="flex items-center gap-2 text-slate-400 hover:text-red-400 cursor-pointer transition-colors"
          >
            <LayoutDashboard size={20} />
            <span className="font-bold tracking-wide">DASHBOARD</span>
          </div>

          <div className="h-6 w-px bg-slate-700"></div>

          {/* --- ACTIVE EDITOR TAB --- */}
          <div className="flex items-center gap-2 text-cyan-400 cursor-default">
            <CodeIcon size={20} />
            <span className="font-bold tracking-wide border-b-2 border-cyan-400 pb-0.5">
              EDITOR
            </span>
          </div>
        </div>

        {/* --- USER PROFILE --- */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-slate-400">Logged in as</p>
            <p className="text-sm font-medium text-blue-200">{user?.email}</p>
          </div>

          {/* Logout Trigger Button */}
          <button
            onClick={handleLogout}
            className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 border border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:scale-105 transition-transform flex items-center justify-center group"
            title="Sign Out"
          >
            <LogOut
              size={16}
              className="text-white opacity-0 group-hover:opacity-100 transition-opacity absolute"
            />
          </button>
        </div>
      </header>

      {/* ================= MAIN GRID LAYOUT ================= */}
      <div className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-y-auto lg:overflow-hidden min-h-0">
        {/* Left Column */}
        <div className="lg:col-span-7 flex flex-col gap-4 h-full">
          <div className="flex-1 relative flex flex-col rounded-xl border border-blue-500/30 bg-slate-900/40 backdrop-blur-sm overflow-hidden shadow-[0_0_30px_rgba(59,130,246,0.1)]">
            <div className="flex justify-between items-center px-4 py-2 bg-blue-900/20 border-b border-blue-500/20">
              <span className="text-sm font-semibold text-blue-300 flex items-center gap-2">
                <CodeIcon size={16} /> Code Submission Area
              </span>
              <button
                onClick={handleValidate}
                disabled={isEvaluating}
                className={`px-3 py-1 text-xs font-bold rounded shadow-sm transition-all focus:outline-none ${isEvaluating
                  ? "bg-slate-400 text-slate-700 cursor-not-allowed"
                  : "bg-slate-200 text-slate-900 hover:bg-white"
                  }`}
              >
                {isEvaluating ? <Loader2 className="animate-spin inline-block w-3 h-3 mr-1" /> : null}
                {isEvaluating ? "Validating..." : "Validate"}
              </button>
            </div>
            <div className="flex-1 pt-2">
              <Editor
                height="100%"
                defaultLanguage="javascript"
                language={language}
                theme="vs-dark"
                value={code}
                onChange={(val) => setCode(val || "")}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 10 },
                }}
              />
            </div>
          </div>

          <div className="h-48 rounded-xl border border-sky-400/30 bg-slate-900/40 backdrop-blur-sm flex flex-col shadow-[0_0_20px_rgba(56,189,248,0.1)]">
            <div className="px-4 py-2 bg-sky-900/20 border-b border-sky-500/20">
              <span className="text-sm font-semibold text-sky-300">
                Code Description / Problem Statement
              </span>
            </div>
            <textarea
              className="flex-1 bg-transparent p-4 resize-none focus:outline-none text-slate-300 placeholder-slate-600 text-sm font-mono"
              placeholder="Describe the logic of your code or the problem you are solving..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-5 flex flex-col gap-4 h-full min-h-0">
          <div className="flex-[0.8] min-h-0 rounded-xl border border-pink-500/30 bg-slate-900/40 backdrop-blur-sm overflow-hidden shadow-[0_0_20px_rgba(236,72,153,0.1)] flex flex-col">
            <div className="px-4 py-2 bg-pink-900/20 border-b border-pink-500/20 flex items-center gap-2">
              <Brain size={16} className="text-pink-400" />
              <span className="text-sm font-semibold text-pink-300">
                AI Suggestions & Hints
              </span>
            </div>
            <div className="p-4 overflow-y-auto h-full space-y-3">
              {aiHints.map((hint, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-lg bg-pink-500/10 border border-pink-500/10"
                >
                  <div className="min-w-[6px] h-6 rounded-full bg-pink-500 mt-0.5"></div>
                  <p className="text-xs text-pink-100/80 leading-relaxed">
                    {hint}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-[1.2] min-h-0 flex gap-4">
            <div className="w-1/2 rounded-xl border border-yellow-500/30 bg-slate-900/40 backdrop-blur-sm overflow-hidden flex flex-col">
              <div className="px-3 py-2 bg-yellow-900/20 border-b border-yellow-500/20 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <FileJson size={14} className="text-yellow-400" />
                  <span className="text-xs font-bold text-yellow-300 uppercase tracking-wider">
                    Struct IR
                  </span>
                </div>
                <button
                  onClick={handleCopyIr}
                  className="text-yellow-400 hover:text-yellow-300 p-1 rounded-md transition-colors"
                  title="Copy IR"
                >
                  {copiedIr ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
              <pre className="flex-1 p-3 text-[10px] text-yellow-100/70 font-mono overflow-auto custom-scrollbar">
                {irOutput}
              </pre>
            </div>

            <div className="w-1/2 rounded-xl border border-purple-500/30 bg-slate-900/40 backdrop-blur-sm overflow-hidden flex flex-col">
              <div className="px-3 py-1.5 bg-purple-900/20 border-b border-purple-500/20 flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <Languages size={14} className="text-purple-400" />
                  <span className="text-xs font-bold text-purple-300 uppercase">
                    Target
                  </span>
                </div>
                <select
                  className="bg-slate-950 text-[10px] text-purple-200 border border-purple-500/30 rounded px-1 outline-none"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="javascript">JS</option>
                  <option value="python">Python</option>
                  <option value="cpp">C++</option>
                </select>
              </div>
              <pre className="flex-1 p-3 text-[10px] text-purple-100/70 font-mono overflow-auto custom-scrollbar">
                {translatedCode}
              </pre>
            </div>
          </div>

          <div className="flex-[1] min-h-0 rounded-xl border border-emerald-500/30 bg-emerald-900/10 backdrop-blur-sm flex flex-col justify-between p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors"></div>

            {submissionSuccess ? (
              <div className="flex flex-col items-center justify-center h-full space-y-4">
                <CheckCircle2 size={48} className="text-emerald-400" />
                <h3 className="text-xl font-bold text-emerald-400">Submission Success!</h3>
                <p className="text-sm text-emerald-200/80 text-center">
                  Your code has been successfully validated and saved.
                </p>
                <button
                  onClick={() => onNavigate?.("dashboard")}
                  className="mt-4 px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg shadow-lg flex items-center gap-2 transition-transform hover:-translate-y-1"
                >
                  <LayoutDashboard size={18} />
                  Return to Dashboard
                </button>
              </div>
            ) : (
              <>
                <div>
                  <h3 className="text-lg font-bold text-emerald-400 mb-2 flex items-center gap-2">
                    <CheckCircle2 size={20} /> Ready to Submit?
                  </h3>
                  <p className="text-xs text-emerald-200/60">
                    Ensure your description matches the logic provided, and validate your code first.
                  </p>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading || !isValidated}
                  className={`w-full py-4 mt-4 rounded-lg font-bold text-sm uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all transform
                    ${loading || !isValidated
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                      : "bg-emerald-500 hover:bg-emerald-400 hover:-translate-y-1 text-slate-950 shadow-emerald-500/20"
                    }
                  `}
                >
                  {loading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}
                  {loading ? "Processing..." : !isValidated ? "Validate First to Save" : "Submit / Save"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
