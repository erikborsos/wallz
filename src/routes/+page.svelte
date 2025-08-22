<script lang="ts">
	import ImageUpload from "./(components)/import/image-upload.svelte"

	let uploadedImage: ImageData | null = $state(null)
	let canvasElement = $state<HTMLCanvasElement | null>(null)
</script>

<div class="space-y-4">
	<ImageUpload bind:uploadedImage bind:canvasElement />
</div>
