export enum CognitiveDistortions {
	ALL_OR_NOTHING = 'All or Nothing',
	OVERGENERALIZATION = 'Overgeneralization',
	MENTAL_FILTER = 'Mental Filter',
	DISCOUNTING_POSITIVES = 'Discounting Positives',
	JUMPING_TO_CONCLUSIONS = 'Jumping to Conclusions',
	MAGNIFICATION = 'Magnification',
	EMOTIONAL_REASONING = 'Emotional Reasoning',
	SHOULD_STATEMENTS = 'Should Statements',
	LABELING = 'Labeling',
	PERSONALIZATION = 'Personalization'
}

export const distortionDetails = {
	[CognitiveDistortions.ALL_OR_NOTHING]: {
		explanation:
			'Also known as black-and-white thinking, this distortion occurs when you see situations in extreme terms with no middle ground. You view things as all good or all bad, perfect or a failure, with no room for nuance or complexity.',
		example:
			"If I don't succeed at every part of this project, it's a complete disaster. Or, if one aspect of my performance is criticized, I assume the whole effort is worthless."
	},
	[CognitiveDistortions.OVERGENERALIZATION]: {
		explanation:
			'This distortion involves taking a single negative event and applying it broadly, assuming that one instance of failure or disappointment will repeat indefinitely.',
		example:
			"After being rejected from one job application, you think, 'I’ll never get a job.' Or, after a difficult breakup, you conclude, 'I’ll always be alone.'"
	},
	[CognitiveDistortions.MENTAL_FILTER]: {
		explanation:
			'With mental filtering, you focus solely on the negative aspects of a situation and ignore any positive details. This creates a distorted view, where you only see the negative side.',
		example:
			'During a presentation, you received mostly positive feedback, but one person offered constructive criticism. Now, you can only remember that single negative comment.'
	},
	[CognitiveDistortions.DISCOUNTING_POSITIVES]: {
		explanation:
			'This distortion occurs when you dismiss positive events or accomplishments as unimportant or insignificant. This allows you to maintain a negative perspective by refusing to acknowledge your successes or positive qualities.',
		example:
			"After completing a challenging project successfully, you think, 'Anyone could have done that,' or you believe that any compliments you receive are just flattery."
	},
	[CognitiveDistortions.JUMPING_TO_CONCLUSIONS]: {
		explanation:
			"Jumping to conclusions involves making negative assumptions without evidence to support them. This can manifest as 'mind reading,' where you assume you know what others are thinking, or 'fortune telling,' where you predict negative outcomes.",
		example:
			'You assume a friend is upset with you because they didn’t reply to a text immediately, or you decide you’re going to fail a test before you’ve even taken it.'
	},
	[CognitiveDistortions.MAGNIFICATION]: {
		explanation:
			'Also called catastrophizing, this distortion involves blowing things out of proportion, expecting the worst possible outcome from a situation, or seeing small issues as massive problems.',
		example:
			'You made a minor error at work and now believe you’re going to get fired. Or, if someone doesn’t greet you warmly, you think they dislike you entirely.'
	},
	[CognitiveDistortions.EMOTIONAL_REASONING]: {
		explanation:
			'Emotional reasoning happens when you believe that because you feel a certain way, it must be true. This distortion leads you to accept negative feelings as evidence of a negative reality.',
		example:
			"You feel anxious about a presentation and conclude, 'I’m going to do terribly.' Or, you feel unworthy and assume, 'I am unworthy.'"
	},
	[CognitiveDistortions.SHOULD_STATEMENTS]: {
		explanation:
			"This distortion involves setting rigid standards for yourself or others, often leading to feelings of guilt, frustration, or resentment when expectations aren’t met. Words like 'should,' 'must,' or 'ought' are commonly used.",
		example:
			"You think, 'I should always be productive,' or 'They should appreciate me more,' setting up unrealistic standards that often lead to disappointment."
	},
	[CognitiveDistortions.LABELING]: {
		explanation:
			'Labeling is an extreme form of all-or-nothing thinking where you attach a negative label to yourself or others based on a single experience or action.',
		example:
			"If you make a mistake, you think, 'I’m such a failure,' rather than recognizing it as a learning opportunity. Or, if someone cuts you off in traffic, you label them as a 'terrible person.'"
	},
	[CognitiveDistortions.PERSONALIZATION]: {
		explanation:
			'This distortion involves taking responsibility for events outside your control, assuming that external events are directly related to you. It often leads to guilt or shame for situations you didn’t cause.',
		example:
			'You blame yourself when a friend is upset, thinking it must be something you did. Or, if a project fails, you assume it’s solely your fault even if others contributed.'
	}
};
