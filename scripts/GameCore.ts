import { world, system, Player, GameMode, Dimension, Container } from "@minecraft/server"; 
import { EventManager } from "./EventManager";
import { clearArena } from "./ArenaManager";

export class GameCore {
    public curTick: number = 0;
    public score: number = 0;
    public players: Player[] = [];
    public eventManager: EventManager = new EventManager();
    private gameLoopId: number | undefined = undefined;
    private isEndingGame: boolean = false;

    constructor(
        public gameConfig: {
            gameTime: number; // Minutes
            minPlayers: number;
            maxPlayers: number;
            arenaLocation: { x: number; y: number; z: number; dimension: Dimension };
            arenaSize: { x: number; y: number; z: number };
            defaultGamemode: GameMode;
            lobbyLocation: { x: number; y: number; z: number };
        }
    ) {}

    // Start the game loop
    public startGameLoop(tickCallback: (curTick: number) => void) {
        // Reset the ending game flag
        this.isEndingGame = false;

        const runGameTick = () => {
            try {
                this.curTick++;

                // Check end conditions
                const timeLimit = this.gameConfig.gameTime * 60 * 20; // Convert minutes to ticks
                const activePlayers = this.players.filter((player) => player.isValid()).length;

                if (this.curTick >= timeLimit || activePlayers < this.gameConfig.minPlayers) {
                    this.endGame();
                    return; // Stop the loop
                }

                // Execute the tick callback
                tickCallback(this.curTick);

                // Schedule the next tick
                this.gameLoopId = system.runTimeout(runGameTick, 1);
            } catch (error) {
                console.error(`❌ Game tick error: ${error instanceof Error ? error.message : error}`);
                this.endGame();
            }
        };

        // Start the game loop
        this.gameLoopId = system.runTimeout(runGameTick, 1);
        console.log("✅ Game loop started");
    }

    // End the game
    public endGame() {
        // Prevent multiple endGame calls
        if (this.isEndingGame) {
            console.log("⚠️ Game is already ending, ignoring duplicate endGame call");
            return;
        }
        
        // Set flag to prevent duplicate calls
        this.isEndingGame = true;
        console.log("Ending game and cleaning up...");
        
        try {
            // We don't need to explicitly cancel the game loop
            // Just setting the flag and not scheduling the next tick is sufficient
            this.gameLoopId = undefined;

            // Unsubscribe from all events
            this.eventManager.unsubscribeAll();
            console.log("✅ Events unsubscribed");

            // Send a message before processing
            world.sendMessage("Game Over! Cleaning up...");
            
            // First clear the arena (with a small delay to ensure game is stopped)
            system.runTimeout(() => {
                try {
                    // Clear the arena
                    clearArena({
                        x: this.gameConfig.arenaLocation.x - Math.floor(this.gameConfig.arenaSize.x / 2),
                        y: this.gameConfig.arenaLocation.y,
                        z: this.gameConfig.arenaLocation.z - Math.floor(this.gameConfig.arenaSize.z / 2),
                        dimension: this.gameConfig.arenaLocation.dimension
                    }, this.gameConfig.arenaSize);
                    
                    console.log("✅ Arena cleared");
                } catch (arenaError) {
                    console.error(`❌ Error clearing arena: ${arenaError instanceof Error ? arenaError.message : arenaError}`);
                }
                
                // Then reset players (with delay to ensure arena is cleared)
                system.runTimeout(() => {
                    // Create a copy of players array to avoid modification during iteration
                    const playersToReset = [...this.players];
                    console.log(`Resetting ${playersToReset.length} players`);
                    
                    // Reset players one by one with a slight delay between them
                    const resetPlayerAtIndex = (index: number) => {
                        if (index >= playersToReset.length) {
                            // All players processed, finish up
                            console.log("✅ All players processed");
                            
                            // Final confirmation message
                            world.sendMessage("Thanks for playing!");
                            
                            // Reset game state
                            this.resetGameState();
                            return;
                        }
                        
                        const player = playersToReset[index];
                        if (player && player.isValid()) {
                            try {
                                console.log(`Processing player ${player.name}...`);
                                
                                // Clear inventory first
                                this.clearPlayerInventory(player);
                                
                                // Set gamemode
                                // Assuming player.setGameMode is a valid method and 'creative' is a valid game mode value
                                player.setGameMode(GameMode.creative); // Set the player's game mode to creative
                                console.log(`✅ Set gamemode for ${player.name} to creative`);
                                
                                // Teleport player to lobby
                                player.teleport(
                                    { 
                                        x: this.gameConfig.lobbyLocation.x, 
                                        y: this.gameConfig.lobbyLocation.y, 
                                        z: this.gameConfig.lobbyLocation.z 
                                    }, 
                                    { 
                                        dimension: this.gameConfig.arenaLocation.dimension 
                                    }
                                );
                                console.log(`✅ Teleported ${player.name} to lobby`);

                                 // Remove game tags
                                player.removeTag("MTD");

              
                                 // Clear the player's scoreboard for the "score" objective
                                try {
                                    player.runCommand(`scoreboard players reset @a[name="${player.name}"] score`);
                                    console.log(`✅ Cleared scoreboard for ${player.name}`);
                                } catch (error) {
                                    console.error(`❌ Failed to clear scoreboard for ${player.name}: ${error instanceof Error ? error.message : error}`);
                                }
                                
                                // Hide the scoreboard sidebar for the player
                                try {
                                    player.runCommand(`scoreboard objectives setdisplay sidebar`);
                                    console.log(`✅ Removed scoreboard sidebar for ${player.name}`);
                                } catch (error) {
                                    console.error(`❌ Failed to remove scoreboard sidebar for ${player.name}: ${error instanceof Error ? error.message : error}`);
                                }
    
                                
                                // Process next player
                                system.runTimeout(() => resetPlayerAtIndex(index + 1), 5);
                            } catch (playerError) {
                                console.error(`❌ Error resetting player ${player.name}: ${playerError instanceof Error ? playerError.message : playerError}`);
                                // Continue with next player even if one fails
                                system.runTimeout(() => resetPlayerAtIndex(index + 1), 5);
                            }
                        } else {
                            // Skip invalid player
                            system.runTimeout(() => resetPlayerAtIndex(index + 1), 5);
                        }
                    };
                    
                    // Start processing players
                    resetPlayerAtIndex(0);
                    
                }, 10); // Short delay for player processing
            }, 10); // Short delay for arena clearing
            
        } catch (error) {
            console.error(`❌ Error during game cleanup: ${error instanceof Error ? error.message : error}`);
            // Attempt to reset game state even if there was an error
            this.resetGameState();
        }
    }

    // Reset game state
    private resetGameState() {
        this.curTick = 0;
        this.score = 0;
        this.players = [];
        this.isEndingGame = false;
        console.log("✅ Game state reset.");
    }

    // Helper function to clear player inventory
    private clearPlayerInventory(player: Player) {
        try {
            const inventory = player.getComponent("minecraft:inventory") as unknown as Container;
            if (inventory) {
                // Try to clear inventory using a command first for reliability
                try {
                    player.dimension.runCommand(`clear @a[name="${player.name}"]`);
                    console.log(`✅ Cleared inventory for player ${player.name} using command`);
                    return;
                } catch (commandError) {
                    console.error(`❌ Failed to clear inventory with command: ${commandError}`);
                    // Fall back to manual clearing
                }
                
                // Manual inventory clearing
                for (let i = 0; i < inventory.size; i++) {
                    try {
                        inventory.setItem(i, undefined);
                    } catch (slotError) {
                        console.error(`❌ Error clearing inventory slot ${i}: ${slotError instanceof Error ? slotError.message : slotError}`);
                    }
                }
                console.log(`✅ Cleared inventory for player ${player.name} manually`);
            } else {
                console.error(`❌ Could not get inventory component for player ${player.name}`);
            }
        } catch (error) {
            console.error(`❌ Error in clearPlayerInventory: ${error instanceof Error ? error.message : error}`);
        }
    }

}