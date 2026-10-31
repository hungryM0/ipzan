const SALT = "QWERIPZAN1290QWER";
const HEX_CHARS = "0123456789abcdef";

export function generateObfuscatedAccount(username: string, password: string): string {
  const encoded = base64EncodeUtf8(`${username}${SALT}${password}`);
  const randomHex = randomHexString(400);

  return [
    randomHex.slice(0, 100),
    encoded.slice(0, 8),
    randomHex.slice(100, 200),
    encoded.slice(8, 20),
    randomHex.slice(200, 300),
    encoded.slice(20),
    randomHex.slice(300, 400),
  ].join("");
}

function base64EncodeUtf8(value: string): string {
  const bytes = new TextEncoder().encode(value);
  return btoa(String.fromCharCode(...bytes));
}

function randomHexString(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (byte) => HEX_CHARS[byte & 15]).join("");
}
