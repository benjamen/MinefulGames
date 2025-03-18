import { world, system, DisplaySlotId, GameMode } from "@minecraft/server";

export class GameSetup {
    private gameTimer: number = 0;
    private overallScores: Map<string, number> = new Map();
    private intervalId?: number;

    constructor(
        private gameName: string,
        private gameDescription: string,
        timerMinutes: number,
        private gameMode: "survival" | "creative" | "adventure" | "spectator",
        private dayOrNight: "day" | "night",
        private difficulty: string
    ) {
        this.gameTimer = timerMinutes * 60;
    }

    // Display game introduction and start timer
    startGame(players: any[], gameArea: { x: number; y: number; z: number; dimension: any }) {
        this.clearObjectives();
        this.clearArena(gameArea);
        this.clearPlayerInventories(players);

        world.sendMessage(`🎰 Welcome to ${this.gameName}!`);
        world.sendMessage(`${this.gameDescription}`);
        world.sendMessage(`⏳ You have ${this.gameTimer / 60} minutes! Good luck!`);

        this.setWorldSettings();

        players.forEach(player => {
            player.teleport(gameArea);
            player.sendMessage(`🚀 Teleporting you to the game area!`);
            player.setGameMode(this.getGameModeEnum());
        });

        this.setupScoreboard();
        this.resetPlayerScores(players);
        this.startTimer(players);
    }

    private clearObjectives() {
        world.scoreboard.getObjectives().forEach(objective => {
            world.scoreboard.removeObjective(objective);
            world.sendMessage(`🧹 Removed scoreboard objective: ${objective.id}`);
        });
    }

    private clearArena(gameArea: { x: number; y: number; z: number; dimension: any }) {
        const { x, y, z, dimension } = gameArea;
        const arenaSize = 20;

        try {
            dimension.runCommand(`fill ${x - arenaSize} ${y} ${z - arenaSize} ${x + arenaSize} ${y + 10} ${z + arenaSize} air`);
            world.sendMessage(`🧹 Cleared the game arena!`);
        } catch (error) {
            world.sendMessage(`⚠️ Failed to clear arena: ${error}`);
        }
    }

    private clearPlayerInventories(players: any[]) {
        players.forEach(player => {
            try {
                const inventory = player.getComponent("inventory");
                if (inventory?.container) {
                    for (let i = 0; i < inventory.container.size; i++) {
                        inventory.container.setItem(i, undefined);
                    }
                    player.sendMessage(`🧹 Your inventory has been cleared!`);
                } else {
                    player.sendMessage("⚠️ Could not clear inventory. No inventory found.");
                }
            } catch (error) {
                world.sendMessage(`⚠️ Failed to clear inventory for player ${player.name}: ${error}`);
            }
        });
        world.sendMessage("🧹 Cleared all players' inventories!");
    }

    private getGameModeEnum(): GameMode {
        switch (this.gameMode) {
            case "survival": return GameMode.survival;
            case "creative": return GameMode.creative;
            case "adventure": return GameMode.adventure;
            case "spectator": return GameMode.spectator;
        }
    }

    private setWorldSettings() {
        const overworld = world.getDimension("overworld");
        overworld.runCommand(`time set ${this.dayOrNight}`);
        overworld.runCommand(`gamerule doDaylightCycle ${this.dayOrNight === "day"}`);
        overworld.runCommand(`difficulty ${this.difficulty}`);
    }

    private startTimer(players: any[]) {
        this.intervalId = system.runInterval(() => {
            if (this.gameTimer > 0) {
                this.gameTimer--;
                players.forEach(player => {
                    player.onScreenDisplay.setActionBar(`⏳ Time Remaining: ${this.gameTimer} seconds`);
                });
            } else {
                this.endGame(players);
                if (this.intervalId !== undefined) {
                    system.clearRun(this.intervalId);
                }
            }
        }, 20);
    }

    private endGame(players: any[]) {
        world.sendMessage(`⏳ Time is up! The game ${this.gameName} is over!`);
        players.forEach(player => {
            player.teleport({ x: 0, y: 65, z: 0 });
            player.sendMessage(`🏠 Returning to the lobby!`);
        });
    }

    private setupScoreboard() {
        const objective = world.scoreboard.addObjective("points", "Points");
        world.scoreboard.setObjectiveAtDisplaySlot(DisplaySlotId.Sidebar, { objective });
        return objective;
    }

    private resetPlayerScores(players: any[]) {
        players.forEach(player => {
            this.updatePlayerScore(player, 0);
        });
    }

    private updatePlayerScore(player: any, points: number) {
        const objective = world.scoreboard.getObjective("points");
        if (objective) {
            objective.setScore(player, points);
        }
    }
}
