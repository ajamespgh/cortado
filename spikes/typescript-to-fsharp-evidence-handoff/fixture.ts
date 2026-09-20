function writeAuditRecord(): void {}

function handleRequest(isAuthorized: boolean): void {
  if (isAuthorized) {
    writeAuditRecord();
  }
}

handleRequest(true);
