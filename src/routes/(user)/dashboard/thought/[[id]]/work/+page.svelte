<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';

    const { data } = $props();

</script>

<div class="mx-2 flex items-center justify-center">
	<Card.Root class="sm:w-[400px]">
		<Card.Header>
			<Card.Title>{data.thought.thought}</Card.Title>
			<Card.Description>Work on this thought here.</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="flex flex-col gap-y-2"> 
                <h2>Melt Defenses</h2>
                <Button>Identify associated emotions</Button>
                <Button>Benefit/cost analysis</Button>
                <Button>What if?</Button>
            </div>

            <div class="pt-3 flex flex-col gap-y-2"> 
                <h2>Turn Thought Around</h2>
                <Button>Find the evidence</Button>
                <Button>Reframe</Button>
                <Button>Self-compassion</Button>
            </div>
            <div>
        

            </div>
		</Card.Content>
		<Card.Footer class="flex justify-between">
			<Button variant="outline" href="/dashboard">Home</Button>
			<!-- <Button>Deploy</Button> -->
		</Card.Footer>
	</Card.Root>
</div>
