const SLA_HOURS = {
  Low: 48,
  Medium: 24,
  High: 8,
  Critical: 2
};

export function getSLADeadline(urgency, createdAt = new Date()) {
  const hours = SLA_HOURS[urgency] || 24;
  const deadline = new Date(createdAt);
  deadline.setHours(deadline.getHours() + hours);
  return deadline;
}

export function checkSLABreached(slaDeadline) {
  if (!slaDeadline) return false;
  return new Date() > new Date(slaDeadline);
}

export function getSLAHours(urgency) {
  return SLA_HOURS[urgency] || 24;
}
