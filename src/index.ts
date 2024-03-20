import dotenv from "dotenv";
import { DataTypes, Op, Sequelize } from "sequelize";

dotenv.config();

// Utils
import { generateJWT } from "./utils";
import { decryptPassword } from "./utils/cryptoPassword";
import { getEmployee } from "./db/models/employee";

export let sequelize: any = null;

async function loadSequelize() {
	const sequelize = new Sequelize(
		`mysql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:3306/${process.env.DB_DATABASE}`,
		{
			pool: {
				max: 2,
				min: 0,
				idle: 0,
				acquire: 3000,
				evict: 3000,
			},
		}
	);

	// or `sequelize.sync()`
	await sequelize.authenticate();

	return sequelize;
}

export const handler = async (event: any) => {
	// re-use the sequelize instance across invocations to improve performance
	if (!sequelize) {
		sequelize = await loadSequelize();
	} else {
		// restart connection pool to ensure connections are not re-used across invocations
		sequelize.connectionManager.initPools();

		// restore `getConnection()` if it has been overwritten by `close()`
		if (sequelize.connectionManager.hasOwnProperty("getConnection")) {
			delete sequelize.connectionManager.getConnection;
		}
	}

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

		// const { user: inputUser, password: inputPassword } = JSON.parse(
		// 	event.body
		// );
		const { user: inputUser, password: inputPassword } = event.body;

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

		const Employee = getEmployee(sequelize).Employee;

		// Consulta com duas condições: email OU matrícula
		const employee = await Employee.findOne({
			where: {
				[Op.or]: [
					{ employee_email: inputUser },
					{ employee_registry: inputUser },
				],
			},
		});

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
				const token = generateJWT(secretKey, employee);
				return {
					statusCode: 200,
					body: JSON.stringify({
						token: token,
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
		// Qualquer outro erro de execução
		return {
			statusCode: 500,
			body: JSON.stringify({ message: error }),
		};
	} finally {
		await sequelize.connectionManager.close();
	}
};
