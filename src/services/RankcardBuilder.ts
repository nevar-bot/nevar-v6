import { Canvas, CanvasRenderingContext2D, createCanvas, Image, loadImage } from 'canvas';
import { FormatUtils } from '@utils/format-utils.js';
const formatUtilsInstance: FormatUtils = new FormatUtils();

async function image(url: string): Promise<Image|null> {
	try{
		new URL(url);
		return await loadImage(url);
	}catch(error: unknown){
		return null
	}
}

function formatXp(xp: number): string {
	if(xp >= 1000) {
		return (xp / 1000).toFixed(1) + 'K';
	}
	return xp.toString();
}

class RankcardBuilder {
	public displayName: string;

	public currentLevel: number;
	public currentRank: number;
	public currentXp: number;
	public requiredXp: number;
	public avatar?: string;
	public font: string;

	constructor({ displayName, currentLevel, currentRank, currentXp, requiredXp, avatar}) {
		this.displayName = displayName;
		this.currentLevel = currentLevel;
		this.currentRank = currentRank;
		this.currentXp = currentXp;
		this.requiredXp = requiredXp;
		this.avatar = avatar;
		this.font = 'Verdana';
	}

	async draw(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): Promise<void> {
		// Border radius
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(1000, 250);
		ctx.arcTo(0, 250, 0, 0, 30);
		ctx.arcTo(0, 0, 1000, 0, 30);
		ctx.arcTo(1000, 0, 1000, 250, 30);
		ctx.arcTo(1000, 250, 0, 250, 30);
		ctx.clip();

		// Background
		ctx.fillStyle = '#070d19';
		ctx.fillRect(0, 0, canvasWidth, canvasHeight);

		// Bubbles
		ctx.beginPath();
		ctx.arc(153, 225, 10, 0, Math.PI * 2);
		ctx.fillStyle = formatUtilsInstance.hexToRgbA('#0CA7FF', 0.31);
		ctx.fill();
		ctx.closePath();

		ctx.arc(213, 81, 10, 0, Math.PI * 2);
		ctx.fillStyle = formatUtilsInstance.hexToRgbA('#0CA7FF', 0.07);
		ctx.fill();
		ctx.closePath();

		ctx.arc(238, 16, 10, 0, Math.PI * 2);
		ctx.fillStyle = formatUtilsInstance.hexToRgbA('#0CA7FF', 0.6);
		ctx.fill();
		ctx.closePath();

		ctx.beginPath();
		ctx.arc(486, 148, 40, 0, Math.PI * 2);
		ctx.fillStyle = formatUtilsInstance.hexToRgbA('#0CA7FF', 0.1);
		ctx.fill();
		ctx.closePath();

		ctx.beginPath();
		ctx.arc(396.5, 33.5, 7.5, 0, Math.PI * 2);
		ctx.fillStyle = formatUtilsInstance.hexToRgbA('#0CA7FF', 0.05);
		ctx.fill();
		ctx.closePath();

		ctx.beginPath();
		ctx.arc(515.5, 38.5, 12.5, 0, Math.PI * 2);
		ctx.fillStyle = formatUtilsInstance.hexToRgbA('#0CA7FF', 0.43);
		ctx.fill();
		ctx.closePath();

		ctx.beginPath();
		ctx.arc(572, 257, 30, 0, Math.PI * 2);
		ctx.fillStyle = formatUtilsInstance.hexToRgbA('#0CA7FF', 1);
		ctx.fill();
		ctx.closePath();

		ctx.beginPath();
		ctx.arc(782.5, 226.5, 8.5, 0, Math.PI * 2);
		ctx.fillStyle = formatUtilsInstance.hexToRgbA('#0CA7FF', 0.15);
		ctx.fill();
		ctx.closePath();

		ctx.beginPath();
		ctx.arc(1000, 101, 10, 0, Math.PI * 2);
		ctx.fillStyle = formatUtilsInstance.hexToRgbA('#0CA7FF', 0.63);
		ctx.fill();
		ctx.closePath();

		ctx.restore();

		// Avatar
		if (this.avatar) {
			ctx.beginPath();
			ctx.arc(105, 125, 75, 0, Math.PI * 2, true);
			ctx.closePath();
			ctx.save();
			ctx.clip();
			const img = await image(this.avatar);
			ctx.drawImage(img, 30, 50, 150, 150);
			ctx.restore();
		}

		// Progress Bar
		ctx.save();

		// Progress Bar Back
		ctx.beginPath();
		ctx.globalAlpha = 0.5;
		ctx.fillStyle = '#0CA7FF';
		ctx.arc(canvasWidth - 47.5, 182.5, 17.5, Math.PI * 1.5, Math.PI * 0.5);
		ctx.arc(227.5, 182.5, 17.5, Math.PI * 0.5, Math.PI * 1.5);
		ctx.fill();
		ctx.clip();
		ctx.closePath();

		// Progress Bar Front
		const currentPercentXP = Math.floor((this.currentXp / this.requiredXp) * 100);
		if (currentPercentXP >= 1) {
			ctx.beginPath();
			const onePercentBar = (canvasWidth - 30 - 210) / 100;
			const pxBar = onePercentBar * currentPercentXP;
			ctx.globalAlpha = 1;
			ctx.fillStyle = '#0CA7FF';
			ctx.arc(192.5 + pxBar, 182.5, 17.5, Math.PI * 1.5, Math.PI * 0.5);
			ctx.arc(227.5, 182.5, 17.5, Math.PI * 0.5, Math.PI * 1.5);
			ctx.fill();
			ctx.closePath();
		}
		ctx.restore();

		let offsetLvlXP = canvasWidth - 30;

		// XP
		ctx.save();

		// Needed XP
		ctx.font = '600 35px ' + this.font;
		ctx.textAlign = 'right';
		ctx.fillStyle = '#7F8384';
		const requiredXpFormatted: string = formatXp(this.requiredXp);
		ctx.fillText(`${requiredXpFormatted} XP`, offsetLvlXP, 150);
		offsetLvlXP -= ctx.measureText(`${requiredXpFormatted} XP`).width + 3;

		// Slash
		ctx.fillText('/', offsetLvlXP, 150);

		// Current XP
		ctx.fillStyle = '#0CA7FF';
		offsetLvlXP -= ctx.measureText(`/`).width + 3;
		const currentXpFormatted: string = formatXp(this.currentXp);
		ctx.fillText(`${currentXpFormatted}`, offsetLvlXP, 150);
		offsetLvlXP -= ctx.measureText(`${currentXpFormatted}`).width;
		ctx.restore();

		// Display Name
		ctx.font = '600 35px ' + this.font;

		ctx.fillStyle = '#0CA7FF';
		ctx.fillText(this.displayName, 210, 150, offsetLvlXP - 210 - 15);

		// Rank
		ctx.save();
		let offsetRankX = canvasWidth - 30;
		ctx.textAlign = 'right';

		// rank number
		ctx.fillStyle = '#0CA7FF';
		ctx.font = '600 60px ' + this.font;
		ctx.fillText(`${this.currentRank}`, offsetRankX, 75);
		offsetRankX -= ctx.measureText(`${this.currentRank}`).width;

		// Rank text
		ctx.fillStyle = '#0CA7FF';
		ctx.font = '600 35px ' + this.font;
		ctx.fillText(' RANG ', offsetRankX, 75);
		offsetRankX -= ctx.measureText(' RANG ').width;

		// Level
		ctx.fillStyle = '#0CA7FF';

		// Level number
		ctx.fillStyle = '#0CA7FF';
		ctx.font = '600 60px ' + this.font;
		ctx.fillText(`${this.currentLevel}`, offsetRankX, 75);
		offsetRankX -= ctx.measureText(`${this.currentLevel}`).width;

		// Level text
		ctx.fillStyle = '#0CA7FF';
		ctx.font = '600 35px ' + this.font;
		ctx.fillText(' LEVEL ', offsetRankX, 75);
		ctx.restore();

	}

	async build(): Promise<Canvas> {
		const canvas = createCanvas(1000, 250);
		const ctx = canvas.getContext('2d');
		await this.draw(ctx, canvas.width, canvas.height);
		return canvas;
	}
}

export { RankcardBuilder };