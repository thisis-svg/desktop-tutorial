import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type CaseId = 'abl' | 'pm';

/** 物品ID -> 使用数量 */
export type Selection = Record<string, number>;

type State = Record<CaseId, Selection>;

const STORAGE_KEY = 'case-cost:selections:v1';

const emptyState: State = { abl: {}, pm: {} };

type Ctx = {
  ready: boolean;
  state: State;
  /** 数量を設定（0 以下で削除） */
  setQty: (caseId: CaseId, materialId: string, qty: number) => void;
  /** 数量を加算 */
  addOne: (caseId: CaseId, materialId: string) => void;
  /** 症例の選択をすべてクリア */
  clear: (caseId: CaseId) => void;
};

const CaseContext = createContext<Ctx | null>(null);

export function CaseStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(emptyState);
  const [ready, setReady] = useState(false);

  // 起動時に保存済みの選択を復元
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<State>;
          setState({ abl: parsed.abl ?? {}, pm: parsed.pm ?? {} });
        }
      } catch {
        // 復元失敗時は空のままにする
      } finally {
        setReady(true);
      }
    })();
  }, []);

  // 変更があれば保存
  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, ready]);

  const api = useMemo<Ctx>(() => {
    const setQty = (caseId: CaseId, materialId: string, qty: number) => {
      setState((prev) => {
        const next = { ...prev[caseId] };
        if (qty <= 0) {
          delete next[materialId];
        } else {
          next[materialId] = qty;
        }
        return { ...prev, [caseId]: next };
      });
    };
    const addOne = (caseId: CaseId, materialId: string) => {
      setState((prev) => {
        const cur = prev[caseId][materialId] ?? 0;
        return { ...prev, [caseId]: { ...prev[caseId], [materialId]: cur + 1 } };
      });
    };
    const clear = (caseId: CaseId) => {
      setState((prev) => ({ ...prev, [caseId]: {} }));
    };
    return { ready, state, setQty, addOne, clear };
  }, [state, ready]);

  return <CaseContext.Provider value={api}>{children}</CaseContext.Provider>;
}

export function useCaseStore(): Ctx {
  const ctx = useContext(CaseContext);
  if (!ctx) throw new Error('useCaseStore must be used within CaseStoreProvider');
  return ctx;
}
