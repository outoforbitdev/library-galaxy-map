import { CSSProperties, MouseEventHandler, ReactNode } from "react";

export interface IChildlessComponentProps {
  className?: string;
  id?: string;
  onClick?: MouseEventHandler;
  style?: CSSProperties;
}

export interface IComponentProps extends IChildlessComponentProps {
  children?: ReactNode;
}

export function getDomProps(
  props: IComponentProps,
  ...args: (string | undefined)[]
) {
  return {
    className: combineClassNames(props.className, ...args),
    id: props.id,
    onClick: props.onClick,
    style: props.style,
  };
}

export function combineClassNames(...args: (string | undefined)[]) {
  const stringNames = args.filter((s) => (s?.length ?? 0) > 0).join(" ");
  return stringNames;
}
