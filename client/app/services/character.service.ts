import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Character } from '../shared/models/character.model';

@Injectable()
export class CharacterService {

  constructor(private http: HttpClient) { }

  getCharacters(own?): Observable<Character[]> {
    return this.http.get<Character[]>('/api/characters', { params: { ...own ? { own: own } : {} } });
  }

  countCharacters(): Observable<number> {
    return this.http.get<number>('/api/characters/count');
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
