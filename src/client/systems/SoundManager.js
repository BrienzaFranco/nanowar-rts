// Simple Sound Manager using Web Audio API
// No external files needed - generates sounds programmatically

export class SoundManager {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.init();
    }

    init() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playTone(freq, duration, type = 'sine', volume = 0.1) {
        if (!this.ctx || !this.enabled) return;
        
        this.resume();
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = type;
        osc.frequency.value = freq;
        
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playSelect() {
        // Short high blip
        this.playTone(800, 0.08, 'sine', 0.08);
    }

    playMove() {
        // Ascending blip
        if (!this.ctx || !this.enabled) return;
        this.resume();
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(500, this.ctx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }

    playAttack() {
        // Harsh descending sound
        if (!this.ctx || !this.enabled) return;
        this.resume();
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.15);
        
        gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }

    playCapture() {
        // Longer, more satisfying chord with build-up
        if (!this.ctx || !this.enabled) return;
        this.resume();
        
        // Main chord - C major with octave and extensions
        const notes = [523, 659, 784, 1047, 1319];
        
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = i < 2 ? 'sine' : 'triangle';
            osc.frequency.value = freq;
            
            // Staggered entry for build-up effect
            const startTime = this.ctx.currentTime + i * 0.08;
            const duration = 0.7;
            
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.1, startTime + 0.05);
            gain.gain.setValueAtTime(0.1, startTime + duration - 0.15);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.start(startTime);
            osc.stop(startTime + duration);
        });
        
        // Add a bass note
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sine';
        bassOsc.frequency.value = 261.63;
        bassGain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        bassGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);
        bassOsc.connect(bassGain);
        bassGain.connect(this.ctx.destination);
        bassOsc.start();
        bassOsc.stop(this.ctx.currentTime + 0.6);
    }

    playCollision() {
        // Short satisfying "pop" for cell collisions - own cells only
        if (!this.ctx || !this.enabled) return;
        this.resume();
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        // Quick frequency sweep for "pop" effect
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.08);
        
        gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
    }

    playSpawn() {
        // Quick blip
        this.playTone(600, 0.05, 'sine', 0.04);
    }

    playWin() {
        // Victory fanfare
        if (!this.ctx || !this.enabled) return;
        this.resume();
        
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'square';
            osc.frequency.value = freq;
            
            const startTime = this.ctx.currentTime + i * 0.15;
            gain.gain.setValueAtTime(0.1, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.start(startTime);
            osc.stop(startTime + 0.3);
        });
    }

    playLose() {
        // Sad descending
        if (!this.ctx || !this.enabled) return;
        this.resume();
        
        const notes = [400, 350, 300, 250];
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'sawtooth';
            osc.frequency.value = freq;
            
            const startTime = this.ctx.currentTime + i * 0.2;
            gain.gain.setValueAtTime(0.08, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.start(startTime);
            osc.stop(startTime + 0.4);
        });
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}

// Global instance
export const sounds = new SoundManager();
