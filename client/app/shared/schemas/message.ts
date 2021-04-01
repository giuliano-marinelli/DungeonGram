import { Schema } from './schema';

export class Message extends Schema {
  //schema
  user?: string;
  username?: string;
  content?: string;
  date?: number;

  constructor(schema?) {
    super();

    this.synchronizeSchema(schema);
  }

}
