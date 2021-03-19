import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Character } from '../shared/models/character.model';

@Injectable()
export class CharacterService {

  constructor(private http: HttpClient) { }

  getCharacters(own?, page?, count?): Observable<Character[]> {
    return this.http.get<Character[]>('/api/characters',
      { params: { ...own ? { own: own } : {}, ...page ? { page: page } : {}, ...count ? { count: count } : {} } }
    );
  }

  countCharacters(own?): Observable<number> {
    return this.http.get<number>('/api/characters/count', { params: { ...own ? { own: own } : {} } });
  }

  addCharacter(character: Character): Observable<Character> {
    return this.http.post<Character>('/api/character', character);
  }

  getCharacter(character: Character): Observable<Character> {
    return this.http.get<Character>(`/api/character/${character._id}`);
  }

  editCharacter(character: Character): Observable<any> {
    return this.http.put(`/api/character/${character._id}`, character, { responseType: 'text' });
  }

  deleteCharacter(character: Character): Observable<any> {
    return this.http.delete(`/api/character/${character._id}`, { responseType: 'text' });
  }
}
