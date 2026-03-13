import { doc, setDoc, getDoc, collection, getDocs, query, orderBy, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";
import { COLORS, T_VALUES } from "./constants";
import { ID_MIN, ID_MAX } from "./config";

export type SubmissionRow = {
  id: number;
  colors?: string;
  t_value?: string;
  record?: string;
  updated_at: string;
};

export async function upsertSubmission(id: number, colors: string[], tValue: string) {
  if (id < ID_MIN || id > ID_MAX) throw new Error("ID out of range");
  if (colors.length !== 5 || !colors.every((c: any) => COLORS.includes(c))) throw new Error("Invalid colors");
  // Validation for tValue is more flexible now as format changed to AT+B
  if (tValue !== "" && !/^\d+T\+\d+$/.test(tValue)) throw new Error("Invalid tValue format");

  const now = new Date().toISOString();
  const docRef = doc(db, "submissions", String(id));
  
  await setDoc(docRef, {
    id,
    colors: JSON.stringify(colors),
    t_value: tValue,
    updated_at: now
  }, { merge: true });

  return { id, colors, tValue, updatedAt: now };
}

export async function upsertRecord(id: number, record: string) {
  if (id < ID_MIN || id > ID_MAX) throw new Error("ID out of range");
  const now = new Date().toISOString();
  const docRef = doc(db, "submissions", String(id));
  
  await setDoc(docRef, {
    id,
    record,
    updated_at: now
  }, { merge: true });

  return { id, record, updatedAt: now };
}

export async function getSubmission(id: number) {
  const docRef = doc(db, "submissions", String(id));
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  const data = snap.data();
  return { 
    id: data.id, 
    colors: data.colors ? JSON.parse(data.colors) : null, 
    tValue: data.t_value ?? "", 
    record: data.record ?? "",
    updatedAt: data.updated_at 
  };
}

export async function getAllSubmissions() {
  const colRef = collection(db, "submissions");
  const q = query(colRef, orderBy("id", "asc"));
  const snap = await getDocs(q);
  const rows: any[] = [];
  snap.forEach(doc => {
    rows.push(doc.data());
  });
  return rows.map(r => ({ 
    id: r.id, 
    colors: r.colors ? JSON.parse(r.colors) : null, 
    tValue: r.t_value ?? "", 
    record: r.record ?? "",
    updatedAt: r.updated_at 
  }));
}

export async function clearAllSubmissions() {
  const colRef = collection(db, "submissions");
  const snap = await getDocs(colRef);
  const promises = snap.docs.map(d => deleteDoc(d.ref));
  await Promise.all(promises);
}

export async function getSettings() {
  const docRef = doc(db, "settings", "config");
  const snap = await getDoc(docRef);
  if (!snap.exists()) return { isTurnEntryEnabled: false };
  return snap.data() as { isTurnEntryEnabled: boolean };
}

export async function updateSettings(isTurnEntryEnabled: boolean) {
  const docRef = doc(db, "settings", "config");
  await setDoc(docRef, { isTurnEntryEnabled }, { merge: true });
  return { isTurnEntryEnabled };
}

export function getRange() {
  return { min: ID_MIN, max: ID_MAX };
}
