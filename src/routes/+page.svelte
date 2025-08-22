<script>
	import ImageUpload from "./(components)/import/image-upload.svelte"

	let uploadedImage = $state("")
</script>

<div class="mx-auto my-auto max-w-2xl py-30">
	<ImageUpload bind:uploadedImage />
	{uploadedImage}
</div>
