import { inject, injectable } from "inversify";
import { Symbols } from "../../identifier.js";
import * as path from "path";
import type { FastifyInstance } from "fastify";
import { createWriteStream, promises as fsPromises } from "fs";
import { pipeline } from "stream/promises";
import { nanoid } from "nanoid";
import dayjs from "dayjs";

@injectable()
export class FileService {
  constructor(
    @inject(Symbols.Fastify) private readonly fastify: FastifyInstance,
    @inject(Symbols.ROOT_PATH) private readonly rootPath: string
  ) {}

  async uploadFile(file: any) {
    const dateDif = dayjs().format("YYYY-MM-DD");
    const uploadDir = path.join(this.rootPath, "public", "uploads", dateDif);

    // 检查并创建 uploadDir 目录
    await fsPromises.mkdir(uploadDir, { recursive: true });

    const fileExt = path.extname(file.filename);
    const fileName = `${nanoid()}${fileExt}`;
    const filePath = path.join(uploadDir, fileName);

    await pipeline(file.file, createWriteStream(filePath));

    return {
      url: `${this.fastify.config.FILE_BASE_URL}/uploads/${dateDif}/${fileName}`,
    };
  }
}
