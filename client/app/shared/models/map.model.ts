export class Map {
  _id?: string;
  owner?: string;
  name?: string;
  description?: string;
  walls?: object[];
  characters?: object[];
  tilemap?: object;
  private?: boolean;
}
