import _ from "lodash";
import mongoose from "mongoose";

class DatabaseMigrator {
	constructor(){}

	private isEqual(data: any, updatedData: any): boolean {
		return _.isEqual(data, updatedData);
	}

	private addMissingProperties(data: any, schema: any): any {
		for (const key in schema) {
			const schemaValue: any = schema[key];
			const dataValue: any = data[key];

			if (dataValue === undefined) {
				if (schemaValue.default !== undefined) {
					data[key] = schemaValue.default;
				} else if (schemaValue.type === Object || schemaValue instanceof mongoose.Schema) {
					data[key] = {};

					if (schemaValue.type === Object) {
						this.addMissingProperties(data[key], schemaValue.default);
					} else if (schemaValue instanceof mongoose.Schema) {
						this.addMissingProperties(data[key], schemaValue.obj);
					}
				}
			} else if (schemaValue?.type === Object || schemaValue instanceof mongoose.Schema) {
				if (dataValue !== null) {
					this.addMissingProperties(dataValue, schemaValue.default);
				}
			}
		}
		return data;
	}

	private removeObsoleteProperties(data: any, schema: any): any {
		for (const key in data) {
			const schemaValue: any = schema[key];
			const dataValue: any = data[key];

			if (key === '_id' || key === '__v') continue;

			if (!(key in schema)) {
				delete data[key];
			} else if ((schemaValue?.type === Object || schemaValue instanceof mongoose.Schema) && dataValue !== null) {
				if (schemaValue.type === Object) {
					this.removeObsoleteProperties(dataValue, schemaValue.default || {});
				} else if (schemaValue instanceof mongoose.Schema) {
					this.removeObsoleteProperties(dataValue, schemaValue.obj);
				}
			}
		}
		return data;
	}

	private updateData(data: any, schema: any): any {
		data = this.addMissingProperties(data, schema);
		data = this.removeObsoleteProperties(data.toObject(), schema);
		return data;
	}

	public async migrateData(model: any, uniqueFields: any[]): Promise<number> {
		let count: number = 0;
		const items: any[] = await model.find();

		for (const item of items) {
			const query: any = {};
			uniqueFields.forEach(field => {
				query[field] = item[field];
			});
			const rawData: any = await model.findOne(query).lean();
			const currentData: any = item;
			const updatedData: any = this.updateData(currentData, model.schema.obj);

			if (!this.isEqual(rawData, updatedData)) {
				count++;
				await model.findOneAndDelete(query);
				const newData = new model(updatedData);
				await newData.save();
			}
		}

		return count;
	}

	/**
	 * TODO: example usage: (hoffentlich, nicht getestet bisher)
	 *  this.migrateData(GuildModel, ['id']);
	 *  this.migrateData(UserModel, ['id']);
	 *  this.migrateData(MemberModel, ['id', 'guildID']);
 	 */
}

export { DatabaseMigrator };