import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { validate as isUUID } from 'uuid';

@Injectable()
export class UuidValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    // usamos la liberia interna de Nest para verificar si el valor enviado es un UUID, de ser asi
    // retorna el valor, si no lo es envia la validacion
    if(!isUUID(value)) throw new BadRequestException('El ID enviado no es un UUID válido.');

    return value;
  }
}
