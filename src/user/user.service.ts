import {
  BadRequestException,
  ConflictException, Injectable,
  InternalServerErrorException, Logger, NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ILike, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { User } from '../user/entities/user.entity';
import { UserType } from '../user/entities/user-type.entity';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangeUserPasswordDto } from './dto/change-password.dto';

import bcrypt from 'bcrypt';
import { EmailService } from '../email/email.service';
import { generateActivationCode, generateTimeExpirationInMinutes } from 'src/common/utils/functions';

@Injectable()
export class UserService {

  private readonly logger = new Logger('UserService');

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(UserType)
    private readonly userTypeRepository: Repository<UserType>,

    private readonly emailService: EmailService,
  ) { }

  async create(createUserDto: CreateUserDto) {
    try {

      const { password, passwordConfirm, ...userData } = createUserDto;

      if (password !== passwordConfirm) throw new BadRequestException('Las contraseñas no coinciden.');

      //                                                              2: duelista
      const userType = await this.userTypeRepository.findOne({ where: { id: 2 } });

      if (!userType) throw new Error('No se encontro el tipo de usuario por defecto.')

      // generacion de codigo de activacion
      const code = generateActivationCode();

      // tiempo de expiracion del codigo     30 minutos
      const expires = generateTimeExpirationInMinutes(30);

      const user = this.userRepository.create({
        ...userData,
        password: bcrypt.hashSync(password, 10),
        activationCode: code,
        activationCodeExpires: expires,
        typeUser: userType,
      });

      await this.userRepository.save(user);
      await this.emailService.sendMail(
        user.email,
        'Bienvenido Duelista - Confirma tu cuenta',
        'welcome',
        {
          name: user.name,
          code: user.activationCode,
        },
      );

      return { ok: true, message: 'Usuario creado. Revisa tu correo para activar la cuenta.' };
    } catch (error) {
      this.handleDBException(error);
    }
  }

  async findAll() {
    try {

      const users = await this.userRepository.createQueryBuilder('user')
        .leftJoin('user.typeUser', 'typeUser')
        .select([
          'user.name',
          'user.lastName',
        ])
        .where('user.typeUserId = :id', { id: 2 })
        .getMany();

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
      ],
    });

    if (!user.length)
      throw new NotFoundException(`El usuario ingresado "${term}" no fue encontrado.`);

    return user;
  }

  async updateUserAccount(id: string, updateUserDto: UpdateUserDto) {

    const { lastName, ...rest } = updateUserDto;

    const user = await this.userRepository.preload({
      id: id,
      ...rest,
      lastName: lastName === '' ? null : lastName,
    });

    if (!user) throw new NotFoundException(`El usuario con el id ${id} no fue encontrado.`);

    await this.userRepository.save(user);

    const userDB = await this.userRepository.findOne({
      where: {
        id: user.id
      },
      relations: ['typeUser', 'gameProfile']
    });

    if (!userDB) throw new UnauthorizedException('Usuario no encontrado.');

    return {
      ok: true,
      message: "Perfil de usuario actualizado correctamente.",
      user: {
        id: userDB.id,
        userName: userDB.name,
        lastName: userDB.lastName,
        email: userDB.email,
        role: userDB.typeUser.id,
        profileId: userDB.gameProfile?.id ?? null,
        nickName: userDB.gameProfile?.nickName ?? null,
        createdAt: userDB.gameProfile?.createdAt ?? null,
        avatarUrl: userDB.gameProfile?.avatarUrl ?? null,
      }
    }
  }

  async verifyAccountActivation(emailUser: string, code: string) {
    const user = await this.userRepository.findOne({
      // para realizar el filtro puede usar el email
      where: [{ email: emailUser }],
      select: ['id', 'email', 'activationCode', 'activationCodeExpires', 'isActive'],
    });

    if (!user) throw new NotFoundException('El correo ingresado no se encuentra registrado.');
    if (user.isActive) throw new BadRequestException('Cuenta ya activada.');

    if (!user.activationCode || user.activationCode !== code)
      throw new BadRequestException('Código de activación inválido.');

    if (!user.activationCodeExpires || user.activationCodeExpires < new Date())
      throw new BadRequestException('Código de activación expirado. Comuniquese con un Administrador para obtener un nuevo código de activación.');

    user.isActive = true;
    user.activationCode = null;
    user.activationCodeExpires = null;

    await this.userRepository.save(user);

    return { ok: true, message: 'Cuenta activada correctamente.' };
  }

  async changePassword(userId: string, changeUserPasswordDto: ChangeUserPasswordDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: {
        id: true,
        password: true,
      }
    });

    if (!user) throw new NotFoundException('Usuario no encontrado.');

    const { currentPassword } = changeUserPasswordDto;

    if (!bcrypt.compareSync(currentPassword, user.password)) {
      throw new UnauthorizedException('La contraseña actual ingresada no coincide con la registrada.');
    }

    const newPassword = changeUserPasswordDto.password;
    const passwordHashed = bcrypt.hashSync(newPassword, 10);

    user.password = passwordHashed;

    await this.userRepository.save(user);

    return { ok: true, message: 'Contraseña cambiada correctamente.' };
  }

  private handleDBException(error: any): never {
    // 💬 Si el error viene de un constraint UNIQUE
    if (error.code === '23505') {
      throw new ConflictException('El campo ingresado ya existe, verificar.');
    }

    // 🪵 Registrar en consola o logs para depuración
    this.logger.error(error);

    // ⚠️ Si no coincide con ninguno de los anteriores
    throw new InternalServerErrorException('Error, revisar los logs del servidor');
  }

}
