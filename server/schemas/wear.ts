import { Schema, type } from "@colyseus/schema";

export class Wear extends Schema {
  @type("string")
  category: string;
  @type("string")
  subcategory: string;
  @type("string")
  name: string;
  @type("string")
  color: string;

  constructor(category: string, subcategory: string, name: string, color: string) {
    super();
    this.category = category;
    this.subcategory = subcategory;
    this.name = name;
    this.color = color;
  }
}
