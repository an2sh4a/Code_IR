import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import axios from "axios";
import {
  LayoutDashboard,
  ClipboardCheck,
  User,
  LogOut,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  FileText,
  ChevronRight,
} from "lucide-react";

interface InstructorDashboardProps {
  onNavigate: (view: "dashboard" | "evaluation", submissionId?: string) => void;
}

export default function InstructorDashboard({
  onNavigate,
}: InstructorDashboardProps) {
  const [user, setUser] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pending: 0, evaluated: 0, total: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      setUser(session.user);

      const response = await axios.get("http://localhost:5000/api/instructor/dashboard");

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to fetch instructor dashboard data");
      }

      const safeData = response.data.data || [];
      setSubmissions(safeData);

      // Calculate Stats
      const total = safeData.length;
      const evaluated = safeData.filter(
        (s: any) => s.evaluations && s.evaluations.length > 0,
      ).length;
      const pending = total - evaluated;

      setStats({ total, evaluated, pending });
    } catch (error) {
      console.error("Error fetching instructor data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-white font-sans overflow-hidden">
      {/* ================= HEADER ================= */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md z-50">
        <div className="flex items-center gap-6">
          {/* TAB 1: DASHBOARD (Active) */}
          <div className="flex items-center gap-2 text-red-400 cursor-default border-b-2 border-red-400 pb-0.5">
            <LayoutDashboard size={20} />
            <span className="font-bold tracking-wide">DASHBOARD</span>
          </div>

          <div className="h-6 w-px bg-slate-700"></div>

          {/* TAB 2: EVALUATION (Navigation Link) */}
          {/* This was missing! Now you can click this to go to Sandbox Mode */}
          <div
            onClick={() => onNavigate("evaluation")}
            className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 cursor-pointer transition-colors select-none"
            role="button"
            tabIndex={0}
          >
            <ClipboardCheck size={20} />
            <span className="font-bold tracking-wide">EVALUATION</span>
          </div>
        </div>

        {/* User Profile Section */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-slate-400">Instructor Account</p>
            <p className="text-sm font-medium text-red-200">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-full hover:bg-slate-800 transition-colors"
          >
            <LogOut size={18} className="text-slate-400 hover:text-white" />
          </button>
        </div>
      </header>

      {/* ================= MAIN CONTENT ================= */}
      <div className="flex-1 flex overflow-hidden">
        {/* === LEFT PANEL: PROFILE === */}
        <div className="hidden lg:flex w-1/4 min-w-[260px] max-w-[300px] bg-slate-900/50 border-r border-slate-800 p-6 flex-col gap-6">
          {" "}
          <div className="flex flex-col items-center text-center pt-8">
            <div className="h-28 w-28 rounded-full bg-gradient-to-br from-red-600 to-rose-600 p-1 shadow-[0_0_25px_rgba(225,29,72,0.4)]">
              <div className="h-full w-full rounded-full bg-slate-950 flex items-center justify-center">
                <User size={48} className="text-red-400" />
              </div>
            </div>
            <h2 className="mt-6 text-xl font-bold text-white">
              Prof. {user?.email?.split("@")[0]}
            </h2>
            <p className="text-sm text-red-300/60 mt-1">Senior Evaluator</p>
            <div className="mt-6 w-full h-px bg-slate-800"></div>
            <div className="mt-6 w-full space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Department</span>
                <span className="text-slate-200">CompSci</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Term</span>
                <span className="text-slate-200">Fall 2024</span>
              </div>
            </div>
          </div>
        </div>

        {/* === RIGHT PANEL: STATS & TABLE === */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
          {/* --- TOP: ACTIVE SUMMARY CARDS --- */}
          <div className="p-8 border-b border-slate-800 bg-slate-900/20">
            <h3 className="text-lg font-bold text-slate-300 mb-6 flex items-center gap-2">
              <ClipboardCheck size={20} className="text-red-400" /> Submission
              Overview
            </h3>

            <div className="grid grid-cols-3 md:grid-cols-3 gap-6">
              {/* Card 1: Pending */}
              <div className="p-6 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.1)] flex flex-col">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                    <Clock size={24} className="text-orange-400" />
                  </div>
                  <span className="text-3xl font-bold text-white">
                    {stats.pending}
                  </span>
                </div>
                <p className="mt-4 text-sm font-medium text-orange-200/80 uppercase tracking-wider">
                  Pending Reviews
                </p>
              </div>

              {/* Card 2: Evaluated */}
              <div className="p-6 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)] flex flex-col">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <CheckCircle2 size={24} className="text-emerald-400" />
                  </div>
                  <span className="text-3xl font-bold text-white">
                    {stats.evaluated}
                  </span>
                </div>
                <p className="mt-4 text-sm font-medium text-emerald-200/80 uppercase tracking-wider">
                  Evaluated
                </p>
              </div>

              {/* Card 3: Total */}
              <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)] flex flex-col">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <FileText size={24} className="text-blue-400" />
                  </div>
                  <span className="text-3xl font-bold text-white">
                    {stats.total}
                  </span>
                </div>
                <p className="mt-4 text-sm font-medium text-blue-200/80 uppercase tracking-wider">
                  Total Submissions
                </p>
              </div>
            </div>
          </div>

          {/* --- BOTTOM: STUDENT TABLE --- */}
          <div className="flex-1 p-6 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-yellow-200 flex items-center gap-2">
                Active Submissions
              </h3>
              <div className="flex gap-2">
                <button className="p-2 bg-slate-800 rounded hover:bg-slate-700 text-slate-300">
                  <Search size={16} />
                </button>
                <button className="p-2 bg-slate-800 rounded hover:bg-slate-700 text-slate-300">
                  <Filter size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto overflow-x-auto rounded-xl border border-yellow-500/10 bg-slate-900/40 shadow-inner custom-scrollbar">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="bg-yellow-900/10 text-yellow-200/80 sticky top-0 z-10 backdrop-blur-md">
                  <tr>
                    <th className="p-4 font-semibold">Student ID</th>
                    <th className="p-4 font-semibold">Problem</th>
                    <th className="p-4 font-semibold">Submitted</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold">Score</th>
                    <th className="p-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {submissions.map((sub) => {
                    const isEvaluated =
                      sub.evaluations && sub.evaluations.length > 0;
                    const score = isEvaluated
                      ? (sub.evaluations[0].final_scores?.correctness || 0) +
                      (sub.evaluations[0].final_scores?.efficiency || 0) +
                      (sub.evaluations[0].final_scores?.style || 0)
                      : "-";

                    return (
                      <tr
                        key={sub.submission_id}
                        className="hover:bg-white/5 transition-colors group"
                      >
                        <td className="p-4 font-mono text-slate-400">
                          {sub.user_id.slice(0, 8)}...
                        </td>
                        <td className="p-4 text-slate-200 font-medium">
                          {sub.problems?.problem_statement
                            ? sub.problems.problem_statement.slice(0, 30) + "..."
                            : "Untitled Problem"}
                        </td>
                        <td className="p-4 text-slate-400">
                          {new Date(sub.submission_timestamp).toLocaleDateString()}{" "}
                          <span className="text-xs text-slate-600">
                            {new Date(sub.submission_timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </td>
                        <td className="p-4">
                          {isEvaluated ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                              Evaluated
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 text-xs font-bold border border-orange-500/20">
                              Pending Review
                            </span>
                          )}
                        </td>
                        <td className="p-4 font-mono text-slate-300">
                          {score !== "-" ? (
                            <span className="text-emerald-300">{score}/30</span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => onNavigate("evaluation", sub.submission_id)}
                            className="px-3 py-1.5 text-xs font-bold bg-slate-800 text-slate-300 hover:bg-cyan-500 hover:text-white rounded border border-slate-700 hover:border-cyan-400 transition-all flex items-center gap-1 ml-auto"
                          >
                            {isEvaluated ? "Edit Grade" : "Grade Now"}{" "}
                            <ChevronRight size={12} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
