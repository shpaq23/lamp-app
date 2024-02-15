import { Injectable } from '@angular/core';
import { SquareInfo } from './square-canvas.component';

export interface LightPoint {
	x: number;
	y: number;
}

// export interface SquareInfo {
// 	selected: boolean;
// 	lastToggled: number;
// 	xCanvas: number;
// 	yCanvas: number;
// 	sizeCanvas: number;
// }

@Injectable({
	providedIn: 'root'
})
export class LightService {


	calculate(grid: SquareInfo[][], lightRadius: number): LightPoint[] {
		const lightPoints: LightPoint[] = [];

		// Przeliczanie promienia światła z metrów na piksele, uwzględniając rozmiar kwadratu na kanwie.
		// Zakładamy, że 1m = 20px, więc lightRadius * 20 daje nam promień w pikselach.
		const coverageRadiusPx = lightRadius * 20; // Promień oświetlenia w pikselach

		const gridWidth = grid.length;
		const gridHeight = grid[0].length;

		for (let x = 0; x < gridWidth; x++) {
			for (let y = 0; y < gridHeight; y++) {
				const square = grid[x][y];
				if (square.selected && !this.isLit(square.xCanvas + square.sizeCanvas / 2, square.yCanvas + square.sizeCanvas / 2, lightPoints, coverageRadiusPx)) {
					// Umieszczamy punkt światła w centrum zaznaczonego kwadratu na kanwie.
					lightPoints.push({ x: square.xCanvas + square.sizeCanvas / 2, y: square.yCanvas + square.sizeCanvas / 2 });
				}
			}
		}

		return lightPoints;
	}

	private isLit(x: number, y: number, lightPoints: LightPoint[], coverageRadiusPx: number): boolean {
		return lightPoints.some(point => {
			const dx = point.x - x;
			const dy = point.y - y;
			const distance = Math.sqrt(dx * dx + dy * dy);
			return distance <= coverageRadiusPx;
		});
	}

}