import * as LuxEngine from "@lux-ai/2021-challenge";
import * as LuxSDK from "@lux-ai-bots/lux-sdk";

export const luxSDKStateToSerializedTeamState = (
  sdkState: LuxSDK.GameState
): LuxEngine.SerializedState["teamStates"] => {
  const mapped = sdkState.players.map<
    [string, LuxEngine.SerializedState["teamStates"]["0"]]
  >((player) => [
    `${player.team}`,
    {
      researchPoints: player.researchPoints,
      researched: {
        wood: true,
        coal: !!player?.researchedCoal?.(),
        uranium: !!player?.researchedUranium?.(),
      },
      units: player.units.reduce(
        (acc, unit) => ({
          ...acc,
          [unit.id]: {
            cargo: unit.cargo,
            cooldowm: unit.cooldown,
            x: unit.pos.x,
            y: unit.pos.y,
            type: unit.type,
          },
        }),
        {}
      ),
    },
  ]);
  return Object.fromEntries(mapped) as LuxEngine.SerializedState["teamStates"];
};

export const luxSDKStateToSerializedCities = ({
  players,
}: LuxSDK.GameState): LuxEngine.SerializedState["cities"] => {
  const mapped = players.flatMap(({ cities }) =>
    Array.from(cities?.values?.() || []).map((city) => [
      city.cityid,
      {
        cityCells: city.citytiles.map((tile) => ({
          x: tile.pos.x,
          y: tile.pos.y,
          cooldown: tile.cooldown,
        })),
        id: city.cityid,
        fuel: city.fuel,
        lightupkeep: city.getLightUpkeep(),
        team: city.team,
      },
    ])
  );
  return Object.fromEntries(mapped);
};

export const luxSDKStateToSerializedStateDTO = (
  sdkState: LuxSDK.GameState
): LuxEngine.SerializedState => {
  const globalCityIDCount: LuxEngine.SerializedState["globalCityIDCount"] =
    Math.max(
      0,
      ...sdkState.players.flatMap((player) =>
        Array.from(player?.cities?.values?.() || []).map((city) =>
          parseInt(city.cityid.split("_")[1] || "0", 10)
        )
      )
    );
  const globalUnitIDCount: LuxEngine.SerializedState["globalUnitIDCount"] =
    Math.max(
      0,
      ...sdkState.players.flatMap((player) =>
        Array.from(player?.units?.values?.() || []).map((unit) =>
          parseInt(unit.id.split("_")[1] || "0", 10)
        )
      )
    );

  return {
    turn: sdkState.turn,
    globalCityIDCount,
    globalUnitIDCount,
    map: sdkState.map.map,
    teamStates: luxSDKStateToSerializedTeamState(sdkState),
    cities: luxSDKStateToSerializedCities(sdkState),
  };
};
