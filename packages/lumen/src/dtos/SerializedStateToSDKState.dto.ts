import R from "ramda";
import * as LuxEngine from "@lux-ai/2021-challenge";
import * as LuxSDK from "@lux-ai-bots/lux-sdk";

const serializedMapToSDKMap = (
  { map: serializedMap }: LuxEngine.SerializedState,
  sdkCities: LuxSDK.City[]
): LuxSDK.GameMap => {
  const newMap = new LuxSDK.GameMap(
    serializedMap.length,
    serializedMap[0].length
  );

  for (let x = 0; x < serializedMap.length; x++) {
    for (let y = 0; y < serializedMap[x].length; y++) {
      const newCell = new LuxSDK.Cell(x, y);
      newCell.resource = serializedMap[y][x].resource || null;
      newCell.road = serializedMap[y][x].road;
      const cityWhichContainsXY = sdkCities.find((city) =>
        city.citytiles.find((tile) => tile.pos.x === x && tile.pos.y === y)
      );
      newCell.citytile =
        cityWhichContainsXY?.citytiles?.find(
          (tile) => tile.pos.x === x && tile.pos.y === y
        ) || null;
      newMap.map[y][x] = newCell;
    }
  }

  return newMap;
};

const createSDKCitiesFromSerializedState = (
  serializedState: LuxEngine.SerializedState
): LuxSDK.City[] => {
  const sdkCities = Object.values(serializedState.cities).map(
    (city): LuxSDK.City => {
      const sdkCity = new LuxSDK.City(
        city.team,
        city.id,
        city.fuel,
        city.lightupkeep
      );
      city.cityCells.forEach((cell) => {
        sdkCity.addCityTile(cell.x, cell.y, cell.cooldown);
      });
      return sdkCity;
    }
  );
  return sdkCities;
};

const getSDKPlayersFromSerializedState = (
  serializedState: LuxEngine.SerializedState,
  sdkCities: LuxSDK.City[]
): LuxSDK.Player[] => {
  return Object.entries(serializedState.teamStates).map(
    ([teamId, teamState]): LuxSDK.Player => {
      const numTeamId = parseInt(teamId, 10);
      const player = new LuxSDK.Player(numTeamId);
      player.units = Object.entries(teamState.units).map(
        ([unitId, unit]): LuxSDK.Unit =>
          new LuxSDK.Unit(
            numTeamId,
            unit.type,
            unitId,
            unit.x,
            unit.y,
            unit.cooldown,
            unit.cargo.wood,
            unit.cargo.coal,
            unit.cargo.uranium
          )
      );
      player.researchPoints = teamState.researchPoints;
      const playerCities = sdkCities.filter(
        (sdkCity) => sdkCity.team.toString() === teamId.toString()
      );
      player.cityTileCount = playerCities.reduce(
        (acc, city) => acc + city.citytiles.length,
        0
      );
      player.cities = new Map(playerCities.map((city) => [city.cityid, city]));
      return player;
    }
  );
};

export const serializedStateToSDKStateDTO = (
  serializedState: LuxEngine.SerializedState
): LuxSDK.GameState => {
  const cities = createSDKCitiesFromSerializedState(serializedState);
  const players = getSDKPlayersFromSerializedState(serializedState, cities);
  return {
    id: serializedState.turn,
    turn: serializedState.turn,
    players,
    map: serializedMapToSDKMap(serializedState, cities),
  };
};
