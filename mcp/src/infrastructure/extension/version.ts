export const EXPECTED_EXTENSION_VERSION = "0.1.0";

export interface ExtensionStatus {
  connected: boolean;
  version?: string;
  expected: string;
  upToDate: boolean;
}

export function describeStatus(connected: boolean, version?: string): ExtensionStatus {
  return { connected, version, expected: EXPECTED_EXTENSION_VERSION, upToDate: version === EXPECTED_EXTENSION_VERSION };
}
