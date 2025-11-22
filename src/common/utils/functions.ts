import { randomBytes } from 'crypto';

// genera un codigo alfanumerico de 8 caracteres
export function generateActivationCode() {
    const code = randomBytes(4).toString('hex'); // 8 caracteres
    return code;
}

// genera cantidad de tiempo en minutos      ↓↓↓↓
export function generateTimeExpiration(timeMinutes: number) {
    return new Date(Date.now() + timeMinutes * 60 * 1000);
}

// genera un token aleatorio
export function generateAleatoryToken() {
    return randomBytes(32).toString('hex');
}