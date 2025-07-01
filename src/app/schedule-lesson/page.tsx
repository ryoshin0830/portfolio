import { redirect } from 'next/navigation';

export default function ScheduleLessonRedirect() {
  // 重定向到中文版本作为默认
  redirect('/zh/schedule-lesson');
}