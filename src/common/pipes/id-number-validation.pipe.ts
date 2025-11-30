import {
  PipeTransform,
  Injectable,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class OnlyNumbersPipe implements PipeTransform {
  transform(value: any) {
    const isOnlyNumbers = /^[0-9]+$/.test(value);

    if (!isOnlyNumbers) {
      throw new BadRequestException(
        'El valor del parámetro debe contener solo números.',
      );
    }

    return Number(value);
  }
}
