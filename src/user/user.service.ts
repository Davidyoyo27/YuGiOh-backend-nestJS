import {
  ConflictException, Injectable,
  InternalServerErrorException, Logger, NotFoundException,
  UnauthorizedException
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ILike, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { User } from './entities/user.entity';

import bcrypt from 'bcrypt';

@Injectable()
export class UserService {

  private readonly logger = new Logger('UserService');

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  async create(createUserDto: CreateUserDto) {
    try {

      const { password, passwordConfirm, ...userData } = createUserDto;

      const user = this.userRepository.create({
        ...userData,
        password: bcrypt.hashSync(password, 10),
        nickName: createUserDto.nickName || null,
      });

      await this.userRepository.save(user);

      return { ok: true, user };
    } catch (error) {
      this.handleDBException(error);
    }
  }

  async findAll() {
    try {

      const users = await this.userRepository.find();

      return users;
    } catch (error) {
      this.handleDBException(error);
    }
  }

  // funcion no retornara solo un registro si segun las coincidencias que encuentre
  async findOne(term: string) {

    // const queryBuilder = this.userRepository.createQueryBuilder('user');
    // // LIKE vs ILIKE
    // // LIKE = Compara cadenas respetando mayúsculas y minúsculas EJ: 'Carlos' ≠ 'carlos'
    // // ILIKE = Compara cadenas ignorando mayúsculas y minúsculas EJ: 'Carlos' = 'carlos'
    // const user = await queryBuilder.where('UPPER(user.name) ILIKE :name or UPPER(user.nickName) ILIKE :nickName', {
    //   name: `%${term.toUpperCase()}%`,
    //   nickName: `%${term.toUpperCase()}%`,
    // }).getMany(); // recordar que si quieres que te retorne solo un resultado debes usar getOne() no getMany()

    const user = await this.userRepository.find({
      where: [
        { name: ILike(`%${term}%`) },
        { nickName: ILike(`%${term}%`) },
      ],
    });

    if (!user.length)
      throw new NotFoundException(`El usuario ingresado "${term}" no fue encontrado.`);

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {

    const { nickName, lastName, ...rest } = updateUserDto;

    const user = await this.userRepository.preload({
      id: id,
      ...rest,
      lastName: lastName === '' ? null : lastName,
      nickName: nickName === '' ? null : nickName,
    });

    if (!user) throw new NotFoundException(`El usuario con el id ${id} no fue encontrado.`);

    return this.userRepository.save(user);
  }
  
  private handleDBException(error: any): never {
    // 💬 Si el error viene de un constraint UNIQUE
    if (error.code === '23505') {
      throw new ConflictException('No se pudo crear usuario, registro duplicado, verificar.');
      // throw new ConflictException('El correo ingresado ya existe.');
    }

    // 🪵 Registrar en consola o logs para depuración
    this.logger.error(error);

    // ⚠️ Si no coincide con ninguno de los anteriores
    throw new InternalServerErrorException('Error, revisar los logs del servidor');
  }

}
