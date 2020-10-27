export class Campaign {
  // tslint:disable-next-line: variable-name
  _id?: string;
  owner?: string;
  owner_info?: object;
  title?: string;
  description?: string;
  players?: string[];
  players_info?: object[];
  private?: boolean;
  maps?: string[];
  maps_info?: object[];
  openedMap?: string;
  openedMap_info?: object;
}
