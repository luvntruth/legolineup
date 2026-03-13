"use client";

import { useState, useEffect } from "react";
import { COLORS, T_VALUES, Color, TValue } from "@/lib/constants";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableLegoItem } from "@/components/SortableLegoItem";

export default function HomePage() {
  const [id, setId] = useState<number | "">("");
  const [range, setRange] = useState<{ min: number; max: number }>({ min: 1, max: 100 });
  const [colors, setColors] = useState<Color[]>([...COLORS]);
  const [tValue, setTValue] = useState<string>("");
  const [tParts, setTParts] = useState<{ a: number; b: number }>({ a: 1, b: 1 });
  const [status, setStatus] = useState<string>("");
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isTurnEnabled, setIsTurnEnabled] = useState<boolean>(false);

  useEffect(() => {
    const checkSettings = () => {
      fetch(`/api/data?t=${Date.now()}`, { cache: "no-store" })
        .then((res) => res.json())
        .then((d) => {
          if (d?.range) setRange(d.range);
          if (d?.settings) setIsTurnEnabled(d.settings.isTurnEntryEnabled);
        });
    };
    checkSettings();
    const pollId = setInterval(checkSettings, 3000);
    return () => clearInterval(pollId);
  }, []);

  useEffect(() => {
    if (id === "") return;
    fetch(`/api/participant?id=${id}&t=${Date.now()}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((d) => {
        if (d?.submission) {
          setColors(d.submission.colors);
          setTValue(d.submission.tValue);
          if (d.submission.tValue === "") {
            setStep(2);
          } else {
            setStep(4);
          }
        }
      })
      .catch(() => {});
  }, [id]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setColors((items) => {
        const oldIndex = items.indexOf(active.id as Color);
        const newIndex = items.indexOf(over.id as Color);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
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
          <span className="text-[#E60012] font-black text-xl italic tracking-tighter">theplaycompany</span>
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
                <span className="px-3 py-1 bg-red-50 text-[#E60012] text-[10px] font-bold rounded-full uppercase tracking-tighter">드래그하여 순서 변경</span>
              </div>
              <p className="text-sm text-[#666666] mb-4">
                원하는 색상 블록을 <strong className="text-[#E60012] font-semibold">위아래로 길게 꾹 누른 상태로 드래그</strong>하여 순서를 변경해보세요!
              </p>
              
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={colors} strategy={verticalListSortingStrategy}>
                  {colors.map((c, idx) => (
                    <SortableLegoItem key={c} id={c} color={c} index={idx} />
                  ))}
                </SortableContext>
              </DndContext>
            </section>

            <section className="pt-4">
              <button 
                className={`btn-primary ${id === "" ? "opacity-50 grayscale pointer-events-none" : ""}`}
                onClick={submitColors}
                disabled={id === "" || status === "제출 중..."}
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
            
            <div className="p-6 bg-[#F8F9FA] rounded-2xl border border-[#EEEEEE] mb-8">
              <p className="text-[#666666] text-lg font-medium leading-relaxed">
                현재 대기 상태입니다.<br/>
                강사님의 안내가 있을 때까지 기다려 주세요.
              </p>
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
                    {Array.from({length: 10}, (_, i) => (
                      <option key={i+1} value={i+1}>{i+1}</option>
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
                    {Array.from({length: 10}, (_, i) => (
                      <option key={i+1} value={i+1}>{i+1}</option>
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
                  <span>{colors.join("")}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-[#666666]">턴 수</span>
                  <span className="text-[#E60012]">{tValue}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="mt-20 text-center px-6">
        <p className="text-[10px] font-bold text-[#CCCCCC] tracking-[0.2em] uppercase">
          © {new Date().getFullYear()} The Play Company. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
