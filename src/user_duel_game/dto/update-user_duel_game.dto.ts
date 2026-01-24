import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDuelGameDto } from './create-user_duel_game.dto';

export class UpdateUserDuelGameDto extends PartialType(CreateUserDuelGameDto) {}
