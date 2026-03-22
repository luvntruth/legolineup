export const COLORS = ["빨", "노", "파", "초", "흰"] as const;
export type Color = (typeof COLORS)[number];

export const T_VALUES = [
  "2T+1",
  "3T+1",
  "4T+1",
  "5T+1",
] as const;
export type TValue = (typeof T_VALUES)[number];
