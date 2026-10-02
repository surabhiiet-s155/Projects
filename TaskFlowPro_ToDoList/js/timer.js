/**
 * TaskFlow Pro - Focus Pomodoro Timer Module
 * Integrated countdown timer with audio feedback and task linking.
 */

class PomodoroTimer {
    constructor(taskManager, onTickCallback, onCompleteCallback) {
        this.taskManager = taskManager;
        this.onTick = onTickCallback;
        this.onComplete = onCompleteCallback;

        this.durations = {
            work: 25 * 60,
            shortBreak: 5 * 60,
            longBreak: 15 * 60
        };

        this.currentMode = 'work';
        this.timeLeft = this.durations.work;
        this.totalDuration = this.durations.work;
        this.isRunning = false;
        this.timerId = null;
        this.linkedTaskId = null;

        // Web Audio API Context for sound effects
        this.audioCtx = null;
    }

    initAudio() {
        if (!this.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioCtx = new AudioContext();
            }
        }
    }

    playAlarmSound() {
        this.initAudio();
        if (!this.audioCtx || !this.taskManager.settings.soundEnabled) return;

        // Play pleasant chime alert using Web Audio API
        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.3); // A5

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.8);
    }

    playTickSound() {
        this.initAudio();
        if (!this.audioCtx || !this.taskManager.settings.soundEnabled) return;

        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.05);
    }

    setMode(mode) {
        if (this.durations[mode]) {
            this.currentMode = mode;
            this.totalDuration = this.durations[mode];
            this.timeLeft = this.durations[mode];
            this.pause();
            if (this.onTick) this.onTick(this.timeLeft, this.totalDuration);
        }
    }

    linkTask(taskId) {
        this.linkedTaskId = taskId;
    }

    start() {
        if (this.isRunning) return;
        this.initAudio();
        this.isRunning = true;

        this.timerId = setInterval(() => {
            if (this.timeLeft > 0) {
                this.timeLeft--;
                
                // Track focus time for task
                if (this.currentMode === 'work' && this.linkedTaskId) {
                    const task = this.taskManager.tasks.find(t => t.id === this.linkedTaskId);
                    if (task) {
                        task.focusTimeMinutes = (task.focusTimeMinutes || 0) + (1 / 60);
                    }
                }

                // Track total stats
                if (this.currentMode === 'work') {
                    this.taskManager.stats.totalFocusSeconds += 1;
                }

                if (this.onTick) this.onTick(this.timeLeft, this.totalDuration);
            } else {
                this.timerCompleted();
            }
        }, 1000);
    }

    pause() {
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
        this.isRunning = false;
    }

    reset() {
        this.pause();
        this.timeLeft = this.totalDuration;
        if (this.onTick) this.onTick(this.timeLeft, this.totalDuration);
    }

    timerCompleted() {
        this.pause();
        this.playAlarmSound();
        this.taskManager.save();

        if (this.onComplete) {
            this.onComplete(this.currentMode);
        }
    }

    getFormattedTime() {
        const mins = Math.floor(this.timeLeft / 60);
        const secs = this.timeLeft % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}
