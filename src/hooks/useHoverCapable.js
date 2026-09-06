import { MQ_HOVER_CAPABLE } from '../config/breakpoints';
import { useMediaQuery } from './useMediaQuery';

export const useHoverCapable = () => useMediaQuery(MQ_HOVER_CAPABLE);

export default useHoverCapable;
