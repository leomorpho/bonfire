// import { toast } from 'svelte-sonner';
// import { env as publicEnv } from '$env/dynamic/public';

// export const handleShare = async (eventData: any) => {
// 	if (!navigator.share) {
// 		alert('Sharing is not supported on this browser.');
// 		return;
// 	}

// 	// Prepare shareable data
// 	const shareData = {
// 		title: `Hey! You're invited to ${eventData.title}!`, // Use the event title
// 		text: `...Check out this awesome event at ${eventData.location}!`, // Use the event location
// 		url: `${publicEnv.PUBLIC_ORIGIN}/bonfire/${eventData.id}` // Use the event's unique ID in the URL
// 	};

// 	toast.success('Invitation copied to clipboard!');

// 	// Add data to clipboard
// 	try {
// 		const clipboardText = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
// 		await navigator.clipboard.writeText(clipboardText);
// 	} catch (error) {
// 		console.error('Error copying to clipboard:', error);
// 	}

// 	navigator
// 		.share(shareData)
// 		.then(() => {
// 			console.log('Content shared successfully!');
// 		})
// 		.catch((error) => {
// 			console.error('Error sharing content:', error);
// 		});
// };
