<script>
	import Button from "$lib/components/ui/button/button.svelte"
	import Icon from "@iconify/svelte"
</script>

<footer class="flex items-center justify-between border-t px-20 py-8">
	<span class="flex items-center justify-center">
		Made by
		<Button href="https://github.com/erikborsos" target="blank" variant="link">
			<Icon icon="mdi:github" />
			erikborsos
		</Button>
	</span>
	<div class="flex items-center justify-center">
		<Button href="https://github.com/erikborsos/wallz" target="blank" variant="link">Code</Button>
		<Button
			href="https://github.com/erikborsos/wallz/blob/main/LICENSE"
			target="blank"
			variant="link">License</Button
		>
	</div>
</footer>
