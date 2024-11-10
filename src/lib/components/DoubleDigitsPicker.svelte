<script lang="ts">
    import { Input } from '$lib/components/ui/input/index.js';
    import { createEventDispatcher } from 'svelte';
    
    export let maxValue: number = 59; // Default to 59 if not specified
    export let value: string = "";
    const dispatch = createEventDispatcher();
    
    function validateValue(inputValue: string, isBlur = false): string {
        // Only allow digits
        inputValue = inputValue.replace(/[^\d]/g, '');
        
        // Ensure it's not longer than 2 digits
        inputValue = inputValue.slice(0, 2);
        
        // Then check if it's empty or consists of only digits
        if (inputValue === "" || /^\d{1,2}$/.test(inputValue)) {
            // Check against maxValue if we have a number
            if (inputValue) {
                const numericValue = parseInt(inputValue, 10);
                if (numericValue > maxValue) {
                    return maxValue.toString();
                }
                // Only pad with zero on blur and if we have a single digit
                if (isBlur && inputValue.length === 1) {
                    return inputValue.padStart(2, '0');
                }
            }
            return inputValue;
        }
        return value; // Keep existing value if invalid input
    }
    
    function handleInput(event) {
        const inputValue = event.target.value;
        value = validateValue(inputValue, false);
        dispatch('input', { value });
    }
    
    function handleBlur() {
        value = validateValue(value, true);
        dispatch('input', { value });
    }
    </script>
    
    <!-- Two-digit input field with max value -->
    <Input
        type="text"
        bind:value
        pattern="[0-9]*"
        inputmode="numeric"
        placeholder="00"
        class="w-16 text-center"
        on:input={handleInput}
        on:blur={handleBlur}
    />