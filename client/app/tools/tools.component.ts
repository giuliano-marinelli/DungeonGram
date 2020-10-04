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
  orderedTools: any[];

  constructor() { }

  ngOnInit(): void {
    this.tools = {
      walls: {
        name: 'walls', label: 'Walls', image: 'assets/images/tools/walls.png', dropdown: true,
        options: {
          remove: true,
          adjustToGrid: true
        },
        actions: {
          toggle: () => {
            this.toggleActiveTool(this.tools.walls, !this.tools.walls.active);
            this.controller.send('game', 'wall', { value: this.tools.walls.active, action: 'pickable' });
          },
          remove: (value) => { this.tools.walls.options.remove = value },
          adjustToGrid: (value) => { this.tools.walls.options.adjustToGrid = value },
          visibility: (visibility) => { this.controller.send('game', 'wall', { value: parseFloat(visibility.value), action: 'visibility' }) },
        }
      },
      rule: {
        name: 'rule', label: 'Rule', image: 'assets/images/tools/rule.png',
        actions: {
          toggle: () => { this.toggleActiveTool(this.tools.rule, !this.tools.rule.active) }
        }
      },
      grid: {
        name: 'grid', label: 'Grid', image: 'assets/images/tools/grid.png', dropdown: true,
        actions: {
          gridSize: (size) => { this.controller.send('game', 'tilemap', { width: parseInt(size.width), height: parseInt(size.height), action: 'resize' }) },
          show: (show) => { this.controller.send('game', 'tilemap', { value: show, action: 'show' }) }
        }
      },
      fogOfWar: {
        name: 'fogOfWar', label: 'Fog of War', image: 'assets/images/tools/fogOfWar.png', dropdown: true,
        actions: {
          visibility: (visibility) => { this.controller.send('game', 'fogOfWar', { value: parseFloat(visibility.value), action: 'visibility' }) },
        }
      }
    };

    this.orderedTools = [this.tools.grid, this.tools.walls, this.tools.fogOfWar, this.tools.rule]

    setTimeout(() => $('[data-toggle-tooltip="tooltip"]').tooltip({ html: true }));
  }

  callTool(event, tool) {
    if (this.tools[tool]?.actions?.toggle) this.tools[tool].actions.toggle();
    $('[data-toggle-tooltip="tooltip"]').tooltip('hide');
    event.stopPropagation(); //to stop dropdown work on click (only on hover)
  }

  toggleActiveTool(tool, toggle) {
    for (let toolKey in this.tools) {
      this.tools[toolKey].active = false;
    }
    tool.active = toggle;
    this.controller.toggleTool(tool, toggle);
  }
}
