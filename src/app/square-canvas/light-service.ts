import { Injectable } from '@angular/core';
import { Lamp, LampLightInfo, Point, SquareInfo } from './square-canvas.component';

@Injectable({
	providedIn: 'root'
})
export class LightService {


	step1(grid: SquareInfo[][], lampLightInfo: LampLightInfo): Lamp[] {
		const meterToPixel = grid[0][0].sizeCanvas;
		const { buildingAreaLeftTop, buildingAreaRightBottom } = this.getAreaCorners(grid);
		return this.calculateLampPoints(lampLightInfo, buildingAreaLeftTop, buildingAreaRightBottom, meterToPixel);
	}

	step2(grid: SquareInfo[][], lampLightInfo: LampLightInfo): Lamp[] {
		const lamps = this.step1(grid, lampLightInfo);
		const meterToPixel = grid[0][0].sizeCanvas;
		const { buildingAreaLeftTop, buildingAreaRightBottom } = this.getAreaCorners(grid);
		const buildingAreaDiagonalCrossPoint = this.getDiagonalCrossPoint(buildingAreaLeftTop, buildingAreaRightBottom);
		console.log('areaDiagonalCrossPoint', buildingAreaDiagonalCrossPoint);

		const { lightAreaLeftTop, lightAreaRightBottom } = this.getLampCorners(lamps, lampLightInfo, meterToPixel);
		const lightAreaDiagonalCrossPoint = this.getDiagonalCrossPoint(lightAreaLeftTop, lightAreaRightBottom);
		console.log('lightAreaDiagonalCrossPoint', lightAreaDiagonalCrossPoint);

		const xDiff = buildingAreaDiagonalCrossPoint.xCanvas - lightAreaDiagonalCrossPoint.xCanvas;
		const yDiff = buildingAreaDiagonalCrossPoint.yCanvas - lightAreaDiagonalCrossPoint.yCanvas;

		console.log('xDiff', xDiff);
		console.log('yDiff', yDiff);

		const lampsMoved = lamps.map(lamp => {
			return {
				lightLeftTopPoint: {
					xCanvas: lamp.lightLeftTopPoint.xCanvas + xDiff,
					yCanvas: lamp.lightLeftTopPoint.yCanvas + yDiff
				},
				frameLeftTopPoint: {
					xCanvas: lamp.frameLeftTopPoint.xCanvas + xDiff,
					yCanvas: lamp.frameLeftTopPoint.yCanvas + yDiff
				}
			};
		});

		return lampsMoved;
	}

	step3(grid: SquareInfo[][], lampLightInfo: LampLightInfo): Lamp[] {
		const lamps = this.step2(grid, lampLightInfo);
		const meterToPixel = grid[0][0].sizeCanvas;
		const buildingAreaPoints = this.getBuildingAreaPoints(grid);

		const lampsWithLightningArea = this.calculateLampLightingAreaPercentage(buildingAreaPoints, lamps, lampLightInfo, meterToPixel);
		console.log('lampsWithLightningArea', lampsWithLightningArea);
		return lamps;
	}

	drawLight(lamps: Lamp[], lampLightInfo: LampLightInfo, meterToPixel: number, canvas: CanvasRenderingContext2D | undefined): void {
		if (!canvas) {
			return;
		}
		this.drawLamps(lamps, lampLightInfo, canvas, meterToPixel);
	}

	private calculateLampLightingAreaPercentage(buildingAreaPoints: Point[], lamps: Lamp[], lampInfo: LampLightInfo, meterToPx: number): Lamp[] {
		// Assuming getGenericLampAreaPoints returns a list of points relative to (0,0) for the lamp's lighting area
		const genericLampAreaPoints = this.getGenericLampAreaPoints(lampInfo, meterToPx);

		// Convert buildingAreaPoints into a more efficient structure for point existence checking
		const buildingAreaSet = new Set(buildingAreaPoints.map(p => `${p.xCanvas},${p.yCanvas}`));

		return lamps.map(lamp => {
			// Translate generic lamp area points to lamp's position
			const translatedLampAreaPoints = genericLampAreaPoints.map(p => ({
				xCanvas: p.xCanvas + lamp.lightLeftTopPoint.xCanvas,
				yCanvas: p.yCanvas + lamp.lightLeftTopPoint.yCanvas
			}));

			// Count how many of these points are in the building area
			const lampLightingAreaPointsCount = translatedLampAreaPoints.filter(p => buildingAreaSet.has(`${p.xCanvas},${p.yCanvas}`)).length;

			const percentage = lampLightingAreaPointsCount / translatedLampAreaPoints.length;
			const lightingAreaPercentage = Math.round(percentage * 100) / 100;
			return { ...lamp, lightingAreaPercentage };
		});
	}

	private getGenericLampAreaPoints(lampInfo: LampLightInfo, meterToPx: number): Point[] {
		// Determine the width and height of the light area in pixels
		const lightAreaWidth = (lampInfo.lampPosition === 'vertical' ? lampInfo.lampLightWidthInM : lampInfo.lampLightHeightInM) * meterToPx;
		const lightAreaHeight = (lampInfo.lampPosition === 'vertical' ? lampInfo.lampLightHeightInM : lampInfo.lampLightWidthInM) * meterToPx;

		const points: Point[] = [];

		// Generate points for the light area, relative to a generic origin (0,0)
		for (let x = 0; x <= lightAreaWidth; x++) {
			for (let y = 0; y <= lightAreaHeight; y++) {
				// Here, instead of adding points based on the lamp's actual position,
				// we generate them as if the lamp is positioned at the origin (0,0).
				// These points will later be translated to each lamp's actual position.
				points.push({ xCanvas: x, yCanvas: y });
			}
		}

		return points;
	}

	private getBuildingAreaPoints(grid: SquareInfo[][]): Point[] {
		const areaGrid: Point[] = grid.reduce((acc, row) => {
			return acc.concat(row
				.filter(cell => cell.selected)
				.map(cell => ({ xCanvas: cell.xCanvas, yCanvas: cell.yCanvas }))
			);
		}, [] as Point[]);
		const points: Point[] = [];

		const cellSize = grid[0][0].sizeCanvas;

		areaGrid.forEach((point, index) => {
			for (let x = 0; x <= cellSize; x++) {
				for (let y = 0; y <= cellSize; y++) {
					points.push({ xCanvas: point.xCanvas + x, yCanvas: point.yCanvas + y });
				}
			}
		});
		return points;
	}


	private getDiagonalCrossPoint(leftTopCorner: Point, rightBottomCorner: Point): Point {
		return {
			xCanvas: (leftTopCorner.xCanvas + rightBottomCorner.xCanvas) / 2,
			yCanvas: (leftTopCorner.yCanvas + rightBottomCorner.yCanvas) / 2
		};
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


	private getLampCorners(lamps: Lamp[], lampInfo: LampLightInfo, meterToPx: number): { lightAreaLeftTop: Point, lightAreaRightBottom: Point } {
		const areaGrid = lamps.map(lamp => lamp.lightLeftTopPoint);
		const leftTop = this.findLeftTopCorner(areaGrid);
		const rightBottom = this.findRightBottomCorner(areaGrid);
		rightBottom.xCanvas += (lampInfo.lampPosition === 'vertical' ? lampInfo.lampLightWidthInM : lampInfo.lampLightHeightInM) * meterToPx;
		rightBottom.yCanvas += (lampInfo.lampPosition === 'vertical' ? lampInfo.lampLightHeightInM : lampInfo.lampLightWidthInM) * meterToPx;
		console.log('lightAreaLeftTop', leftTop);
		console.log('lightAreaRightBottom', rightBottom);
		return { lightAreaLeftTop: leftTop, lightAreaRightBottom: rightBottom };
	}

	private getAreaCorners(grid: SquareInfo[][]): { buildingAreaLeftTop: Point, buildingAreaRightBottom: Point } {
		const squareSize = grid[0][0].sizeCanvas;
		const areaGrid: Point[] = grid.reduce((acc, row) => {
			return acc.concat(row
				.filter(cell => cell.selected)
				.map(cell => ({ xCanvas: cell.xCanvas, yCanvas: cell.yCanvas }))
			);
		}, [] as Point[]);
		console.log('areaGrid', areaGrid);
		const leftTop = this.findLeftTopCorner(areaGrid);
		const rightBottom = this.findRightBottomCorner(areaGrid);
		rightBottom.xCanvas += squareSize;
		rightBottom.yCanvas += squareSize;
		return { buildingAreaLeftTop: leftTop, buildingAreaRightBottom: rightBottom };
	}


	private findLeftTopCorner(areaGrid: Point[]): Point {
		let leftTop: Point = { xCanvas: Infinity, yCanvas: Infinity };
		for (let square of areaGrid) {
			if (square.xCanvas < leftTop.xCanvas || (square.xCanvas === leftTop.xCanvas && square.yCanvas < leftTop.yCanvas)) {
				leftTop = { xCanvas: square.xCanvas, yCanvas: square.yCanvas };
			}
		}
		return leftTop;
	}


	private findRightBottomCorner(areaGrid: Point[]): Point {
		let rightBottom: Point = { xCanvas: -Infinity, yCanvas: -Infinity };
		for (let square of areaGrid) {
			if (square.xCanvas > rightBottom.xCanvas || (square.xCanvas === rightBottom.xCanvas && square.yCanvas > rightBottom.yCanvas)) {
				rightBottom = { xCanvas: square.xCanvas, yCanvas: square.yCanvas };
			}
		}
		return { xCanvas: rightBottom.xCanvas, yCanvas: rightBottom.yCanvas };
	}

}
