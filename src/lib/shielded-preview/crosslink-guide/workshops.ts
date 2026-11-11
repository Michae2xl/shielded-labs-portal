// Recorded Crosslink workshops. Every row was read at its source on the date below: the forum post that announced
// the session (date and venue), the forum post that published the recording, and the video's title and channel on YouTube.
// Titles are the ones on YouTube. Add a session only once its recording has been posted.
const post = (topic: number, number: number) => `https://forum.zcashcommunity.com/t/${topic}/${number}`;
const video = (id: string) => `https://www.youtube.com/watch?v=${id}`;

export type Workshop = {
  /** Day of the session, as announced. */
  date: string;
  title: string;
  venue: "Discord" | "Zoom";
  recording: string;
  /** Forum post where the organizers shared the recording. */
  published: string;
  announcement: string;
  /** Something the organizers said about the recording itself. */
  note?: string;
};

export const workshopsChecked = "11 Nov 2026";
export const workshopChannel = "https://www.youtube.com/@shieldedlabs";
export const workshops: Workshop[] = [
  { date: "2026-10-01", title: "Crosslink Workshop: Oct 1, 2026", venue: "Discord", recording: video("ggWv8TlgNuY"), published: post(55210, 106), announcement: post(55210, 101) },
  { date: "2026-08-26", title: "Crosslink Workshop: Aug 26, 2026", venue: "Discord", recording: video("3G5BSF7Odo0"), published: post(55210, 84), announcement: post(55210, 83) },
  { date: "2026-06-10", title: "Crosslink Feature Net: Workshop #2 (June 10)", venue: "Discord", recording: video("NBpTtrEy4Gk"), published: post(55210, 46), announcement: post(55210, 43) },
  { date: "2026-04-15", title: "Crosslink Feature Net: Season 1 Workshop", venue: "Discord", recording: video("OJxvzgl_vAc"), published: post(55210, 29), announcement: post(55210, 15) },
  { date: "2026-01-28", title: "Crosslink Milestone #4c Workshop and Q&A Session", venue: "Discord", recording: video("gFYTFckJzbs"), published: post(54374, 18), announcement: post(54374, 1), note: "Q&A from about minute 44" },
  { date: "2025-12-03", title: "Crosslink Milestone #4b Workshop", venue: "Discord", recording: video("2MevEb-CgHU"), published: post(53321, 12), announcement: post(53321, 1) },
  { date: "2025-10-22", title: "Crosslink Milestone #4a Workshop", venue: "Zoom", recording: video("c12416G_CFw"), published: post(52505, 17), announcement: post(52505, 1) },
  { date: "2025-08-27", title: "Crosslink Milestone #3 Workshop", venue: "Discord", recording: video("57vjVzG1Qx4"), published: post(51996, 8), announcement: post(51996, 1), note: "The organizers reported bad audio" },
  { date: "2025-05-20", title: "Crosslink Milestone #2 Workshop", venue: "Discord", recording: video("tw_bqa2ys14"), published: post(51252, 10), announcement: post(51252, 1) },
];

// Other Crosslink videos on the same channel. Title, channel and publication date of each were read on YouTube on the date above.
export type ChannelVideo = { published: string; title: string; url: string };
export const milestoneVideos: ChannelVideo[] = [
  { published: "2025-10-18", title: "Crosslink Milestone #4 | Permissionlessly Joining the Roster and Accumulating Stake", url: video("FSeyWwUsEKY") },
  { published: "2025-08-07", title: "Crosslink Milestone #3 | Is that THE Crosslink?!", url: video("A0PUmThne_M") },
  { published: "2025-07-10", title: "Crosslink Milestone #3 Demo", url: video("ctF7W-FlLrA") },
  { published: "2025-05-12", title: "Crosslink Milestone #2 | Linking to PoW from PoS", url: video("plS_gb6mvo8") },
  { published: "2025-04-17", title: "Crosslink Milestone #2 | BFT Chat App and Sidechain Visualization", url: video("YCbYN2bwFV4") },
  { published: "2025-04-03", title: "Crosslink Milestone #2 | GUI Chain Visualizer", url: video("NFAtuniwdcs") },
  { published: "2025-03-21", title: "Crosslink: Milestone #1 Demo", url: video("aOozuD0rt6A") },
];
// Made for the January 2026 workshop and for Season 1: the current steps are the guide's, not these.
export const earlierSetupVideos: ChannelVideo[] = [
  { published: "2026-04-17", title: "Crosslink Feature Net: Season 1 - Quick Start Guide", url: video("amej5wEiFFo") },
  { published: "2026-01-28", title: "Crosslink Workshop (Jan 2026): Windows Installation", url: video("cO-5Oa4B1Tk") },
  { published: "2026-01-28", title: "Crosslink Workshop (Jan 2026): Mac Installation", url: video("C5o5W2sRKVM") },
  { published: "2026-01-28", title: "Crosslink Workshop (Jan 2026): Linux Installation", url: video("i8AABDUS_iM") },
];
export const crosslinkVideoCount = workshops.length + milestoneVideos.length + earlierSetupVideos.length;
