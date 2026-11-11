import {
  BadRequestException, ConflictException, Injectable,
  InternalServerErrorException, Logger, NotFoundException
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { generateActivationCode, generateTimeExpirationInMinutes } from 'src/common/utils/functions';
import { EmailService } from '../email/email.service';
import { UpdateUserByAdminDto } from './dto/update-user-by-admin.dto';
import { UserResponseDto } from 'src/user/dto/user-response.dto';
import { plainToInstance } from 'class-transformer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminService {

  private readonly logger = new Logger('UserService');

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly emailService: EmailService,

    private readonly configService: ConfigService,
  ) { }

  async findAllUsersAdmin() {
    try {

      const users = await this.userRepository.createQueryBuilder('user')
        .leftJoin('user.typeUser', 'typeUser')
        .select([
          'user.id',
          'user.email',
          'user.name',
          'user.lastName',
          'user.isActive',
          'typeUser.typeName'
        ])
        .where('user.typeUserId = :id', { id: 2 })
        .getMany();

      return users;
    } catch (error) {
      this.handleDBException(error);
    }
  }

  async resendActivationEmail(id: string) {
    const user = await this.userRepository.findOneBy({ id });

    if (!user) throw new NotFoundException('Usuario no encontrado.');
    if (user.isActive) throw new BadRequestException('Cuenta ya activada.');

    // generar el codigo
    const newCode = generateActivationCode();
    // asignar tiempo de expiracion
    const newTimeExpiration = generateTimeExpirationInMinutes(30);

    user.activationCode = newCode;
    user.activationCodeExpires = newTimeExpiration;

    await this.userRepository.save(user);

    // Obtener URL del frontend desde la configuración.
    const frontendUrl = this.configService.get<string>('frontend.url');

    if (!frontendUrl) throw new Error('La variable FRONTEND_URL no está configurada.');

    // Construir enlace de activación.
    const activationUrl = `${frontendUrl.replace(/\/$/, '')}/account_activation?code=${encodeURIComponent(newCode)}`;

    await this.emailService.sendMail(
      user.email,
      'Bienvenido Duelista - Reenvío de código activación de cuenta',
      'resend-email-activation',
      {
        name: user.name,
        code: user.activationCode,
        activationUrl,
      },
    );

    return { ok: true, message: 'Correo de activación reenviado.' }
  }

  async blockUserAdmin(id: string, updateUserByAdminDto: UpdateUserByAdminDto): Promise<UserResponseDto> {

    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`El usuario con id ${id} no existe.`);
    }

    // modificamos solo el campo recibido
    user.isActive = updateUserByAdminDto.isActive;
    // guardamos los cambios
    await this.userRepository.save(user);

    // devolvemos solo los campos que se desean visualizar
    return plainToInstance(UserResponseDto, user, {
      // habilita el @Expose() en el responseDTO
      excludeExtraneousValues: true,
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
