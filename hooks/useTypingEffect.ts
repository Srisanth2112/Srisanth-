import { useState, useEffect } from 'react';

export const useTypingEffect = (text: string, duration: number) => {
  const [displayText, setDisplayText] = useState('');
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (!text) return;

    setDisplayText('');
    setIsFinished(false);
    let i = 0;
    const typingInterval = duration / text.length;

    const intervalId = setInterval(() => {
      if (i < text.length) {
        setDisplayText(prev => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(intervalId);
        setIsFinished(true);
      }
    }, typingInterval);

    return () => clearInterval(intervalId);
  }, [text, duration]);

  return { displayText, isFinished };
};
