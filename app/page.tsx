"use client";

import { useState, useEffect } from "react";
import { COLORS, Color } from "@/lib/constants";
import { onSettingsSnapshot } from "@/lib/db";
import { getRange } from "@/lib/db";
import { getColorHex, getColorName } from "@/lib/utils";

export default function HomePage() {
  const [id, setId] = useState<number | "">("");
  const [range, setRange] = useState<{ min: number; max: number }>({ min: 1, max: 100 });
  const [colors, setColors] = useState<Color[]>([]);
  const [tValue, setTValue] = useState<string>("");
  const [tParts, setTParts] = useState<{ a: number; b: number }>({ a: 2, b: 1 });
  const [status, setStatus] = useState<string>("");
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isTurnEnabled, setIsTurnEnabled] = useState<boolean>(false);

  useEffect(() => {
    setRange(getRange());
    const unsubscribe = onSettingsSnapshot((settings) => {
      setIsTurnEnabled(settings.isTurnEntryEnabled);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (id === "") {
      setStep(1);
      setColors([]);
      setTValue("");
      return;
    }
    fetch(`/api/participant?id=${id}&t=${Date.now()}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((d) => {
        if (d?.submission) {
          if (d.submission.colors) {
            setColors(d.submission.colors);
          } else {
            setColors([]);
          }
          setTValue(d.submission.tValue || "");
          setStep(1);
        } else {
          setStep(1);
          setColors([]);
          setTValue("");
        }
      })
      .catch(() => {
        setStep(1);
        setColors([]);
        setTValue("");
      });
  }, [id]);

  // 색상 순차 선택: 아직 선택하지 않은 색상 중에서 탭하면 순서대로 추가
  const availableColors = COLORS.filter((c) => !colors.includes(c));

  const handleSelectColor = (color: Color) => {
    if (colors.includes(color)) return;
    setColors((prev) => [...prev, color]);
  };

  const handleUndoLastColor = () => {
    setColors((prev) => prev.slice(0, -1));
  };

  const handleResetColors = () => {
    setColors([]);
  };

  // 수정하기: step 2 또는 step 4에서 step 1로 돌아감
  const handleEdit = () => {
    setColors([]);
    setTValue("");
    setStatus("");
    setStep(1);
  };

  const submitColors = async () => {
    if (id === "") {
      setStatus("ID를 입력하세요");
      return;
    }
    if (id < range.min || id > range.max) {
      setStatus(`ID는 ${range.min}~${range.max} 범위만 가능합니다.`);
      return;
    }
    if (colors.length !== 5) {
      setStatus("5개의 색상을 모두 선택해주세요.");
      return;
    }
    setStatus("제출 중...");
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, colors, tValue: "" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data?.error ?? "오류 발생");
      } else {
        setStatus("");
        setStep(2);
      }
    } catch (e) {
      setStatus("네트워크 오류");
    }
  };

  const submitTValue = async () => {
    if (id === "") return;
    setStatus("제출 중...");
    try {
      const turnString = `${tParts.a}T+${tParts.b}`;
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, colors, tValue: turnString }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data?.error ?? "오류 발생");
      } else {
        setStatus("");
        setTValue(turnString);
        setStep(4);
      }
    } catch (e) {
      setStatus("네트워크 오류");
    }
  };

  return (
    <main className="min-h-screen bg-white pb-12 animate-fade-in font-plus-jakarta">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-30">
        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 12H5" stroke="#E60012" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 19L5 12L12 5" stroke="#E60012" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[#E60012] font-black text-xl italic tracking-tighter">Lego Lineup</span>
        </div>
        <div className="w-10"></div>
      </header>

      <div className="px-6 space-y-8 mt-4 max-w-lg mx-auto">
        {step === 1 && (
          <div className="space-y-8 animate-fade-in">
            <section>
              <h1 className="text-[2.5rem] font-bold text-[#1A1A1A] leading-tight mb-2">색상 순서 입력</h1>
              <p className="text-[#666666] font-medium">팀 ID와 의사결정한 색상 순서를 입력해주세요.</p>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#1A1A1A]">팀 ID (1-100)</h2>
              </div>
              <input
                type="number"
                className="input-premium"
                placeholder="팀 ID를 입력하세요"
                value={id}
                min={range.min}
                max={range.max}
                onChange={(e) => setId(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </section>

            <section>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-[#1A1A1A]">색상 순서 선택</h2>
                <span className="px-3 py-1 bg-red-50 text-[#E60012] text-[10px] font-bold rounded-full uppercase tracking-tighter">
                  {colors.length}/5 선택됨
                </span>
              </div>
              <p className="text-sm text-[#666666] mb-4">
                원하는 색상을 <strong className="text-[#E60012] font-semibold">1번부터 5번까지 순서대로 탭</strong>하여 선택해주세요.
              </p>

              {/* 선택된 순서 표시 */}
              <div className="flex items-center gap-2 mb-4 min-h-[56px] p-3 bg-[#F8F9FA] rounded-2xl border border-[#EEEEEE]">
                {colors.length === 0 ? (
                  <span className="text-sm text-[#999999] font-medium w-full text-center">아래에서 색상을 선택하세요</span>
                ) : (
                  colors.map((c, idx) => (
                    <div key={c} className="flex items-center gap-1">
                      <span className="text-[10px] font-black text-[#999999]">{idx + 1}</span>
                      <div
                        className="w-10 h-10 rounded-full border-2 border-black/10 shadow-sm flex items-center justify-center"
                        style={{ backgroundColor: getColorHex(c) }}
                      >
                        <span className={`text-xs font-black ${c === "흰" || c === "노" ? "text-black/60" : "text-white/80"}`}>
                          {c}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* 선택 가능한 색상 버튼 */}
              <div className="grid grid-cols-5 gap-2 mb-3">
                {COLORS.map((c) => {
                  const isSelected = colors.includes(c);
                  const orderNum = isSelected ? colors.indexOf(c) + 1 : null;
                  return (
                    <button
                      key={c}
                      onClick={() => handleSelectColor(c)}
                      disabled={isSelected}
                      className={`
                        relative flex flex-col items-center justify-center py-3 rounded-2xl border-2 transition-all duration-200
                        ${isSelected
                          ? "border-[#CCCCCC] opacity-30 cursor-not-allowed scale-95"
                          : "border-[#EEEEEE] hover:border-[#E60012] hover:shadow-md active:scale-95 cursor-pointer"
                        }
                      `}
                    >
                      <div
                        className="w-10 h-10 rounded-full shadow-[inset_0_-3px_6px_rgba(0,0,0,0.1),_0_3px_6px_rgba(0,0,0,0.1)] border border-black/5"
                        style={{ backgroundColor: getColorHex(c) }}
                      />
                      <span className="text-[11px] font-bold text-[#666666] mt-1.5">{getColorName(c)}</span>
                      {isSelected && (
                        <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-[#E60012] rounded-full flex items-center justify-center shadow-sm">
                          <span className="text-[10px] font-black text-white">{orderNum}</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* 초기화 버튼 */}
              <button
                onClick={handleResetColors}
                disabled={colors.length === 0}
                className={`w-full py-2.5 rounded-xl border-2 font-bold text-sm transition-all
                  ${colors.length === 0
                    ? "border-[#EEEEEE] text-[#CCCCCC] cursor-not-allowed"
                    : "border-[#666666] text-[#666666] hover:bg-gray-50 active:scale-[0.98]"
                  }`}
              >
                전체 초기화
              </button>
            </section>

            <section className="pt-4">
              <button
                className={`btn-primary ${(id === "" || colors.length !== 5) ? "opacity-50 grayscale pointer-events-none" : ""}`}
                onClick={submitColors}
                disabled={id === "" || colors.length !== 5 || status === "제출 중..."}
              >
                {status === "제출 중..." ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : "색상 순서 제출"}
                {!status && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 12h14M12 5l7 7-7 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                )}
              </button>

              {status && status !== "제출 중..." && (
                <div className="mt-4 text-center p-4 rounded-2xl font-bold border animate-fade-in bg-red-50 border-red-100 text-[#E60012]">
                  {status}
                </div>
              )}
            </section>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-fade-in text-center py-12">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="#34C759" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 4L12 14.01l-3-3" stroke="#34C759" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            <h1 className="text-[2rem] font-bold text-[#1A1A1A] leading-tight mb-4">제출 되었습니다!</h1>

            <div className="p-6 bg-[#F8F9FA] rounded-2xl border border-[#EEEEEE] mb-4">
              <p className="text-[#666666] text-lg font-medium leading-relaxed">
                현재 대기 상태입니다.<br/>
                강사님의 안내가 있을 때까지 기다려 주세요.
              </p>
            </div>

            {/* 제출 내역 미리보기 */}
            <div className="p-4 bg-white rounded-2xl border border-[#EEEEEE] mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#666666] font-medium">팀 #{id}</span>
                <div className="flex items-center gap-1">
                  {colors.map((c, i) => (
                    <div key={i} className="w-6 h-6 rounded-full border border-black/10" style={{ backgroundColor: getColorHex(c) }} />
                  ))}
                </div>
              </div>
            </div>

            <button
              className={`btn-primary ${!isTurnEnabled ? "opacity-50 grayscale cursor-not-allowed" : ""}`}
              onClick={() => {
                if (isTurnEnabled) setStep(3);
              }}
              disabled={!isTurnEnabled}
            >
              {!isTurnEnabled && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              {isTurnEnabled ? "다음 단계 진행하기" : "강사 승인 대기 중..."}
              {isTurnEnabled && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12h14M12 5l7 7-7 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>

            {/* 수정하기 버튼 */}
            <button
              onClick={handleEdit}
              className="w-full py-4 rounded-2xl border-2 border-[#E60012] text-[#E60012] font-bold text-lg hover:bg-red-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="#E60012" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#E60012" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              수정하기
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-fade-in">
            <section>
              <h1 className="text-[2.5rem] font-bold text-[#1A1A1A] leading-tight mb-2">턴 수 입력</h1>
              <p className="text-[#666666] font-medium">강사님의 안내에 따라 결정한 턴 수를 입력해주세요.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1A1A1A] mb-4">턴 수 선택 (숫자T+숫자)</h2>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <div className="relative">
                  <select
                    className="input-premium appearance-none pr-10 text-center text-xl font-bold"
                    value={tParts.a}
                    onChange={(e) => setTParts(prev => ({ ...prev, a: Number(e.target.value) }))}
                  >
                    {[2, 3, 4, 5].map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-30">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>

                <span className="text-2xl font-black text-[#1A1A1A]">T +</span>

                <div className="relative">
                  <select
                    className="input-premium appearance-none pr-10 text-center text-xl font-bold"
                    value={tParts.b}
                    onChange={(e) => setTParts(prev => ({ ...prev, b: Number(e.target.value) }))}
                  >
                    {[1, 2, 3, 4].map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-30">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>
            </section>

            <section className="pt-4">
              <button
                className="btn-primary"
                onClick={submitTValue}
                disabled={status === "제출 중..."}
              >
                {status === "제출 중..." ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : "최종 제출"}
                {!status && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="white" fillOpacity="0.2"/>
                        <path d="M8 12L11 15L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                )}
              </button>

              {status && status !== "제출 중..." && (
                <div className="mt-4 text-center p-4 rounded-2xl font-bold border animate-fade-in bg-red-50 border-red-100 text-[#E60012]">
                  {status}
                </div>
              )}
            </section>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-8 animate-fade-in text-center py-12">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="#34C759" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 4L12 14.01l-3-3" stroke="#34C759" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            <h1 className="text-[2rem] font-bold text-[#1A1A1A] leading-tight mb-4">모든 제출이 완료되었습니다!</h1>

            <div className="p-6 bg-[#F8F9FA] rounded-2xl border border-[#EEEEEE]">
              <p className="text-[#666666] text-lg font-medium leading-relaxed mb-4">
                제출 내역
              </p>
              <div className="flex flex-col gap-3 font-bold text-[#1A1A1A]">
                <div className="flex justify-between items-center py-2 border-b border-[#EEEEEE]">
                  <span className="text-[#666666]">팀 ID</span>
                  <span>{id}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#EEEEEE]">
                  <span className="text-[#666666]">색상 순서</span>
                  <div className="flex items-center gap-1.5">
                    {colors.map((c, i) => (
                      <div key={i} className="w-6 h-6 rounded-full border border-black/10" style={{ backgroundColor: getColorHex(c) }} />
                    ))}
                    <span className="ml-1 text-sm">{colors?.join("") || "-"}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-[#666666]">턴 수</span>
                  <span className="text-[#E60012]">{tValue}</span>
                </div>
              </div>
            </div>

            {/* 수정하기 버튼 */}
            <button
              onClick={handleEdit}
              className="w-full py-4 rounded-2xl border-2 border-[#E60012] text-[#E60012] font-bold text-lg hover:bg-red-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="#E60012" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#E60012" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              수정하기
            </button>
          </div>
        )}
      </div>

      <footer className="mt-20 text-center px-6">
        <p className="text-[10px] font-bold text-[#CCCCCC] tracking-[0.2em] uppercase">
          © {new Date().getFullYear()} Lego Lineup. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
