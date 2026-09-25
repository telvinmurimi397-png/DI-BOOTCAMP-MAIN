function getMinutesLived(birthdate) {
  const birthDate = new Date(birthdate);

  if (Number.isNaN(birthDate.getTime())) {
    throw new Error('Please provide a valid birthdate.');
  }

  const minutesLived = Math.floor((Date.now() - birthDate.getTime()) / (1000 * 60));
  return minutesLived;
}

module.exports = getMinutesLived;