import { world, system, GameMode, Dimension, Player, ItemStack, EntityInventoryComponent } from "@minecraft/server";
import { PlayerManager } from "./PlayerManager";
import { setupScoreboard, updatePlayerScore, resetScoreboard } from "./ScoreManager";
import { EventManager } from "./EventManager";
import { clearArena, setupArena } from "./ArenaManager";
import { setWorldSettings } from "./WorldManager";
import { GameLevelManager } from "./GameLevelManager";

export enum GameState {
  WAITING,
  ACTIVE,
  COMPLETED,
  FAILED,
}

// In GameCore.ts
export interface GameLevel {
    description: string;
    gameTime: number;
    goal?: number;
    blockToBreak?: string;
    randomBlockToPlace?: string;
    customData?: {
        mobsToSpawn?: Array<{ type: string; count: number }>;
    };
}

export interface GameConfig {
  name: string;
  levelConfigurations: GameLevel[];
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
  playerTag: string;
  victoryCondition: "score" | "survival" | "custom";
  respawnStrategy?: "instant" | "delayed";
  levelManager: new (game: GameCore) => GameLevelManager;
}

export class GameCore {
  public gameState: GameState = GameState.WAITING;
  public score = 0;
  public totalScore = 0;
  public lives: number;
  public currentLevelIndex = 0;
  public players: Player[] = [];
  public remainingTime: number = 0;
  private onGameEnd?: () => void;

  public eventManager = new EventManager();
  public levelManager: GameLevelManager;
  private playerManager: PlayerManager;

  private gameInterval?: number;
  private levelTimeout?: number;

  constructor(public config: GameConfig, onGameEnd?: () => void) {
    this.lives = config.lives;
    this.onGameEnd = onGameEnd;
    this.playerManager = new PlayerManager(this);
    this.levelManager = new config.levelManager(this);
  }

  // In GameCore.ts - Modify startGame()
public startGame() {
  if (this.gameState !== GameState.WAITING) return;
  this.gameState = GameState.ACTIVE;

  this.levelManager.preGameCleanup();
  setWorldSettings("gameStart");
  clearArena(this.config.arenaLocation, this.config.arenaSize);
  
  // Add callback for arena completion
  setupArena(this.config.arenaLocation, this.config.arenaSize, this.config.arenaSettings);
  
  // Delay level initialization
  // In startGame() method, modify the scoreboard setup:
  system.runTimeout(() => {
    this.initializePlayers();
    const scoreboardSuccess = setupScoreboard(
      this.config.scoreboardConfig.objectiveId,
      this.config.scoreboardConfig.displayName
    );
    
    if (!scoreboardSuccess) {
      console.error("Failed to initialize scoreboard");
      return;
    }
    
    this.registerEventHandlers();
    this.startLevel();
  }, 60); // 3 second delay
}

  private initializePlayers() {
    this.players = world.getAllPlayers().filter((p) => p.hasTag(this.config.playerTag));
    this.players.forEach((player) => {
      try {
        // Force-add player to scoreboard
        // Change this line in initializePlayers():
        world.scoreboard.getObjective(this.config.scoreboardConfig.objectiveId)
        ?.setScore(player, 0); // Use player object instead of player.name
        const inventory = player.getComponent("minecraft:inventory") as EntityInventoryComponent;
        inventory?.container?.clearAll();

        this.config.startingInventory.forEach((item) => {
          inventory.container?.addItem(new ItemStack(item.item, item.count));
        });

        player.runCommand(`gamemode ${this.config.defaultGamemode}`);
        player.teleport(
          {
            x: this.config.arenaLocation.x,
            y: this.config.arenaLocation.y + 2,
            z: this.config.arenaLocation.z,
          },
          { dimension: this.config.arenaLocation.dimension }
        );
      } catch (error) {
        console.error("Player initialization failed:", error);
      }
    });
  }

 // In GameCore.ts
// In GameCore.ts - Modified registerEventHandlers()
private registerEventHandlers() {
  this.eventManager.subscribe(world.beforeEvents.playerBreakBlock, (event) => {
    if (event.block.typeId === this.currentLevel.blockToBreak) {
        this.score++;
        this.totalScore++;
        
        // Update ALL players' scores
        this.players.forEach(player => {
            updatePlayerScore(player, this.config.scoreboardConfig.objectiveId, this.score);
        });
        
        this.levelManager.handleBlockBroken();
        
        if (this.score >= this.currentLevel.goal!) {
            this.nextLevel();
        }
    }
});



    this.eventManager.subscribe(world.afterEvents.entityDie, (event) => {
      if (event.deadEntity instanceof Player && this.players.includes(event.deadEntity)) {
        this.handlePlayerDeath(event.deadEntity);
      }
    });

    this.eventManager.subscribe(system.afterEvents.scriptEventReceive, () => {
      this.players.forEach((player) => this.checkPlayerBounds(player));
    });
  }


  private checkPlayerBounds(player: Player) {
    const arena = this.config.arenaLocation;
    const size = this.config.arenaSize;
    const loc = player.location;

    if (
      loc.x < arena.x - size.x / 2 ||
      loc.x > arena.x + size.x / 2 ||
      loc.z < arena.z - size.z / 2 ||
      loc.z > arena.z + size.z / 2
    ) {
      player.teleport({ x: arena.x, y: arena.y + 2, z: arena.z }, { dimension: arena.dimension });
      player.sendMessage("§cStay in the arena!");
    }
  }


  private handlePlayerDeath(player: Player) {
    this.lives--;
    this.broadcastMessage(`§c${player.name} died! ${this.lives} lives remaining`);
  
    if (this.lives > 0) {
      const respawnDelay = this.config.respawnStrategy === "delayed" ? 20 : 0;
      system.runTimeout(() => this.playerManager.respawnPlayer(player), respawnDelay);
    } else {
      this.endGame(false);
    }
  }

  private startLevel() {
    const level = this.currentLevel;
    this.remainingTime = level.gameTime * 20;
    this.score = 0;

    this.broadcastMessage(`§eStarting Level ${this.currentLevelIndex + 1}: §f${level.description}`);
    this.players.forEach((player) => {
      player.onScreenDisplay.setTitle({
        rawtext: [{ text: `§eLevel ${this.currentLevelIndex + 1}\n` }, { text: `§f${level.description}` }],
      });
    });

    this.levelManager.initializeLevel();
    this.gameInterval = system.runInterval(() => this.gameTick(), 20);
    this.levelTimeout = system.runTimeout(() => this.onLevelTimeout(), this.remainingTime);
  }


  private gameTick() {
    if (this.remainingTime <= 0) return;
  
    // Decrement by 20 ticks (1 second) instead of 1
    this.remainingTime -= 20;
  
    // Convert ticks to minutes and seconds
    const totalSeconds = Math.floor(this.remainingTime / 20);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
  
    this.players.forEach((player) => {
      player.onScreenDisplay.setActionBar(
        `Level: ${this.currentLevelIndex + 1} | ` +
        `Time: ${minutes}m ${seconds.toString().padStart(2, '0')}s | ` + // Added leading zero
        `Lives: ${this.lives} | ` +
        `Score: ${this.score}/${this.currentLevel.goal}`
      );
    });
  
    if (this.remainingTime <= 0) {
      this.onLevelTimeout();
    }
  }
  

  private onLevelTimeout() {
    if (this.currentLevelIndex >= this.config.levelConfigurations.length - 1) {
      this.endGame(true);
    } else {
      this.nextLevel();
    }
  }

  // In GameCore.ts - Modify nextLevel()
public nextLevel() {
  if (this.currentLevelIndex >= this.config.levelConfigurations.length - 1) {
      this.endGame(true);
      return;
  }

  // Clear existing intervals/timeouts
  if (this.gameInterval) system.clearRun(this.gameInterval);
  if (this.levelTimeout) system.clearRun(this.levelTimeout);

  // Clean up current level
  this.levelManager.cleanup();
  
  // Clear arena with delay
   // Increase delays for arena rebuild
   system.runTimeout(() => {
    clearArena(this.config.arenaLocation, this.config.arenaSize);
    
    system.runTimeout(() => {
        if (setupArena(this.config.arenaLocation, this.config.arenaSize, this.config.arenaSettings)) {
            system.runTimeout(() => {
                this.currentLevelIndex++;
                this.startLevel();
            }, 40); // 2 second delay
        }
    }, 40); // 2 second delay
}, 20); // 1 second delay
}

 // Update endGame() method
// Update endGame() method
private endGame(success: boolean) {
  this.gameState = success ? GameState.COMPLETED : GameState.FAILED;
  
  // Clear all timers
  if (this.gameInterval) system.clearRun(this.gameInterval);
  if (this.levelTimeout) system.clearRun(this.levelTimeout);
  
  // Cleanup world
  setWorldSettings("gameEnd");
  this.levelManager.cleanup();
  clearArena(this.config.arenaLocation, this.config.arenaSize);

  // Teleport players and reset state
  system.runTimeout(() => {
      this.players.forEach((player) => {
          try {
              // Reset player state
              player.teleport(this.config.lobbyLocation);
              player.removeTag(this.config.playerTag);
              player.runCommand(`gamemode creative`);
              (player.getComponent("minecraft:inventory") as EntityInventoryComponent)
                  ?.container?.clearAll();
          } catch (error) {
              console.error("Player cleanup failed:", error);
          }
      });
      
      // Reset game state
      resetScoreboard(this.config.scoreboardConfig.objectiveId);
      this.currentLevelIndex = 0;
      this.score = 0;
      this.totalScore = 0;
      this.lives = this.config.lives;
      
      this.onGameEnd?.();
  }, 100);
}

  private broadcastMessage(message: string) {
    this.players.forEach((player) => player.sendMessage(message));
  }

  get currentLevel(): GameLevel {
    return this.config.levelConfigurations[this.currentLevelIndex];
  }
}
