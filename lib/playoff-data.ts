import raw from "../data/playoff-model.json" with { type: "json" };
import type { SimModel } from "./playoff-sim.ts";

export const PLAYOFF_MODEL = raw as SimModel;
