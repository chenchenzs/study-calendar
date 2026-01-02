import { create } from "zustand";
import { getCalendarData, postCalendarData } from "./server";

type State = {
	list: any[];
};

type Action = {
	
	fetchCalendarData: (params: any) => Promise<any>;
	addCalendarData: (data: any) => Promise<{ success: boolean; code: number }>;
};


const useCalendarStore = create<State & Action>((set) => ({
	list: [],
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