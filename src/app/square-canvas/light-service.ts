import { Injectable } from '@angular/core';
import { Lamp, LampLightInfo, Point, SquareInfo } from './square-canvas.component';

@Injectable({
	providedIn: 'root'
})
export class LightService {


	drawLight(grid: SquareInfo[][], lampLightInfo: LampLightInfo, canvas: CanvasRenderingContext2D | undefined): void {
		if (!canvas) {
			return;
		}
		const meterToPixel = grid[0][0].sizeCanvas;
		const { leftTop, rightBottom } = this.getAreaCorners(grid);
		const lamps = this.calculateLampPoints(lampLightInfo, leftTop, rightBottom, meterToPixel);
		console.log('lamps', lamps);
		this.drawLamps(lamps, lampLightInfo, canvas, meterToPixel);
	}


	private drawLamps(lamps: Lamp[], lampInfo: LampLightInfo, ctx: CanvasRenderingContext2D, meterToPixel: number): void {

		const lightAreaColor = 'rgba(255, 255, 0, 0.5)';
		ctx.strokeStyle = 'orange';
		ctx.lineWidth = 1;

		lamps.forEach(lamp => {
			ctx.fillStyle = lightAreaColor;
			const lightWidthPx = (lampInfo.lampPosition === 'horizontal' ? lampInfo.lampLightHeightInM : lampInfo.lampLightWidthInM) * meterToPixel;
			const lightHeightPx = (lampInfo.lampPosition === 'horizontal' ? lampInfo.lampLightWidthInM : lampInfo.lampLightHeightInM) * meterToPixel;
			ctx.beginPath();
			ctx.rect(lamp.lightLeftTopPoint.xCanvas, lamp.lightLeftTopPoint.yCanvas, lightWidthPx, lightHeightPx);
			ctx.fill();
			ctx.stroke();

			ctx.fillStyle = 'black';
			const frameWidthPx = (lampInfo.lampPosition === 'horizontal' ? lampInfo.lampHeightInM : lampInfo.lampWidthInM) * meterToPixel;
			const frameHeightPx = (lampInfo.lampPosition === 'horizontal' ? lampInfo.lampWidthInM : lampInfo.lampHeightInM) * meterToPixel;

			ctx.beginPath();
			ctx.rect(lamp.frameLeftTopPoint.xCanvas, lamp.frameLeftTopPoint.yCanvas, frameWidthPx, frameHeightPx);
			ctx.fill();
		});
	}


	private calculateLampPoints(lampLightInfo: LampLightInfo, leftTopCorner: Point, rightBottomCorner: Point, meterToPixel: number): Lamp[] {
		const areaWidth = rightBottomCorner.xCanvas - leftTopCorner.xCanvas;
		const areaHeight = rightBottomCorner.yCanvas - leftTopCorner.yCanvas;

		const lampLightWidth = (lampLightInfo.lampPosition === 'vertical' ? lampLightInfo.lampLightWidthInM : lampLightInfo.lampLightHeightInM) * meterToPixel;
		const lampLightHeight = (lampLightInfo.lampPosition === 'vertical' ? lampLightInfo.lampLightHeightInM : lampLightInfo.lampLightWidthInM) * meterToPixel;

		const frameWidth = (lampLightInfo.lampPosition === 'vertical' ? lampLightInfo.lampWidthInM : lampLightInfo.lampHeightInM) * meterToPixel;
		const frameHeight = (lampLightInfo.lampPosition === 'vertical' ? lampLightInfo.lampHeightInM : lampLightInfo.lampWidthInM) * meterToPixel;


		const lampsInRow = Math.ceil(areaWidth / lampLightWidth);
		const lampsInColumn = Math.ceil(areaHeight / lampLightHeight);


		let lamps: Lamp[] = [];

		for (let i = 0; i < lampsInRow; i++) {
			for (let j = 0; j < lampsInColumn; j++) {
				const lightLeftTopPoint: Point = {
					xCanvas: leftTopCorner.xCanvas + i * lampLightWidth,
					yCanvas: leftTopCorner.yCanvas + j * lampLightHeight
				};
				const frameLeftTopPoint: Point = {
					xCanvas: lightLeftTopPoint.xCanvas + lampLightWidth / 2 - frameWidth / 2,
					yCanvas: lightLeftTopPoint.yCanvas + lampLightHeight / 2 - frameHeight / 2
				};
				lamps.push({ lightLeftTopPoint, frameLeftTopPoint });
			}
		}

		return lamps;
	}

	private getAreaCorners(grid: SquareInfo[][]): { leftTop: Point, rightBottom: Point } {
		const areaGrid = grid.reduce((acc, row) => {
			return acc.concat(row.filter(cell => cell.selected));
		}, []);
		console.log('areaGrid', areaGrid);
		const leftTop = this.findLeftTopCorner(areaGrid);
		const rightBottom = this.findRightBottomCorner(areaGrid);

		return { leftTop, rightBottom };
	}


	private findLeftTopCorner(areaGrid: SquareInfo[]): Point {
		let leftTop: Point = { xCanvas: Infinity, yCanvas: Infinity };
		for (let square of areaGrid) {
			if (square.xCanvas < leftTop.xCanvas || (square.xCanvas === leftTop.xCanvas && square.yCanvas < leftTop.yCanvas)) {
				leftTop = { xCanvas: square.xCanvas, yCanvas: square.yCanvas };
			}
		}
		return leftTop;
	}


	private findRightBottomCorner(areaGrid: SquareInfo[]): Point {
		const squareSize = areaGrid[0].sizeCanvas;
		let rightBottom: Point = { xCanvas: -Infinity, yCanvas: -Infinity };
		for (let square of areaGrid) {
			if (square.xCanvas > rightBottom.xCanvas || (square.xCanvas === rightBottom.xCanvas && square.yCanvas > rightBottom.yCanvas)) {
				rightBottom = { xCanvas: square.xCanvas, yCanvas: square.yCanvas };
			}
		}
		return { xCanvas: rightBottom.xCanvas + squareSize, yCanvas: rightBottom.yCanvas + squareSize };
	}

}
