import { Component, OnInit } from '@angular/core';
import * as Colyseus from "colyseus.js";

declare var DungeonEditor;

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    var editor = new DungeonEditor({
      selector: 'editor'
    });
  }

}
