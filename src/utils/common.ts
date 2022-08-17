import { enc } from 'crypto-js';
import * as CryptoJS from 'crypto-js';

const key = 'tfyscanf';

export const encrypt = (plainText: string): string => {
  const encrypted = CryptoJS.AES.encrypt(plainText, key);
  return encrypted.toString();
};

export const decrypt = (encryptedText: string): string => {
  const decrypted = CryptoJS.AES.decrypt(encryptedText, key);
  return decrypted.toString(enc.Utf8);
};

export class ResponseUtils {
  static getSuccessResponse(data: unknown, message: string): Response {
    const r: Response = {
      status: 'success',
      message: message,
      data: data,
    };

    return r;
  }

  static getErrorResponse(data: unknown, message: string): Response {
    const r: Response = {
      status: 'error',
      message: message,
      data: data,
    };

    return r;
  }
}

export class Response {
  status: 'success' | 'error';
  message: string;
  data: unknown;
}
