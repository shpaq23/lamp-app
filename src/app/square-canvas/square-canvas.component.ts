import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { LightPoint, LightService } from './light-service';

// Define a type for square information
export interface SquareInfo {
	selected: boolean;
	lastToggled: number;
	xCanvas: number;
	yCanvas: number;
	sizeCanvas: number;
}

@Component({
	selector: 'app-square-canvas',
	template: `
		<div>
			Initial Area Width: <input (change)="updateInitialArea()" [(ngModel)]="initialWidth" type="number">
			Initial Area Height: <input (change)="updateInitialArea()" [(ngModel)]="initialHeight" type="number">
			Light Value in m2: <input type="number" [(ngModel)]="lightValue">

		</div>
		<button (click)="calculate()">Calculate</button>
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

	lightValue: number = 1.4; // Domyślna wartość pokrycia


	initialWidth: number = 10; // Default initial width
	initialHeight: number = 10; // Default initial height

	constructor(
		private readonly lightService: LightService
	) {
	}


	ngAfterViewInit(): void {
		this.drawGrid();
	}

	updateInitialArea(): void {
		this.colorInitialArea();
		this.drawGrid();
	}

	calculate(): void {
		const lightPoints = this.lightService.calculate(this.grid, this.lightValue);
		this.drawGrid();
		console.log(lightPoints);
		this.drawLightPoints(lightPoints, this.lightValue);
	}


	drawLightPoints(lightPoints: LightPoint[], lightValue: number): void {
		const ctx = this.myCanvas.nativeElement.getContext('2d');
		if (!ctx) return;

		// Przeliczanie promienia światła z metrów na piksele, zakładając że 1m = 20px
		const radiusInPixels = lightValue * 20; // Promień światła w pikselach

		lightPoints.forEach(point => {
			const centerX = point.x; // Współrzędna x punktu światła jest już w pikselach
			const centerY = point.y; // Współrzędna y punktu światła jest już w pikselach

			ctx.beginPath();
			ctx.arc(centerX, centerY, radiusInPixels, 0, Math.PI * 2);
			ctx.fillStyle = 'rgba(255, 255, 0, 0.5)'; // Ustawienie koloru i przezroczystości światła
			ctx.fill();

			ctx.strokeStyle = 'black'; // Ustawienie koloru obramowania
			ctx.lineWidth = 1; // Ustawienie grubości linii obramowania
			ctx.stroke(); // Rysowanie obramowania
		});
	}



	colorInitialArea(): void {
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

	drawGrid(): void {
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
}
