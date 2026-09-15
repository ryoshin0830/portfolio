// jsdom には IntersectionObserver が無いので、scroll-spy 系のテスト用に
// 「観測対象を記録するだけ」のスタブを入れる。コールバックはテスト側が
// インスタンスを掴んで手動発火する。
class IntersectionObserverStub implements IntersectionObserver {
  static instances: IntersectionObserverStub[] = [];

  readonly root: Element | Document | null = null;
  readonly rootMargin: string = "";
  readonly thresholds: ReadonlyArray<number> = [];
  observed: Element[] = [];

  constructor(public callback: IntersectionObserverCallback) {
    IntersectionObserverStub.instances.push(this);
  }

  observe(target: Element) {
    this.observed.push(target);
  }
  unobserve(target: Element) {
    this.observed = this.observed.filter((el) => el !== target);
  }
  disconnect() {
    this.observed = [];
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

globalThis.IntersectionObserver =
  IntersectionObserverStub as unknown as typeof IntersectionObserver;

// jsdom は scrollIntoView を実装していない（呼ぶと TypeError）。
Element.prototype.scrollIntoView = () => {};

// jsdom には matchMedia が無い。GSAP の gsap.matchMedia() と
// usePrefersReducedMotion が使うので、常に「マッチしない」スタブを入れる。
// （テストでは reduced-motion / hover 条件を全て false 扱いにして、
//  スクロール演出を登録させない = DOM 構造だけを検証する）
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

// ScrollTrigger が参照する。observe/unobserve を記録しないダミーで十分。
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

export { IntersectionObserverStub };
