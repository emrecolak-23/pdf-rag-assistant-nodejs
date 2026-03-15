<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { invalidate } from '$app/navigation';
	import type { PageData } from './$types';
	import { beforeNavigate } from '$app/navigation';
	import { resetAll, sendMessage } from '$s/chat/index';
	import PdfViewer from '$c/PdfViewer.svelte';
	import ChatPanel from '$c/chat/ChatPanel.svelte';
	import { api } from '$api';

	export let data: PageData;

	const document = data.document;
	const documentUrl = data.documentUrl;

	let pollInterval: ReturnType<typeof setInterval> | null = null;
	const POLL_INTERVAL_MS = 3000;

	function handleSubmit(content: string, useStreaming: boolean) {
		sendMessage({ role: 'user', content }, { useStreaming, documentId: document.id });
	}

	onMount(() => {
		if (!document || (document.status ?? 'completed') === 'completed') return;

		pollInterval = setInterval(async () => {
			try {
				const { data: res } = await api.get(`/pdfs/${document.id}`);
				if ((res.pdf?.status ?? 'completed') === 'completed') {
					if (pollInterval) clearInterval(pollInterval);
					pollInterval = null;
					await invalidate(`/documents/${document.id}`);
				}
			} catch {}
		}, POLL_INTERVAL_MS);
	});

	onDestroy(() => {
		if (pollInterval) clearInterval(pollInterval);
	});

	beforeNavigate(resetAll);
</script>

{#if data.error}
	{data.error}
{/if}

{#if document}
	{#if (document.status ?? 'completed') !== 'completed'}
		<div class="flex flex-col items-center justify-center p-12 text-center">
			<p class="text-lg text-amber-600 dark:text-amber-400 mb-2">
				Document is being processed...
			</p>
			<p class="text-sm text-gray-500 dark:text-gray-400">
				Please wait until the document is ready. You can refresh the page or return to the
				<a href="/documents" class="text-blue-500 hover:underline">documents list</a>.
			</p>
		</div>
	{:else}
		<div class="grid grid-cols-3 gap-2" style="height: calc(100vh - 80px);">
			<div class="col-span-1">
				<ChatPanel documentId={document.id} onSubmit={handleSubmit} />
			</div>
			<div class="col-span-2">
				<PdfViewer url={documentUrl} />
			</div>
		</div>
	{/if}
{/if}
