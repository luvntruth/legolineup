"use client";

import { useEffect, useState } from "react";
import { COLORS } from "@/lib/constants";

interface Submission {
  id: number;
  colors: string[];
  tValue: string;
  updatedAt: string;
}

export default function AdminPage() {
  const [range, setRange] = useState<{ min: number; max: number }>({ min: 1, max: 100 });
  const [rows, setRows] = useState<Submission[]>([]);
  const [status, setStatus] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  const load = async () => {
    try {
      const res = await fetch("/api/data");
      const data = await res.json();
      setRange(data.range);
      setRows(data.submissions ?? []);
      setStatus(new Date().toLocaleTimeString());
    } catch (e) {
      console.error("Failed to load data");
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
        {/* Manual Refresh Button */}
        <button 
          onClick={load}
          className="btn-primary"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-spin-slow">
            <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C14.8273 3 17.3752 4.30561 19 6.33333M21 3V7H17" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          수동 새로고침
        </button>

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
            <button className="text-[#E60012] font-bold text-sm flex items-center gap-1 hover:underline">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 3H21V9" stroke="#E60012" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 21H3V15" stroke="#E60012" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 3L14 10" stroke="#E60012" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 21L10 14" stroke="#E60012" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              전체 보기
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#F8F9FA]">
                  <th className="px-6 py-4 text-[10px] font-black text-[#999999] uppercase tracking-widest">팀 ID</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[#999999] uppercase tracking-widest">색상 순서</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[#999999] uppercase tracking-widest text-right">T-VALUE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEEEEE]">
                {rows.length > 0 ? (
                  rows.slice().reverse().map((r) => (
                    <tr key={r.id} className="hover:bg-[#F8F9FA] transition-colors group">
                      <td className="px-6 py-5 font-bold text-[#1A1A1A]">#{r.id}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-1.5">
                          {r.colors?.map((c, i) => (
                            <div 
                              key={i} 
                              className="w-4 h-4 rounded-full border border-black/5 shadow-sm"
                              style={{ backgroundColor: getColorHex(c) }}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="px-3 py-1 bg-red-50 text-[#E60012] rounded-full text-xs font-bold border border-red-100">
                          {r.tValue}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-20 text-center text-[#999999] font-medium italic">
                      제출된 데이터가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom Tabs Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#EEEEEE] px-6 py-3 flex items-center justify-between z-40 max-w-4xl mx-auto shadow-[0_-4px_16px_rgba(0,0,0,0.04)] rounded-t-[2rem]">
        <button 
          onClick={() => setActiveTab("dashboard")}
          className={`flex flex-col items-center gap-1 flex-1 transition-all ${activeTab === "dashboard" ? "text-[#E60012]" : "text-[#CCCCCC]"}`}
        >
          <div className={`p-2 rounded-xl ${activeTab === "dashboard" ? "bg-red-50" : ""}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z" fill="currentColor"/>
            </svg>
          </div>
          <span className="text-[10px] font-bold">제출 현황</span>
        </button>
        <button 
          onClick={() => setActiveTab("stats")}
          className={`flex flex-col items-center gap-1 flex-1 transition-all ${activeTab === "stats" ? "text-[#E60012]" : "text-[#CCCCCC]"}`}
        >
          <div className={`p-2 rounded-xl ${activeTab === "stats" ? "bg-red-50" : ""}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-[10px] font-bold">데이터 통계</span>
        </button>
        <button 
          onClick={() => setActiveTab("settings")}
          className={`flex flex-col items-center gap-1 flex-1 transition-all ${activeTab === "settings" ? "text-[#E60012]" : "text-[#CCCCCC]"}`}
        >
          <div className={`p-2 rounded-xl ${activeTab === "settings" ? "bg-red-50" : ""}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2.5"/>
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-[10px] font-bold">설정</span>
        </button>
      </nav>
    </main>
  );
}
