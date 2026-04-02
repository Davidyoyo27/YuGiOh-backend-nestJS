import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { User } from 'src/user/entities/user.entity';
import { UserType } from 'src/user/entities/user-type.entity';
import { UserSessions } from 'src/auth/entities/user-sessions.entity';
import { LoginAttempts } from 'src/auth/entities/login-attempts.entity';
import { IpRateLimit } from 'src/auth/entities/login-ip-rate-limit.entity';

import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { UpdateUserDto } from 'src/user/dto/update-user.dto';
import { SuperAdminResponseDto } from './dto/superadmin-response.dto';
import { UpdateUserByAdminDto } from 'src/admin/dto/update-user-by-admin.dto';
import { UserResponseDto } from 'src/user/dto/user-response.dto';

import { plainToInstance } from 'class-transformer';
import { EmailService } from 'src/email/email.service';
import { generateActivationCode, generateTimeExpirationInMinutes } from 'src/common/utils/functions';
import bcrypt from 'bcrypt';

@Injectable()
export class SuperadminService {

  private readonly logger = new Logger('UserService');

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(UserType)
    private readonly userTypeRepository: Repository<UserType>,

    @InjectRepository(UserSessions)
    private readonly userSessionRepository: Repository<UserSessions>,

    @InjectRepository(LoginAttempts)
    private readonly userLoginAttemptsRepository: Repository<LoginAttempts>,

    @InjectRepository(IpRateLimit)
    private readonly ipRateLimitRepository: Repository<IpRateLimit>,

    private readonly emailService: EmailService,
  ) { }

  async createSuperAdmin(createUserDto: CreateUserDto) {
    try {

      const { password, passwordConfirm, ...userData } = createUserDto;

      const userType = await this.userTypeRepository.findOne({ where: { id: 4 } });

      if (!userType) throw new Error('No se encontro el tipo de usuario por defecto.');

      const code = generateActivationCode();
      const expires = generateTimeExpirationInMinutes(15);

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
        'Bienvenido SuperAdministrador - ACCESO DE NIVEL Ω CONCEDIDO - Confirma tu cuenta',
        'account-superadmin',
        {
          name: user.name,
          code: user.activationCode,
        }
      );

      return { ok: true, message: 'SuperAdmin creado correctamente.' };
    } catch (error) {
      this.handleDBException(error);
    }
  }

  async createAdmin(createUserDto: CreateUserDto) {
    try {

      const { password, passwordConfirm, ...userData } = createUserDto;

      const userType = await this.userTypeRepository.findOne({ where: { id: 3 } });

      if (!userType) throw new Error('No se encontro el tipo de usuario por defecto.');

      const code = generateActivationCode();
      const expires = generateTimeExpirationInMinutes(15);

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
        'Bienvenido Administrador - Control Concedido sobre Insectos - Confirma tu cuenta',
        'account-admin',
        {
          name: user.name,
          code: user.activationCode,
        }
      );

      return { ok: true, message: 'Administrador creado correctamente.' };
    } catch (error) {
      this.handleDBException(error);
    }
  }

  // findAll() con filtros por tipo de usuario, 
  // trae todos los usuarios con o sin filtro de "tipo de usuario"
  async findAll(typeUserIds?: number[]) {
    try {
      // SOLO estos ids del typeUser son posibles consultarlos
      const allowed = [2, 3];

      let finalIds: number[];

      // si el usuario PASA FILTROS, usarlos
      if (typeUserIds && typeUserIds.length > 0) {
        // filtrar solo roles permitidos
        finalIds = typeUserIds.filter(id => allowed.includes(id));

        // si despues del filtro no queda ninguno forzar [2, 3] por seguridad
        if (finalIds.length === 0) finalIds = allowed;

      } else {
        // Si el usuario no mando filtros, solo 2 y 3 se ocuparan por defecto
        finalIds = allowed;
      }

      const users = await this.userRepository.createQueryBuilder('user')
        .leftJoin('user.typeUser', 'typeUser')
        .select([
          'user.email',
          'user.name',
          'user.lastName',
          'user.isActive',
          'typeUser.typeName',
        ])
        .where('user.typeUserId IN (:...id)', { id: finalIds })
        .getMany();

      return users;
    } catch (error) {
      this.handleDBException(error);
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {

    const { lastName, passwordConfirm, ...restData } = updateUserDto;

    const user = await this.userRepository.preload({
      id,
      ...restData,
      lastName: lastName === '' ? null : lastName,
    });

    if (!user) throw new NotFoundException('Usuario no encontrado.');

    const userModified = this.userRepository.save(user);

    // devolvemos solo los campos que se desean visualizar
    return plainToInstance(SuperAdminResponseDto, userModified, {
      // habilita el @Expose() en el responseDTO
      excludeExtraneousValues: true,
    });
  }

  async blockUserAccount(id: string, updateUserByAdminDto: UpdateUserByAdminDto) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) throw new NotFoundException(`El usuario con el id ${id} no existe.`);
    if (user?.typeUser.id === 4) throw new BadRequestException('No es posible modificar este usuario');

    user.isActive = updateUserByAdminDto.isActive;
    await this.userRepository.save(user);

    // devolvemos solo los campos que se desean visualizar
    return plainToInstance(UserResponseDto, user, {
      // habilita el @Expose() en el responseDTO
      excludeExtraneousValues: true,
    });
  }

  async userFinishAllActiveSession(idUser: string) {

    await this.userSessionRepository.update(
      { user: { id: idUser }, status: true }, // condicion
      { status: false }                       // actualizacion
    )

    return { message: 'Todas las sesiones del usuario han sido cerradas.' };
  }

  async userFinishActiveSession(idSession: number) {

    const session = await this.userSessionRepository.findOne({ where: { id: idSession } });

    if (!session) throw new NotFoundException('La sesion no existe.');
    if (session.status === false) throw new NotFoundException('La sesion ingresada ya se encuentra cerrada.');

    session.status = false;
    await this.userSessionRepository.save(session);

    return {
      ok: true,
      message: 'Sesion finalizada correctamente.',
      sessionId: idSession,
    }
  }

  // traer lista de intentos de login de los usuarios
  async getAllLoginAttempts() {

    const usersLoginAttempts = await this.userLoginAttemptsRepository.createQueryBuilder('login-attempts')
      .leftJoin('login-attempts.user', 'user')
      .select([
        'login-attempts.attempts',
        'login-attempts.lastAttemptAt',
        'login-attempts.lockedUntil',
        'user.name',
        'user.lastName',
        'user.email',
      ])
      .getMany();

    return usersLoginAttempts;
  }

  // traer la lista de IPs con intentos de login
  async getAllLoginAttemptsByIP() {
    return await this.ipRateLimitRepository.find({
      select: ['ip', 'attempts', 'lockLevel', 'lastAttemptAt', 'lockedUntil', 'createdAt']
    });
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
