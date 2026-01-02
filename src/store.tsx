import { create } from "zustand";
import { getCalendarData, postCalendarData } from "./server";

type State = {
	count: number;
	list: any[];
};

type Action = {
	inc: () => void;
	dec: () => void;
	fetchCalendarData: (params: any) => Promise<any>;
	addCalendarData: (data: any) => Promise<{ success: boolean; code: number }>;
};


const useCalendarStore = create<State & Action>((set, get) => ({
	count: 1,
	list: [],
	inc: () => set((state) => ({ count: state.count + 1 })),
	dec: () => set(() => ({ count: get().count - 1 })),
	fetchCalendarData: async function (prams) {
		const res = getCalendarData(prams) || [];
		console.log('fetch calendar data:', res);
		set({ list: res });
		return res;
	},
	addCalendarData: async function (data): Promise<{ success: boolean; code: number }> {
		const res = postCalendarData(data);
		return res
	}
}));

export default useCalendarStore;