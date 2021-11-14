import R from "ramda";
import * as LuxEngine from "@lux-ai/2021-challenge";
import * as LuxSDK from "@lux-ai-bots/lux-sdk";

let index = 1;

export function addCityTileToPlayer(
  player: LuxSDK.Player,
  gameMap: LuxSDK.GameMap,
  x: number,
  y: number,
  cooldown = 0
): LuxSDK.CityTile {
  const city_id = `c_${index}`;
  player.cities.set(city_id, new LuxSDK.City(0, city_id, 120, 100));
  const city = player.cities.get(city_id);
  const cityTile = city.addCityTile(x, y, cooldown);
  gameMap.getCell(cityTile.pos.x, cityTile.pos.y).citytile = cityTile;
  player.cityTileCount += 1;
  index++;
  return cityTile;
}
