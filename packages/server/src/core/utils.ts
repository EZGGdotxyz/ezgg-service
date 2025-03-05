import { customAlphabet } from "nanoid";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import * as _ from "radash";

dayjs.extend(utc);

const alphabetNumberOnly = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  32
);

const shortCode = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 13);

export const CodeUtil = {
  generateNumberOnlyCode: async () => {
    return alphabetNumberOnly(18);
  },
  generateSortCode: async (size?: number) => {
    return shortCode(size);
  },
};

export function decryptAES(mix: string, secret: string): string {
  const cipher = crypto.createDecipheriv("aes-128-ecb", secret, null);
  const decrypted = cipher.update(mix, "base64", "utf8");
  return decrypted + cipher.final("utf8");
}

export namespace Timezone {
  export const DEFAULT_DATE_F = "YYYY-MM-DD";
  export const DEFAULT_DATE_TIME_F = "YYYY-MM-DD HH:mm:ss.SSS";

  export namespace UTC {
    export function now() {
      return dayjs().utc();
    }
    export function nowDate() {
      return UTC.now().toDate();
    }
    export function at(date: Date) {
      return dayjs(date).utc();
    }
    export function parseDate(date: string) {
      return dayjs(date, DEFAULT_DATE_F).utc();
    }
    export function parseDateTime(date: string) {
      return dayjs(date, DEFAULT_DATE_TIME_F).utc();
    }
    export function formatDate(date: Date, format = DEFAULT_DATE_F) {
      return UTC.at(date).format(format);
    }
    export function formatDateTime(date: Date, format = DEFAULT_DATE_TIME_F) {
      return UTC.at(date).format(format);
    }
  }

  export namespace LOCAL {
    export function now() {
      return dayjs();
    }
    export function at(date: Date) {
      return dayjs(date);
    }
    export function parseDate(date: string) {
      return dayjs(date, DEFAULT_DATE_F);
    }
    export function parseDateTime(date: string) {
      return dayjs(date, DEFAULT_DATE_TIME_F);
    }
    export function formatDate(date: Date, format = DEFAULT_DATE_F) {
      return LOCAL.at(date).format(format);
    }
    export function formatDateTime(date: Date, format = DEFAULT_DATE_TIME_F) {
      return LOCAL.at(date).format(format);
    }
  }
}

export const encodePassword = async (password: string) =>
  (await bcrypt.hash(_.trim(password), 10)) as string;

export const comparePassword = async (
  password: string,
  member: { password: string | null }
) =>
  password &&
  member.password &&
  (await bcrypt.compare(password, member.password));
