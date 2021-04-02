export class Map {
  _id?: string;
  owner?: string;
  name?: string;
  description?: string;
  walls?: object[];
  tilemap?: object;
  private?: boolean;
  imageUrl?: string;
  terrain?: string;
}
