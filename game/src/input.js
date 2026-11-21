// Keyboard + mouse state, with edge-triggered presses for one-shot actions.
export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.pressed = new Set();
    this.mouseDown = false;
    this.mousePressed = false;
    this.camYaw = Math.PI;
    this.camPitch = 0.32;
    window.addEventListener("keydown", (e) => {
      if (!this.keys.has(e.code)) this.pressed.add(e.code);
      this.keys.add(e.code);
      if (["Space", "KeyW", "KeyA", "KeyS", "KeyD"].includes(e.code)) e.preventDefault();
    });
    window.addEventListener("keyup", (e) => this.keys.delete(e.code));
    window.addEventListener("blur", () => { this.keys.clear(); this.mouseDown = false; });
    canvas.addEventListener("mousedown", () => { this.mouseDown = true; this.mousePressed = true; });
    window.addEventListener("mouseup", () => { this.mouseDown = false; });
    window.addEventListener("mousemove", (e) => {
      if (e.buttons & 2 || e.buttons & 1) {
        this.camYaw -= e.movementX * 0.004;
        this.camPitch = Math.max(0.08, Math.min(1.1, this.camPitch + e.movementY * 0.003));
      }
    });
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  }
  wasPressed(code) {
    return this.pressed.has(code);
  }
  endFrame() {
    this.pressed.clear();
    this.mousePressed = false;
  }
}
