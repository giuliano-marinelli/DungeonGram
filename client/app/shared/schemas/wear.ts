import { Schema } from './schema';

export class Wear extends Schema {
  //schema
  category?: string;
  subcategory?: string;
  name?: string;
  color?: string;

  constructor(schema?) {
    super();

    this.synchronizeSchema(schema);
  }
}
