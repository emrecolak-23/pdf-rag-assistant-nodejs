import { injectable, singleton } from "tsyringe";
import { EnvConfig } from "@worker/config";
import fs from "fs";
import path from "path";
import os from "os";
import { randomUUID } from "crypto";

@injectable()
@singleton()
export class FileService {
  constructor(private readonly config: EnvConfig) {}

  async withDownload<T>(
    fileId: string,
    fn: (filePath: string) => Promise<T>,
    _ext = ".pdf",
  ): Promise<T> {
    const baseUrl = this.config.PDF_SERVER_URL.replace(/\/$/, "");
    const url = `${baseUrl}/internal/files/${fileId}`;

    const response = await fetch(url, {
      headers: {
        "X-Internal-API-Key": this.config.INTERNAL_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to download file ${fileId}: ${response.status} ${response.statusText}`,
      );
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const tempPath = path.join(
      os.tmpdir(),
      `pdf-${fileId}-${randomUUID()}.pdf`,
    );

    try {
      fs.writeFileSync(tempPath, buffer);
      return await fn(tempPath);
    } finally {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    }
  }
}
