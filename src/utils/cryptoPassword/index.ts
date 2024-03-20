import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const password_key = process.env.SECRET_KEY_JWT_TOKEN + "";

// Função para criptografar o password
export function encryptPassword(password: string) {
	const hash = crypto
		.pbkdf2Sync(password, password_key, 100000, 32, "sha256")
		.toString("hex");
	return { hash };
}

// Função para descriptografar o password
export function decryptPassword(password: string, hash: string) {
	const hashedPassword = crypto
		.pbkdf2Sync(password, password_key, 100000, 32, "sha256")
		.toString("hex");
	return hash === hashedPassword;
}
