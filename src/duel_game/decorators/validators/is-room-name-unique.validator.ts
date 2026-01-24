import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
    registerDecorator,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidationArguments,
} from 'class-validator';
import { DuelGame } from 'src/duel_game/entities/duel-game.entity';
import { Repository } from 'typeorm';


@ValidatorConstraint({ async: true })
@Injectable()
export class IsRoomNameUniqueConstraint implements ValidatorConstraintInterface {
    constructor(
        @InjectRepository(DuelGame)
        private readonly duelGameRepository: Repository<DuelGame>,
    ) { }

    async validate(roomName: string, args: ValidationArguments) {
        const findRoom = await this.duelGameRepository.findOne({ where: { roomName } });
        return !findRoom; // válido solo si NO existe
    }

    defaultMessage(args: ValidationArguments) {
        return 'El nombre de la sala ya está registrado.';
    }
}

// Decorador que usarás en el DTO
export function IsRoomNameUnique(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsRoomNameUniqueConstraint,
        });
    };
}