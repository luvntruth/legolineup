"use client";

import { useState, useEffect } from "react";
import { COLORS, T_VALUES, Color, TValue } from "@/lib/constants";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
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
  const [tValue, setTValue] = useState<TValue>("2T+1" as TValue);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    fetch(`/api/data`).then((res) => res.json()).then((d) => {
      if (d?.range) setRange(d.range);
    });
    const savedId = localStorage.getItem("participantId");
    if (savedId) setId(Number(savedId));
  }, []);

  useEffect(() => {
    if (id === "") return;
    localStorage.setItem("participantId", String(id));
    fetch(`/api/participant?id=${id}`)
      .then((res) => res.json())
      .then((d) => {
        if (d?.submission) {
          setColors(d.submission.colors);
          setTValue(d.submission.tValue);
        }
      })
      .catch(() => {});
  }, [id]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
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

  const submit = async () => {
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
        body: JSON.stringify({ id, colors, tValue }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data?.error ?? "오류 발생");
      } else {
        setStatus("저장 완료");
        setTimeout(() => setStatus(""), 3000);
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
        {/* Page Title */}
        <section>
          <h1 className="text-[2.5rem] font-bold text-[#1A1A1A] leading-tight mb-2">참가자 폼</h1>
          <p className="text-[#666666] font-medium">학습 경험을 위한 세부 정보를 입력해 주세요.</p>
        </section>

        {/* Team ID */}
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

        {/* Color Sequence */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#1A1A1A]">색상 순서 선택</h2>
            <span className="px-3 py-1 bg-red-50 text-[#E60012] text-[10px] font-bold rounded-full uppercase tracking-tighter">드래그하여 순서 변경</span>
          </div>
          
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={colors}
              strategy={verticalListSortingStrategy}
            >
              {colors.map((c, idx) => (
                <SortableLegoItem key={c} id={c} color={c} index={idx} />
              ))}
            </SortableContext>
          </DndContext>
        </section>

        {/* T-Value */}
        <section>
          <h2 className="text-lg font-bold text-[#1A1A1A] mb-4">T-Value 선택</h2>
          <div className="relative">
            <select
              className="input-premium appearance-none pr-12 cursor-pointer"
              value={tValue}
              onChange={(e) => setTValue(e.target.value as TValue)}
            >
              {T_VALUES.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 9L12 15L18 9" stroke="#666666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </section>

        {/* Submit */}
        <section className="pt-4">
          <button 
            className={`btn-primary ${id === "" ? "opacity-50 grayscale pointer-events-none" : ""}`}
            onClick={submit}
            disabled={id === "" || status === "제출 중..."}
          >
            {status === "제출 중..." ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : "제출"}
            {!status && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="white" fillOpacity="0.2"/>
                    <path d="M8 12L11 15L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            )}
          </button>
          
          {status && status !== "제출 중..." && (
            <div className={`
              mt-4 text-center p-4 rounded-2xl font-bold border animate-fade-in
              ${status === "저장 완료" ? "bg-green-50 border-green-100 text-green-600" : "bg-red-50 border-red-100 text-[#E60012]"}
            `}>
              {status}
            </div>
          )}
        </section>
      </div>

      <footer className="mt-20 text-center px-6">
        <p className="text-[10px] font-bold text-[#CCCCCC] tracking-[0.2em] uppercase">
          © {new Date().getFullYear()} The Play Company. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
