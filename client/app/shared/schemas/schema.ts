import * as BABYLON from '@babylonjs/core/Legacy/legacy';

export class Schema {
  _schema: any;
  _subschemas?: any;
  _parameters?: any;

  constructor() { }

  synchronizeSchema(schema, subschemas?, parameters?) {
    this._schema = schema;
    this._subschemas = subschemas;
    this._parameters = parameters;

    schema.onChange = (changes) => {
      changes.forEach((change) => {
        if (typeof change.value != 'object' && typeof change.value != 'undefined') {
          this[change.field] = change.value;
        } else {
          if (subschemas[change.field].datatype == Object) {
            if (!change.value) {
              this[change.field] = null;
            } else if (!this[change.field]) {
              this[change.field] = new subschemas[change.field].type(change.value, parameters);
            }
          } else if (subschemas[change.field].datatype == Array) {
            if (!this[change.field]) {
              this[change.field] = [];

              schema[change.field].onAdd = (itemSchema, key) => {
                var itemParameters = parameters;
                if (subschemas[change.field].parameters)
                  itemParameters = { ...parameters, ...subschemas[change.field].parameters(key) };

                this[change.field][key] = new subschemas[change.field].type(itemSchema, itemParameters);
              }

              schema[change.field].onRemove = (itemSchema, key) => {
                var itemParameters = parameters;
                if (subschemas[change.field].parameters)
                  itemParameters = { ...parameters, ...subschemas[change.field].parameters(key) };

                if (this[change.field][key]) {
                  this[change.field][key].remove(itemParameters);
                  delete this[change.field][key];
                  if (Array.isArray(change.value))
                    this[change.field].length = this[change.field].length - 1;
                }
              }

              schema[change.field].triggerAll();

            }
          }
        }
      });
      this.update(changes, parameters);
    }
    schema.triggerAll();
  }

  update(changes, parameters?) {
    //to do on subclass
  }

  remove(parameters?) {
    if (this._subschemas) {
      for (var subschemaName in this._subschemas) {
        var subschema = this._subschemas[subschemaName];
        if (subschema.datatype == Object) {
          this[subschemaName].remove(parameters);
        } else if (subschema.datatype == Array) {
          this[subschemaName].forEach(function (subschemaItem) {
            subschemaItem.remove(parameters);
          })
        }
      }
    }
    //to extend on subclass
  }
}
