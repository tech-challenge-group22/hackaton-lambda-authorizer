import dotenv from "dotenv";
import { Op } from "sequelize";

dotenv.config();

// Database
import { sequelize as database } from "./db/db";
import { Employee } from "./db/models/employee";

// Utils
import { generateJWT } from "./utils";
import { decryptPassword } from "./utils/cryptoPassword";

export const handler = async (event: any) => {
	try {
		// Valida secretKey para gerar JWT
		const secretKey = process.env.SECRET_KEY_JWT_TOKEN;
		if (!secretKey || secretKey.trim() === "") {
			throw new Error("Chave secreta JWT não configurada corretamente");
		}

		// Se não tiver preenchido o body da requisição corretamente
		if (event.body === undefined || event.body === null) {
			return {
				statusCode: 500,
				body: JSON.stringify({ message: "Campos não informados" }),
			};
		}

		const { user: inputUser, password: inputPassword } = JSON.parse(
			event.body
		);
		// const { user: inputUser, password: inputPassword } = event.body;

		if (
			inputUser === "" ||
			inputUser === undefined ||
			inputPassword === "" ||
			inputPassword === undefined
		) {
			return {
				statusCode: 500,
				body: JSON.stringify({ message: "Campos não informados" }),
			};
		}

		// Consulta com duas condições: email OU matrícula
		const employee = await Employee.findOne({
			where: {
				[Op.or]: [
					{ employee_email: inputUser },
					{ employee_registry: inputUser },
				],
			},
		});

		// Fecha conexão com banco de dados
		await database.close();

		// Se encontrou employee
		if (employee) {
			// Pega password do employee encontrado no database
			const databaseEmployeePassword =
				employee?.getDataValue("employee_password");

			// Verifica se a senha corresponde com o input
			const match = decryptPassword(
				inputPassword,
				databaseEmployeePassword
			);

			// Se senha VÁLIDA retorna JWT
			if (match) {
				return {
					statusCode: 200,
					body: JSON.stringify({
						token: generateJWT(secretKey, employee),
					}),
				};
			} else {
				// Se senha INVÁLIDA retorna erro
				return {
					statusCode: 401,
					body: JSON.stringify({
						message: "Usuário ou senha inválidos",
					}),
				};
			}
		} else {
			// Se não encontrou usuário
			return {
				statusCode: 404,
				body: JSON.stringify({ message: "Usuário não encontrado" }),
			};
		}
	} catch (error) {
		console.log(error);
		// Qualquer outro erro de execução
		return {
			statusCode: 500,
			body: JSON.stringify({ message: error }),
		};
	}
};
