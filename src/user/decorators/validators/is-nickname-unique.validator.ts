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
export class IsNickNameUniqueConstraint implements ValidatorConstraintInterface {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    async validate(nickName: string, args: ValidationArguments) {
        if (!nickName) return true; // si es null o vacío, se permite
        const user = await this.userRepository.findOne({ where: { nickName } });
        return !user;
    }

    defaultMessage(args: ValidationArguments) {
        return 'El nick de usuario ya está en uso.';
    }
}

// DTO
export function IsNickNameUnique(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsNickNameUniqueConstraint,
        });
    };
}