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

		const { lightAreaLeftTop, lightAreaRightBottom } = this.getLampCorners(lamps, lampLightInfo, meterToPixel);
		const lightAreaDiagonalCrossPoint = this.getDiagonalCrossPoint(lightAreaLeftTop, lightAreaRightBottom);

		const xDiff = buildingAreaDiagonalCrossPoint.xCanvas - lightAreaDiagonalCrossPoint.xCanvas;
		const yDiff = buildingAreaDiagonalCrossPoint.yCanvas - lightAreaDiagonalCrossPoint.yCanvas;

		return lamps.map(lamp => {
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
	}

	step3(grid: SquareInfo[][], lampLightInfo: LampLightInfo): Lamp[] {
		const lamps = this.step2(grid, lampLightInfo);
		const meterToPixel = grid[0][0].sizeCanvas;
		const buildingAreaPoints = this.getBuildingAreaPoints(grid);

		const lampsWithLightningArea = this.calculateLampLightingAreaPercentage(buildingAreaPoints, lamps, lampLightInfo, meterToPixel);
		return lampsWithLightningArea.filter(lamp => (lamp.lightingAreaPercentage * 100) >= lampLightInfo.percentageOfLightThreshold);
	}

	step4(grid: SquareInfo[][], lampLightInfo: LampLightInfo): Lamp[] {
		const lamps = this.step3(grid, lampLightInfo);
		const meterToPixel = grid[0][0].sizeCanvas;
		const buildingAreaPoints = this.getBuildingAreaPoints(grid);

		return this.moveOffsetLamps(buildingAreaPoints, lamps, lampLightInfo, meterToPixel);
	}

	drawLight(lamps: Lamp[], lampLightInfo: LampLightInfo, meterToPixel: number, canvas: CanvasRenderingContext2D | undefined): void {
		if (!canvas) {
			return;
		}
		this.drawLamps(lamps, lampLightInfo, canvas, meterToPixel);
	}

	private moveOffsetLamps(buildingAreaPoints: Point[], lamps: Lamp[], lampLightInfo: LampLightInfo, meterToPixel: number): Lamp[] {
		return lamps
			.map(lamp => {
				if (lamp.lightingAreaPercentage === 1) {
					return { ...lamp };
				}
				const lampFrameOffsetPoints = this.calculateLampFrameOffsetPoints(buildingAreaPoints, lamp, lampLightInfo, meterToPixel);
				if (lampLightInfo.lampPosition === 'vertical') {
					const lampFrameOffsetYUniques = Array.from(new Set(lampFrameOffsetPoints.map(p => p.yCanvas)));
					const isTopOffset = lampFrameOffsetYUniques[0] <= lamp.frameLeftTopPoint.yCanvas;
					const isBotOffset = lampFrameOffsetYUniques[0] > lamp.frameLeftTopPoint.yCanvas;
					const offset = lampFrameOffsetYUniques.length;

					if (isTopOffset) {
						lamp.frameLeftTopPoint.yCanvas += offset;
						lamp.lightLeftTopPoint.yCanvas += offset;
						lamp.hasLampMoved = true;
					}

					if (isBotOffset) {
						lamp.frameLeftTopPoint.yCanvas -= offset;
						lamp.lightLeftTopPoint.yCanvas -= offset;
						lamp.hasLampMoved = true;
					}
					return { ...lamp, lightingAreaPercentage: undefined };
				}
				if (lampLightInfo.lampPosition === 'horizontal') {
					const lampFrameOffsetXUniques = Array.from(new Set(lampFrameOffsetPoints.map(p => p.xCanvas)));
					const isLeftOffset = lampFrameOffsetXUniques[0] <= lamp.frameLeftTopPoint.xCanvas;
					const isRightOffset = lampFrameOffsetXUniques[0] > lamp.frameLeftTopPoint.xCanvas;
					const offset = lampFrameOffsetXUniques.length;

					if (isLeftOffset) {
						lamp.frameLeftTopPoint.xCanvas += offset;
						lamp.lightLeftTopPoint.xCanvas += offset;
						lamp.hasLampMoved = true;
					}

					if (isRightOffset) {
						lamp.frameLeftTopPoint.xCanvas -= offset;
						lamp.lightLeftTopPoint.xCanvas -= offset;
						lamp.hasLampMoved = true;
					}
					return { ...lamp, lightingAreaPercentage: undefined };
				}
				return { ...lamp };
			});


	}


	private calculateLampFrameOffsetPoints(buildingAreaPoints: Point[], lamp: Lamp, lampLightInfo: LampLightInfo, meterToPx: number): Point[] {
		const buildingAreaSet = new Set(buildingAreaPoints.map(p => `${p.xCanvas},${p.yCanvas}`));
		const frameWidth = (lampLightInfo.lampPosition === 'vertical' ? lampLightInfo.lampWidthInM : lampLightInfo.lampHeightInM) * meterToPx;
		const frameHeight = (lampLightInfo.lampPosition === 'vertical' ? lampLightInfo.lampHeightInM : lampLightInfo.lampWidthInM) * meterToPx;
		const lampFrameOffsetPoints: Point[] = [];
		for (let x = 0; x <= frameWidth; x++) {
			for (let y = 0; y <= frameHeight; y++) {
				const point = { xCanvas: lamp.frameLeftTopPoint.xCanvas + x, yCanvas: lamp.frameLeftTopPoint.yCanvas + y };
				if (!buildingAreaSet.has(`${point.xCanvas},${point.yCanvas}`)) {
					lampFrameOffsetPoints.push(point);
				}
			}
		}

		return lampFrameOffsetPoints;
	}

	private calculateLampLightingAreaPercentage(buildingAreaPoints: Point[], lamps: Lamp[], lampInfo: LampLightInfo, meterToPx: number): Lamp[] {
		const genericLampAreaPoints = this.getGenericLampAreaPoints(lampInfo, meterToPx);

		const buildingAreaSet = new Set(buildingAreaPoints.map(p => `${p.xCanvas},${p.yCanvas}`));

		return lamps.map(lamp => {
			const translatedLampAreaPoints = genericLampAreaPoints.map(p => ({
				xCanvas: p.xCanvas + lamp.lightLeftTopPoint.xCanvas,
				yCanvas: p.yCanvas + lamp.lightLeftTopPoint.yCanvas
			}));

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
		const movedLightAreaColor = 'rgba(0, 255, 0, 0.5)';
		ctx.strokeStyle = 'orange';
		ctx.lineWidth = 1;

		lamps.forEach(lamp => {
			ctx.fillStyle = lamp.hasLampMoved ? movedLightAreaColor : lightAreaColor;
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
		const leftTop = this.findLeftTopCorner(areaGrid);
		const rightBottom = this.findRightBottomCorner(areaGrid);
		rightBottom.xCanvas += squareSize;
		rightBottom.yCanvas += squareSize;
		return { buildingAreaLeftTop: leftTop, buildingAreaRightBottom: rightBottom };
	}


	private findLeftTopCorner(areaGrid: Point[]): Point {
		let minX = Infinity;
		let minY = Infinity;

		for (let square of areaGrid) {
			if (square.xCanvas < minX) {
				minX = square.xCanvas;
			}
			if (square.yCanvas < minY) {
				minY = square.yCanvas;
			}
		}

		return { xCanvas: minX, yCanvas: minY };
	}


	private findRightBottomCorner(areaGrid: Point[]): Point {
		let maxX = -Infinity;
		let maxY = -Infinity;

		for (let square of areaGrid) {
			if (square.xCanvas > maxX) {
				maxX = square.xCanvas;
			}
			if (square.yCanvas > maxY) {
				maxY = square.yCanvas;
			}
		}

		return { xCanvas: maxX, yCanvas: maxY };
	}

}
