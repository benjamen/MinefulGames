// EventManager.ts

export class EventManager {
    private subscriptions = new Set<() => void>();

    subscribe<T>(
        event: { 
            subscribe: (callback: (arg: T) => void) => void;
            unsubscribe: (callback: (arg: T) => void) => void 
        }, 
        callback: (arg: T) => void
    ) {
        event.subscribe(callback);
        this.subscriptions.add(() => event.unsubscribe(callback));
    }

    public unsubscribeAll() {
        this.subscriptions.forEach(unsub => unsub());
        this.subscriptions.clear();
    }
}
