// p5.js functions
declare function createCanvas(w: number, h: number): any;
declare function resizeCanvas(w: number, h: number): void;
declare function push(): void;
declare function pop(): void;
declare function stroke(color: any): void;
declare function stroke(r: number, g: number, b: number): void;
declare function stroke(r: number, g: number, b: number, a: number): void;
declare function strokeWeight(weight: number): void;
declare function strokeJoin(style: any): void;
declare function strokeCap(style: any): void;
declare function fill(color: any): void;
declare function fill(r: number, g: number, b: number): void;
declare function fill(r: number, g: number, b: number, a: number): void;
declare function noFill(): void;
declare function noStroke(): void;
declare function beginShape(): void;
declare function vertex(x: number, y: number): void;
declare function endShape(mode?: any): void;
declare function ellipse(x: number, y: number, w: number, h?: number): void;
declare function rect(x: number, y: number, w: number, h?: number, r?: number): void;
declare function line(x1: number, y1: number, x2: number, y2: number): void;
declare function background(color: any): void;
declare function translate(x: number, y: number): void;
declare function scale(factor: number): void;
declare function cursor(type: any): void;
declare function textFont(font: string): void;
declare function text(str: string, x: number, y: number): void;
declare function textSize(size: number): void;
declare function textAlign(horizontal: any, vertical?: any): void;
declare function textWidth(str: string): number;
declare function dist(x1: number, y1: number, x2: number, y2: number): number;
declare function redraw(): void;
declare function resetMatrix(): void;
declare function color(r: number, g?: number, b?: number, a?: number): any;
declare function createVector(x: number, y: number): any;
declare function atan2(y: number, x: number): number;

// p5 math helpers
declare function degrees(radians: number): number;
declare function radians(degrees: number): number;
declare function sin(angle: number): number;
declare function cos(angle: number): number;

// p5 DOM functions
declare function createDiv(content?: string): any;
declare function createButton(label: string): any;
declare function createSlider(min: number, max: number, value: number, step?: number): any;
declare function createCheckbox(label: string, value: boolean): any;
declare function createSpan(content: string): any;
declare function select(selector: string): any;

// p5 constants
declare const ROUND: any;
declare const CLOSE: any;
declare const ARROW: any;
declare const HAND: any;
declare const CROSS: any;
declare const LEFT: any;
declare const RIGHT: any;
declare const CENTER: any;
declare const TOP: any;
declare const BOTTOM: any;
declare const ESCAPE: any;
declare const DELETE: any;
declare const SHIFT: any;
declare const CONTROL: any;

// p5 global variables
declare const windowWidth: number;
declare const windowHeight: number;
declare const width: number;
declare const height: number;
declare const mouseX: number;
declare const mouseY: number;
declare const mouseButton: any;
declare const key: string;
declare const keyCode: number;
declare const drawingContext: any;

// p5 functions
declare function keyIsDown(keyCode: number): boolean;

// canvas (declared in code)
