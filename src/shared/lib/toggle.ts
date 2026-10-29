// Adds or removes `item`, keeping the canonical order of `allowed`.
export function toggle<T>(allowed: readonly T[], selected: T[], item: T): T[] {
  const isSelected = selected.includes(item);
  return allowed.filter((value) =>
    value === item ? !isSelected : selected.includes(value),
  );
}
