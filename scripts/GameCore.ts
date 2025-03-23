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
            };
            lobbyLocation: { x: number; y: number; z: number };
            startingInventory: Array<{ item: string; count: number }>;
            defaultGamemode: GameMode;
            minPlayers: number;
            lives: number;
            scoreboardConfig: { objectiveId: string; displayName: string };
        },
        onGameEnd?: () => void
    ) {
        this.lives = config.lives;
        this.onGameEnd = onGameEnd;
        this.levelManager = new LevelManager(this);
        this.playerManager = new PlayerManager(this);
    }

    public startGame() {
        setWorldSettings("day");
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
                const spawnPoint = {
                    x: this.config.arenaLocation.x,
                    y: this.config.arenaLocation.y + 2,
                    z: this.config.arenaLocation.z,
                    dimension: this.config.arenaLocation.dimension
                };
                player.setSpawnPoint(spawnPoint);
                player.teleport(spawnPoint);
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
    }

    private handleBlockBreak(player: Player) {
        system.run(() => {
            this.score++;
            this.totalScore++;
            updatePlayerScore(player, this.config.scoreboardConfig.objectiveId, 1);
            this.levelManager.initializeLevel();
            
            if (this.score >= this.currentLevel.goal) {
                this.nextLevel();
            }
        });
    }

    private handlePlayerDeath(player: Player) {
        this.lives--;
        if (this.lives > 0) {
            system.runTimeout(() => this.playerManager.respawnPlayer(player), 20);
        } else {
            this.endGame();
        }
    }

    get currentLevel() {
        return this.config.levelConfigurations[this.currentLevelIndex];
    }

    private startLevel() {
        this.remainingTime = this.currentLevel.gameTime * 20;
        console.log(`Starting level ${this.currentLevelIndex + 1} with ${this.remainingTime} ticks`);

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

    public nextLevel() {
        if (this.currentLevelIndex >= this.config.levelConfigurations.length - 1) {
            this.endGame(true);
            return;
        }

        this.currentLevelIndex++;
        this.score = 0;
        this.players.forEach(player => {
            player.sendMessage(`§a§lLevel ${this.currentLevelIndex} Complete!`);
            player.runCommand("playsound random.levelup @s");
        });
        system.runTimeout(() => this.startLevel(), 60);
    }

    private endGame(success = false) {
        // Cleanup players
        this.players.forEach(player => {
            try {
                // Clear inventory
                const inv = player.getComponent("minecraft:inventory") as EntityInventoryComponent;
                inv.container?.clearAll();
                
                // Reset gamemode
                player.runCommand(`gamemode creative`);
                
                // Teleport and reset score
                player.teleport(this.config.lobbyLocation);
                player.runCommand("scoreboard players reset @s mtd_diamonds");
                
            } catch (error) {
                console.error("Player cleanup failed:", error);
            }
        });
    
        // Rest of existing cleanup logic
        this.levelManager.cleanup();
        resetScoreboard(this.config.scoreboardConfig.objectiveId);
        clearArena(this.config.arenaLocation, this.config.arenaSize);
        this.levelManager.cleanup();
        if (this.gameInterval) system.clearRun(this.gameInterval);
        if (this.levelTimeout) system.clearRun(this.levelTimeout);
        
        resetScoreboard(this.config.scoreboardConfig.objectiveId);
        clearArena(this.config.arenaLocation, this.config.arenaSize);

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
            
            player.runCommand(success ? "playsound random.levelup @s" : "playsound mob.wither.death @s");
            system.runTimeout(() => {
                player.teleport(this.config.lobbyLocation);
                player.removeTag("MTD");
            }, 100);
        });

        if (this.onGameEnd) {
            system.runTimeout(() => this.onGameEnd!(), 120);
        }
    }
}