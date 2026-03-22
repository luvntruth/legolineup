export function getLegoColorClass(color: string) {
  switch (color) {
    case "빨":
      return "bg-red-500 text-white shadow-red-700";
    case "노":
      return "bg-yellow-400 text-black shadow-yellow-600";
    case "파":
      return "bg-blue-600 text-white shadow-blue-800";
    case "초":
      return "bg-green-500 text-white shadow-green-700";
    case "흰":
    default:
      return "bg-white text-black shadow-gray-300";
  }
}

export function getColorHex(c: string): string {
  switch (c) {
    case "빨": return "#FF3B30";
    case "노": return "#FFCC00";
    case "파": return "#007AFF";
    case "초": return "#34C759";
    case "흰": return "#FFFFFF";
    default: return "#F2F2F7";
  }
}

export function getColorName(c: string): string {
  switch (c) {
    case "빨": return "빨강";
    case "노": return "노랑";
    case "파": return "파랑";
    case "초": return "초록";
    case "흰": return "흰색";
    default: return "";
  }
}

export function parseRecordToSeconds(record: string): number {
  if (!record) return Infinity;
  const match = record.match(/(\d+)'\s*(\d+)"/);
  if (!match) return Infinity;
  return parseInt(match[1]) * 60 + parseInt(match[2]);
}
