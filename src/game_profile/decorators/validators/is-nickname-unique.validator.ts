import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
    registerDecorator,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidationArguments,
} from 'class-validator';
import { GameProfile } from '../../entities/game-profile.entity';
import { Repository } from 'typeorm';


@ValidatorConstraint({ async: true })
@Injectable()
export class IsNickNameUniqueConstraint implements ValidatorConstraintInterface {
    constructor(
        @InjectRepository(GameProfile)
        private readonly gameProfileRepository: Repository<GameProfile>,
    ) { }

    async validate(nickName: string, args: ValidationArguments) {
        if (!nickName) return true; // si es null o vacío, se permite
        // const user = await this.userRepository.findOne({ where: { nickName } });
        const user = await this.gameProfileRepository.findOne({ where: { nickName } });
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