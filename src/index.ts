import dotenv from "dotenv";

import { sequelize as database } from "./db/db";
import { Employee } from "./db/models/employee";

dotenv.config();

import { generateJWT } from "./utils";
import { Op } from "sequelize";

export const handler = async (event: any) => {
	try {
		const secretKey = process.env.SECRET_KEY_JWT_TOKEN;
		if (!secretKey || secretKey.trim() === "") {
			throw new Error("Chave secreta JWT não configurada corretamente");
		}

		const user = event.body.user;
		const password = event.body.password;

		// Consulta com duas condições: nome OU matrícula
		const employee = await Employee.findOne({
			where: {
				[Op.or]: [
					{ employee_name: user },
					{ employee_registry: user },
				],
				employee_password: password,
			},
		});
		
		database.close();
		if (employee) {
			return {
				statusCode: 200,
				body: JSON.stringify({
					token: generateJWT(secretKey, employee),
				}),
			};
		} else {
			return {
				statusCode: 404,
				body: JSON.stringify({ message: "Funcionário não encontrado" }),
			};
		}
	} catch (error) {
		console.log(error);
		return {
			statusCode: 500,
			body: JSON.stringify({ message: error }),
		};
	}
};
