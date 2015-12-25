// compute week number based on date.
export function getWeek (_date) {
  let now = new Date(_date);
  let onejan = new Date(now.getFullYear(), 0, 1);
  return Math.ceil((((now - onejan) / 86400000) + onejan.getDay() + 1) / 7);
}