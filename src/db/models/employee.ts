import { DataTypes, Model, ModelCtor } from "sequelize";

export function getEmployee(sequelize: any) {
	const Employee: ModelCtor<Model<any, any>> = sequelize.define(
		"employee",
		{
			id: {
				type: DataTypes.STRING,
				autoIncrement: true,
				allowNull: false,
				primaryKey: true,
			},
			employee_name: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			employee_email: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			employee_password: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			employee_registry: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
		},
		{
			timestamps: false,
		}
	);
	
	return {
		Employee
	}
}

