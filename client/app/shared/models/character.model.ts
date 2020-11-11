export class Character {
  // tslint:disable-next-line: variable-name
  _id?: string;
  owner?: string;
  name?: string;
  description?: string;
  wears?: object[];
  height?: number;
  private?: boolean;
  portrait?: string;
}
