import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Obtener roles requeridos del decorador
    const requiredRoles = this.reflector.getAllAndOverride<number[]>(
      ROLES_KEY,
      [
        context.getHandler(),
        context.getClass(),
      ],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // No requiere roles
    }

    // 2. Obtener el usuario de la request
    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('Usuario no encontrado.');
    }

    // 3. Comparar roles
    // const userRole = user.typeUser?.type_name;
    const userRole = user.typeUser?.id;

    if (!requiredRoles.includes(userRole)) {
      throw new ForbiddenException(`Acceso denegado, su cuenta no posee los privilegios para acceder.`);
    }

    return true;
  }
}
