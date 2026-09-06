export function drawCircle(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	r: number,
	fill?: string | null,
	stroke?: string | null,
	lineWidth = 1,
): void {
	ctx.beginPath();
	ctx.arc(x, y, r, 0, Math.PI * 2);
	if (fill) {
		ctx.fillStyle = fill;
		ctx.fill();
	}
	if (stroke) {
		ctx.strokeStyle = stroke;
		ctx.lineWidth = lineWidth;
		ctx.stroke();
	}
}

export function drawLine(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	x2: number,
	y2: number,
	color: string,
	width = 1,
): void {
	ctx.strokeStyle = color;
	ctx.lineWidth = width;
	ctx.beginPath();
	ctx.moveTo(x, y);
	ctx.lineTo(x2, y2);
	ctx.stroke();
}
