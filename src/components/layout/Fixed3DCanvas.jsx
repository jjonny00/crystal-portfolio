import { Canvas } from '@react-three/fiber';

console.log('[Fixed3DCanvas] module loaded');

export default function Fixed3DCanvas() {
  console.log('[Fixed3DCanvas] render called');
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#ff00ff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: '2rem',
      }}
    >
      <p>Canvas test</p>
      <Canvas
        style={{
          position: 'absolute',
          inset: 0,
          border: '4px solid yellow',
        }}
        onCreated={() => console.log('[Fixed3DCanvas] Canvas mounted')}
      />
    </div>
  );
}
