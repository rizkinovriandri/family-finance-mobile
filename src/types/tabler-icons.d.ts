// Paket @tabler/icons-react-native menunjuk ke file tipe per-ikon (dist/icons/*.d.ts) yang tidak
// ada di disk, jadi deep import ('@tabler/icons-react-native/IconHome') jatuh ke `any`.
// Deklarasi ini memberi tipe `Icon` yang sama dengan barrel-nya.
declare module '@tabler/icons-react-native/*' {
  import type { Icon } from '@tabler/icons-react-native';
  const IconComponent: Icon;
  export default IconComponent;
}
