import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Color } from "@/lib/constants";

interface SortableLegoItemProps {
  id: string;
  color: Color;
  index: number;
}

export function SortableLegoItem({ id, color, index }: SortableLegoItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
  };

  const getColorHex = (c: Color) => {
    switch (c) {
      case "빨": return "#FF3B30";
      case "노": return "#FFCC00";
      case "파": return "#007AFF";
      case "초": return "#34C759";
      case "흰": return "#FFFFFF";
      default: return "#FFFFFF";
    }
  };

  const getColorName = (c: Color) => {
    switch (c) {
      case "빨": return "빨강";
      case "노": return "노랑";
      case "파": return "파랑";
      case "초": return "초록";
      case "흰": return "흰색";
      default: return "";
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        relative flex items-center justify-between p-4 mb-3
        bg-white rounded-2xl border border-[#EEEEEE] shadow-[0_2px_8px_rgba(0,0,0,0.04)]
        cursor-grab active:cursor-grabbing select-none 
        transition-all duration-200
        ${isDragging ? "opacity-90 scale-[1.02] shadow-[0_8px_24px_rgba(0,0,0,0.1)] z-50 border-[#E60012]/20" : ""}
      `}
    >
      <div className="flex items-center gap-4">
        <div 
          className="w-12 h-12 rounded-full shadow-[inset_0_-4px_8px_rgba(0,0,0,0.1),_0_4px_8px_rgba(0,0,0,0.1)] border border-black/5 flex items-center justify-center relative overflow-hidden"
          style={{ backgroundColor: getColorHex(color) }}
        >
          {/* Lego Studs simulation (subtle) */}
          <div className="grid grid-cols-2 gap-1 opacity-20">
            <div className="w-2 h-2 rounded-full border border-black/20"></div>
            <div className="w-2 h-2 rounded-full border border-black/20"></div>
            <div className="w-2 h-2 rounded-full border border-black/20"></div>
            <div className="w-2 h-2 rounded-full border border-black/20"></div>
          </div>
        </div>
        <span className="font-bold text-lg text-[#1A1A1A]">
          {getColorName(color)}
        </span>
      </div>

      <div className="flex flex-col gap-1 items-end opacity-20">
        <div className="flex gap-1">
          <div className="w-1 h-1 rounded-full bg-black"></div>
          <div className="w-1 h-1 rounded-full bg-black"></div>
        </div>
        <div className="flex gap-1">
          <div className="w-1 h-1 rounded-full bg-black"></div>
          <div className="w-1 h-1 rounded-full bg-black"></div>
        </div>
        <div className="flex gap-1">
          <div className="w-1 h-1 rounded-full bg-black"></div>
          <div className="w-1 h-1 rounded-full bg-black"></div>
        </div>
      </div>
    </div>
  );
}
