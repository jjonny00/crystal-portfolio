import { useEffect } from 'react';

const DebugMount = ({ name }) => {
  useEffect(() => {
    console.log(`[MOUNT] ${name}`);
    return () => {
      console.log(`[UNMOUNT] ${name}`);
    };
  }, [name]);

  return null;
};

export default DebugMount;
