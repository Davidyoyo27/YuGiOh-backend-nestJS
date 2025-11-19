import { randomBytes } from 'crypto';


export function generateActivationCode() {
    const code = randomBytes(4).toString('hex'); // 8 caracteres
    return code;
}

export function generateTimeExpiration(timeMinutes: number) {
    return new Date(Date.now() + timeMinutes * 60 * 1000);
}