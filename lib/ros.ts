import byes from "@/data/maye-byes.json";
import rosters from "@/data/league-rosters.json";
import points from "@/data/player-points-w4-7.json";
import { PLAYOFF_MODEL } from "@/lib/playoff-data";
import { buildRosterGrade, type ByeFile, type RosterPlayer } from "@/lib/ros-grade";

export const MAYE_ROS = buildRosterGrade(
  rosters as Record<string, RosterPlayer[]>,
  points as Record<string, Record<string, number>>,
  PLAYOFF_MODEL,
  byes as ByeFile,
);
