import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class StorageService {

  constructor(
    private readonly configService: ConfigService,
  ) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadAvatar(file: Express.Multer.File, userId: string): Promise<string> {

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream({
        folder: 'avatars',
        public_id: userId,
        overwrite: true,
        transformation: [
          {
            width: 256,
            height: 256,
            crop: 'fill',
            gravity: 'face',
          }
        ],
        format: 'webp',
        quality: 'auto',
      },

        (error, result) => {
          if (error) {
            return reject(error);
          }

          resolve(result!);
        }
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });

    return result.secure_url;
  }

  // retorna una imagen de perfil aleatoria de las subidas al servicio de cloudinary
  async defaultAvatarsPerfil() {

    const result = await cloudinary.search
      .expression('asset_folder="avatars/default-avatars/"')
      .max_results(20)
      .execute();

    const perfilImages = result.resources.map(resource => ({
      id: resource.public_id,
      url: resource.secure_url,
    }));

    const randomImage = perfilImages[Math.floor(Math.random() * perfilImages.length)];

    return randomImage;
  }

}
