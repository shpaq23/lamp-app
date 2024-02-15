import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { LightPoint, LightService, SquareInfo } from './light-service';

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

	grid: SquareInfo[][] = Array(50).fill(null).map(() => Array(50).fill(null).map(() => ({
		selected: false,
		lastToggled: 0
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
		const lightPoints = this.lightService.calculate(this.grid, this.lightValue, this.squareSize);
		this.drawGrid();
		this.drawLightPoints(lightPoints, this.lightValue);
	}

	drawLightPoints(lightPoints: LightPoint[], lightValue: number): void {
		const ctx = this.myCanvas.nativeElement.getContext('2d');
		if (!ctx) return;

		// Skalowanie promienia światła do pikseli na canvasie, lightValue jest traktowane jako promień
		const radiusInPixels = lightValue * this.squareSize;

		lightPoints.forEach(point => {
			const centerX = point.x * this.squareSize + this.squareSize / 2; // Centrowanie punktu światła
			const centerY = point.y * this.squareSize + this.squareSize / 2; // Centrowanie punktu światła

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

		const padding = 2; // Adjust the padding size as needed
		const paddedSize = this.squareSize - padding * 2; // Calculate the size for the filled square after applying padding

		ctx.clearRect(0, 0, 1000, 1000); // Clear the canvas before redrawing

		for (let x = 0; x < this.grid.length; x++) {
			for (let y = 0; y < this.grid[0].length; y++) {
				const square = this.grid[x][y];
				const topLeftX = x * this.squareSize;
				const topLeftY = y * this.squareSize;

				// Always draw the border for both selected and unselected squares
				ctx.strokeStyle = 'black';
				ctx.strokeRect(topLeftX, topLeftY, this.squareSize, this.squareSize);

				if (square.selected) {
					// Then draw the smaller filled square inside for selected squares
					ctx.fillStyle = 'lightgrey';
					ctx.fillRect(topLeftX + padding, topLeftY + padding, paddedSize, paddedSize);
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
