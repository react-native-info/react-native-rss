const getDisplayTime = (datePublished: Date) => {
  const now = new Date();
  let displayTime = 'Just now';
  const diffYear = Math.abs(now.getFullYear() - datePublished.getFullYear());
  if (diffYear > 0) {
    displayTime = diffYear === 1 ? 'Last year' : diffYear + ' years ago';
  } else {
    const diffMonth = Math.abs(now.getMonth() - datePublished.getMonth());
    if (diffMonth > 0) {
      displayTime = diffMonth === 1 ? 'Last month' : diffMonth + ' months ago';
    } else {
      const diffDays = Math.abs(now.getDate() - datePublished.getDate());
      if (diffDays > 0) {
        displayTime = diffDays === 1 ? 'Yesterday' : diffDays + ' days ago';
      } else {
        const diffTime = Math.abs(now.getTime() - datePublished.getTime());
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        if (diffHours > 0) {
          displayTime = diffHours <= 1 ? 'Last hour' : diffHours + ' hours ago';
        }
      }
    }
  }

  return displayTime;
};

export default getDisplayTime;
