<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { invalidate } from '$app/navigation';
	import type { PageData } from './$types';
	import AuthGuard from '$c/AuthGuard.svelte';
	import { api } from '$api';

	export let data: PageData;

	const documents = data.documents || [];

	let pollInterval: ReturnType<typeof setInterval> | null = null;
	const POLL_INTERVAL_MS = 3000;

	onMount(() => {
		const hasProcessing = documents.some((d) => (d.status ?? 'completed') === 'processing');
		if (!hasProcessing) return;

		pollInterval = setInterval(async () => {
			try {
				const { data: fresh } = await api.get<typeof documents>('/pdfs');
				const stillProcessing = fresh.some((d) => (d.status ?? 'completed') === 'processing');
				await invalidate('/documents');
				if (!stillProcessing) {
					if (pollInterval) clearInterval(pollInterval);
					pollInterval = null;
				}
			} catch {}
		}, POLL_INTERVAL_MS);
	});

	onDestroy(() => {
		if (pollInterval) clearInterval(pollInterval);
	});
</script>

<AuthGuard />
<div class="flex flex-row justify-between items-center my-4">
	<h2 class="text-3xl font-bold m-2">Your Documents</h2>
	<div class="">
		<a
			href="/documents/new"
			class="py-2 px-4 inline-flex justify-center items-center gap-2 rounded-md border border-transparent font-semibold bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all dark:focus:ring-offset-gray-800"
			>New</a
		>
	</div>
</div>

<div class="flex flex-col">
	<div class="-m-1.5 overflow-x-auto">
		<div class="p-1.5 min-w-full inline-block align-middle">
			<div class="border rounded-lg overflow-hidden">
				<table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
					<thead class="bg-gray-50">
						<tr>
							<th
								scope="col"
								class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th
							>
							<th
								scope="col"
								class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th
							>
							<th
								scope="col"
								class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th
							>
							<th
								scope="col"
								class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th
							>
						</tr>
					</thead>

					<tbody class="divide-y divide-gray-200 dark:divide-gray-700">
						{#each documents as document}
							<tr class="hover:bg-gray-100 dark:hover:bg-gray-700">
								<td
									class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200"
									>{document.name}</td
								>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200"
									>{document.id}</td
								>
								<td class="px-6 py-4 whitespace-nowrap">
									<span
										class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {(document.status ?? 'completed') ===
									'completed'
									? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
									: 'bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100'}"
									>
										{(document.status ?? 'completed') === 'completed' ? 'Ready' : 'Processing...'}
									</span>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
									{#if (document.status ?? 'completed') === 'completed'}
										<a class="text-blue-500 hover:text-blue-700" href="/documents/{document.id}"
											>View</a
										>
									{:else}
										<span class="text-gray-400 cursor-not-allowed">View</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</div>
</div>
