function getTimeUntilNewYear() {
  const now = new Date();
  const nextNewYear = new Date(now.getFullYear() + 1, 0, 1);
  const remainingMilliseconds = nextNewYear.getTime() - now.getTime();

  const totalSeconds = Math.floor(remainingMilliseconds / 1000);
  const days = Math.floor(totalSeconds / (24 * 60 * 60));
  const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;

  return `${days} days and ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} hours`;
}

module.exports = getTimeUntilNewYear;