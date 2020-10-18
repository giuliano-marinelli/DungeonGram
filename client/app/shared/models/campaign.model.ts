import { User } from './user.model';

export class Campaign {
  // tslint:disable-next-line: variable-name
  _id?: string;
  owner?: string;
  title?: string;
  description?: string;
  players: string[];
  private: boolean;
}
