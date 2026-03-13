export const COLORS = ["빨", "노", "파", "초", "흰"] as const;
export type Color = (typeof COLORS)[number];

export const T_VALUES = [
  "2T+1","2T+2","2T+3","2T+4",
  "3T+1","3T+2","3T+3","3T+4",
  "4T+1","4T+2","4T+3","4T+4",
  "5T+1","5T+2","5T+3","5T+4",
] as const;
export type TValue = (typeof T_VALUES)[number];
