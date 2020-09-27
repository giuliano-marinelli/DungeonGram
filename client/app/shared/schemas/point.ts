export class Point {
  //schema
  x?: number = 0;
  y?: number = 0;

  constructor(schema?) {
    schema.onChange = (changes) => {
      changes.forEach((change) => {
        switch (change.field) {
          case 'x': case 'y':
            this[change.field] = change.value;
            break;
        }
      });
    }
    schema.triggerAll();
  }
}
