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

export { IntersectionObserverStub };
