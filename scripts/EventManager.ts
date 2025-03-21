export class EventManager {
    private subscriptions: any[] = [];

    subscribe(event: any, callback: (eventData: any) => void) {
        try {
            // Store the subscription object, not the callback
            const sub = event.subscribe(callback);
            if (sub && typeof sub.unsubscribe === "function") {
                this.subscriptions.push(sub);
                console.log("✅ Event subscribed successfully.");
            } else {
                console.error("❌ Invalid subscription object:", sub);
            }
        } catch (error) {
            console.error("❌ Failed to subscribe to event:", error);
        }
    }

    unsubscribeAll() {
        this.subscriptions.forEach((sub, index) => {
            try {
                if (sub && typeof sub.unsubscribe === "function") {
                    sub.unsubscribe();
                    console.log("✅ Event unsubscribed successfully.");
                } else {
                    console.error("❌ Invalid subscription object at index:", index, sub);
                }
            } catch (error) {
                console.error("❌ Failed to unsubscribe:", error);
            }
        });
        this.subscriptions = [];
    }
}