import { Schema } from './schema';
import { Message } from './message';

export class Messenger extends Schema {
  //schema
  messages?: Message[];

  constructor(schema, parameters) {
    super(parameters);

    this.synchronizeSchema(schema,
      {
        messages: {
          type: Message, datatype: Array, parameters: (key) => {
            return {
              messenger: this,
              room: parameters.room,
              token: parameters.token,
              controller: parameters.controller,
              id: key
            }
          }
        }
      }
    );
  }

  update(changes) {
    changes?.forEach((change) => {
      switch (change.field) {
        case 'messages':
          this.parameters.controller.updateSetting('messages', this.messages);
          break;
      }
    });
  }
}
