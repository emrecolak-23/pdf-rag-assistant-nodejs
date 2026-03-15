import { injectable, singleton } from 'tsyringe';
import { EnvConfig } from '@pdf/config';
import fs from 'fs';
import path from 'path';

@injectable()
@singleton()
export class FileService {
  private readonly publicPath: string;

  constructor(private readonly config: EnvConfig) {
    this.publicPath = path.resolve(this.config.PUBLIC_PATH);
  }

  async saveToLocal(localFilePath: string, fileId: string, ext = '.pdf'): Promise<void> {
    if (!fs.existsSync(this.publicPath)) {
      fs.mkdirSync(this.publicPath, { recursive: true });
    }

    const destPath = path.join(this.publicPath, `${fileId}${ext}`);
    fs.copyFileSync(localFilePath, destPath);
  }

  getLocalPath(fileId: string, ext = '.pdf'): string {
    return path.join(this.publicPath, `${fileId}${ext}`);
  }

  createDownloadUrl(fileId: string): string {
    return `/api/files/${fileId}`;
  }
}
