import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';

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
	lampPosition: 'horizontal' | 'vertical';
}

export interface LampPoint {
	xCanvas: number;
	yCanvas: number;
}

@Component({
	selector: 'app-square-canvas',
	template: `
		<div>
			Initial Area Width: <input (change)="updateInitialArea()" [(ngModel)]="initialWidth" type="number">
			Initial Area Height: <input (change)="updateInitialArea()" [(ngModel)]="initialHeight" type="number">
			Lamp Width in M: <input [(ngModel)]="lampWidthInM" type="number">
			Lamp Height in M: <input [(ngModel)]="lampHeightInM" type="number">
			Lamp Light Width in M: <input [(ngModel)]="lampLightWidthInM" type="number">
			Lamp Light Height in M: <input [(ngModel)]="lampLightHeightInM" type="number">
			Lamp Position: <select [(ngModel)]="lampPosition">
			<option value="horizontal">Horizontal</option>
			<option value="vertical">Vertical</option>
		</select>

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

	lampWidthInM: number = 0.1; // Default lamp width

	lampHeightInM: number = 1; // Default lamp height

	lampLightWidthInM: number = 1.0; // Default lamp light width

	lampLightHeightInM: number = 1.5; // Default lamp light height

	lampPosition: 'horizontal' | 'vertical' = 'vertical'; // Default lamp position


	ngAfterViewInit(): void {
		this.drawGrid();
	}

	updateInitialArea(): void {
		this.colorInitialArea();
		this.drawGrid();
	}

	calculate(): void {
		const lampInfo = {
			lampWidthInM: this.lampWidthInM,
			lampHeightInM: this.lampHeightInM,
			lampLightHeightInM: this.lampLightHeightInM,
			lampLightWidthInM: this.lampLightWidthInM,
			lampPosition: this.lampPosition
		};
		const lampPoints = this.calculateLampPosition(this.grid, lampInfo);
		this.drawGrid();
		console.log(lampPoints);
		this.drawLamps(lampPoints, lampInfo);
	}


	calculateLampPosition(grid: SquareInfo[][], lampLightInfo: LampLightInfo): LampPoint[] {
		const lampPoints: LampPoint[] = [];

		// Przeliczanie wymiarów światła z metrów na piksele
		const lightWidthPx = lampLightInfo.lampLightWidthInM * this.squareSize;
		const lightHeightPx = lampLightInfo.lampLightHeightInM * this.squareSize;

		// Znalezienie zakresu zaznaczonych kwadratów
		let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
		grid.forEach((row, x) => {
			row.forEach((cell, y) => {
				if (cell.selected) {
					minX = Math.min(minX, x);
					maxX = Math.max(maxX, x);
					minY = Math.min(minY, y);
					maxY = Math.max(maxY, y);
				}
			});
		});

		// Ustalenie kierunku rozprzestrzeniania się światła
		const isHorizontal = lampLightInfo.lampPosition === 'horizontal';

		// Dostosowanie kroków iteracji w zależności od orientacji światła lampy
		const stepX = isHorizontal ? 1 : Math.ceil(lightWidthPx / this.squareSize);
		const stepY = isHorizontal ? Math.ceil(lightHeightPx / this.squareSize) : 1;

		for (let x = minX; x <= maxX; x += stepX) {
			for (let y = minY; y <= maxY; y += stepY) {
				if (grid[x][y].selected) {
					// Sprawdzenie, czy obszar nie jest już pokryty przez światło innej lampy
					const isAlreadyCovered = lampPoints.some(lampPoint => {
						const distX = Math.abs(lampPoint.xCanvas / this.squareSize - x);
						const distY = Math.abs(lampPoint.yCanvas / this.squareSize - y);
						return (isHorizontal && distX * this.squareSize < lightWidthPx) || (!isHorizontal && distY * this.squareSize < lightHeightPx);
					});

					if (!isAlreadyCovered) {
						const lampX = x * this.squareSize;
						const lampY = y * this.squareSize;
						lampPoints.push({ xCanvas: lampX, yCanvas: lampY });
					}
				}
			}
		}

		return lampPoints;
	}


	drawLamps(lampPoints: LampPoint[], lampInfo: LampLightInfo): void {
		// Pobieranie kontekstu 2D z elementu canvas
		const ctx = this.myCanvas.nativeElement.getContext('2d');
		if (!ctx) {
			return;
		}

		// Ustawienia dla rysowania obszaru świetlnego
		const lightAreaColor = 'rgba(255, 255, 0, 0.5)'; // Kolor obszaru świetlnego z przezroczystością
		ctx.strokeStyle = 'orange'; // Kolor obramowania obszaru świetlnego
		ctx.lineWidth = 1; // Grubość linii obramowania

		// Przeliczanie wymiarów lampy z metrów na piksele
		const lampWidthPx = lampInfo.lampWidthInM * this.squareSize;
		const lampHeightPx = lampInfo.lampHeightInM * this.squareSize;

		lampPoints.forEach(lampPoint => {
			// Rysowanie obszaru świetlnego w zależności od orientacji lampy
			ctx.fillStyle = lightAreaColor;
			let lightWidthPx, lightHeightPx;
			if (lampInfo.lampPosition === 'horizontal') {
				lightWidthPx = lampInfo.lampLightHeightInM * this.squareSize;
				lightHeightPx = lampInfo.lampLightWidthInM * this.squareSize;
			} else {
				lightWidthPx = lampInfo.lampLightWidthInM * this.squareSize;
				lightHeightPx = lampInfo.lampLightHeightInM * this.squareSize;
			}
			ctx.beginPath();
			ctx.rect(lampPoint.xCanvas, lampPoint.yCanvas, lightWidthPx, lightHeightPx);
			ctx.fill();
			ctx.stroke();

			// Rysowanie czarnego paska reprezentującego lampę
			ctx.fillStyle = 'black';
			let barX, barY, barWidth, barHeight;
			if (lampInfo.lampPosition === 'horizontal') {
				// Poziomy pasek
				barWidth = lampInfo.lampHeightInM * this.squareSize;
				barHeight = lampInfo.lampWidthInM * this.squareSize;
				barX = lampPoint.xCanvas + (lightWidthPx - barWidth) / 2;
				barY = lampPoint.yCanvas + (lightHeightPx - barHeight) / 2;
			} else { // 'vertical'
				// Pionowy pasek
				barWidth = lampInfo.lampWidthInM * this.squareSize;
				barHeight = lampInfo.lampHeightInM * this.squareSize;
				barX = lampPoint.xCanvas + (lightWidthPx - barWidth) / 2;
				barY = lampPoint.yCanvas + (lightHeightPx - barHeight) / 2;
			}
			ctx.beginPath();
			ctx.rect(barX, barY, barWidth, barHeight);
			ctx.fill();
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
