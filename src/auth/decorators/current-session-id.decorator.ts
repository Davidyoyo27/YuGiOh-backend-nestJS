import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const CurrentSessionId = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        // 1-. Obtener el request HTTP
        const request = ctx.switchToHttp().getRequest();
        const sessionId = request.user.sessionId;

        // 2-. Retornar la id de la sesion del usuario
        return sessionId;
    }
);