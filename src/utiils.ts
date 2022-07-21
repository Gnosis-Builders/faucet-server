import { enc } from 'crypto-js';
import * as CryptoJS from 'crypto-js';

const key = 'tfyscanf';

export const encrypt = (plainText) => {
  const encrypted = CryptoJS.AES.encrypt(plainText, key);
  return encrypted.toString();
};

export const decrypt = (encryptedText) => {
  const decrypted = CryptoJS.AES.decrypt(encryptedText, key);
  return decrypted.toString(enc.Utf8);
};

export class ResponseUtils {
  static getSuccessResponse(data: any, message?: string): Response {
    const r: Response = {
      status: 'success',
      message: message,
      data: data,
    };

    return r;
  }
}

export class Response {
  status: string;
  message: string;
  data: any;
}
