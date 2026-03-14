"use client";

import { useEffect, useState } from "react";
import { COLORS } from "@/lib/constants";

interface Submission {
  id: number;
  colors?: string[];
  tValue: string;
  record: string;
  updatedAt: string;
}

export default function AdminPage() {
  const [range, setRange] = useState<{ min: number; max: number }>({ min: 1, max: 100 });
  const [rows, setRows] = useState<Submission[]>([]);
  const [status, setStatus] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [isFullView, setIsFullView] = useState<boolean>(false);
  
  // Recorder State
  const [recTeamId, setRecTeamId] = useState<number | "">("");
  const [recMin, setRecMin] = useState<number>(0);
  const [recSec, setRecSec] = useState<number>(0);
  const [recStatus, setRecStatus] = useState<string>("");

  const load = async () => {
    try {
      const res = await fetch(`/api/data?t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      setRange(data.range);
      const submissions = data.submissions ?? [];
      (submissions as any)._settings = data.settings;
      setRows(submissions);
      setStatus(new Date().toLocaleTimeString());
    } catch (e) {
      console.error("Failed to load data");
    }
  };

  const handleReset = async () => {
    if (!window.confirm("정말로 모든 데이터를 초기화하시겠습니까?\n이 작업은 되돌릴 수 없습니다.")) {
      return;
    }
    try {
      const res = await fetch("/api/reset", { method: "POST" });
      if (res.ok) {
        alert("데이터가 완전히 초기화되었습니다.");
        load();
      } else {
        alert("초기화 실패");
      }
    } catch (e) {
      alert("네트워크 오류");
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  const getColorHex = (c: string) => {
    switch (c) {
      case "빨": return "#FF3B30";
      case "노": return "#FFCC00";
      case "파": return "#007AFF";
      case "초": return "#34C759";
      case "흰": return "#F2F2F7";
      default: return "#F2F2F7";
    }
  };

  // Calculate stats (Insight data preparation)
  const validRows = rows.filter(r => r.record && r.tValue !== "");
  const sortedByRecord = [...validRows].sort((a, b) => {
    const parse = (rec: string) => {
      if (!rec) return Infinity;
      const match = rec.match(/(\d+)'\s*(\d+)"/);
      return match ? parseInt(match[1]) * 60 + parseInt(match[2]) : Infinity;
    };
    return parse(a.record) - parse(b.record);
  });

  const handleRecordSubmit = async () => {
    if (recTeamId === "") {
        setRecStatus("팀 ID를 입력하세요.");
        return;
    }
    const recordStr = `${recMin}' ${String(recSec).padStart(2, '0')}"`;
    setRecStatus("전송 중...");
    try {
      const res = await fetch("/api/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: recTeamId, record: recordStr }),
      });
      if (res.ok) {
        setRecStatus("기록 저장 완료!");
        load();
        setTimeout(() => setRecStatus(""), 3000);
      } else {
        const d = await res.json();
        setRecStatus(d.error || "저장 실패");
      }
    } catch (e) {
      setRecStatus("네트워크 오류");
    }
  };

  // --- Insight Logic (Unified) ---
  const parseRecordToSeconds = (record: string) => {
    if (!record) return Infinity;
    const match = record.match(/(\d+)'\s*(\d+)"/);
    if (!match) return Infinity;
    return parseInt(match[1]) * 60 + parseInt(match[2]);
  };

  const top20Percent = sortedByRecord.slice(0, Math.ceil(validRows.length * 0.2) || 1);
  const insights = [];

  if (validRows.length >= 3) {
    // 1. 기록이 짧은 팀들의 특징
    const top20Colors = new Set(top20Percent.map(r => r.colors?.join(",") || ""));
    const top20TValues = top20Percent.map(r => parseInt(r.tValue.split("T")[0]));
    const avgTInput = top20TValues.reduce((a, b) => a + b, 0) / top20TValues.length;
    
    if (top20Colors.size > 1) {
      insights.push({
        title: "기록 상위 팀의 전략 다양성",
        content: `기록이 짧은 상위 ${top20Percent.length}개 팀은 서로 다른 색상 순서를 사용하고 있지만, 평균 턴 수는 ${avgTInput.toFixed(1)}T 내외로 유지되고 있습니다. 전략은 다르지만 효율적인 턴 관리가 핵심임을 알 수 있습니다.`,
        type: "success"
      });
    }

    // 2. 턴 수 vs 기록 편차
    const tValueGroups: Record<string, string[]> = {};
    validRows.forEach(r => {
      if (!tValueGroups[r.tValue]) tValueGroups[r.tValue] = [];
      tValueGroups[r.tValue].push(r.record);
    });

    const variedTValue = Object.entries(tValueGroups).find(([_, records]) => {
      if (records.length < 2) return false;
      const secs = records.map(parseRecordToSeconds);
      return Math.max(...secs) - Math.min(...secs) > 30; // 30초 이상 차이
    });

    if (variedTValue) {
      insights.push({
        title: "동일 턴 수 내 기록 차이 발견",
        content: `턴 수는 '${variedTValue[0]}'으로 동일하지만, 기록(시간)에서 상당한 차이가 나는 팀들이 존재합니다. 이는 단순히 턴 수를 줄이는 것 외에도 조립 과정의 숙련도나 커뮤니케이션 속도가 기록에 큰 영향을 미침을 시사합니다.`,
        type: "warning"
      });
    }
  }

  // === Visualization Data ===
  const avgSeconds = validRows.length > 0
    ? validRows.reduce((sum, r) => sum + parseRecordToSeconds(r.record), 0) / validRows.length
    : 0;
  const formatSeconds = (s: number) => {
    if (!isFinite(s)) return "-";
    const m = Math.floor(s / 60);
    const sec = Math.round(s % 60);
    return `${m}' ${String(sec).padStart(2, '0')}"`;
  };
  const maxRecordSeconds = sortedByRecord.length > 0
    ? parseRecordToSeconds(sortedByRecord[sortedByRecord.length - 1].record)
    : 1;

  // Full team grouping by tValue for insight 2 visualization
  const tValueTeamGroups: Record<string, Submission[]> = {};
  validRows.forEach(r => {
    if (!tValueTeamGroups[r.tValue]) tValueTeamGroups[r.tValue] = [];
    tValueTeamGroups[r.tValue].push(r);
  });
  const variedTValueTeams = Object.entries(tValueTeamGroups).find(([_, teams]) => {
    if (teams.length < 2) return false;
    const secs = teams.map(t => parseRecordToSeconds(t.record));
    return Math.max(...secs) - Math.min(...secs) > 30;
  });

  // T-value base distribution (group by turn number: 2T, 3T, 4T, 5T)
  const tBaseDistribution: Record<string, { count: number; avgSec: number; teams: Submission[] }> = {};
  validRows.forEach(r => {
    const tBase = r.tValue.split("T")[0] + "T";
    if (!tBaseDistribution[tBase]) tBaseDistribution[tBase] = { count: 0, avgSec: 0, teams: [] };
    tBaseDistribution[tBase].count++;
    tBaseDistribution[tBase].teams.push(r);
  });
  Object.values(tBaseDistribution).forEach(v => {
    v.avgSec = v.teams.reduce((s, r) => s + parseRecordToSeconds(r.record), 0) / v.count;
  });
  const tBaseSorted = Object.entries(tBaseDistribution).sort(([a], [b]) => a.localeCompare(b));
  const maxTBaseAvg = tBaseSorted.length > 0 ? Math.max(...tBaseSorted.map(([_, v]) => v.avgSec)) : 1;

  return (
    <main className="min-h-screen bg-[#F8F9FA] pb-24 font-plus-jakarta animate-fade-in">
      {/* Header */}
      <header className="px-6 py-6 border-b border-[#EEEEEE] bg-white flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E60012] flex items-center justify-center">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="4" width="6" height="6" rx="1" fill="white"/>
                <rect x="4" y="14" width="6" height="6" rx="1" fill="white" fillOpacity="0.4"/>
                <rect x="14" y="4" width="6" height="6" rx="1" fill="white" fillOpacity="0.4"/>
                <rect x="14" y="14" width="6" height="6" rx="1" fill="white" fillOpacity="0.4"/>
             </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">제출 현황</h1>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-100">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-[10px] font-bold text-green-600 uppercase tracking-tight">라이브: 5초 후 자동 새로고침</span>
        </div>
      </header>

      <div className="px-6 py-8 space-y-8 max-w-4xl mx-auto">
        {activeTab === "dashboard" && (
          <>
            {/* Actions */}
            <div className="flex flex-col md:flex-row gap-4">
              <button 
                onClick={load}
                className="btn-primary flex-1 py-5"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-spin-slow">
                  <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C14.8273 3 17.3752 4.30561 19 6.33333M21 3V7H17" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-xl">새로고침</span>
              </button>
              
              <button 
                onClick={handleReset}
                className="px-6 py-5 bg-white text-[#E60012] font-bold rounded-[2rem] border-2 border-[#E60012] flex items-center justify-center gap-2 hover:bg-red-50 transition-colors flex-1 shadow-[0_8px_16px_rgba(230,0,18,0.05)]"
                title="데이터 초기화"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 21 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-xl">데이터 초기화</span>
              </button>

              <button 
                onClick={async () => {
                  const currentStatus = (rows as any)._settings?.isTurnEntryEnabled || false;
                  await fetch("/api/settings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ isTurnEntryEnabled: !currentStatus }),
                  });
                  load();
                }}
                className={`px-6 py-5 font-bold rounded-[2rem] border-2 transition-colors flex-1 flex items-center justify-center gap-2 shadow-[0_8px_16px_rgba(0,0,0,0.05)]
                  ${(rows as any)._settings?.isTurnEntryEnabled 
                    ? "bg-green-500 border-green-500 text-white hover:bg-green-600" 
                    : "bg-white border-[#E60012] text-[#E60012] hover:bg-red-50"
                  }`}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 2L3 14h9l-1 8L21 10h-9l1-8z" fill="currentColor"/>
                </svg>
                <span className="text-xl">{(rows as any)._settings?.isTurnEntryEnabled ? "턴 수 중단" : "턴 수 활성화"}</span>
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card-premium p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#666666] mb-1">참가 팀 수</p>
                  <h3 className="text-4xl font-black text-[#1A1A1A]">{rows.length.toLocaleString()}</h3>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="#E60012" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="#E60012" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M23 21V19C22.9993 18.1137 22.7044 17.2524 22.1614 16.5523C21.6184 15.8522 20.8581 15.3516 20 15.13" stroke="#E60012" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25393 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75607 18.1676 9.45768C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="#E60012" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              <div className="card-premium p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#666666] mb-1">최근 업데이트</p>
                  <h3 className="text-4xl font-black text-[#1A1A1A]">{status || "데이터 없음"}</h3>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="#E60012" strokeWidth="2"/>
                    <path d="M12 6V12L16 14" stroke="#E60012" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Data List */}
            <div className="card-premium overflow-hidden">
              <div className="px-6 py-5 border-b border-[#EEEEEE] flex items-center justify-between bg-white">
                <h2 className="text-lg font-bold text-[#1A1A1A]">실시간 데이터 내역</h2>
                <button 
                  className="text-[#E60012] font-bold text-sm flex items-center gap-1 hover:underline cursor-pointer"
                  onClick={() => setIsFullView(true)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 3H21V9" stroke="#E60012" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 21H3V15" stroke="#E60012" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 3L14 10" stroke="#E60012" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 21L10 14" stroke="#E60012" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  전체 보기
                </button>
              </div>
              
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#F8F9FA]">
                      <th className="px-6 py-4 text-[10px] font-black text-[#999999] uppercase tracking-widest">팀 ID</th>
                      <th className="px-6 py-4 text-[10px] font-black text-[#999999] uppercase tracking-widest text-center">기록</th>
                      <th className="px-6 py-4 text-[10px] font-black text-[#999999] uppercase tracking-widest text-center">색상 순서</th>
                      <th className="px-6 py-4 text-[10px] font-black text-[#999999] uppercase tracking-widest text-right">턴 수</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEEEEE]">
                    {rows.length > 0 ? (
                      rows.slice().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 10).map((r) => (
                        <tr key={r.id} className="hover:bg-[#F8F9FA] transition-colors group">
                          <td className="px-6 py-5 font-bold text-[#1A1A1A]">#{r.id}</td>
                          <td className="px-6 py-5 text-center font-black text-[#E60012] text-lg tabular-nums">
                            {r.record || "-"}
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center justify-center gap-3">
                              {r.colors ? (
                                <>
                                  <div className="flex items-center gap-1.5">
                                    {r.colors.map((c, i) => (
                                      <div 
                                        key={i} 
                                        className="w-4 h-4 rounded-full border border-black/5 shadow-sm"
                                        style={{ backgroundColor: getColorHex(c) }}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-sm font-bold text-[#666666] tracking-widest">{r.colors.join("")}</span>
                                </>
                              ) : (
                                <span className="text-xs font-bold text-[#CCCCCC] italic">제출 대기</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-5 text-right">
                            {r.tValue !== "" ? (
                              <span className="px-3 py-1 bg-red-50 text-[#E60012] rounded-full text-xs font-bold border border-red-100">
                                {r.tValue}
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-[#F8F9FA] text-[#999999] rounded-full text-xs font-bold border border-[#EEEEEE]">
                                대기 중
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-20 text-center text-[#999999] font-medium italic">
                          제출된 데이터가 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List */}
              <div className="md:hidden divide-y divide-[#EEEEEE]">
                {rows.length > 0 ? (
                  rows.slice().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 10).map((r) => (
                    <div key={r.id} className="p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-[#999999]">팀 #{r.id}</span>
                        <span className="text-xs text-[#999999] font-medium">{new Date(r.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-[#999999] uppercase tracking-wider">기록</p>
                          <p className="text-2xl font-black text-[#E60012] tabular-nums">{r.record || "-"}</p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-[10px] font-bold text-[#999999] uppercase tracking-wider">턴 수</p>
                          {r.tValue !== "" ? (
                            <span className="inline-block px-3 py-1 bg-red-50 text-[#E60012] rounded-full text-sm font-bold border border-red-100">
                              {r.tValue}
                            </span>
                          ) : (
                            <span className="inline-block px-3 py-1 bg-[#F8F9FA] text-[#999999] rounded-full text-sm font-bold border border-[#EEEEEE]">
                              대기 중
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="pt-2">
                        <p className="text-[10px] font-bold text-[#999999] uppercase tracking-wider mb-2">색상 순서</p>
                        {r.colors ? (
                          <div className="flex items-center gap-3 bg-[#F8F9FA] p-3 rounded-xl border border-[#EEEEEE]">
                            <div className="flex items-center gap-1.5 font-bold text-[#666666] tracking-widest text-sm min-w-[50px]">
                              {r.colors.join("")}
                            </div>
                            <div className="flex items-center gap-1.5">
                              {r.colors.map((c, i) => (
                                <div 
                                  key={i} 
                                  className="w-4 h-4 rounded-full border border-black/5 shadow-sm"
                                  style={{ backgroundColor: getColorHex(c) }}
                                />
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-[#F8F9FA] p-3 rounded-xl border border-[#EEEEEE] text-center">
                            <span className="text-xs font-bold text-[#CCCCCC] italic">제출 대기 중</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-20 text-center text-[#999999] font-medium italic">
                    제출된 데이터가 없습니다.
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Stats View */}
        {activeTab === "stats" && (
          <div className="animate-fade-in max-w-4xl mx-auto space-y-8">

            {validRows.length >= 3 ? (
              <>
                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-3 md:gap-4">
                  <div className="card-premium p-4 md:p-5 text-center">
                    <p className="text-[10px] md:text-xs font-black text-[#999999] uppercase tracking-widest mb-1">참가 팀</p>
                    <p className="text-2xl md:text-3xl font-black text-[#1A1A1A]">{validRows.length}</p>
                  </div>
                  <div className="card-premium p-4 md:p-5 text-center">
                    <p className="text-[10px] md:text-xs font-black text-[#999999] uppercase tracking-widest mb-1">평균 기록</p>
                    <p className="text-2xl md:text-3xl font-black text-[#E60012] tabular-nums">{formatSeconds(avgSeconds)}</p>
                  </div>
                  <div className="card-premium p-4 md:p-5 text-center">
                    <p className="text-[10px] md:text-xs font-black text-[#999999] uppercase tracking-widest mb-1">최고 기록</p>
                    <p className="text-2xl md:text-3xl font-black text-green-600 tabular-nums">{sortedByRecord[0]?.record || "-"}</p>
                  </div>
                </div>

                {/* Team Ranking Bar Chart */}
                <section className="card-premium overflow-hidden">
                  <div className="px-6 py-5 border-b border-[#EEEEEE] bg-white">
                    <h2 className="text-lg md:text-xl font-bold text-[#1A1A1A]">🏆 팀 기록 순위</h2>
                    <p className="text-xs text-[#999999] mt-1">기록이 빠른 순서 · <span className="text-green-600 font-bold">상위 {top20Percent.length}팀 (20%)</span> 하이라이트</p>
                  </div>
                  <div className="p-3 md:p-6 space-y-1.5 md:space-y-2">
                    {sortedByRecord.map((r, idx) => {
                      const seconds = parseRecordToSeconds(r.record);
                      const percentage = maxRecordSeconds > 0 ? (seconds / maxRecordSeconds) * 100 : 0;
                      const isTop20 = idx < top20Percent.length;
                      const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : null;
                      return (
                        <div key={r.id} className={`flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-xl transition-all ${
                          isTop20 ? 'bg-green-50/80 border border-green-200' : 'bg-[#FAFAFA] border border-transparent'
                        }`}>
                          <span className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[10px] md:text-xs font-black shrink-0 ${
                            isTop20 ? 'bg-green-500 text-white shadow-sm' : 'bg-[#EEEEEE] text-[#999999]'
                          }`}>
                            {medal || (idx + 1)}
                          </span>
                          <span className="font-bold text-[#1A1A1A] w-10 md:w-14 text-xs md:text-sm shrink-0">#{r.id}</span>
                          <div className="hidden md:flex items-center gap-1 shrink-0">
                            {r.colors?.map((c, i) => (
                              <div key={i} className="w-3 h-3 rounded-full border border-black/5 shadow-sm" style={{ backgroundColor: getColorHex(c) }} />
                            ))}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="h-5 md:h-6 rounded-full overflow-hidden bg-[#EEEEEE]/60">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${
                                  isTop20
                                    ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                                    : 'bg-gradient-to-r from-gray-300 to-gray-400'
                                }`}
                                style={{ width: `${Math.max(percentage, 8)}%` }}
                              />
                            </div>
                          </div>
                          <span className="font-black text-[#E60012] tabular-nums text-xs md:text-sm w-14 md:w-16 text-right shrink-0">{r.record}</span>
                          <span className="text-[9px] md:text-xs font-bold text-[#999] bg-[#F0F0F0] px-1.5 md:px-2 py-0.5 rounded-full shrink-0">{r.tValue}</span>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Enhanced AI Insights with Team Data */}
                <section className="card-premium overflow-hidden border-2 border-red-50">
                  <div className="px-6 py-5 border-b border-red-100 bg-red-50/30 flex items-center gap-2">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#E60012" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 17L12 22L22 17" stroke="#E60012" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 12L12 17L22 12" stroke="#E60012" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <h2 className="text-xl font-bold text-[#E60012]">데이터 학습 인사이트</h2>
                  </div>
                  <div className="p-5 md:p-8 bg-white space-y-8">
                    {/* Insight 1: 전략 다양성 */}
                    {insights.filter(i => i.type === 'success').map((insight, idx) => (
                      <div key={`s-${idx}`} className="space-y-4">
                        <div className="p-5 rounded-2xl bg-green-50/50 border-2 border-green-100 hover:shadow-md transition-all">
                          <div className="flex items-start gap-3">
                            <div className="mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 bg-green-500" />
                            <div>
                              <h3 className="text-base md:text-lg font-black text-green-700 mb-2">{insight.title}</h3>
                              <p className="text-sm md:text-base text-[#444444] leading-relaxed font-medium">{insight.content}</p>
                            </div>
                          </div>
                        </div>
                        {/* Top 20% team data */}
                        <div className="bg-green-50/30 rounded-2xl p-4 md:p-5 border border-green-100">
                          <h4 className="text-xs font-black text-green-700 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                            <span>📊</span> 상위 {top20Percent.length}팀 실제 데이터
                          </h4>
                          <div className="space-y-2">
                            {top20Percent.map((r, i) => (
                              <div key={r.id} className="flex items-center gap-2 md:gap-3 p-2.5 md:p-3 bg-white rounded-xl border border-green-100/50 shadow-sm">
                                <span className="text-base md:text-lg shrink-0">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i+1}`}</span>
                                <span className="font-bold text-[#1A1A1A] text-sm">팀 #{r.id}</span>
                                <div className="flex items-center gap-1 shrink-0">
                                  {r.colors?.map((c, j) => (
                                    <div key={j} className="w-3.5 h-3.5 md:w-4 md:h-4 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: getColorHex(c) }} />
                                  ))}
                                </div>
                                <span className="hidden md:inline text-sm font-bold text-[#666] tracking-wider">{r.colors?.join("")}</span>
                                <div className="ml-auto flex items-center gap-2 md:gap-3">
                                  <span className="text-[10px] md:text-xs font-bold text-[#999] bg-[#F0F0F0] px-2 py-0.5 rounded-full">{r.tValue}</span>
                                  <span className="font-black text-[#E60012] tabular-nums text-sm">{r.record}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Insight 2: 동일 턴 수 내 기록 차이 */}
                    {insights.filter(i => i.type === 'warning').map((insight, idx) => (
                      <div key={`w-${idx}`} className="space-y-4">
                        <div className="p-5 rounded-2xl bg-amber-50/50 border-2 border-amber-200 hover:shadow-md transition-all">
                          <div className="flex items-start gap-3">
                            <div className="mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 bg-amber-500" />
                            <div>
                              <h3 className="text-base md:text-lg font-black text-amber-700 mb-2">{insight.title}</h3>
                              <p className="text-sm md:text-base text-[#444444] leading-relaxed font-medium">{insight.content}</p>
                            </div>
                          </div>
                        </div>
                        {/* Teams with same T-value, different records */}
                        {variedTValueTeams && (
                          <div className="bg-amber-50/30 rounded-2xl p-4 md:p-5 border border-amber-200">
                            <h4 className="text-xs font-black text-amber-700 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                              <span>⚡</span> 턴 수 &apos;{variedTValueTeams[0]}&apos; 팀 비교
                            </h4>
                            <div className="space-y-2">
                              {variedTValueTeams[1]
                                .sort((a, b) => parseRecordToSeconds(a.record) - parseRecordToSeconds(b.record))
                                .map((r) => {
                                  const seconds = parseRecordToSeconds(r.record);
                                  const localMax = Math.max(...variedTValueTeams[1].map(t => parseRecordToSeconds(t.record)));
                                  const pct = localMax > 0 ? (seconds / localMax) * 100 : 0;
                                  return (
                                    <div key={r.id} className="flex items-center gap-2 md:gap-3 p-2.5 md:p-3 bg-white rounded-xl border border-amber-100/50 shadow-sm">
                                      <span className="font-bold text-[#1A1A1A] w-12 md:w-14 text-sm shrink-0">#{r.id}</span>
                                      <div className="flex items-center gap-1 shrink-0">
                                        {r.colors?.map((c, j) => (
                                          <div key={j} className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full border border-black/5" style={{ backgroundColor: getColorHex(c) }} />
                                        ))}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="h-5 rounded-full overflow-hidden bg-amber-100/50">
                                          <div
                                            className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500 transition-all duration-700"
                                            style={{ width: `${Math.max(pct, 10)}%` }}
                                          />
                                        </div>
                                      </div>
                                      <span className="font-black text-[#E60012] tabular-nums text-sm w-14 md:w-16 text-right shrink-0">{r.record}</span>
                                    </div>
                                  );
                                })}
                              <div className="mt-3 p-3 bg-amber-100/40 rounded-xl text-center">
                                <span className="text-sm font-bold text-amber-700">
                                  ⏱ 최대 차이: {(() => {
                                    const secs = variedTValueTeams[1].map(t => parseRecordToSeconds(t.record));
                                    const diff = Math.max(...secs) - Math.min(...secs);
                                    return formatSeconds(diff);
                                  })()}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {insights.length === 0 && (
                      <div className="py-16 text-center space-y-4">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                           <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3" stroke="#E60012" strokeWidth="2" strokeLinecap="round"/>
                           </svg>
                        </div>
                        <p className="text-[#999999] text-lg font-bold italic">아직 분석할 패턴이 부족합니다.</p>
                        <p className="text-xs text-[#CCCCCC] uppercase tracking-[0.2em] font-black">데이터가 더 쌓이면 인사이트가 표시됩니다</p>
                      </div>
                    )}
                  </div>
                </section>

                {/* Turn Count Distribution Chart */}
                {tBaseSorted.length > 0 && (
                  <section className="card-premium overflow-hidden">
                    <div className="px-6 py-5 border-b border-[#EEEEEE] bg-white">
                      <h2 className="text-lg md:text-xl font-bold text-[#1A1A1A]">📊 턴 수별 평균 기록</h2>
                      <p className="text-xs text-[#999999] mt-1">턴 수 그룹별 평균 소요 시간 비교</p>
                    </div>
                    <div className="p-6 md:p-8">
                      <div className="flex items-end gap-3 md:gap-6 justify-center" style={{ height: '220px' }}>
                        {tBaseSorted.map(([tBase, data]) => {
                          const heightPct = maxTBaseAvg > 0 ? (data.avgSec / maxTBaseAvg) * 100 : 0;
                          const tNum = parseInt(tBase);
                          const barColors = [
                            'from-emerald-400 to-emerald-500',
                            'from-blue-400 to-blue-500',
                            'from-purple-400 to-purple-500',
                            'from-rose-400 to-rose-500',
                          ];
                          const barColor = barColors[(tNum - 2) % barColors.length] || 'from-gray-400 to-gray-500';
                          return (
                            <div key={tBase} className="flex flex-col items-center gap-2 flex-1 max-w-20 md:max-w-28" style={{ height: '100%' }}>
                              <span className="text-[10px] md:text-xs font-bold text-[#666] tabular-nums whitespace-nowrap">{formatSeconds(data.avgSec)}</span>
                              <div className="w-full flex-1 flex items-end">
                                <div
                                  className={`w-full rounded-t-xl bg-gradient-to-t ${barColor} transition-all duration-700 shadow-sm`}
                                  style={{ height: `${Math.max(heightPct, 5)}%` }}
                                />
                              </div>
                              <div className="text-center pt-2 border-t-2 border-[#EEEEEE] w-full">
                                <span className="text-sm md:text-base font-black text-[#1A1A1A]">{tBase}</span>
                                <p className="text-[10px] text-[#999] font-bold">{data.count}팀</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </section>
                )}
              </>
            ) : (
              <section className="card-premium overflow-hidden border-2 border-red-50">
                <div className="px-6 py-5 border-b border-red-100 bg-red-50/30 flex items-center gap-2">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#E60012" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="#E60012" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="#E60012" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <h2 className="text-xl font-bold text-[#E60012]">데이터 학습 인사이트</h2>
                </div>
                <div className="p-8 bg-white">
                  <div className="py-20 text-center space-y-4">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                       <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3" stroke="#E60012" strokeWidth="2" strokeLinecap="round"/>
                       </svg>
                    </div>
                    <p className="text-[#999999] text-lg font-bold italic">데이터가 쌓이면 실시간 분석 인사이트가 여기에 표시됩니다.</p>
                    <p className="text-xs text-[#CCCCCC] uppercase tracking-[0.2em] font-black">Real-time Analysis Engine Initializing...</p>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}

        {/* Recorder View */}
        {activeTab === "recorder" && (
          <div className="space-y-6 animate-fade-in max-w-md mx-auto">
            <section className="card-premium p-8 space-y-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">기록 측정 입력기</h2>
                <p className="text-[#666666] font-medium text-sm">팀별 활동 시간을 입력해 주세요.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-[#999999] uppercase tracking-widest mb-2">팀 ID</label>
                  <input
                    type="number"
                    className="input-premium text-center text-2xl font-black"
                    placeholder="ID"
                    value={recTeamId}
                    onChange={(e) => setRecTeamId(e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-[#999999] uppercase tracking-widest mb-2">분 (Min)</label>
                    <select 
                      className="input-premium text-center text-xl font-bold appearance-none bg-white"
                      value={recMin}
                      onChange={(e) => setRecMin(Number(e.target.value))}
                    >
                      {Array.from({length: 60}, (_, i) => (
                        <option key={i} value={i}>{i}분</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-[#999999] uppercase tracking-widest mb-2">초 (Sec)</label>
                    <select 
                      className="input-premium text-center text-xl font-bold appearance-none bg-white"
                      value={recSec}
                      onChange={(e) => setRecSec(Number(e.target.value))}
                    >
                      {Array.from({length: 60}, (_, i) => (
                        <option key={i} value={i}>{String(i).padStart(2, '0')}초</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={handleRecordSubmit}
                    disabled={recStatus === "전송 중..." || recTeamId === ""}
                    className={`btn-primary w-full text-lg h-16 rounded-2xl transition-all ${
                      (recStatus === "전송 중..." || recTeamId === "") ? "opacity-50 cursor-not-allowed shadow-none" : ""
                    }`}
                  >
                    {recStatus === "전송 중..." ? (
                      <div className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        저장 중...
                      </div>
                    ) : "기록 제출하기"}
                  </button>
                  {recStatus && recStatus !== "전송 중..." && (
                    <div className={`mt-4 p-3 rounded-xl border text-center font-bold text-sm animate-fade-in ${
                      recStatus.includes("완료") 
                        ? "bg-green-50 border-green-100 text-green-600" 
                        : "bg-red-50 border-red-100 text-[#E60012]"
                    }`}>
                      {recStatus}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="card-premium overflow-hidden">
                <div className="px-6 py-4 border-b border-[#EEEEEE] bg-white">
                    <h3 className="text-sm font-bold text-[#1A1A1A]">최근 입력 기록</h3>
                </div>
                <div className="divide-y divide-[#EEEEEE]">
                    {rows.slice().sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5).map(r => (
                        <div key={r.id} className="px-6 py-4 flex items-center justify-between bg-white text-sm">
                            <span className="font-bold">#{r.id}팀</span>
                            <span className="font-black text-[#E60012]">{r.record || "-"}</span>
                        </div>
                    ))}
                </div>
            </section>
          </div>
        )}
      </div>

      {/* Full View Modal */}
      {isFullView && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col animate-fade-in">
          <header className="px-6 py-4 border-b border-[#EEEEEE] flex items-center justify-between sticky top-0 bg-white z-10 h-16 sm:h-20">
            <h2 className="text-xl font-bold text-[#1A1A1A]">전체 데이터 내역</h2>
            <button 
              onClick={() => setIsFullView(false)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </header>
          
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 pb-24">
            <div className="card-premium overflow-hidden">
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#F8F9FA] sticky top-0 z-10">
                      <th className="px-6 py-4 text-[10px] font-black text-[#999999] uppercase tracking-widest leading-none">팀 ID</th>
                      <th className="px-6 py-4 text-[10px] font-black text-[#999999] uppercase tracking-widest text-center leading-none">기록</th>
                      <th className="px-6 py-4 text-[10px] font-black text-[#999999] uppercase tracking-widest text-center leading-none">색상 순서</th>
                      <th className="px-6 py-4 text-[10px] font-black text-[#999999] uppercase tracking-widest text-right leading-none">턴 수</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEEEEE]">
                    {rows.length > 0 ? (
                      rows.slice().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).map((r) => (
                        <tr key={r.id} className="hover:bg-[#F8F9FA] transition-colors">
                          <td className="px-6 py-5 font-bold text-[#1A1A1A]">#{r.id}</td>
                          <td className="px-6 py-5 text-center font-black text-[#E60012] tabular-nums">
                            {r.record || "-"}
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center justify-center gap-3">
                              {r.colors ? (
                                <>
                                  <div className="flex items-center gap-1.5">
                                    {r.colors.map((c, i) => (
                                      <div 
                                        key={i} 
                                        className="w-4 h-4 rounded-full border border-black/5 shadow-sm"
                                        style={{ backgroundColor: getColorHex(c) }}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-sm font-bold text-[#666666] tracking-widest">{r.colors.join("")}</span>
                                </>
                              ) : (
                                <span className="text-xs font-bold text-[#CCCCCC] italic">제출 대기</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-5 text-right">
                            {r.tValue !== "" ? (
                              <span className="px-3 py-1 bg-red-50 text-[#E60012] rounded-full text-xs font-bold border border-red-100">
                                {r.tValue}
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-[#F8F9FA] text-[#999999] rounded-full text-xs font-bold border border-[#EEEEEE]">
                                대기 중
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-20 text-center text-[#999999] font-medium italic">
                          제출된 데이터가 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List for Full View */}
              <div className="md:hidden divide-y divide-[#EEEEEE]">
                {rows.length > 0 ? (
                  rows.slice().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).map((r) => (
                    <div key={r.id} className="p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-[#999999]">팀 #{r.id}</span>
                        <span className="text-xs text-[#999999] font-medium">{new Date(r.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-[#999999] uppercase tracking-wider">기록</p>
                          <p className="text-2xl font-black text-[#E60012] tabular-nums">{r.record || "-"}</p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-[10px] font-bold text-[#999999] uppercase tracking-wider">턴 수</p>
                          {r.tValue !== "" ? (
                            <span className="inline-block px-3 py-1 bg-red-50 text-[#E60012] rounded-full text-sm font-bold border border-red-100">
                              {r.tValue}
                            </span>
                          ) : (
                            <span className="inline-block px-3 py-1 bg-[#F8F9FA] text-[#999999] rounded-full text-sm font-bold border border-[#EEEEEE]">
                              대기 중
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="pt-2">
                        <p className="text-[10px] font-bold text-[#999999] uppercase tracking-wider mb-2">색상 순서</p>
                        {r.colors ? (
                          <div className="flex items-center gap-3 bg-[#F8F9FA] p-3 rounded-xl border border-[#EEEEEE]">
                            <div className="flex items-center gap-1.5 font-bold text-[#666666] tracking-widest text-sm min-w-[30px]">
                              {r.colors.join("")}
                            </div>
                            <div className="flex items-center gap-1.5">
                              {r.colors.map((c, i) => (
                                <div 
                                  key={i} 
                                  className="w-4 h-4 rounded-full border border-black/5 shadow-sm"
                                  style={{ backgroundColor: getColorHex(c) }}
                                />
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-[#F8F9FA] p-3 rounded-xl border border-[#EEEEEE] text-center">
                            <span className="text-xs font-bold text-[#CCCCCC] italic">제출 대기 중</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-20 text-center text-[#999999] font-medium italic">
                    제출된 데이터가 없습니다.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Tabs Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#EEEEEE] px-4 py-3 pb-6 sm:pb-3 flex items-center justify-between z-40 max-w-4xl mx-auto shadow-[0_-8px_24px_rgba(0,0,0,0.06)] rounded-t-[2.5rem]">
        <button 
          onClick={() => setActiveTab("dashboard")}
          className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${activeTab === "dashboard" ? "text-[#E60012]" : "text-[#CCCCCC]"}`}
        >
          <div className={`p-2.5 rounded-2xl transition-colors ${activeTab === "dashboard" ? "bg-red-50" : "hover:bg-gray-50"}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z" fill="currentColor"/>
            </svg>
          </div>
          <span className="text-[10px] font-black uppercase tracking-tight">현황</span>
        </button>

        <button 
          onClick={() => setActiveTab("recorder")}
          className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${activeTab === "recorder" ? "text-[#E60012]" : "text-[#CCCCCC]"}`}
        >
          <div className={`p-2.5 rounded-2xl transition-colors ${activeTab === "recorder" ? "bg-red-50" : "hover:bg-gray-50"}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5"/>
                <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-[10px] font-black uppercase tracking-tight">입력</span>
        </button>

        <button 
          onClick={() => setActiveTab("stats")}
          className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${activeTab === "stats" ? "text-[#E60012]" : "text-[#CCCCCC]"}`}
        >
          <div className={`p-2.5 rounded-2xl transition-colors ${activeTab === "stats" ? "bg-red-50" : "hover:bg-gray-50"}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-[10px] font-black uppercase tracking-tight">통계</span>
        </button>
      </nav>
    </main>
  );
}
