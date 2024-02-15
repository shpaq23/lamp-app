import { Injectable } from '@angular/core';
import { SquareInfo } from './square-canvas.component';

export interface LightPoint {
	x: number;
	y: number;
}


@Injectable({
	providedIn: 'root'
})
export class LightService {

	calculate(grid: SquareInfo[][], lightValue: number, squareSize: number): LightPoint[] {
		const lightPoints: LightPoint[] = [];

		// Przeliczanie promienia oświetlenia z metrów na jednostki siatki, uwzględniając rozmiar kwadratu w pikselach.
		// Ponieważ 1 kwadrat = 1m², a lightValue jest promieniem w metrach, nie musimy przeliczać promienia na piksele.
		// Zamiast tego bezpośrednio używamy lightValue jako promień w "jednostkach" kwadratów siatki.
		const coverageRadiusInSquares = lightValue; // Promień oświetlenia w jednostkach kwadratów siatki

		const gridWidth = grid.length;
		const gridHeight = grid[0].length;

		for (let x = 0; x < gridWidth; x++) {
			for (let y = 0; y < gridHeight; y++) {
				if (grid[x][y].selected && !this.isLit(x, y, lightPoints, coverageRadiusInSquares)) {
					lightPoints.push({x: x, y: y}); // Umieszczanie punktu światła bez przesunięcia o 0.5
				}
			}
		}

		return lightPoints;
	}

	private isLit(x: number, y: number, lightPoints: LightPoint[], coverageRadius: number): boolean {
		return lightPoints.some(point => {
			const dx = point.x - x;
			const dy = point.y - y;
			const distance = Math.sqrt(dx * dx + dy * dy);
			return distance <= coverageRadius;
		});
	}
}