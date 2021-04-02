import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Character } from '../shared/models/character.model';

@Injectable()
export class CharacterService {

  constructor(private http: HttpClient) { }

  getCharacters(params?): Observable<Character[]> {
    return this.http.get<Character[]>('/api/characters', { params: params });
  }

  countCharacters(params?): Observable<number> {
    return this.http.get<number>('/api/characters/count', { params: params });
  }

  addCharacter(character: Character): Observable<Character> {
    return this.http.post<Character>('/api/character', character);
  }

  getCharacter(character: Character): Observable<Character> {
    return this.http.get<Character>(`/api/character/${character._id}`);
  }

  getCharacterById(id: string): Observable<Character> {
    return this.http.get<Character>(`/api/character/${id}`);
  }

  editCharacter(character: Character): Observable<any> {
    return this.http.post(`/api/character/${character._id}`, character, { responseType: 'text' });
  }

  deleteCharacter(character: Character): Observable<any> {
    return this.http.delete(`/api/character/${character._id}`, { responseType: 'text' });
  }
}
