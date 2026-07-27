// @vitest-environment node
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { useInitiallyExpanded } from "./useInitiallyExpanded";

function TestComponent() {
  const expanded = useInitiallyExpanded();
  return <span>{expanded ? "expanded" : "collapsed"}</span>;
}

describe("useInitiallyExpanded (server rendering)", () => {
  it("does not throw when rendered without a window global, e.g. during SSR", () => {
    expect(() => renderToStaticMarkup(<TestComponent />)).not.toThrow();
  });

  it("renders collapsed by default when there is no window to query", () => {
    const html = renderToStaticMarkup(<TestComponent />);
    expect(html).toContain("collapsed");
  });
});
