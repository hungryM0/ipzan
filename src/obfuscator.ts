const BASE64_TABLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
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
  let result = "";

  for (let i = 0; i < bytes.length; i += 3) {
    const first = bytes[i];
    const second = bytes[i + 1];
    const third = bytes[i + 2];

    result += BASE64_TABLE[first >> 2];

    if (second === undefined) {
      result += BASE64_TABLE[(first & 3) << 4];
      result += "==";
      continue;
    }

    result += BASE64_TABLE[((first & 3) << 4) | (second >> 4)];

    if (third === undefined) {
      result += BASE64_TABLE[(second & 15) << 2];
      result += "=";
      continue;
    }

    result += BASE64_TABLE[((second & 15) << 2) | (third >> 6)];
    result += BASE64_TABLE[third & 63];
  }

  return result;
}

function randomHexString(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  let result = "";
  for (const byte of bytes) {
    result += HEX_CHARS[byte & 15];
  }

  return result;
}
