// GameInitializer.ts
import { world, Player } from "@minecraft/server";
import { GameSetup } from "./GameManager";

export function initializeGame(
    gameConfig: any,
    gameState: { players: Player[] },
    gameSetup: GameSetup | null
) {
    if (!world) throw new Error("World object is not available.");
    gameState.players = world.getAllPlayers().filter((player) => player.isValid() && !player.hasTag("MTD"));

    if (gameState.players.length === 0) {
        throw new Error("No valid players found to start the game.");
    }

    gameSetup = new GameSetup(
        gameConfig.name,
        gameConfig.description,
        gameConfig.gameTime,
        gameConfig.gameMode,
        gameConfig.dayOrNight,
        gameConfig.difficulty,
        gameConfig.lobbyLocation,
        gameConfig.arenaLocation,
        gameConfig.arenaSize,
        gameConfig.arenaCenter,
        gameConfig.arenaLowerCorner,
        gameConfig.startingInventory
    );

    if (!gameSetup) {
        throw new Error("Failed to initialize GameSetup.");
    }

    gameSetup.startGame(gameState.players);
}