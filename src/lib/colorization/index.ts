const SRGB_GAMMA_THRESHOLD = 0.04045
const SRGB_GAMMA_FACTOR = 1.055
const SRGB_GAMMA_EXPONENT = 2.4
const SRGB_LINEAR_FACTOR = 12.92
const SRGB_LINEAR_OFFSET = 0.055
const SRGB_INVERSE_GAMMA_THRESHOLD = SRGB_GAMMA_THRESHOLD / SRGB_LINEAR_FACTOR

const SRGB_TO_XYZ = [
	[0.4124564, 0.3575761, 0.1804375],
	[0.2126729, 0.7151522, 0.072175],
	[0.0193339, 0.119192, 0.9503041]
]

const XYZ_TO_SRGB = [
	[3.2404542, -1.5371385, -0.4985314],
	[-0.969266, 1.8760108, 0.041556],
	[0.0556434, -0.2040259, 1.0572252]
]

const D65_WHITE_POINT = { X: 0.95047, Y: 1.0, Z: 1.08883 }

const LAB_DELTA = 6.0 / 29.0
const LAB_DELTA_CUBED = LAB_DELTA * LAB_DELTA * LAB_DELTA
const LAB_DELTA_FACTOR = 1 / (3 * LAB_DELTA * LAB_DELTA)
const LAB_SCALE_L = 116.0
const LAB_SCALE_A = 500.0
const LAB_SCALE_B = 200.0
const LAB_LIGHTNESS_OFFSET = 16.0

const LUMINANCE_WEIGHTS = { r: 0.2126, g: 0.7152, b: 0.0722 }
export interface ColorizeOptions {
	strength: number
	saturation: number
	contrast: number
	brightness: number
	preserveEdges: boolean
	edgeThreshold: number
}

interface LabColor {
	L: number
	a: number
	b: number
}

interface XYZColor {
	X: number
	Y: number
	Z: number
}

interface RGBColor {
	r: number
	g: number
	b: number
}

export class ImageColorizer {
	private paletteLabs: { rgb: RGBColor; lab: LabColor }[]

	constructor(private palette: string[]) {
		this.palette = palette.map((color) => color.toLowerCase())
		this.paletteLabs = this.palette
			.map((hex) => {
				const rgb = this.hexToRGB(hex)
				return { rgb, lab: this.xyzToLab(this.rgbToXYZ(rgb)) }
			})
			.sort((a, b) => a.lab.L - b.lab.L)
	}

	private hexToRGB(hex: string): RGBColor {
		const r = parseInt(hex.slice(1, 3), 16) / 255
		const g = parseInt(hex.slice(3, 5), 16) / 255
		const b = parseInt(hex.slice(5, 7), 16) / 255
		return { r, g, b }
	}

	private sRGBToLinear(value: number): number {
		return value > SRGB_GAMMA_THRESHOLD
			? Math.pow((value + SRGB_LINEAR_OFFSET) / SRGB_GAMMA_FACTOR, SRGB_GAMMA_EXPONENT)
			: value / SRGB_LINEAR_FACTOR
	}

	private linearToSRGB(value: number): number {
		return value > SRGB_INVERSE_GAMMA_THRESHOLD
			? SRGB_GAMMA_FACTOR * Math.pow(value, 1 / SRGB_GAMMA_EXPONENT) - SRGB_LINEAR_OFFSET
			: SRGB_LINEAR_FACTOR * value
	}

	private rgbToXYZ(rgb: RGBColor): XYZColor {
		const lr = this.sRGBToLinear(rgb.r)
		const lg = this.sRGBToLinear(rgb.g)
		const lb = this.sRGBToLinear(rgb.b)

		const X = lr * SRGB_TO_XYZ[0][0] + lg * SRGB_TO_XYZ[0][1] + lb * SRGB_TO_XYZ[0][2]
		const Y = lr * SRGB_TO_XYZ[1][0] + lg * SRGB_TO_XYZ[1][1] + lb * SRGB_TO_XYZ[1][2]
		const Z = lr * SRGB_TO_XYZ[2][0] + lg * SRGB_TO_XYZ[2][1] + lb * SRGB_TO_XYZ[2][2]
		return { X: X * 100, Y: Y * 100, Z: Z * 100 }
	}

	private xyzToLab(xyz: XYZColor): LabColor {
		const f = (t: number) =>
			t > LAB_DELTA_CUBED
				? Math.pow(t, 1 / 3)
				: LAB_DELTA_FACTOR * t + LAB_LIGHTNESS_OFFSET / LAB_SCALE_L

		const Xr = xyz.X / (D65_WHITE_POINT.X * 100)
		const Yr = xyz.Y / (D65_WHITE_POINT.Y * 100)
		const Zr = xyz.Z / (D65_WHITE_POINT.Z * 100)

		const L = Math.max(0, LAB_SCALE_L * f(Yr) - LAB_LIGHTNESS_OFFSET)
		const a = LAB_SCALE_A * (f(Xr) - f(Yr))
		const b = LAB_SCALE_B * (f(Yr) - f(Zr))
		return { L, a, b }
	}

	private labToXYZ(lab: LabColor): XYZColor {
		const fy = (lab.L + LAB_LIGHTNESS_OFFSET) / LAB_SCALE_L
		const fx = fy + lab.a / LAB_SCALE_A
		const fz = fy - lab.b / LAB_SCALE_B

		const fInverse = (t: number) =>
			t > LAB_DELTA ? t ** 3 : (t - LAB_LIGHTNESS_OFFSET / LAB_SCALE_L) / LAB_DELTA_FACTOR

		return {
			X: fInverse(fx) * D65_WHITE_POINT.X * 100,
			Y: fInverse(fy) * D65_WHITE_POINT.Y * 100,
			Z: fInverse(fz) * D65_WHITE_POINT.Z * 100
		}
	}

	private xyzToRGB(xyz: XYZColor): RGBColor {
		const X = xyz.X / 100
		const Y = xyz.Y / 100
		const Z = xyz.Z / 100

		const r = X * XYZ_TO_SRGB[0][0] + Y * XYZ_TO_SRGB[0][1] + Z * XYZ_TO_SRGB[0][2]
		const g = X * XYZ_TO_SRGB[1][0] + Y * XYZ_TO_SRGB[1][1] + Z * XYZ_TO_SRGB[1][2]
		const b = X * XYZ_TO_SRGB[2][0] + Y * XYZ_TO_SRGB[2][1] + Z * XYZ_TO_SRGB[2][2]

		return {
			r: Math.max(0, Math.min(1, this.linearToSRGB(r))),
			g: Math.max(0, Math.min(1, this.linearToSRGB(g))),
			b: Math.max(0, Math.min(1, this.linearToSRGB(b)))
		}
	}

	private getEdgeStrength(
		pixels: Uint8ClampedArray,
		width: number,
		height: number,
		x: number,
		y: number
	): number {
		if (x <= 0 || x >= width - 1 || y <= 0 || y >= height - 1) return 0

		const idx = (y * width + x) * 4
		const getLuminance = (i: number) =>
			(LUMINANCE_WEIGHTS.r * pixels[i]) / 255 +
			(LUMINANCE_WEIGHTS.g * pixels[i + 1]) / 255 +
			(LUMINANCE_WEIGHTS.b * pixels[i + 2]) / 255

		const center = getLuminance(idx)
		const neighbors = [
			getLuminance(idx - width * 4), // top
			getLuminance(idx + width * 4), // bottom
			getLuminance(idx - 4), // left
			getLuminance(idx + 4) // right
		]

		const maxDiff = Math.max(...neighbors.map((n) => Math.abs(n - center)))
		return maxDiff > 0.1 ? 255 : 0
	}

	private adjustSaturation(rgb: RGBColor, factor: number): RGBColor {
		const lum =
			rgb.r * LUMINANCE_WEIGHTS.r + rgb.g * LUMINANCE_WEIGHTS.g + rgb.b * LUMINANCE_WEIGHTS.b
		return {
			r: Math.max(0, Math.min(1, lum + (rgb.r - lum) * factor)),
			g: Math.max(0, Math.min(1, lum + (rgb.g - lum) * factor)),
			b: Math.max(0, Math.min(1, lum + (rgb.b - lum) * factor))
		}
	}

	private adjustContrast(rgb: RGBColor, contrast: number): RGBColor {
		const factor = (259 * (contrast * 127.5 + 255)) / (255 * (259 - contrast * 127.5))
		return {
			r: Math.max(0, Math.min(1, factor * (rgb.r * 255 - 128) + 128) / 255),
			g: Math.max(0, Math.min(1, factor * (rgb.g * 255 - 128) + 128) / 255),
			b: Math.max(0, Math.min(1, factor * (rgb.b * 255 - 128) + 128) / 255)
		}
	}

	public colorizeImage(imageData: ImageData, options: ColorizeOptions): ImageData {
		const { width, height } = imageData
		const pixels = imageData.data
		const result = new Uint8ClampedArray(pixels.length)

		const opts: ColorizeOptions = {
			strength: Math.max(0, Math.min(1, options.strength ?? 1)),
			saturation: Math.max(0, Math.min(2, options.saturation ?? 1)),
			contrast: Math.max(0, Math.min(2, options.contrast ?? 1)),
			brightness: Math.max(-100, Math.min(100, options.brightness ?? 0)),
			preserveEdges: options.preserveEdges ?? false,
			edgeThreshold: Math.max(0, options.edgeThreshold ?? 0.1)
		}

		const minLightness = this.paletteLabs.length > 0 ? this.paletteLabs[0].lab.L : 0
		const maxLightness =
			this.paletteLabs.length > 0 ? this.paletteLabs[this.paletteLabs.length - 1].lab.L : 100

		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				const idx = (y * width + x) * 4
				let rgb: RGBColor = {
					r: pixels[idx] / 255,
					g: pixels[idx + 1] / 255,
					b: pixels[idx + 2] / 255
				}

				// Apply brightness
				rgb.r = Math.max(0, Math.min(1, rgb.r + opts.brightness / 255))
				rgb.g = Math.max(0, Math.min(1, rgb.g + opts.brightness / 255))
				rgb.b = Math.max(0, Math.min(1, rgb.b + opts.brightness / 255))

				// Apply saturation
				if (opts.saturation !== 1.0) {
					rgb = this.adjustSaturation(rgb, opts.saturation)
				}

				// Apply contrast
				if (opts.contrast !== 1.0) {
					rgb = this.adjustContrast(rgb, opts.contrast)
				}

				const lab = this.xyzToLab(this.rgbToXYZ(rgb))

				// Edge preservation
				let localStrength = opts.strength
				if (opts.preserveEdges) {
					const edgeStrength = this.getEdgeStrength(pixels, width, height, x, y)
					if (edgeStrength > 0) {
						localStrength *= 0.3 // Stronger edge preservation
					}
				}

				// Colorize based on palette
				let targetLab: LabColor
				if (this.paletteLabs.length === 1) {
					const target = this.paletteLabs[0].lab
					targetLab = {
						L: lab.L,
						a: target.a * Math.min(lab.L / Math.max(target.L, 1), 1.0),
						b: target.b * Math.min(lab.L / Math.max(target.L, 1), 1.0)
					}
				} else {
					const clampedLightness = Math.max(minLightness, Math.min(lab.L, maxLightness))
					let lowerColor = this.paletteLabs[0]
					let upperColor = this.paletteLabs[0]
					for (let j = 0; j < this.paletteLabs.length - 1; j++) {
						lowerColor = this.paletteLabs[j]
						upperColor = this.paletteLabs[j + 1]
						if (clampedLightness >= lowerColor.lab.L && clampedLightness <= upperColor.lab.L) {
							break
						}
					}

					const range = upperColor.lab.L - lowerColor.lab.L
					const amount = range === 0 ? 0 : (clampedLightness - lowerColor.lab.L) / range

					targetLab = {
						L: lab.L,
						a: lowerColor.lab.a + (upperColor.lab.a - lowerColor.lab.a) * amount,
						b: lowerColor.lab.b + (upperColor.lab.b - lowerColor.lab.b) * amount
					}
				}

				// Blend colors
				const finalLab: LabColor = {
					L: lab.L,
					a: lab.a + (targetLab.a - lab.a) * localStrength,
					b: lab.b + (targetLab.b - lab.b) * localStrength
				}

				const finalRGB = this.xyzToRGB(this.labToXYZ(finalLab))

				result[idx] = Math.round(finalRGB.r * 255)
				result[idx + 1] = Math.round(finalRGB.g * 255)
				result[idx + 2] = Math.round(finalRGB.b * 255)
				result[idx + 3] = pixels[idx + 3]
			}
		}

		return new ImageData(result, width, height)
	}
}
