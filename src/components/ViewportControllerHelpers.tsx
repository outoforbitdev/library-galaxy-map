import { IVector2 } from "./Vector2";

function clientPositionToContainerPosition(
  clientPosition: IVector2,
  container: HTMLDivElement,
): IVector2 {
  const rect = container.getBoundingClientRect();

  const containerPosition = {
    x: clientPosition.x - rect.left,
    y: clientPosition.y - rect.top,
  };

  return containerPosition;
}

function distance(a: IVector2, b: IVector2) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export { clientPositionToContainerPosition, distance };
