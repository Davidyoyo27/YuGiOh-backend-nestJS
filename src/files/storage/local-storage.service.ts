import { Injectable } from '@nestjs/common';
import sharp from 'sharp';
import path, { join } from 'path';
import fs from 'fs';

@Injectable()
export class LocalStorageService {

    private uploadRoot = path.join(process.cwd(), 'uploads');

    // funcion que realiza la subida del archivo de imagen
    async uploadAvatar(buffer: Buffer, fileName: string): Promise<string> {
        const avatarDir = join(this.uploadRoot, 'avatars');

        if (!fs.existsSync(avatarDir)) {
            fs.mkdirSync(avatarDir, { recursive: true });
        }

        const finalPath = path.join(avatarDir, fileName);

        await sharp(buffer)
            .resize(256, 256)
            .webp({ quality: 80 })
            .toFile(finalPath);

        return `/uploads/avatars/${fileName}`;
    }
}
