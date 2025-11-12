import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsOnlyLetters(message?: string, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isOnlyLetters',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          return typeof value === 'string' && /^[a-zA-ZáéíóúÁÉÍÓÚñÑ]+$/.test(value);
        },
        defaultMessage() {
          // 👇 Usa el mensaje recibido o uno por defecto
          return message || 'Este campo solo puede contener letras';
        },
      },
    });
  };
}