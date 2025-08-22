<script lang="ts">
	import { Card, CardContent } from "$lib/components/ui/card"
	import { Button } from "$lib/components/ui/button"

	import Icon from "@iconify/svelte"
	import { cn } from "$lib/utils"

	interface Props {
		uploadedImage: ImageData | null
		canvasElement: HTMLCanvasElement | null
		maxFileSize?: number
		supportedFormats?: string[]
		onUploadStart?: () => void
		onUploadSuccess?: (file: File) => void
		onUploadError?: (error: string) => void
	}

	let {
		uploadedImage = $bindable(),
		canvasElement = $bindable(),
		maxFileSize = 50 * 1024 * 1024,
		supportedFormats = ["image/jpeg", "image/png", "image/webp"],
		onUploadStart,
		onUploadSuccess,
		onUploadError
	}: Props = $props()

	let fileInput = $state<HTMLInputElement | null>(null)
	let isDragOver = $state(false)
	let isUploading = $state(false)

	function handleDragOver(e: DragEvent) {
		e.preventDefault()
		isDragOver = true
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault()
		isDragOver = false
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault()
		isDragOver = false

		const files = e.dataTransfer?.files
		if (files && files.length > 0) {
			handleFile(files[0])
		}
	}

	function handleFileSelect(e: Event) {
		const target = e.target as HTMLInputElement
		const files = target.files
		if (files && files.length > 0) {
			handleFile(files[0])
		}
	}

	async function handleFile(file: File) {
		if (onUploadStart) onUploadStart()
		isUploading = true

		if (!supportedFormats.includes(file.type)) {
			isUploading = false
			if (onUploadError) onUploadError(`Unsupported file format: ${file.type}`)
			return
		}

		if (file.size > maxFileSize) {
			isUploading = false
			if (onUploadError)
				onUploadError(`File too large. Max size is ${Math.round(maxFileSize / 1024 / 1024)}MB.`)
			return
		}

		const img = new Image()
		const canvas = document.createElement("canvas")
		const ctx = canvas.getContext("2d")

		img.onload = () => {
			canvas.width = img.width
			canvas.height = img.height
			ctx?.drawImage(img, 0, 0)
			const imageData = ctx?.getImageData(0, 0, img.width, img.height)
			if (imageData) {
				uploadedImage = imageData
				isUploading = false
				if (onUploadSuccess) onUploadSuccess(file)
			} else {
				isUploading = false
				if (onUploadError) onUploadError("Failed to process image data.")
			}
		}

		img.onerror = () => {
			isUploading = false
			if (onUploadError) onUploadError("Failed to load image.")
		}

		const reader = new FileReader()
		reader.onload = (e) => {
			img.src = e.target?.result as string
		}
		reader.onerror = () => {
			isUploading = false
			if (onUploadError) onUploadError("Failed to read file.")
		}
		reader.readAsDataURL(file)
	}

	function removeImage() {
		uploadedImage = null
		if (fileInput) fileInput.value = ""
	}

	$effect(() => {
		if (canvasElement && uploadedImage) {
			const ctx = canvasElement.getContext("2d")
			if (ctx) {
				ctx.putImageData(uploadedImage, 0, 0)
			}
		}
	})
</script>

<div class="space-y-2">
	{#if uploadedImage}
		<Card class="overflow-hidden p-0">
			<CardContent class="p-5">
				<div class="group relative">
					<canvas
						bind:this={canvasElement}
						width={uploadedImage.width}
						height={uploadedImage.height}
						class="h-24 w-full rounded-lg object-cover"
					></canvas>
					<div
						class="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 opacity-0 group-hover:opacity-100"
					>
						<Button
							variant="destructive"
							size="sm"
							onclick={removeImage}
							class="cursor-pointer gap-2"
						>
							<Icon icon="lucide:x" class="size-4" />
							Remove
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	{:else if isUploading}
		<!-- Uploading State -->
		<Card
			class={cn(
				"relative overflow-hidden border-2 border-dashed p-0",
				"border-primary bg-primary/10"
			)}
		>
			<!-- Animated background effect -->
			<div
				class="absolute inset-0 animate-pulse bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20"
			></div>
			<CardContent class="relative z-10 p-5">
				<div class="flex h-24 w-full flex-col items-center justify-center">
					<!-- Spinner -->
					<div
						class="mb-4 size-12 animate-spin rounded-full border-4 border-primary border-t-transparent"
					></div>
					<h4 class="mb-2 font-medium text-primary">Uploading...</h4>
					<p class="text-sm text-muted-foreground">
						Please wait while your image is being processed
					</p>
				</div>
			</CardContent>
		</Card>
	{:else}
		<!-- Upload Area -->
		<Card
			class={cn(
				"border-2 border-dashed p-0",
				isDragOver
					? "border-primary bg-primary/5"
					: "border-muted-foreground/25 hover:border-primary/50"
			)}
			ondragover={handleDragOver}
			ondragleave={handleDragLeave}
			ondrop={handleDrop}
		>
			<CardContent class="cursor-pointer p-5" onclick={() => fileInput!.click()}>
				<div class="flex h-24 w-full flex-col items-center justify-center">
					<div
						class="mx-auto mb-1 flex size-12 items-center justify-center rounded-full bg-primary/10"
					>
						<Icon icon="lucide:upload" class="size-6 text-primary" />
					</div>
					<h4 class="font-medium">Drop your image here</h4>
					<p class="text-sm text-muted-foreground">or click to browse files</p>
					<input
						bind:this={fileInput}
						type="file"
						accept={supportedFormats.join(",")}
						onchange={handleFileSelect}
						class="hidden"
					/>
				</div>
			</CardContent>
		</Card>
	{/if}

	<div class="text-xs text-muted-foreground">
		<p class="mb-1 font-medium">Supported formats:</p>
		<p>
			{supportedFormats.map((f) => f.split("/")[1].toUpperCase()).join(", ")} (max {Math.round(
				maxFileSize / 1024 / 1024
			)}MB)
		</p>
	</div>
</div>
