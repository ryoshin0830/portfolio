import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { SECTION_IDS, SECTION_REDIRECTS, HASH_DIALOGS } from "./sections";

/**
 * セクション ID / ページ内アンカー / リダイレクト / ナビの整合性テスト。
 *
 * 「すべての連絡先」ボタン (#contact) のようなページ内アンカーが、実在しない
 * id を指したり、scroll-spy・リダイレクトの構成から漏れたりしていないことを
 * ソースを走査して検証する。
 */

const ROOT = path.resolve(__dirname, "../..");
const SRC = path.join(ROOT, "src");

function listFiles(dir: string, ext: RegExp): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(full, ext);
    return ext.test(entry.name) ? [full] : [];
  });
}

const sourceFiles = listFiles(SRC, /\.tsx?$/).filter(
  (f) => !f.endsWith(".test.ts") && !f.endsWith(".test.tsx")
);
const sources = sourceFiles.map((file) => ({
  file: path.relative(ROOT, file),
  text: fs.readFileSync(file, "utf8"),
}));

/** JSX の静的な id="..." をすべて収集 */
const domIds = new Set(
  sources.flatMap(({ text }) =>
    [...text.matchAll(/\bid="([a-zA-Z][\w-]*)"/g)].map((m) => m[1])
  )
);

describe("ページ内アンカーの整合性", () => {
  it('href="#..." のリンク先がすべて実在する（id またはハッシュ駆動ダイアログ）', () => {
    const hashDialogs = new Set<string>(HASH_DIALOGS);
    const broken: string[] = [];
    for (const { file, text } of sources) {
      for (const m of text.matchAll(/href="#([\w-]+)"/g)) {
        if (!domIds.has(m[1]) && !hashDialogs.has(m[1])) {
          broken.push(`${file}: href="#${m[1]}"`);
        }
      }
    }
    expect(broken, `リンク先が存在しないアンカー: ${broken.join(", ")}`).toEqual([]);
  });

  it("ハッシュ駆動ダイアログ (#contact) を ContactModal が処理している", () => {
    const modal = fs.readFileSync(
      path.join(SRC, "components/ContactModal.tsx"),
      "utf8"
    );
    expect(modal).toContain('"#contact"');
    expect(modal).toContain("hashchange");
  });

  it("SECTION_IDS の各 ID に対応する id 属性が実在する", () => {
    const missing = SECTION_IDS.filter((id) => !domIds.has(id));
    expect(missing, `id="${missing.join(", ")}" の要素が見つからない`).toEqual([]);
  });
});

describe("scroll-spy とリダイレクトの整合性", () => {
  // scroll-spy は URL を /{locale}/{section} に書き換えるため、hero 以外の
  // 全セクションにリダイレクトが必要（無いとその URL のリロードが 404 になる）。
  // ハッシュ駆動ダイアログ（contact）も旧 URL 互換のためリダイレクトを残す。
  it("SECTION_REDIRECTS = (SECTION_IDS − hero) + HASH_DIALOGS", () => {
    expect([...SECTION_REDIRECTS].sort()).toEqual(
      [...SECTION_IDS.filter((id) => id !== "hero"), ...HASH_DIALOGS].sort()
    );
  });

  it("next.config.ts が単一ソース（src/lib/sections）の SECTION_REDIRECTS を使っている", () => {
    const config = fs.readFileSync(path.join(ROOT, "next.config.ts"), "utf8");
    expect(config).toMatch(
      /import\s*\{[^}]*SECTION_REDIRECTS[^}]*\}\s*from\s*['"]\.\/src\/lib\/sections['"]/
    );
    // 独自のリダイレクト配列を再定義していないこと
    expect(config).not.toMatch(/const\s+SECTION_REDIRECTS\s*=/);
  });

  it("useScrollNavigation が単一ソースの SECTION_IDS を使っている", () => {
    const hook = fs.readFileSync(
      path.join(SRC, "hooks/useScrollNavigation.ts"),
      "utf8"
    );
    expect(hook).toMatch(
      /import\s*\{[^}]*SECTION_IDS[^}]*\}\s*from\s*['"]@\/lib\/sections['"]/
    );
  });
});

describe("ナビゲーションの整合性", () => {
  it("Navigation の sectionId はすべて SECTION_IDS に含まれる", () => {
    const nav = fs.readFileSync(
      path.join(SRC, "components/Navigation.tsx"),
      "utf8"
    );
    const navIds = [...nav.matchAll(/sectionId:\s*"([\w-]+)"/g)].map((m) => m[1]);
    expect(navIds.length).toBeGreaterThan(0);
    const unknown = navIds.filter(
      (id) => !(SECTION_IDS as readonly string[]).includes(id)
    );
    expect(unknown, `SECTION_IDS に無い sectionId: ${unknown.join(", ")}`).toEqual([]);
  });

  it("page.tsx のセクション描画順が SECTION_IDS の順序と一致する", () => {
    const page = fs.readFileSync(
      path.join(SRC, "app/[locale]/page.tsx"),
      "utf8"
    );
    // <main> 内で使われているコンポーネント名を出現順に取り出す
    const main = page.slice(page.indexOf("<main>"), page.indexOf("</main>"));
    const componentNames = [...main.matchAll(/<([A-Z]\w+)/g)].map((m) => m[1]);

    // 各コンポーネントファイルの先頭の id="..." を対応付ける
    const idOf = (name: string): string | null => {
      const file = path.join(SRC, `components/${name}.tsx`);
      if (!fs.existsSync(file)) return null;
      const m = fs.readFileSync(file, "utf8").match(/\bid="([\w-]+)"/);
      return m ? m[1] : null;
    };

    const renderedOrder = componentNames
      .map(idOf)
      .filter((id): id is string =>
        id !== null && (SECTION_IDS as readonly string[]).includes(id)
      );

    expect(renderedOrder).toEqual([...SECTION_IDS]);
  });
});
