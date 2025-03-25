import { world, system, GameMode, Dimension, Player, ItemStack, EntityInventoryComponent, DisplaySlotId } from "@minecraft/server";
import { LevelManager } from "./LevelManager";
import { PlayerManager } from "./PlayerManager";
import { setupScoreboard, updatePlayerScore, resetScoreboard } from "./ScoreManager";
import { EventManager } from "./EventManager";
import { clearArena, setupArena } from "./ArenaManager";
import { setWorldSettings } from "./WorldManager";

export class GameCore {
    // Game state
    public score = 0;
    public totalScore = 0; // Track cumulative score across levels
    public lives: number;
    public currentLevelIndex = 0;
    public players: Player[] = [];
    public remainingTime: number = 0;
    private onGameEnd?: () => void;

    // Managers
    public eventManager = new EventManager();
    private levelManager: LevelManager;
    private playerManager: PlayerManager;

    // Game loop and timeout IDs
    private gameInterval?: number;
    private levelTimeout?: number;

    // In GameCore.ts constructor
    constructor(
        public config: {
            name: string;
            levelConfigurations: any[];
            arenaLocation: { x: number; y: number; z: number; dimension: Dimension };
            arenaSize: { x: number; y: number; z: number };
            arenaSettings: {
                includeWalls: boolean;
                includeFloor: boolean;
                includeRoof: boolean;
                lighting?: boolean;
            };
            lobbyLocation: { x: number; y: number; z: number };
            startingInventory: Array<{ item: string; count: number }>;
            defaultGamemode: GameMode;
            minPlayers: number;
            lives: number;
            scoreboardConfig: { objectiveId: string; displayName: string };
            respawnStrategy?: 'instant' | 'delayed';
            playerTag: string;
        },
        onGameEnd?: () => void
    ) {
        this.lives = config.lives;
        this.onGameEnd = onGameEnd;
        this.levelManager = new LevelManager(this);
        this.playerManager = new PlayerManager(this);
    }

    public startGame() {
        this.levelManager.preGameCleanup();
        
        setWorldSettings("gameStart");
        clearArena(this.config.arenaLocation, this.config.arenaSize);
        setupArena(
            { x: this.config.arenaLocation.x, y: this.config.arenaLocation.y, z: this.config.arenaLocation.z },
            this.config.arenaSize,
            this.config.arenaSettings
        );
    
        this.initializePlayers();
        setupScoreboard(this.config.scoreboardConfig.objectiveId, this.config.scoreboardConfig.displayName);
        this.registerEventHandlers();
        this.startLevel();
    }

    private initializePlayers() {
        this.players = world.getAllPlayers().filter(p => p.hasTag("MTD"));
        this.players.forEach(player => {
            system.run(() => {
                const inventory = player.getComponent("minecraft:inventory") as EntityInventoryComponent;
                
                if (inventory?.container) {
                    inventory.container.clearAll();
                    this.config.startingInventory.forEach(item => {
                        const itemStack = new ItemStack(item.item, item.count);
                        inventory.container?.addItem(itemStack);
                    });
                } else {
                    console.error("Failed to access player inventory container");
                }

                player.runCommand(`gamemode ${this.config.defaultGamemode}`);
                // In GameCore.ts - initializePlayers
                const spawnPoint = {
                    x: this.config.arenaLocation.x,
                    y: this.config.arenaLocation.y + 2,
                    z: this.config.arenaLocation.z
                };

                player.teleport(spawnPoint, {
                    dimension: this.config.arenaLocation.dimension // Dimension passed separately
                });


                player.runCommand("scoreboard players add @s mtd_diamonds 0");
            });
        });
    }

    private registerEventHandlers() {
        this.eventManager.subscribe(world.beforeEvents.playerBreakBlock, (event) => {
            if (event.block.typeId === this.currentLevel.blockToBreak) {
                this.handleBlockBreak(event.player);
            }
        });

        this.eventManager.subscribe(world.afterEvents.entityDie, (event) => {
            if (event.deadEntity instanceof Player && this.players.includes(event.deadEntity)) {
                this.handlePlayerDeath(event.deadEntity);
            }
        });

        this.eventManager.subscribe(world.afterEvents.playerSpawn, (event) => {
            if (this.players.includes(event.player)) {
                this.checkPlayerBounds(event.player);
            }
        });
        
        // Periodic boundary check
        this.eventManager.subscribe(system.afterEvents.scriptEventReceive, () => {
            this.players.forEach(player => this.checkPlayerBounds(player));
        });
    }    
    
    private checkPlayerBounds(player: Player) {
        const arena = this.config.arenaLocation;
        const size = this.config.arenaSize;
        
        const playerLoc = player.location;
        const xMin = arena.x - size.x/2;
        const xMax = arena.x + size.x/2;
        const zMin = arena.z - size.z/2;
        const zMax = arena.z + size.z/2;
        
        if (playerLoc.x < xMin || playerLoc.x > xMax || 
            playerLoc.z < zMin || playerLoc.z > zMax) {
            // Teleport player back to arena center
            // In GameCore.ts - checkPlayerBounds
            player.teleport(
                {
                    x: arena.x,
                    y: arena.y + 2,
                    z: arena.z
                },
                {
                    dimension: arena.dimension
                }
            );
            player.sendMessage("§cStay in the arena!");
        }
    }
    
    // GameCore.ts - Update handleBlockBreak
    private handleBlockBreak(player: Player) {
        system.run(() => {
            this.score++;
            this.totalScore++;
            updatePlayerScore(player, this.config.scoreboardConfig.objectiveId, 1);
            // Spawn a new target block after each break
            this.levelManager.spawnTargetBlock(this.config.arenaLocation.dimension);
            
            if (this.score >= this.currentLevel.goal) {
                this.nextLevel();
            }
        });
    }

        // In GameCore.ts - Update handlePlayerDeath
    private handlePlayerDeath(player: Player) {
        this.lives--;
        const deathLocation = player.location;
        
        if (this.lives > 0) {
            system.runTimeout(() => {
                this.playerManager.respawnPlayer(player);
                // Clear items around death location
                player.dimension.runCommandAsync(
                    `kill @e[type=item,x=${deathLocation.x},y=${deathLocation.y},z=${deathLocation.z},dx=5,dy=5,dz=5]`
                );
            }, 20);
        } else {
            this.endGame();
        }
    }

    get currentLevel() {
        return this.config.levelConfigurations[this.currentLevelIndex];
    }

    private startLevel() {
        this.remainingTime = this.currentLevel.gameTime * 20; // Convert seconds to ticks
        
            // Show level title
        this.players.forEach(player => {
            player.onScreenDisplay.setTitle({
                rawtext: [
                    { text: `§eLevel ${this.currentLevelIndex + 1}\n` },
                    { text: `§f${this.currentLevel.description}` }
                ]
            });
        });

        this.players.forEach(player => {
            player.sendMessage(`§eStarting Level ${this.currentLevelIndex + 1}: §f${this.currentLevel.description}`);
        });

        if (this.gameInterval) system.clearRun(this.gameInterval);
        if (this.levelTimeout) system.clearRun(this.levelTimeout);

        this.levelManager.initializeLevel();
        this.gameInterval = system.runInterval(() => this.gameTick(), 20);
        this.levelTimeout = system.runTimeout(() => this.handleLevelTimeout(), this.remainingTime);
    }

    private gameTick() {
        if (this.remainingTime <= 0) return;
        
        this.remainingTime -= 20;
        const totalSeconds = Math.floor(this.remainingTime / 20);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        
        this.players.forEach(player => {
            player.onScreenDisplay.setActionBar(
                `Level: ${this.currentLevelIndex + 1} | ` +
                `Time: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} | ` +
                `Lives: ${this.lives} | ` +
                `Score: ${this.score}/${this.currentLevel.goal}`
            );
        });

        if (this.remainingTime <= 0) {
            this.handleLevelTimeout();
        }
    }

    private handleLevelTimeout() {
        world.sendMessage("Time's up!");
        this.endGame();
    }

    // GameCore.ts - Update nextLevel method
    public nextLevel() {
        if (this.currentLevelIndex >= this.config.levelConfigurations.length - 1) {
            this.endGame(true);
            return;
        }

        // Cleanup current level
        this.levelManager.cleanup();
        
        // Rebuild arena for new level
        clearArena(this.config.arenaLocation, this.config.arenaSize);
        setupArena(
            { x: this.config.arenaLocation.x, y: this.config.arenaLocation.y, z: this.config.arenaLocation.z },
            this.config.arenaSize,
            this.config.arenaSettings
        );

        this.currentLevelIndex++;
        this.score = 0;
        this.players.forEach(player => {
            player.sendMessage(`§a§lLevel ${this.currentLevelIndex} Complete!`);
            player.runCommand("playsound random.levelup @s");
        });
        system.runTimeout(() => this.startLevel(), 60);
    }

    // GameCore.ts - Update endGame method
// In GameCore.ts - Update endGame method
private endGame(success = false) {
    setWorldSettings("gameEnd");
    
    // Display final score before any cleanup
    const endMessage = success ? "§6§l🏆 GAME COMPLETE! 🏆" : "§c§l❌ GAME OVER ❌";
    this.players.forEach(player => {
        player.sendMessage(endMessage);
        try {
            const objective = world.scoreboard.getObjective(this.config.scoreboardConfig.objectiveId);
            if (objective) {
                player.sendMessage(`§eTotal Score: §f${this.totalScore}`);
            }
        } catch (error) {
            console.error("Failed to get score:", error);
        }
    });

    // Single cleanup operations
    this.levelManager.cleanup();
    clearArena(this.config.arenaLocation, this.config.arenaSize);
    
    // Clear intervals
    if (this.gameInterval) system.clearRun(this.gameInterval);
    if (this.levelTimeout) system.clearRun(this.levelTimeout);

    // Player cleanup with delay
    system.runTimeout(() => {
        this.players.forEach(player => {
            try {
                const inv = player.getComponent("minecraft:inventory") as EntityInventoryComponent;
                inv.container?.clearAll();
                player.runCommand(`gamemode creative`);
                player.teleport(this.config.lobbyLocation);
                player.runCommand("scoreboard players reset @s mtd_diamonds");
                player.removeTag("MTD");
            } catch (error) {
                console.error("Player cleanup failed:", error);
            }
        });

        // Reset scoreboard once after player cleanup
        resetScoreboard(this.config.scoreboardConfig.objectiveId);
        
        if (this.onGameEnd) this.onGameEnd();
    }, 100);
}

}