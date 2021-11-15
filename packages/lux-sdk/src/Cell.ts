import { Position } from "./Position";
import { CityTile } from "./CityTile";
import { GameMap } from "./GameMap";

export interface Resource {
  type: string;
  amount: number;
}

export class Cell {
  public pos: Position;
  public resource: Resource = null;
  public citytile: CityTile = null;
  public road = 0;

  public constructor(x: number, y: number) {
    this.pos = new Position(x, y);
  }

  public hasResource(): boolean {
    return this.resource !== null && this.resource.amount > 0;
  }

  public isOnMapBorder(gameMap: GameMap,  border: "left" | "right"  | "top" | "bottom"): boolean {
    switch (border) {
      case "left":
        return this.pos.x === 0;
      case "right":
        return this.pos.x === gameMap.width - 1;
      case "top":
        return this.pos.y === gameMap.height - 1;
      case "bottom":
        return this.pos.y === 0;
      default:
        throw new Error("invalid border");
    }
  }
}
