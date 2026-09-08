export type ScopePhase =
  | "req"
  | "basicDesign"
  | "detailDesign"
  | "impl"
  | "test"
  | "ops";

export type EmploymentType = "fulltime" | "contract" | "internship";

export interface Engagement {
  id:
    | "gmo-pepabo"
    | "suiren"
    | "sapeet"
    | "medimo"
    | "ninjal"
    | "shinhan";
  start: string;
  end: string | null;
  isCurrent: boolean;
  employmentType: EmploymentType;
  company: string;
  product: string;
  industry: string;
  role: string;
  teamOverall: number | null;
  teamSection: number | null;
  scope: ScopePhase[];
  stack: string[];
  responsibilities: string[];
  workItems: string[];
  achievements: string[];
}

export interface HighlightStat {
  id: string;
  hero?: boolean;
  value: string;
  unit: string;
  label: string;
  context?: string;
}

export interface SkillCategory {
  id: "languages" | "frontend" | "backend" | "ai" | "databases" | "infra" | "tools";
  titleKey:
    | "programming"
    | "frontend"
    | "backend"
    | "database"
    | "ai"
    | "infrastructure"
    | "tools";
  items: Array<{
    name: string;
    level: "core" | "proficient" | "familiar";
  }>;
}

export interface Expertise {
  id: "web" | "ml" | "language-edu";
  title: string;
  description: string;
}

/**
 * 日程調整チャットのクイック返信チップ。
 * `label` が画面に出る文字、`text` がクリック時にエージェントへ送る本文。
 * 以前は LLM に Tailwind 付きの HTML を毎ターン生成させていたが、内容は静的なので
 * 翻訳ファイル＋クライアント描画に移した（prefill / decode の削減）。
 */
export interface SchedulingQuickReply {
  label: string;
  text: string;
}

export type Translator = (key: string) => unknown;

export function getRaw<T>(t: { raw: (key: string) => unknown }, key: string): T {
  return t.raw(key) as T;
}
