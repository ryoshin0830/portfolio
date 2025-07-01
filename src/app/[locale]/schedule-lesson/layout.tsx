import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "日語課程預約 | Japanese Lesson Scheduling | 日语课程预约", 
  description: "Schedule your Japanese language learning session",
  robots: "noindex, nofollow",
};

export default function ScheduleLessonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}