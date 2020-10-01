import * as BABYLON from '@babylonjs/core/Legacy/legacy';

export class Schema {
  parameters?: any = {};
  _schema: any;
  _subschemas?: any;
  _parentUpdate?: any = () => { };

  constructor(parameters?) {
    this.parameters = parameters;
  }

  synchronizeSchema(schema, subschemas?) {
    this._schema = schema;
    this._subschemas = subschemas;

    schema.onChange = (changes) => {
      changes.forEach((change) => {
        if (typeof change.value != 'object' && typeof change.value != 'undefined') {
          this[change.field] = change.value;
        } else {
          if (subschemas[change.field].datatype == Object) {
            if (!change.value) {
              this[change.field] = null;
            } else if (!this[change.field]) {
              var itemParameters = { parent: null };
              if (subschemas[change.field].parameters)
                itemParameters = subschemas[change.field].parameters();

              this[change.field] = new subschemas[change.field].type(change.value, itemParameters);

              // if (itemParameters.parent)
              //   this[change.field]._parentUpdate = (changes) => { this.childUpdate(changes, change.field) };
            }
          } else if (subschemas[change.field].datatype == Array) {
            if (!Array.isArray(change.value)) {
              if (!this[change.field]) {
                this[change.field] = [];

                schema[change.field].onAdd = (itemSchema, key) => {
                  // key = key ? key : itemSchema.id;
                  // if (!this[change.field][key]) {
                  var itemParameters = { parent: null };
                  if (subschemas[change.field].parameters)
                    itemParameters = subschemas[change.field].parameters(key);

                  this[change.field][key] = new subschemas[change.field].type(itemSchema, itemParameters);

                  // if (itemParameters.parent)
                  //   this[change.field][key]._parentUpdate = (changes) => { this.childUpdate(changes, change.field) };
                  // }
                }

                schema[change.field].onRemove = (itemSchema, key) => {
                  // console.table(this[change.field]);
                  //BUG: ArraySchema onRemove(key), key received is wrong when the removed element is not the last one
                  if (this[change.field][key] != null) {
                    this[change.field][key].remove();
                  }
                  // if (Array.isArray(change.value))
                  //   this[change.field].pop();
                  // this[change.field].length = this[change.field].length - 1;
                  // else
                  delete this[change.field][key];
                }

                schema[change.field].triggerAll();
              }
            } else {
              if (!this[change.field]) {
                this[change.field] = [];
                change.value.forEach((itemSchema, index) => {
                  if (subschemas[change.field].parameters)
                    itemParameters = subschemas[change.field].parameters();

                  this[change.field].push(new subschemas[change.field].type(itemSchema, itemParameters));
                });
              } else {
                var start;
                var end;
                if (change.value.length > this[change.field].length) { //when array adds element
                  if (subschemas[change.field].parameters)
                    itemParameters = subschemas[change.field].parameters();

                  if (subschemas[change.field].onAdd == 'last') {
                    start = this[change.field].length;
                    end = change.value.length;
                    for (let i = start; i < end; i++) {
                      this[change.field].push(new subschemas[change.field].type(change.value[i], itemParameters));
                    }
                  } else if (subschemas[change.field].onAdd == 'first') {
                    start = change.value.length - this[change.field].length - 1;
                    for (let i = start; i >= 0; i--) {
                      this[change.field].unshift(new subschemas[change.field].type(change.value[i], itemParameters));
                    }
                  }
                } else if (change.value.length < this[change.field].length) { //when array removes element
                  if (subschemas[change.field].onRemove == 'last') {
                    start = this[change.field].length - 1;
                    end = this[change.field].length - change.value.length;
                    for (let i = start; i > end; i--) {
                      this[change.field].pop();
                    }
                  } else if (subschemas[change.field].onRemove == 'first') {
                    end = this[change.field].length - change.value.length;
                    for (let i = 0; i < end; i++) {
                      this[change.field].shift();
                    }
                  }
                }
              }
            }
          }
        }
      });
      this.update(changes);
    }
    schema.triggerAll();
  }

  update(changes) {
    this._parentUpdate(changes);
    //to do on subclass
  }

  childUpdate(changes, childRef) {
    //to do on subclass
  }

  remove() {
    if (this._subschemas) {
      for (var subschemaName in this._subschemas) {
        var subschema = this._subschemas[subschemaName];
        if (subschema.datatype == Object) {
          if (this[subschemaName] != null)
            this[subschemaName].remove();
        } else if (subschema.datatype == Array) {
          this[subschemaName].forEach(function (subschemaItem) {
            if (subschemaItem != null)
              subschemaItem.remove();
          })
        }
      }
    }
    //to extend on subclass
  }
}
