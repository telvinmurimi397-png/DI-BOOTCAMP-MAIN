function getNextHoliday() {
  const today = new Date();
  const holidayName = 'Christmas Day';
  let holidayDate = new Date(today.getFullYear(), 11, 25);

  if (holidayDate <= today) {
    holidayDate = new Date(today.getFullYear() + 1, 11, 25);
  }

  const totalSeconds = Math.floor((holidayDate.getTime() - today.getTime()) / 1000);
  const days = Math.floor(totalSeconds / (24 * 60 * 60));
  const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;

  return {
    today: today.toLocaleDateString(),
    holidayName,
    holidayDate: holidayDate.toLocaleDateString(),
    timeRemaining: `${days} days and ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} hours`
  };
}

module.exports = getNextHoliday;