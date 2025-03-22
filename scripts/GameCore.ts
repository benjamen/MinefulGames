import { world, system, GameMode, Dimension, Player } from "@minecraft/server";
import { LevelManager } from "./LevelManager";
import { PlayerManager } from "./PlayerManager";
import { setupScoreboard, updatePlayerScore } from "./ScoreManager";
import { EventManager } from "./EventManager";

export class GameCore {
    // Game state
    public score = 0;
    public lives: number;
    public currentLevelIndex = 0;
    public players: Player[] = [];
    private onGameEnd?: () => void;

    // Managers
    public eventManager = new EventManager();
    private levelManager: LevelManager;
    private playerManager: PlayerManager;

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
        this.initializePlayers();
        setupScoreboard(this.config.scoreboardConfig.objectiveId, this.config.scoreboardConfig.displayName);
        this.registerEventHandlers();
        this.startLevel();
    }

    private initializePlayers() {
        this.players = world.getAllPlayers().filter(p => p.hasTag("MTD"));
        this.players.forEach(player => {
            player.setSpawnPoint(this.config.arenaLocation);
            this.playerManager.respawnPlayer(player);
        });
    }

    private registerEventHandlers() {
        this.eventManager.subscribe(world.beforeEvents.playerBreakBlock, (event) => {
            if (event.block.typeId === this.currentLevel.blockToBreak) {
                this.handleBlockBreak(event.player);
            }
        });

        this.eventManager.subscribe(world.afterEvents.entityDie, (event) => {
            if (event.deadEntity instanceof Player) {
                this.handlePlayerDeath(event.deadEntity);
            }
        });
    }

    private handleBlockBreak(player: Player) {
        this.score++;
        updatePlayerScore(player, this.config.scoreboardConfig.objectiveId, this.score);
        this.levelManager.initializeLevel();
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
        world.sendMessage(`Starting Level ${this.currentLevelIndex + 1}`);
        this.levelManager.initializeLevel();
        system.runInterval(() => this.gameTick(), 20);
    }

    private gameTick() {
        this.players.forEach(player => {
            player.onScreenDisplay.setActionBar(`Lives: ${this.lives} | Score: ${this.score}`);
        });
    }

    private endGame() {
        world.sendMessage("Game Over!");
        this.players.forEach(player => {
            player.teleport(this.config.lobbyLocation);
            player.removeTag("MTD");
        });
        
        if (this.onGameEnd) {
            this.onGameEnd();
        }
    }
}