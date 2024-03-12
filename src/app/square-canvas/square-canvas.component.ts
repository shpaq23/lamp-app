import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { LightService } from './light-service';

// Define a type for square information
export interface SquareInfo {
	selected: boolean;
	lastToggled: number;
	xCanvas: number;
	yCanvas: number;
	sizeCanvas: number;
}

export interface LampLightInfo {
	lampWidthInM: number;
	lampHeightInM: number;
	lampLightHeightInM: number;
	lampLightWidthInM: number;
	percentageOfLightThreshold: number;
	lampPosition: 'horizontal' | 'vertical';
}

export interface Point {
	xCanvas: number;
	yCanvas: number;
}

export interface Lamp {
	lightLeftTopPoint: Point;
	frameLeftTopPoint: Point;
	lightingAreaPercentage?: number;
	hasLampMoved?: boolean;
}


@Component({
	selector: 'app-square-canvas',
	template: `
		<div>
			<div style="padding-bottom: 8px">
				<span>Building Area (in M):</span>
				<div>
					Width: <input (change)="updateInitialArea()" [(ngModel)]="initialWidth" type="number">
					Height: <input (change)="updateInitialArea()" [(ngModel)]="initialHeight" type="number">
				</div>
			</div>

			<div style="display: flex; align-items: center">
				<div style="padding-right: 8px">
					<span>Lamp Frame (in M)</span>
					<div>
						Width: <input [(ngModel)]="lampWidthInM" type="number">
						Height: <input [(ngModel)]="lampHeightInM" type="number">
					</div>
				</div>
				<div>
					<span>Lamp Light (in M)</span>
					<div>
						Width: <input [(ngModel)]="lampLightWidthInM" type="number">
						Height: <input [(ngModel)]="lampLightHeightInM" type="number">
					</div>
				</div>
			</div>
			<div style="padding: 8px 0">
				<span>Lamp settings</span>
				<div>
					Percentage of light threshold : <input [(ngModel)]="lampPercentageOfLightThreshold" type="number">
					Position:
					<select [(ngModel)]="lampPosition">
						<option value="horizontal">Horizontal</option>
						<option value="vertical">Vertical</option>
					</select>
				</div>
			</div>
		</div>
		<div style="padding-bottom: 8px">
			<span>Algorithm:</span>
			<div>
				<button (click)="step1()">Step 1</button>
				<button (click)="step2()">Step 2</button>
				<button (click)="step3()">Step 3</button>
				<button (click)="step4()">Step 4</button>
			</div>
		</div>

		<canvas #myCanvas
				(mousedown)="onMouseDown($event)"
				(mouseleave)="onMouseUp($event)"
				(mousemove)="onMouseMove($event)"
				(mouseup)="onMouseUp($event)"
				height="1000"
				width="1000"></canvas>
	`
})
export class SquareCanvasComponent implements AfterViewInit {
	@ViewChild('myCanvas') myCanvas: ElementRef<HTMLCanvasElement>;

	squareSize: number = 20; // Changed square size to 20 pixels

	grid: SquareInfo[][] = Array(50).fill(null).map((_, xIndex) => Array(50).fill(null).map((_, yIndex) => ({
		selected: false,
		lastToggled: 0,
		xCanvas: xIndex * this.squareSize, // Obliczanie pozycji x na canvasie
		yCanvas: yIndex * this.squareSize, // Obliczanie pozycji y na canvasie
		sizeCanvas: this.squareSize // Rozmiar kwadratu na canvasie
	})));


	isMouseDown: boolean = false; // Track if the mouse button is held down

	debouncePeriod: number = 500; // Adjust as needed

	initialWidth: number = 10; // Default initial width

	initialHeight: number = 10; // Default initial height

	lampWidthInM: number = 0.1; // Default lamp width

	lampHeightInM: number = 1; // Default lamp height

	lampLightWidthInM: number = 1.0; // Default lamp light width

	lampLightHeightInM: number = 1.5; // Default lamp light height

	lampPercentageOfLightThreshold: number = 60; // Default percentage of light threshold

	lampPosition: 'horizontal' | 'vertical' = 'vertical'; // Default lamp position

	private readonly lightService = new LightService();


	ngAfterViewInit(): void {
		this.drawGrid();
		this.updateInitialArea();
	}

	updateInitialArea(): void {
		this.colorInitialArea();
		this.drawGrid();
	}

	step1(): void {
		const lampInfo = {
			lampWidthInM: this.lampWidthInM,
			lampHeightInM: this.lampHeightInM,
			lampLightHeightInM: this.lampLightHeightInM,
			lampLightWidthInM: this.lampLightWidthInM,
			lampPosition: this.lampPosition,
			percentageOfLightThreshold: this.lampPercentageOfLightThreshold
		};
		this.drawGrid();
		const lamps = this.lightService.step1(this.grid, lampInfo);
		this.lightService.drawLight(lamps, lampInfo, 20, this.myCanvas.nativeElement.getContext('2d'));
	}

	step2(): void {
		const lampInfo = {
			lampWidthInM: this.lampWidthInM,
			lampHeightInM: this.lampHeightInM,
			lampLightHeightInM: this.lampLightHeightInM,
			lampLightWidthInM: this.lampLightWidthInM,
			lampPosition: this.lampPosition,
			percentageOfLightThreshold: this.lampPercentageOfLightThreshold
		};
		this.drawGrid();
		const lamps = this.lightService.step2(this.grid, lampInfo);
		this.lightService.drawLight(lamps, lampInfo, 20, this.myCanvas.nativeElement.getContext('2d'));
	}

	step3(): void {
		const lampInfo = {
			lampWidthInM: this.lampWidthInM,
			lampHeightInM: this.lampHeightInM,
			lampLightHeightInM: this.lampLightHeightInM,
			lampLightWidthInM: this.lampLightWidthInM,
			lampPosition: this.lampPosition,
			percentageOfLightThreshold: this.lampPercentageOfLightThreshold
		};
		this.drawGrid();
		const lamps = this.lightService.step3(this.grid, lampInfo);
		this.lightService.drawLight(lamps, lampInfo, 20, this.myCanvas.nativeElement.getContext('2d'));
	}

	step4(): void {
		const lampInfo = {
			lampWidthInM: this.lampWidthInM,
			lampHeightInM: this.lampHeightInM,
			lampLightHeightInM: this.lampLightHeightInM,
			lampLightWidthInM: this.lampLightWidthInM,
			lampPosition: this.lampPosition,
			percentageOfLightThreshold: this.lampPercentageOfLightThreshold
		};
		this.drawGrid();
		const lamps = this.lightService.step4(this.grid, lampInfo);
		this.lightService.drawLight(lamps, lampInfo, 20, this.myCanvas.nativeElement.getContext('2d'));

	}

	onMouseDown(event: MouseEvent): void {
		this.isMouseDown = true;
		this.processMouseEvent(event);
	}

	onMouseMove(event: MouseEvent): void {
		if (this.isMouseDown) {
			this.processMouseEvent(event);
		}
	}

	onMouseUp(event: MouseEvent): void {
		this.isMouseDown = false;
	}

	processMouseEvent(event: MouseEvent): void {
		const rect = this.myCanvas.nativeElement.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;

		const clickedX = Math.floor(x / this.squareSize);
		const clickedY = Math.floor(y / this.squareSize);

		const now = Date.now();

		if (
			clickedX >= 0 && clickedX < this.grid.length &&
			clickedY >= 0 && clickedY < this.grid[0].length
		) {
			const square = this.grid[clickedX][clickedY];

			// Check if enough time has passed since the last toggle
			if (now - square.lastToggled > this.debouncePeriod) {
				square.selected = !square.selected;
				square.lastToggled = now; // Update the last toggled timestamp

				// Redraw the grid to reflect the updated state
				this.drawGrid();
			}
		}
	}

	private drawGrid(): void {
		const ctx = this.myCanvas.nativeElement.getContext('2d');
		if (!ctx) return;

		ctx.clearRect(0, 0, 1000, 1000); // Czyszczenie canvasa

		for (let x = 0; x < this.grid.length; x++) {
			for (let y = 0; y < this.grid[0].length; y++) {
				const square = this.grid[x][y];
				const { xCanvas, yCanvas, sizeCanvas } = square; // Destructuring dla czytelności

				ctx.strokeStyle = 'black';
				ctx.strokeRect(xCanvas, yCanvas, sizeCanvas, sizeCanvas);

				if (square.selected) {
					const padding = 2;
					const paddedSize = sizeCanvas - padding * 2;
					ctx.fillStyle = 'lightgrey';
					ctx.fillRect(xCanvas + padding, yCanvas + padding, paddedSize, paddedSize);
				}
			}
		}
	}

	private colorInitialArea(): void {
		const gridWidth = this.grid.length;
		const gridHeight = this.grid[0].length;
		const startX = Math.floor((gridWidth - this.initialWidth) / 2);
		const startY = Math.floor((gridHeight - this.initialHeight) / 2);

		// Reset grid selection before applying new initial area
		this.grid.forEach(row => row.forEach(cell => cell.selected = false));

		for (let x = startX; x < startX + this.initialWidth; x++) {
			for (let y = startY; y < startY + this.initialHeight; y++) {
				if (x >= 0 && x < gridWidth && y >= 0 && y < gridHeight) {
					this.grid[x][y].selected = true;
				}
			}
		}
	}

}
