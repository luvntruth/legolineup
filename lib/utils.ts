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
