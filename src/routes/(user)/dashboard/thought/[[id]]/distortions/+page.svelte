<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { Label } from '$lib/components/ui/label';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Card from '$lib/components/ui/card';
	import { goto } from '$app/navigation';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	const { data } = $props();

	// Set up the form
	const { form, errors, enhance, submitting } = superForm(data.form);
	function handlePrevious() {
		goto(`/dashboard/thought/${data.thought.id}/belief-target`, { replaceState: true });
	}
	// Initialize distortions based on enum, with default ratings from load
	let distortions = data.distortionRatings;
</script>

<div class="mx-2 flex items-center justify-center">
	<Tabs.Root value="you" class="sm:w-[400px]">
		<Tabs.List class="grid w-full grid-cols-2">
			<Tabs.Trigger value="you">You</Tabs.Trigger>
			<Tabs.Trigger value="ai">A.I.</Tabs.Trigger>
		</Tabs.List>
		<Tabs.Content value="you">
			<Card.Root>
				<Card.Header>
					<Card.Title>{data.thought.thought}</Card.Title>
					<Card.Description class="h-5 sm:h-7">
						Which cognitive distortions do you think are present in this thought? Rate applicable
						ones from 0% to 100%.
					</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-2">
					<form method="post" use:enhance class="m-2 flex w-full flex-col space-y-4">
						<div class="form-control grid w-full items-center gap-1.5">
							<!-- Render each cognitive distortion with a slider -->
							{#each distortions as { name, rating, explanation, example }, index}
								<div class="mt-4">
									<Label
										class="flex flex-row items-center justify-between p-1"
										for="distortion-{index}"
										>{name}
										<Dialog.Root>
											<Dialog.Trigger
												><svg
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
													stroke-linecap="round"
													stroke-linejoin="round"
													class="lucide lucide-info ml-1 h-3 w-3 sm:h-4 sm:w-4"
													><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path
														d="M12 8h.01"
													/></svg
												></Dialog.Trigger
											>
											<Dialog.Content class="sm:max-w-[425px]">
												<Dialog.Header>
													<Dialog.Title>{name}</Dialog.Title>
													<Dialog.Description>
														<div>{explanation}</div>
														<blockquote
															class="my-4 border-s-4 border-gray-300 bg-gray-50 p-4 dark:border-gray-500 dark:bg-gray-800"
														>
															<p
																class="font-medium italic leading-relaxed text-gray-900 dark:text-white"
															>
																{example}
															</p>
														</blockquote>
													</Dialog.Description>
												</Dialog.Header>
											</Dialog.Content>
										</Dialog.Root>
									</Label>
									<Slider
										id="distortion-{index}"
										bind:value={distortions[index].rating}
										min={0}
										max={100}
										step={1}
									/>
									<input
										type="hidden"
										name="distortions[{name}]"
										value={distortions[index].rating}
									/>
								</div>
							{/each}
						</div>
					</form>
				</Card.Content>
				<Card.Footer>
					<div class="flex w-full justify-center space-x-1">
						<Button on:click={handlePrevious} disabled={$submitting} class="w-1/2 max-w-64"
							>Previous</Button
						>
						<Button type="submit" disabled={$submitting} class="w-1/2 max-w-64">
							{#if $submitting}
								<span class="loading loading-spinner"></span> Submitting...
							{:else}
								Continue
							{/if}
						</Button>
					</div>
				</Card.Footer>
			</Card.Root>
		</Tabs.Content>
		<Tabs.Content value="ai">
			<Card.Root>
				<Card.Header>
					<Card.Title>{data.thought.thought}</Card.Title>
					<Card.Description class="h-5 sm:h-7"
						>Here's what our A.I. thinks. Use it as a way to learn to recognize cognitive
						distortions in your thoughts.</Card.Description
					>
				</Card.Header>
				<Card.Content class="space-y-2">
					<div class="m-2 flex w-full flex-col space-y-4">
						<div class="form-control grid w-full items-center gap-1.5">
							<!-- Render each cognitive distortion with a slider -->
							{#each distortions as { name, rating }, index}
								<div class="mt-4">
									<Label for="distortion-{index}" class="flex flex-row items-center justify-between p-1">{name} </Label>
									<Slider
										id="distortion-{index}"
										bind:value={distortions[index].rating}
										min={0}
										max={100}
										step={1}
									/>
								</div>
							{/each}
						</div>
					</div>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>
	</Tabs.Root>
</div>
