<script lang="ts">
	import Icon from "@iconify/svelte"

	import { toggleMode } from "mode-watcher"
	import { Button } from "$lib/components/ui/button/index.js"
</script>

<header
	class="fixed z-50 flex h-16 w-full items-center justify-between border-b bg-background/80 px-20 backdrop-blur-lg"
>
	<h1 class="text-lg font-black">wallz</h1>
	<Button onclick={toggleMode} variant="outline" size="icon">
		<Icon
			icon="lucide:sun"
			class="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 !transition-all dark:scale-0 dark:-rotate-90"
		/>
		<Icon
			icon="lucide:moon"
			class="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 !transition-all dark:scale-100 dark:rotate-0"
		/>
		<span class="sr-only">Toggle theme</span>
	</Button>
</header>
