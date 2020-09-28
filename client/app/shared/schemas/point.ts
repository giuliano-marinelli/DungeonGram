import { Schema } from './schema';

export class Point extends Schema {
  //schema
  x?: number = 0;
  y?: number = 0;

  constructor(schema?) {
    super();

    this.synchronizeSchema(schema);
  }
}
