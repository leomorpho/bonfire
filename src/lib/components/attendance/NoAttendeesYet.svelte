<script lang="ts">
  import * as Avatar from "$lib/components/ui/avatar/index.js";

</script>

<div class="flex justify-center">
    <div
        class="flex w-full items-center justify-center rounded-lg bg-slate-500 bg-opacity-75 p-2 text-sm text-white ring-glow sm:w-2/3"
    >
        <Avatar.Root
            class="mr-2 h-12 w-12 border-2 border-white bg-white dark:bg-slate-900 sm:h-14 sm:w-14"
        >
            <Avatar.Image src={'/icon-128.png'} alt={''} />
            <Avatar.Fallback>{'BO'}</Avatar.Fallback>
        </Avatar.Root> No attendees yet
    </div>
</div>