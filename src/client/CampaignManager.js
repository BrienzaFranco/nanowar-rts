// client/CampaignManager.js

export class CampaignManager {
    static STORAGE_KEY = 'nanowar_campaign_progress';

    static getUnlockedLevel() {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved) {
            return parseInt(saved, 10);
        }
        return 0; // 0 represents the tutorial level
    }

    static completeLevel(completedLevelId) {
        const currentUnlocked = this.getUnlockedLevel();
        if (completedLevelId >= currentUnlocked) {
            localStorage.setItem(this.STORAGE_KEY, (completedLevelId + 1).toString());
        }
    }

    static resetProgress() {
        localStorage.removeItem(this.STORAGE_KEY);
    }
}
