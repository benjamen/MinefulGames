//EventManager.ts

export class EventManager {
    private subscriptions: Map<
        {
            subscribe: (callback: (arg: any) => void) => void;
            unsubscribe: (callback: (arg: any) => void) => void;
        },
        Set<(arg: any) => void> // Explicitly type the callbacks
    > = new Map();

    subscribe<T>(
        event: {
            subscribe: (callback: (arg: T) => void) => void;
            unsubscribe: (callback: (arg: T) => void) => void;
        },
        callback: (arg: T) => void
    ) {
        if (!this.subscriptions.has(event)) {
            this.subscriptions.set(event, new Set());
        }

        const callbacks = this.subscriptions.get(event)!;
        if (!callbacks.has(callback)) {
            callbacks.add(callback);
            event.subscribe(callback);
        }
    }

    public unsubscribeAll() {
        console.log("Unsubscribing all events...");
        for (const [event, callbacks] of this.subscriptions) {
            console.log(`Unsubscribing ${callbacks.size} callbacks for event.`);
            for (const cb of callbacks) {
                try {
                    event.unsubscribe(cb);
                    console.log("Successfully unsubscribed callback.");
                } catch (error) {
                    console.error("Failed to unsubscribe:", error);
                }
            }
            callbacks.clear();
        }
        this.subscriptions.clear();
        console.log("All events unsubscribed.");
    }
}