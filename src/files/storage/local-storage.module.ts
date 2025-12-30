import { Module } from '@nestjs/common';
import { LocalStorageService } from './local-storage.service';

@Module({
  // exportamos el servicio para subir archivos 
  // de imagen para que otros modulos puedan usarlos
  providers: [LocalStorageService],
  exports: [LocalStorageService]
})
export class LocalStorageModule {}
