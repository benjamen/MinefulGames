import { world } from "@minecraft/server";

export class EventManager {
    private subscriptions: Map<string, Function[]> = new Map();

    subscribe(event: any, callback: Function) {
        const eventName = event.constructor.name;
        if (!this.subscriptions.has(eventName)) {
            this.subscriptions.set(eventName, []);
            event.subscribe((e: any) => {
                this.subscriptions.get(eventName)?.forEach(cb => cb(e));
            });
        }
        this.subscriptions.get(eventName)?.push(callback);
    }
}