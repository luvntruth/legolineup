import { Color, TValue } from "./constants";

export type Submission = {
  id: number;
  colors: Color[];
  tValue: TValue;
  updatedAt: string;
};
