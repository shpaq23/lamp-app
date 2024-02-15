import { Injectable } from '@angular/core';
import { LampLightInfo, LampPoint, SquareInfo } from './square-canvas.component';

@Injectable({
	providedIn: 'root'
})
export class LightService {


	calculate(grid: SquareInfo[][], lampLightInfo: LampLightInfo): LampPoint[] {
		const lampPoints: LampPoint[] = [];
		const gridWidth = grid.length;
		const gridHeight = grid[0].length;

		// Zakładamy, że jednostki lampLightWidthInM i lampLightHeightInM są już dostosowane do siatki
		const lampLightWidth = Math.ceil(lampLightInfo.lampLightWidthInM);
		const lampLightHeight = Math.ceil(lampLightInfo.lampLightHeightInM);

		// Obliczanie kroku rozmieszczenia lamp w zależności od ich orientacji
		let stepX = lampLightInfo.lampPosition === 'horizontal' ? lampLightWidth : 1;
		let stepY = lampLightInfo.lampPosition === 'vertical' ? lampLightHeight : 1;

		for (let x = 0; x < gridWidth; x += stepX) {
			for (let y = 0; y < gridHeight; y += stepY) {
				let isAreaSelected = false;

				// Sprawdzanie, czy jakikolwiek kwadrat w obszarze lampy jest zaznaczony
				for (let lx = 0; lx < stepX && x + lx < gridWidth; lx++) {
					for (let ly = 0; ly < stepY && y + ly < gridHeight; ly++) {
						if (grid[x + lx][y + ly].selected) {
							isAreaSelected = true;
							break;
						}
					}
					if (isAreaSelected) break;
				}

				if (isAreaSelected) {
					lampPoints.push({ xCanvas: x * 20, yCanvas: y * 20 }); // Założenie, że rozmiar kwadratu to 20
				}
			}
		}

		return lampPoints;
	}

}
