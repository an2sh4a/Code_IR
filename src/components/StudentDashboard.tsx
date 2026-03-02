import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  LayoutDashboard,
  Code as CodeIcon,
  User,
  LogOut,
  Trophy,
  Flame,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  FileCode,
  FileJson,
} from "lucide-react";

export default function StudentDashboard({
  onNavigate,
}: {
  onNavigate: (page: "dashboard" | "editor") => void;
}) {
  const [user, setUser] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalSolved: 0, currentStreak: 0 });
  const [calendarData, setCalendarData] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      setUser(session.user);

      const { data: subs, error } = await supabase
        .from("submissions")
        .select(
          `
          submission_id, submission_timestamp, validation_status, source_code,
          problems ( problem_statement ),
          pseudocodes ( structured_blocks, translations ( target_language, translated_code ) ),
          evaluations ( teacher_feedback, final_scores )
        `
        )
        .eq("user_id", session.user.id)
        .order("submission_timestamp", { ascending: false });

      if (error) throw error;

      const safeSubs = subs || [];
      setSubmissions(safeSubs);
      calculateStats(safeSubs);
      processCalendarData(safeSubs);
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- DATA TRANSFORMATION FOR HEATMAP ---
  const processCalendarData = (subs: any[]) => {
    const today = new Date();
    const dateMap = new Map<string, number>();

    subs.forEach((s) => {
      const date = new Date(s.submission_timestamp).toISOString().split("T")[0];
      dateMap.set(date, (dateMap.get(date) || 0) + 1);
    });

    // Generate last 365 days
    const data = [];
    for (let i = 364; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const count = dateMap.get(dateStr) || 0;

      let level = 0;
      if (count >= 1) level = 1;
      if (count >= 3) level = 2;
      if (count >= 5) level = 3;
      if (count >= 8) level = 4;

      data.push({ date: dateStr, count, level });
    }
    setCalendarData(data);
  };

  const calculateStats = (subs: any[]) => {
    setStats({
      totalSolved: subs.length,
      currentStreak: calculateStreak(subs),
    });
  };

  const calculateStreak = (subs: any[]) => {
    // Simple streak logic: Check consecutive days going back from today
    if (subs.length === 0) return 0;
    const uniqueDates = Array.from(
      new Set(
        subs.map((s) => new Date(s.submission_timestamp).toISOString().split("T")[0]),
      ),
    )
      .sort()
      .reverse();

    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .split("T")[0];

    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) return 0;

    let streak = 1;
    let current = new Date(uniqueDates[0]);

    for (let i = 1; i < uniqueDates.length; i++) {
      const prev = new Date(uniqueDates[i]);
      const diff = (current.getTime() - prev.getTime()) / (1000 * 3600 * 24);
      if (diff === 1) {
        streak++;
        current = prev;
      } else {
        break;
      }
    }
    return streak;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Helper for Heatmap Colors
  const getLevelColor = (level: number) => {
    switch (level) {
      case 1:
        return "bg-emerald-900"; // Low
      case 2:
        return "bg-emerald-700"; // Medium
      case 3:
        return "bg-emerald-500"; // High
      case 4:
        return "bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.6)]"; // Max
      default:
        return "bg-slate-800/50"; // Empty
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-white font-sans overflow-hidden">
      {/* HEADER */}
      <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-red-400 cursor-default border-b-2 border-red-400 pb-0.5">
            <LayoutDashboard size={20} />
            <span className="font-bold tracking-wide">DASHBOARD</span>
          </div>
          <div className="h-6 w-px bg-slate-700"></div>
          <div
            className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 cursor-pointer transition-colors"
            onClick={() => onNavigate("editor")}
          >
            <CodeIcon size={20} />
            <span className="font-bold tracking-wide">EDITOR</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-slate-400">Student Account</p>
            <p className="text-sm font-medium text-blue-200">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-full hover:bg-slate-800 transition-colors"
          >
            <LogOut size={18} className="text-slate-400 hover:text-white" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL (Profile) */}
        <div className="hidden lg:flex w-1/4 min-w-[280px] bg-slate-900/50 border-r border-slate-800 p-6 flex-col gap-6 overflow-y-auto">
          {" "}
          <div className="flex flex-col items-center text-center pt-4">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 p-1 shadow-[0_0_20px_rgba(59,130,246,0.5)]">
              <div className="h-full w-full rounded-full bg-slate-950 flex items-center justify-center">
                <User size={40} className="text-blue-400" />
              </div>
            </div>
            <h2 className="mt-4 text-xl font-bold text-white">
              {user?.email?.split("@")[0]}
            </h2>
            <p className="text-sm text-blue-300/80">
              Computer Science • Year 2
            </p>
          </div>
          <div className="space-y-3 mt-4">
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">
                  Problems Solved
                </p>
                <p className="text-2xl font-bold text-white">
                  {stats.totalSolved}
                </p>
              </div>
              <Trophy size={24} className="text-yellow-500" />
            </div>
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">
                  Current Streak
                </p>
                <p className="text-2xl font-bold text-white">
                  {stats.currentStreak}{" "}
                  <span className="text-sm text-slate-500">days</span>
                </p>
              </div>
              <Flame size={24} className="text-orange-500" />
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="grid grid-cols-2 gap-4 p-6 pb-0 lg:hidden">
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 flex items-center justify-between shadow-lg">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Solved
                </p>
                <p className="text-2xl font-bold text-white">
                  {stats.totalSolved}
                </p>
              </div>
              <Trophy
                size={24}
                className="text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]"
              />
            </div>

            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 flex items-center justify-between shadow-lg">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Streak
                </p>
                <p className="text-2xl font-bold text-white">
                  {stats.currentStreak}{" "}
                  <span className="text-xs text-slate-500 font-normal">
                    days
                  </span>
                </p>
              </div>
              <Flame
                size={24}
                className="text-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.5)]"
              />
            </div>
          </div>
          {/* --- ACTIVE SUMMARY (CUSTOM HEATMAP) --- */}
          <div className="h-auto min-h-[280px] bg-slate-950 p-8 border-b border-slate-800 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-rose-300 flex items-center gap-2">
                <Calendar size={20} /> Active Summary
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <span>Less</span>
                  <div className="w-2.5 h-2.5 bg-slate-800 rounded-[1px]"></div>
                  <div className="w-2.5 h-2.5 bg-emerald-900 rounded-[1px]"></div>
                  <div className="w-2.5 h-2.5 bg-emerald-700 rounded-[1px]"></div>
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-[1px]"></div>
                  <div className="w-2.5 h-2.5 bg-emerald-300 rounded-[1px]"></div>
                  <span>More</span>
                </div>
                <span className="text-xs text-rose-300/60 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20">
                  Last 365 Days
                </span>
              </div>
            </div>

            {/* Added overflow-x-auto and ensured full width usage */}
            <div className="flex-1 w-full bg-slate-900/40 rounded-xl border border-rose-500/10 p-4 overflow-x-auto custom-scrollbar">
              {/* CSS GRID HEATMAP */}
              {/* w-max ensures the grid doesn't shrink, forcing scroll if needed */}
              <div className="grid grid-rows-7 grid-flow-col gap-1 w-max">
                {/* Weekday Labels (Optional, simplifies grid to just show blocks) */}
                {calendarData.map((day, idx) => (
                  <div
                    key={idx}
                    title={`${day.count} submissions on ${day.date}`}
                    className={`w-3 h-3 rounded-[2px] ${getLevelColor(day.level)} hover:border hover:border-white/50 transition-all`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* --- RECENT ACTIVITY TABLE --- */}
          <div className="flex-1 bg-slate-950 p-6 overflow-hidden flex flex-col">
            <h3 className="text-lg font-bold text-yellow-300 mb-4 flex items-center gap-2">
              <FileCode size={20} /> Recent Activity
            </h3>
            {/* Added overflow-x-auto for horizontal scrolling */}
            <div className="flex-1 overflow-auto overflow-x-auto rounded-xl border border-yellow-500/20 bg-slate-900/40 shadow-inner">
              {/* Added min-w-[600px] to prevent column squashing */}
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="bg-yellow-900/20 text-yellow-200 sticky top-0 z-10 backdrop-blur-md">
                  <tr>
                    <th className="p-4 font-semibold">Problem / Description</th>
                    <th className="p-4 font-semibold">Code (Src)</th>
                    <th className="p-4 font-semibold">IR (Pseudo)</th>
                    <th className="p-4 font-semibold">Feedback</th>
                    <th className="p-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-yellow-500/10">
                  {submissions.map((sub) => (
                    <tr
                      key={sub.submission_id}
                      className="hover:bg-yellow-500/5 transition-colors"
                    >
                      <td className="p-4 max-w-[200px]">
                        <div className="font-medium text-slate-200 truncate">
                          {sub.problems?.problem_statement
                            ? sub.problems.problem_statement.slice(0, 30) + "..."
                            : "Untitled Problem"}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {new Date(sub.submission_timestamp).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-4 font-mono text-xs text-slate-400 max-w-[150px]">
                        <div className="truncate bg-slate-950 p-1.5 rounded border border-slate-800">
                          {sub.source_code
                            ? sub.source_code.slice(0, 20) + "..."
                            : "-"}
                        </div>
                      </td>
                      <td className="p-4 font-mono text-xs text-yellow-100/70 max-w-[150px]">
                        <div className="flex items-center gap-1">
                          <FileJson size={12} />
                          {sub.pseudocodes ? "Generated" : "Pending"}
                        </div>
                      </td>
                      <td className="p-4 max-w-[200px]">
                        {sub.evaluations && sub.evaluations.length > 0 ? (
                          <div className="text-slate-300 text-xs italic">
                            "{sub.evaluations[0].teacher_feedback || "No comments"}"
                          </div>
                        ) : (
                          <span className="text-slate-600 text-xs">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <StatusBadge status={sub.validation_status} />
                      </td>
                    </tr>
                  ))}
                  {submissions.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-8 text-center text-slate-500"
                      >
                        No submissions found. Start coding!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case "submitted":
    case "valid":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
          <CheckCircle2 size={12} /> Solved
        </span>
      );
    case "invalid":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20">
          <XCircle size={12} /> Failed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-xs font-bold border border-yellow-500/20">
          <Clock size={12} /> Pending
        </span>
      );
  }
};
