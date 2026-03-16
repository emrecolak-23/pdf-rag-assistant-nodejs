export interface Scores {
	llm: {
		[name: string]: number;
	};
	retriever: {
		[name: string]: number;
	};
	memory: {
		[name: string]: number;
	};
}
