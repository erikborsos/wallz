<script lang="ts">
	import "../app.css"
	import { ModeWatcher } from "mode-watcher"
	import favicon from "$lib/assets/favicon.svg"
	import Header from "./(components)/header/header.svelte"
	import Footer from "./(components)/footer/footer.svelte"

	let { children } = $props()
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<ModeWatcher disableTransitions={false} />

<Header />
<div class="mx-auto min-h-screen w-full max-w-4xl pt-24 pb-8">
	{@render children?.()}
</div>
<Footer />
