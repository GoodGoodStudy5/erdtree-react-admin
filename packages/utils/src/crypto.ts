import { gcm } from '@noble/ciphers/aes.js';
import {
  managedNonce,
  bytesToHex,
  hexToBytes,
  utf8ToBytes,
  bytesToUtf8,
} from '@noble/ciphers/utils.js';
import { sha256 } from '@noble/hashes/sha2.js';

/**
 * @description: 加密/解密封装，secret值建议从后台接口获取
 */
const secretKey = '__Vite_Admin_Secret__';

/** 每次加密生成随机 nonce，写在密文首部 */
function createCipher(secret: string) {
  return managedNonce(gcm)(sha256(utf8ToBytes(secret)));
}

/**
 * 加密
 * @param data - 加密数据
 * @param secret - 加密密钥
 */
export function encryption(data: object, secret: string = secretKey) {
  const code = JSON.stringify(data);
  return bytesToHex(createCipher(secret).encrypt(utf8ToBytes(code)));
}

/**
 * 解密，密文被篡改或密钥不匹配时抛出，调用方需自行决定如何恢复
 * @param data - 解密数据
 * @param secret - 解密密钥
 */
export function decryption(data: string, secret: string = secretKey) {
  const bytes = createCipher(secret).decrypt(hexToBytes(data));
  return JSON.parse(bytesToUtf8(bytes));
}
