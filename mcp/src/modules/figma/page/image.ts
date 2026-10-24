const MAX_IMAGE_SIDE = 1024;
const BASE64_CHUNK = 0x8000;

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += BASE64_CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + BASE64_CHUNK));
  }
  return btoa(binary);
}

export async function exportImage(root: any): Promise<string> {
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(root.width, root.height));
  const bytes: Uint8Array = await root.exportAsync({ format: "PNG", constraint: { type: "SCALE", value: scale } });
  return toBase64(bytes);
}
