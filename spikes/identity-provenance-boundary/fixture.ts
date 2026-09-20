export function authorize(isOwner: boolean): boolean {
  return isOwner;
}

export function readProtectedRecord(isOwner: boolean): string {
  if (authorize(isOwner)) {
    return "record";
  }

  return "denied";
}
