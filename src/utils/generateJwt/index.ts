import jwt from "jsonwebtoken";

export const generateJWT = (secretKey: string, employee?: any) => {
	let payload = {};

	if (employee) {
		payload = {
			id: employee.id,
			employee_name: employee.employee_name,
			employee_email: employee.employee_email,
			employee_registry: employee.employee_registry,
		};
	}

	return jwt.sign(payload, secretKey, { expiresIn: 60 * 60 });
};
