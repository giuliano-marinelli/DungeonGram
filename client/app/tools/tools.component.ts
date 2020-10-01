import { Component, Input, OnInit } from '@angular/core';
import { Controller } from '../shared/controller/controller';

declare var $;

@Component({
  selector: 'app-tools',
  templateUrl: './tools.component.html',
  styleUrls: ['./tools.component.scss']
})
export class ToolsComponent implements OnInit {
  @Input() controller: Controller;

  tools: any;

  constructor() { }

  ngOnInit(): void {
    this.tools = {
      walls: { name: 'walls', label: 'Walls', image: 'assets/images/tools/walls.png', dropdown: false },
      rule: { name: 'rule', label: 'Rule', image: 'assets/images/tools/rule.png', dropdown: false },
      grid: { name: 'grid', label: 'Grid', image: 'assets/images/tools/grid.png', dropdown: true }
    };

    setTimeout(() => $('[data-toggle-tooltip="tooltip"]').tooltip({ html: true }));
  }

  callTool(tool) {
    this[tool]();
    $('[data-toggle-tooltip="tooltip"]').tooltip('hide');
  }

  toggleActiveTool(tool, toggle) {
    for (let toolKey in this.tools) {
      this.tools[toolKey].active = false;
    }
    tool.active = toggle;
    this.controller.toggleTool(tool, toggle);
  }

  walls() {
    this.toggleActiveTool(this.tools.walls, !this.tools.walls.active);
  }

  rule() {
    this.toggleActiveTool(this.tools.rule, !this.tools.rule.active);
  }

  grid() { }

  gridSize(size) {
    this.controller.send('game', 'tilemap', { width: parseInt(size.width), height: parseInt(size.height) });
  }

}
