export default function classNames(...args: (string | undefined)[]) {
  const stringNames = args.filter((s) => (s?.length ?? 0) > 0).join(" ");
  return stringNames;
}
