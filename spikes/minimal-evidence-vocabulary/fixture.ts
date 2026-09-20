export function allowRequest(isOwner: boolean): boolean {
  return isOwner;
}

export function loadRecord(isOwner: boolean): string {
  if (allowRequest(isOwner)) {
    return "record";
  }

  return "denied";
}
