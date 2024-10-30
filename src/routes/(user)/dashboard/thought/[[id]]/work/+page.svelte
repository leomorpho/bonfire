<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	const { data } = $props();

	// Set the slider initial value conditionally based on beliefInThought, or default to 50
	let beliefRating = $state(data.beliefInThought ? [data.beliefInThought.beliefRating] : [50]);
	let targetBeliefInThought = $state(
		data.targetBeliefInThought ? [data.targetBeliefInThought.beliefTargetRating] : [50]
	);
</script>

<div class="mx-2 flex items-center justify-center">
	<Card.Root class="w-full mx-3 sm:w-[400px]">
		<Card.Header>
			<Card.Title>"{data.thought.thought}"</Card.Title>
			<Card.Description>
				<div class="flex flex-row justify-around pt-2">
					<Tooltip.Root>
						<Tooltip.Trigger asChild let:builder>
							<Button builders={[builder]} variant="outline">Belief: {beliefRating}%</Button>
						</Tooltip.Trigger>
						<Tooltip.Content>
							<p>The last belief you logged, you can log your current belief in it at any time.</p>
						</Tooltip.Content>
					</Tooltip.Root>
					<Tooltip.Root>
						<Tooltip.Trigger asChild let:builder>
							<Button builders={[builder]} variant="outline"
								>Target: {targetBeliefInThought}%</Button
							>
						</Tooltip.Trigger>
						<Tooltip.Content>
							<p>
								How much you would like to believe in this thought instead of how much you currently
								do.
							</p>
						</Tooltip.Content>
					</Tooltip.Root>
				</div>
                <div class="flex flex-col gap-y-2 pt-3">
                    <Button href={`edit`}>Edit thought and beliefs</Button>
                </div>
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="flex flex-col gap-y-2 pt-3">
				<h2>Melt Defenses</h2>
				<Button>Identify associated emotions</Button>
				<Button>Benefit/cost analysis</Button>
				<Button>What if?</Button>
			</div>

			<div class="flex flex-col gap-y-2 pt-3">
				<h2>Turn Thought Around</h2>
				<Button>Find the evidence</Button>
				<Button>Reframe</Button>
				<Button>Self-compassion</Button>
			</div>
			<div></div>
		</Card.Content>
		<Card.Footer class="flex justify-center">
			<Button variant="outline" href="/dashboard">Home</Button>
		</Card.Footer>
	</Card.Root>
</div>
