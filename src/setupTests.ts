import "@testing-library/jest-dom";

class ResizeObserverMock implements ResizeObserver {
  constructor(private callback: ResizeObserverCallback) {}

  observe(target: Element) {
    this.callback(
      [{ target, contentRect: target.getBoundingClientRect() } as ResizeObserverEntry],
      this,
    );
  }

  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock;
