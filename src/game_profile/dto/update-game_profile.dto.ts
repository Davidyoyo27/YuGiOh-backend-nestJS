import { PartialType } from '@nestjs/mapped-types';
import { CreateGameProfileDto } from './create-game_profile.dto';

export class UpdateGameProfileDto extends PartialType(CreateGameProfileDto) {}
