import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
    registerDecorator,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidationArguments,
} from 'class-validator';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';


@ValidatorConstraint({ async: true })
@Injectable()
export class IsEmailUniqueConstraint implements ValidatorConstraintInterface {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    async validate(email: string, args: ValidationArguments) {
        const user = await this.userRepository.findOne({ where: { email } });
        return !user; // válido solo si NO existe
    }

    defaultMessage(args: ValidationArguments) {
        return 'El correo electrónico ya está registrado.';
    }
}

// Decorador que usarás en el DTO
export function IsEmailUnique(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsEmailUniqueConstraint,
        });
    };
}