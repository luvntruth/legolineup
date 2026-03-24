import { doc, setDoc, getDoc, collection, getDocs, query, orderBy, deleteDoc, runTransaction, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { COLORS, T_VALUES } from "./constants";
import { ID_MIN, ID_MAX } from "./config";
import { parseRecordToSeconds } from "./utils";

export type SubmissionRow = {
  id: number;
  colors?: string;
  t_value?: string;
  record?: string;
  records?: string;
  updated_at: string;
};

export async function upsertSubmission(id: number, colors: string[], tValue: string) {
  if (id < ID_MIN || id > ID_MAX) throw new Error("ID out of range");
  if (colors.length !== 5 || !colors.every((c: any) => COLORS.includes(c))) throw new Error("Invalid colors");
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
  
  try {
    let resultRecords: string[] = [];
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(docRef);
      let newRecords = [record];
      let bestRecord = record;

      if (snap.exists()) {
        const data = snap.data();
        const existingRecords: string[] = data.records ? JSON.parse(data.records) : (data.record ? [data.record] : []);
        
        if (existingRecords.length >= 3) {
           throw new Error("팀당 최대 3개의 기록만 입력할 수 있습니다.");
        }
        
        newRecords = [...existingRecords, record];
        
        bestRecord = newRecords.reduce((best, curr) => {
           return parseRecordToSeconds(curr) < parseRecordToSeconds(best) ? curr : best;
        });
      }

      resultRecords = newRecords;
      // 트랜잭션 내에서 데이터를 쓰면 동시성 충돌을 방지할 수 있습니다.
      // record는 하위 호환성 (구버전 컴포넌트)을 위해 가장 빠른 기록을 남김
      transaction.set(docRef, {
        id,
        record: bestRecord,
        records: JSON.stringify(newRecords),
        updated_at: now
      }, { merge: true });
    });
    return { id, records: resultRecords, record: resultRecords[0], updatedAt: now }; // return updated info
  } catch (e: any) {
    if (e.message === "팀당 최대 3개의 기록만 입력할 수 있습니다.") {
       throw e; // re-throw specific errors
    }
    console.error("Transaction failed: ", e);
    throw e;
  }
}

export async function getSubmission(id: number) {
  const docRef = doc(db, "submissions", String(id));
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return parseSubmission(snap.data());
}

export async function getAllSubmissions() {
  const colRef = collection(db, "submissions");
  const q = query(colRef, orderBy("id", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => parseSubmission(d.data()));
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

export async function deleteRecord(id: number, recordIndex: number) {
  if (id < ID_MIN || id > ID_MAX) throw new Error("ID out of range");
  const docRef = doc(db, "submissions", String(id));

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(docRef);
    if (!snap.exists()) throw new Error("팀 기록을 찾을 수 없습니다.");

    const data = snap.data();
    const existing: string[] = data.records ? JSON.parse(data.records) : (data.record ? [data.record] : []);

    if (recordIndex < 0 || recordIndex >= existing.length) {
      throw new Error("유효하지 않은 기록 인덱스입니다.");
    }

    const newRecords = existing.filter((_, i) => i !== recordIndex);
    const bestRecord = newRecords.length > 0
      ? newRecords.reduce((best, curr) => parseRecordToSeconds(curr) < parseRecordToSeconds(best) ? curr : best)
      : "";

    transaction.set(docRef, {
      record: bestRecord,
      records: JSON.stringify(newRecords),
      updated_at: new Date().toISOString(),
    }, { merge: true });
  });
}

export async function updateRecord(id: number, recordIndex: number, newRecord: string) {
  if (id < ID_MIN || id > ID_MAX) throw new Error("ID out of range");
  const docRef = doc(db, "submissions", String(id));

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(docRef);
    if (!snap.exists()) throw new Error("팀 기록을 찾을 수 없습니다.");

    const data = snap.data();
    const existing: string[] = data.records ? JSON.parse(data.records) : (data.record ? [data.record] : []);

    if (recordIndex < 0 || recordIndex >= existing.length) {
      throw new Error("유효하지 않은 기록 인덱스입니다.");
    }

    const newRecords = existing.map((r, i) => (i === recordIndex ? newRecord : r));
    const bestRecord = newRecords.reduce((best, curr) =>
      parseRecordToSeconds(curr) < parseRecordToSeconds(best) ? curr : best
    );

    transaction.set(docRef, {
      record: bestRecord,
      records: JSON.stringify(newRecords),
      updated_at: new Date().toISOString(),
    }, { merge: true });
  });
}

export async function updateSubmissionData(id: number, colors?: string[], tValue?: string) {
  if (id < ID_MIN || id > ID_MAX) throw new Error("ID out of range");
  if (colors !== undefined) {
    if (colors.length !== 5 || !colors.every((c: any) => COLORS.includes(c as any))) {
      throw new Error("Invalid colors");
    }
  }
  if (tValue !== undefined && tValue !== "" && !/^\d+T\+\d+$/.test(tValue)) {
    throw new Error("Invalid tValue format");
  }
  const now = new Date().toISOString();
  const docRef = doc(db, "submissions", String(id));
  const updates: Record<string, any> = { updated_at: now };
  if (colors !== undefined) updates.colors = JSON.stringify(colors);
  if (tValue !== undefined) updates.t_value = tValue;
  await setDoc(docRef, updates, { merge: true });
  return { id, updatedAt: now };
}

export function getRange() {
  return { min: ID_MIN, max: ID_MAX };
}

export function onSubmissionsSnapshot(callback: (submissions: ReturnType<typeof parseSubmission>[]) => void) {
  const colRef = collection(db, "submissions");
  const q = query(colRef, orderBy("id", "asc"));
  return onSnapshot(q, (snap) => {
    const rows = snap.docs.map(d => parseSubmission(d.data()));
    callback(rows);
  });
}

export function onSettingsSnapshot(callback: (settings: { isTurnEntryEnabled: boolean }) => void) {
  const docRef = doc(db, "settings", "config");
  return onSnapshot(docRef, (snap) => {
    if (!snap.exists()) {
      callback({ isTurnEntryEnabled: false });
      return;
    }
    callback(snap.data() as { isTurnEntryEnabled: boolean });
  });
}

function parseSubmission(r: any) {
  return {
    id: r.id,
    colors: r.colors ? JSON.parse(r.colors) : null,
    tValue: r.t_value ?? "",
    record: r.record ?? "",
    records: r.records ? JSON.parse(r.records) : (r.record ? [r.record] : []),
    updatedAt: r.updated_at,
  };
}
